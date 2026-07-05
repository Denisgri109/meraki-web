/**
 * On-site QR product catalog — client mirror of the server-side catalog in
 * supabase/functions/create-stripe-session/index.ts (PRODUCT_CATALOG).
 *
 * SECURITY MODEL: The server is the single source of truth for the actual
 * charge. These client-side values are used ONLY for:
 *   1. Rendering the product picker on the owner's QR dashboard.
 *   2. Encoding productId/price/name into the QR code URL (display hints).
 *   3. Showing a price preview to the customer before they pay.
 *
 * A tampered QR URL cannot change what is charged — create-stripe-session
 * looks up the price from its own server-side PRODUCT_CATALOG by productId and
 * ignores whatever price/name the client sends. Unknown productIds are rejected.
 *
 * If you edit a price, edit it HERE and in the edge function's PRODUCT_CATALOG
 * so the preview the customer sees matches what they are actually charged.
 */

export interface QrCatalogProduct {
  /** Stable identifier encoded in the QR URL. Must match a key in the server catalog. */
  id: string;
  name: string;
  /** Display price in euros. The server re-derives the real charge from this id. */
  price: number;
  description: string;
}

export const QR_CATALOG: QrCatalogProduct[] = [
  { id: 'socks-16',  name: 'Merakí Cozy Socks',      price: 16.00, description: 'Soft, organic cotton salon socks' },
  { id: 'tshirt-25', name: 'Merakí Premium Tee',      price: 25.00, description: 'Relaxed fit, ultra-soft daily wear' },
  { id: 'cap-20',    name: 'Signature Dad Cap',        price: 20.00, description: 'Embroidered logo, adjustable strap' },
  { id: 'towel-12',  name: 'Microfiber Salon Towel',   price: 12.50, description: 'Quick-dry, absorbent hair towel' },
  { id: 'tote-10',   name: 'Canvas Tote Bag',          price: 10.00, description: 'Eco-friendly, spacious everyday carry' },
  { id: 'combo-45',  name: 'Ultimate Care Combo',      price: 45.00, description: 'Socks + Tee + Tote bag premium bundle' },
];

/** Look up a product by id for the checkout preview (display only). */
export function findQrProduct(id: string | null): QrCatalogProduct | null {
  if (!id) return null;
  return QR_CATALOG.find((p) => p.id === id) ?? null;
}
