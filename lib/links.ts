/**
 * Outbound links to the Shopify storefront.
 *
 * The shop pages are not built yet (step one is the brand system and the home
 * page), so product and cart links point at the live Shopify storefront. When
 * the headless /shop routes land, these two helpers are the only place that
 * changes — nothing else in the app builds a product URL.
 */
const SHOP_BASE = (process.env.NEXT_PUBLIC_SHOP_BASE_URL ?? "https://www.fn3pgolf.com").replace(
  /\/+$/,
  "",
);

export function productHref(handle: string): string {
  return `${SHOP_BASE}/products/${handle}`;
}

export function collectionHref(handle: string): string {
  return `${SHOP_BASE}/collections/${handle}`;
}

export function cartHref(): string {
  return `${SHOP_BASE}/cart`;
}

/** True while product links leave the site, so links can carry rel/target. */
export const SHOP_IS_EXTERNAL = true;
