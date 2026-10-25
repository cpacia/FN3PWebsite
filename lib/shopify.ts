/**
 * Shopify Storefront API client (server-only).
 *
 * FN3P's store is the apparel catalogue plus three non-apparel SKUs sold as
 * products (tour entry, GHIN club, the Phoenix Open trip). We read the catalogue
 * with the publishable Storefront token and start checkouts with `cartCreate`.
 *
 * The token stays server-side: product reads happen in Server Components and
 * checkout is proxied through /api/shop/checkout, so the browser never holds it.
 * Reads are cached via next.revalidate; the checkout mutation is uncached.
 */
import { collectionHref } from "@/lib/links";

const DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim();
const TOKEN = (process.env.SHOPIFY_STOREFRONT_TOKEN ?? "").trim();
const VERSION = (process.env.SHOPIFY_API_VERSION ?? "").trim() || "2024-10";
const DROP_COLLECTION = (process.env.SHOPIFY_DROP_COLLECTION ?? "").trim() || "2026-collection";

export interface ProductCard {
  handle: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  /** Formatted "from" price, e.g. "$64.99". */
  price: string;
  availableForSale: boolean;
}

export interface ProductVariant {
  /** Storefront global id, used as merchandiseId at checkout. */
  id: string;
  selectedOptions: { name: string; value: string }[];
  availableForSale: boolean;
  price: number;
  priceFormatted: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  images: { url: string; alt: string }[];
  featuredImage: string;
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
}

/** Format a Storefront money amount for display. */
export function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(n);
}

export function isShopifyConfigured(): boolean {
  return DOMAIN !== "" && TOKEN !== "";
}

/**
 * POST a GraphQL operation to the Storefront API. `revalidate` (seconds) caches
 * reads; omit it for mutations so each checkout is fresh. Returns `data`, or null
 * on any misconfiguration or error — callers render an empty section.
 */
async function storefront<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidate?: number,
): Promise<T | null> {
  if (!isShopifyConfigured()) return null;
  const init: RequestInit & { next?: { revalidate: number } } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  };
  if (revalidate != null) init.next = { revalidate };
  else init.cache = "no-store";
  try {
    const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, init);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

interface MoneyV1 {
  amount: string;
  currencyCode: string;
}

interface ProductCardNode {
  handle: string;
  title: string;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: MoneyV1 };
}

const CARD_FIELDS = `
  handle
  title
  availableForSale
  featuredImage { url altText }
  priceRange { minVariantPrice { amount currencyCode } }
`;

function toProductCard(node: ProductCardNode): ProductCard {
  return {
    handle: node.handle,
    title: node.title,
    imageUrl: node.featuredImage?.url ?? "",
    imageAlt: node.featuredImage?.altText ?? node.title,
    price: formatMoney(
      node.priceRange.minVariantPrice.amount,
      node.priceRange.minVariantPrice.currencyCode,
    ),
    availableForSale: node.availableForSale,
  };
}

const COLLECTION_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      title
      products(first: $first) {
        edges { node { ${CARD_FIELDS} } }
      }
    }
  }
`;

/**
 * Products in a collection, for a card grid or rail. Empty when Shopify isn't
 * configured, the handle doesn't exist, or the request fails.
 */
export async function getCollectionProducts(
  handle: string,
  first = 12,
): Promise<ProductCard[]> {
  const data = await storefront<{
    collectionByHandle: {
      title: string;
      products: { edges: { node: ProductCardNode }[] };
    } | null;
  }>(COLLECTION_QUERY, { handle, first }, 300);
  return (data?.collectionByHandle?.products.edges ?? []).map(({ node }) =>
    toProductCard(node),
  );
}

/** The current drop rail on the home page — SHOPIFY_DROP_COLLECTION. */
export async function getDropProducts(first = 8): Promise<ProductCard[]> {
  return getCollectionProducts(DROP_COLLECTION, first);
}

const PRODUCTS_BY_HANDLE_QUERY = `
  query ProductsByHandle($first: Int!, $query: String!) {
    products(first: $first, query: $query) {
      edges { node { ${CARD_FIELDS} } }
    }
  }
`;

/**
 * Look up several products by handle in one round trip, used for the tour-goods
 * strip (tour entry, GHIN club). Results come back in Shopify's relevance order,
 * so they're re-sorted to match the requested handles.
 */
export async function getProductsByHandle(handles: string[]): Promise<ProductCard[]> {
  const wanted = handles.map((h) => h.trim()).filter(Boolean);
  if (wanted.length === 0) return [];
  const data = await storefront<{
    products: { edges: { node: ProductCardNode }[] };
  }>(
    PRODUCTS_BY_HANDLE_QUERY,
    {
      first: wanted.length,
      query: wanted.map((h) => `handle:${h}`).join(" OR "),
    },
    300,
  );
  const found = (data?.products.edges ?? []).map(({ node }) => toProductCard(node));
  return wanted
    .map((h) => found.find((p) => p.handle === h))
    .filter((p): p is ProductCard => p != null);
}

const PRODUCT_QUERY = `
  query GetByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      descriptionHtml
      images(first: 10) { edges { node { url altText } } }
      featuredImage { url altText }
      options { name values }
      variants(first: 250) {
        edges {
          node {
            id
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

/** One product by handle. Null when not found or unconfigured. */
export async function getProduct(handle: string): Promise<Product | null> {
  const data = await storefront<{
    productByHandle: {
      id: string;
      title: string;
      descriptionHtml: string | null;
      images: { edges: { node: { url: string; altText: string | null } }[] };
      featuredImage: { url: string; altText: string | null } | null;
      options: { name: string; values: string[] }[];
      variants: {
        edges: {
          node: {
            id: string;
            availableForSale: boolean;
            selectedOptions: { name: string; value: string }[];
            price: MoneyV1;
          };
        }[];
      };
    } | null;
  }>(PRODUCT_QUERY, { handle }, 300);

  const p = data?.productByHandle;
  if (!p) return null;

  const images = (p.images.edges ?? []).map(({ node }) => ({
    url: node.url,
    alt: node.altText ?? p.title,
  }));
  return {
    id: p.id,
    handle,
    title: p.title,
    descriptionHtml: p.descriptionHtml ?? "",
    images,
    featuredImage: p.featuredImage?.url ?? images[0]?.url ?? "",
    options: p.options ?? [],
    variants: (p.variants.edges ?? []).map(({ node }) => ({
      id: node.id,
      selectedOptions: node.selectedOptions,
      availableForSale: node.availableForSale,
      price: parseFloat(node.price.amount),
      priceFormatted: formatMoney(node.price.amount, node.price.currencyCode),
    })),
  };
}

/**
 * A charity event's sponsorship packages: the products in the Shopify
 * collection named for the event — `<front9-slug>-sponsorships`. Front9 can't
 * sell products like these, so the link between event and products lives in
 * Shopify, where the products are made: add a product to that collection and it
 * shows on the event page, in the collection's sort order.
 */
export function sponsorshipCollection(eventSlug: string): string {
  return `${eventSlug}-sponsorships`;
}

export interface SponsorshipPackage {
  handle: string;
  title: string;
  /** Plain text, tags stripped. */
  description: string;
  imageUrl: string;
  variants: {
    /** Storefront gid when the API is configured; the store's numeric id otherwise. */
    id: string;
    /** "" for a product without options (Shopify's "Default Title"). */
    title: string;
    price: string;
    available: boolean;
  }[];
}

const SPONSORSHIP_QUERY = `
  query Sponsorships($handle: String!) {
    collectionByHandle(handle: $handle) {
      products(first: 24) {
        edges {
          node {
            handle
            title
            description
            featuredImage { url }
            variants(first: 20) {
              edges { node { id title availableForSale price { amount currencyCode } } }
            }
          }
        }
      }
    }
  }
`;

const optionTitle = (t: string) => (t === "Default Title" ? "" : t);

/**
 * The event's packages. Through the Storefront API once it's configured; until
 * then from the store's public products.json, which needs no token, so the
 * section works today. Empty when the collection doesn't exist or on error.
 */
export async function getSponsorshipPackages(eventSlug: string): Promise<SponsorshipPackage[]> {
  const handle = sponsorshipCollection(eventSlug);
  if (isShopifyConfigured()) {
    const data = await storefront<{
      collectionByHandle: {
        products: {
          edges: {
            node: {
              handle: string;
              title: string;
              description: string;
              featuredImage: { url: string } | null;
              variants: {
                edges: {
                  node: { id: string; title: string; availableForSale: boolean; price: MoneyV1 };
                }[];
              };
            };
          }[];
        };
      } | null;
    }>(SPONSORSHIP_QUERY, { handle }, 300);
    return (data?.collectionByHandle?.products.edges ?? []).map(({ node }) => ({
      handle: node.handle,
      title: node.title,
      description: node.description.trim(),
      imageUrl: node.featuredImage?.url ?? "",
      variants: node.variants.edges.map(({ node: v }) => ({
        id: v.id,
        title: optionTitle(v.title),
        price: formatMoney(v.price.amount, v.price.currencyCode),
        available: v.availableForSale,
      })),
    }));
  }

  try {
    const res = await fetch(`${collectionHref(handle)}/products.json?limit=24`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      products?: {
        handle: string;
        title: string;
        body_html?: string | null;
        images?: { src: string }[];
        variants?: { id: number; title: string; price: string; available?: boolean }[];
      }[];
    };
    return (data.products ?? []).map((p) => ({
      handle: p.handle,
      title: p.title,
      description: (p.body_html ?? "")
        .replace(/<br\s*\/?>|<\/p>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      imageUrl: p.images?.[0]?.src ?? "",
      variants: (p.variants ?? []).map((v) => ({
        id: String(v.id),
        title: optionTitle(v.title),
        price: formatMoney(v.price, "USD"),
        available: v.available !== false,
      })),
    }));
  } catch {
    return [];
  }
}

const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { checkoutUrl }
      userErrors { field message }
    }
  }
`;

/**
 * Start a Shopify checkout for the given lines and return the hosted checkout
 * URL to redirect to. Null on error. Uncached — a fresh cart per call.
 */
export async function createCheckoutUrl(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<string | null> {
  if (lines.length === 0) return null;
  const data = await storefront<{
    cartCreate: {
      cart: { checkoutUrl: string } | null;
      userErrors: { message: string }[];
    };
  }>(CART_CREATE, { input: { lines } });
  if (!data || data.cartCreate.userErrors.length > 0) return null;
  return data.cartCreate.cart?.checkoutUrl ?? null;
}

/**
 * Start a checkout for a product by handle, choosing its first available
 * variant. For single-variant products (the GHIN club, tour entry) this skips
 * the product page and goes straight to Shopify's hosted checkout.
 */
export async function createCheckoutForHandle(
  handle: string,
  quantity = 1,
): Promise<string | null> {
  const product = await getProduct(handle);
  if (!product) return null;
  const variant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  if (!variant) return null;
  return createCheckoutUrl([{ merchandiseId: variant.id, quantity }]);
}
