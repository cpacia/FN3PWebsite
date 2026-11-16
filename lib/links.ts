/**
 * Shop links. Product pages are served here (/products/<handle>); the Shopify
 * storefront is still the target for checkout fallbacks and collection JSON
 * reads (see getSponsorshipPackages). Nothing else in the app builds a product
 * URL.
 */
const SHOP_BASE = (process.env.NEXT_PUBLIC_SHOP_BASE_URL ?? "https://www.fn3pgolf.com").replace(
  /\/+$/,
  "",
);

export function productHref(handle: string): string {
  return `/products/${handle}`;
}

/**
 * The product on the Shopify storefront itself, for fallbacks that deep-link a
 * variant there (`?variant=`) when the Storefront API can't start a checkout.
 */
export function storefrontProductHref(handle: string): string {
  return `${SHOP_BASE}/products/${handle}`;
}

export function collectionHref(handle: string): string {
  return `${SHOP_BASE}/collections/${handle}`;
}

