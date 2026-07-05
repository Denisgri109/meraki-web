/**
 * On-site QR product lookup (client-side preview only).
 *
 * SECURITY MODEL: The server is the single source of truth for the actual
 * charge. The create-stripe-session edge function looks up the product by id
 * in the `products` table and uses the `retail_price` from the row — it
 * ignores any client-supplied price. The helpers here are ONLY for displaying
 * a price/name preview to the customer before they tap "Pay". Even if this
 * lookup returns a stale/wrong value, the charge is always correct.
 */

export interface QrCatalogProduct {
  id: string;
  name: string;
  /** Display price in euros. Preview only — the server re-derives the real charge from this id. */
  price: number;
  description: string | null;
  image_url: string | null;
}

/**
 * Fetch a single product by id for the checkout preview.
 * Returns null if the product doesn't exist, isn't active, or isn't QR-enabled.
 */
export async function fetchQrProduct(
  supabase: { from: (t: string) => any },
  productId: string,
): Promise<QrCatalogProduct | null> {
  if (!productId) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, retail_price, description, image_url, qr_enabled, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (error || !data) return null;
    if (!data.qr_enabled || data.is_active === false) return null;

    return {
      id: data.id,
      name: data.name,
      price: Number(data.retail_price) || 0,
      description: data.description,
      image_url: data.image_url,
    };
  } catch {
    return null;
  }
}
