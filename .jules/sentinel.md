## 2026-05-13 - [Added Security Headers]
**Vulnerability:** Missing crucial security headers in Next.js configuration.
**Learning:** Next.js applications by default do not emit most modern security HTTP headers (such as CSP, X-Frame-Options, or Strict-Transport-Security). Relying on default settings leaves the application vulnerable to basic attacks like clickjacking, MIME-type sniffing, and cross-site scripting (XSS) via inadequate policies.
**Prevention:** Always implement a custom `headers()` function inside `next.config.ts` to enforce baseline protections like `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
## 2024-05-24 - Replace Math.random with crypto.randomUUID
**Vulnerability:** Weak random number generation (`Math.random()`) used for file name generation during uploads.
**Learning:** `Math.random()` is predictable and not cryptographically secure, which could theoretically allow an attacker to guess file paths or overwrite files if they can predict the generation time.
**Prevention:** Use the Web Crypto API (`crypto.randomUUID()`) for generating secure unique identifiers for file paths.
