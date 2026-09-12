import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// validate-iap-purchase
// ---------------------
// Verifies an Academy course purchase made through App Store / Play Billing and
// enrols the student.
//
// WHY THIS EXISTS
//   Apple Guideline 3.1.1 and the Google Play Payments policy require digital
//   content consumed inside an app to be sold with the platform's own billing.
//   Course videos are consumed inside the app, so the iOS and Android apps buy
//   courses through the store; the website keeps using Stripe for the same
//   catalogue.
//
// SECURITY MODEL
//   * The caller is authenticated via the Supabase JWT (verify_jwt = true), so
//     we know who to enrol without trusting a user_id in the body.
//   * The store receipt is never trusted from the client. We ask Apple's
//     App Store Server API or Google's Play Developer API directly, with our
//     own credentials, and use only what they return.
//   * The product id the store reports must match the course the client asked
//     for, so a €2 course receipt cannot unlock a €200 one.
//   * grant_course_from_iap is service_role only and idempotent on
//     (platform, transaction_id), so replays and restores cannot double-enrol
//     or double-count revenue.
//
// REQUIRED SECRETS  (supabase secrets set ...)
//   iOS      APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_BUNDLE_ID
//            (APPLE_PRIVATE_KEY is the contents of the .p8 from App Store
//            Connect → Users and Access → Integrations → In-App Purchase.)
//   Android  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, ANDROID_PACKAGE_NAME
//            (A service account with the "View financial data" and
//            "Manage orders and subscriptions" permissions in Play Console.)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const APPLE_ISSUER_ID = Deno.env.get("APPLE_ISSUER_ID");
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID");
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");
const APPLE_BUNDLE_ID = Deno.env.get("APPLE_BUNDLE_ID");

const GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
const ANDROID_PACKAGE_NAME = Deno.env.get("ANDROID_PACKAGE_NAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  /** 'ios' | 'android' */
  platform: string;
  /** The course the client believes it bought. Cross-checked against the store. */
  course_id: string;
  /** Store product id the client purchased. Cross-checked against the store. */
  product_id: string;
  /** iOS: StoreKit transaction id. Android: the purchaseToken. */
  transaction_id?: string;
  purchase_token?: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Small JWT helpers ───────────────────────────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(new TextEncoder().encode(value));
}

function base64UrlDecodeToString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Strips the PEM armour and returns the DER bytes. */
function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  privateKeyPem: string,
  algorithm: "ES256" | "RS256",
): Promise<string> {
  const keyParams = algorithm === "ES256"
    ? { name: "ECDSA", namedCurve: "P-256" }
    : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const signParams = algorithm === "ES256"
    ? { name: "ECDSA", hash: "SHA-256" }
    : { name: "RSASSA-PKCS1-v1_5" };

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem).buffer as ArrayBuffer,
    keyParams,
    false,
    ["sign"],
  );

  const signingInput = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign(
    signParams,
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// ─── Apple ───────────────────────────────────────────────────────────────────

interface VerifiedPurchase {
  transactionId: string;
  productId: string;
  priceCents: number | null;
  currency: string | null;
  purchasedAt: string | null;
  raw: unknown;
}

async function verifyApple(transactionId: string): Promise<VerifiedPurchase> {
  if (!APPLE_ISSUER_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY || !APPLE_BUNDLE_ID) {
    throw new Error(
      "App Store credentials are not configured. Set APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY and APPLE_BUNDLE_ID.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt(
    { alg: "ES256", kid: APPLE_KEY_ID, typ: "JWT" },
    {
      iss: APPLE_ISSUER_ID,
      iat: now,
      exp: now + 600,
      aud: "appstoreconnect-v1",
      bid: APPLE_BUNDLE_ID,
    },
    APPLE_PRIVATE_KEY,
    "ES256",
  );

  // A build from TestFlight or a simulator produces sandbox transactions, which
  // the production host does not know about. Ask production first, then sandbox
  // — that is the order Apple documents.
  const hosts = [
    "https://api.storekit.itunes.apple.com",
    "https://api.storekit-sandbox.itunes.apple.com",
  ];

  let lastStatus = 0;
  for (const host of hosts) {
    const res = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    lastStatus = res.status;
    if (res.status === 404) continue;
    if (!res.ok) {
      throw new Error(`App Store Server API returned ${res.status}`);
    }

    const body = await res.json();
    const signed: string | undefined = body.signedTransactionInfo;
    if (!signed) throw new Error("App Store response contained no transaction");

    // The response came from an authenticated call to Apple, so the payload is
    // authoritative; we read it rather than re-verifying the signature.
    const claims = JSON.parse(base64UrlDecodeToString(signed.split(".")[1]));

    if (claims.bundleId !== APPLE_BUNDLE_ID) {
      throw new Error("Transaction belongs to a different app");
    }
    if (claims.revocationDate) {
      throw new Error("This purchase was refunded or revoked");
    }

    return {
      transactionId: String(claims.transactionId),
      productId: String(claims.productId),
      // `price` is in thousandths of a currency unit when present.
      priceCents: typeof claims.price === "number" ? Math.round(claims.price / 10) : null,
      currency: claims.currency ?? null,
      purchasedAt: claims.purchaseDate ? new Date(claims.purchaseDate).toISOString() : null,
      raw: claims,
    };
  }

  throw new Error(`Apple does not recognise this transaction (last status ${lastStatus})`);
}

// ─── Google ──────────────────────────────────────────────────────────────────

async function googleAccessToken(): Promise<string> {
  const account = JSON.parse(GOOGLE_PLAY_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    account.private_key,
    "RS256",
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`Google token exchange failed: ${body.error_description ?? res.status}`);
  }
  return body.access_token;
}

async function verifyGoogle(productId: string, purchaseToken: string): Promise<VerifiedPurchase> {
  if (!GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || !ANDROID_PACKAGE_NAME) {
    throw new Error(
      "Play credentials are not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and ANDROID_PACKAGE_NAME.",
    );
  }

  const accessToken = await googleAccessToken();
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(ANDROID_PACKAGE_NAME)}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Play Developer API returned ${res.status}: ${body?.error?.message ?? ""}`);
  }

  // 0 = purchased, 1 = cancelled, 2 = pending.
  if (body.purchaseState !== 0) {
    throw new Error(
      body.purchaseState === 2
        ? "This purchase is still pending with Google. It will unlock once it completes."
        : "This purchase was cancelled or refunded",
    );
  }

  return {
    transactionId: String(body.orderId ?? purchaseToken),
    productId,
    priceCents: body.priceAmountMicros ? Math.round(Number(body.priceAmountMicros) / 10000) : null,
    currency: body.priceCurrencyCode ?? null,
    purchasedAt: body.purchaseTimeMillis
      ? new Date(Number(body.purchaseTimeMillis)).toISOString()
      : null,
    raw: body,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await authClient.auth.getUser();
    if (authError || !userData.user) {
      return jsonResponse({ error: "Unauthorized", details: authError?.message }, 401);
    }
    const userId = userData.user.id;

    const body = (await req.json()) as RequestBody;
    const platform = body.platform;
    if (platform !== "ios" && platform !== "android") {
      return jsonResponse({ error: "platform must be 'ios' or 'android'" }, 400);
    }
    if (!body.course_id || !body.product_id) {
      return jsonResponse({ error: "Missing course_id or product_id" }, 400);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. The course is the server's source of truth for which SKU is valid.
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .select("id, title, price, is_published, ios_product_id, android_product_id")
      .eq("id", body.course_id)
      .maybeSingle();
    if (courseError) {
      return jsonResponse({ error: "Database error", details: courseError.message }, 500);
    }
    if (!course || !course.is_published) {
      return jsonResponse({ error: "This course is no longer available." }, 400);
    }

    const expectedProductId = platform === "ios" ? course.ios_product_id : course.android_product_id;
    if (!expectedProductId) {
      return jsonResponse(
        { error: "This course is not set up for in-app purchase yet." },
        400,
      );
    }

    // 2. Ask the store. Nothing the client sent about the outcome is trusted.
    let verified: VerifiedPurchase;
    try {
      verified = platform === "ios"
        ? await verifyApple(String(body.transaction_id ?? ""))
        : await verifyGoogle(expectedProductId, String(body.purchase_token ?? ""));
    } catch (err) {
      return jsonResponse({ error: String(err instanceof Error ? err.message : err) }, 400);
    }

    // 3. The SKU the store confirmed must be the SKU this course sells.
    if (verified.productId !== expectedProductId) {
      return jsonResponse(
        { error: "This receipt is for a different product." },
        403,
      );
    }

    // 4. A receipt already used by somebody else must not be replayed.
    const { data: existing } = await serviceClient
      .from("iap_transactions")
      .select("user_id")
      .eq("platform", platform)
      .eq("transaction_id", verified.transactionId)
      .maybeSingle();
    if (existing && existing.user_id !== userId) {
      return jsonResponse({ error: "This receipt has already been used." }, 409);
    }

    // 5. Record and enrol, idempotently.
    const { data: grant, error: grantError } = await serviceClient.rpc("grant_course_from_iap", {
      p_user_id: userId,
      p_course_id: course.id,
      p_platform: platform,
      p_product_id: verified.productId,
      p_transaction_id: verified.transactionId,
      p_price_cents: verified.priceCents,
      p_currency: verified.currency?.toLowerCase() ?? null,
      p_purchased_at: verified.purchasedAt,
      p_store_response: verified.raw,
    });
    if (grantError) {
      return jsonResponse({ error: grantError.message }, 400);
    }

    return jsonResponse({
      ok: true,
      enrollment_id: grant?.enrollment_id ?? null,
      newly_granted: grant?.newly_granted ?? false,
      course_title: grant?.course_title ?? course.title,
    });
  } catch (error) {
    return jsonResponse(
      { error: "Failed to validate purchase", details: String(error) },
      500,
    );
  }
});
