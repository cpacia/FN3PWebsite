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
  /** Display title, with any "Pre Order -" prefix moved into `preorder`. */
  title: string;
  imageUrl: string;
  imageAlt: string;
  /** Formatted "from" price, e.g. "$64.99". */
  price: string;
  availableForSale: boolean;
  /** The second photo, crossfaded in on hover. */
  hoverImageUrl?: string;
  /** A wide photo (hats, mostly), which the card draws with less margin. */
  imageWide?: boolean;
  /** Formatted original price when the product is marked down. */
  compareAtPrice?: string;
  preorder?: boolean;
  /** Added to the store recently enough to wear a "New" badge. */
  isNew?: boolean;
}

/** A merch product in the shop: a card plus what the grid filters and sorts on. */
export interface ShopProduct extends ProductCard {
  category: ShopCategory | null;
  onSale: boolean;
  /** Lowest variant price, for sorting. */
  priceValue: number;
  /** ISO timestamp, for "Newest". */
  createdAt: string;
  /** Position in Shopify's best-selling order, for "Featured". */
  rank: number;
}

/**
 * The shop's categories.
 *
 * Shopify has no product types or tags on this catalogue, and its collections
 * are kept by hand and lag new products (the 2027 polos aren't in a polo
 * collection). So a product's category is worked out from, in order: its
 * Product type when someone sets one, the category collections it's in, its
 * title, then its description. Setting Product type in Shopify always wins.
 */
export const SHOP_CATEGORIES = [
  {
    slug: "polos",
    label: "Polos",
    blurb: "Loud prints, four-way stretch, tapered cut.",
    collections: ["2026-polos", "new-polos", "polos"],
    words: /\bpolos?\b/,
  },
  {
    slug: "headwear",
    label: "Headwear",
    blurb: "Snapbacks, dad hats and lids. The best hat you'll ever own.",
    collections: ["all-hats", "hats", "headwear"],
    words: /\b(hats?|snap|snapback|lid|cap|beanie|visor|trucker)\b/,
  },
  {
    slug: "layers",
    label: "Layers",
    blurb: "Hoodies, quarter zips and crewnecks for the cold rounds.",
    collections: ["hoodies", "country-club-pullovers", "pullovers", "layers"],
    words: /\b(hoodie|q[\s-]?zip|quarter[\s-]?zip|crewneck|anorak|pullover|jacket|vest|sweater)\b/,
  },
  {
    slug: "accessories",
    label: "Accessories",
    blurb: "Headcovers and the rest of the bag.",
    collections: ["accessories"],
    words: /\b(driver cover|headcover|head cover|putter|mallet|blade|ball marker|towel|divot|glove)\b/,
  },
  {
    slug: "womens",
    label: "Women's",
    blurb: "Racerback polos, cut for her.",
    collections: ["women-s-polos", "womens"],
    words: /\b(ladies|wmns|women'?s?)\b/,
  },
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number]["slug"];

/**
 * Women's is checked first, because a ladies polo is also a polo. The rest go
 * in the table's order.
 */
const CATEGORY_CHECK_ORDER: ShopCategory[] = ["womens", "accessories", "headwear", "layers", "polos"];

function categoryOf(p: {
  productType: string;
  title: string;
  description: string;
  collections: string[];
}): ShopCategory | null {
  const byWords = (text: string) => {
    const t = text.toLowerCase();
    return CATEGORY_CHECK_ORDER.find((slug) =>
      SHOP_CATEGORIES.find((c) => c.slug === slug)!.words.test(t),
    );
  };
  if (p.productType.trim()) {
    const fromType =
      (SHOP_CATEGORIES.find((c) => c.slug === p.productType.trim().toLowerCase())?.slug as
        | ShopCategory
        | undefined) ?? byWords(p.productType);
    if (fromType) return fromType;
  }
  const fromCollection = CATEGORY_CHECK_ORDER.find((slug) =>
    SHOP_CATEGORIES.find((c) => c.slug === slug)!.collections.some((h) =>
      p.collections.includes(h),
    ),
  );
  return fromCollection ?? byWords(p.title) ?? byWords(p.description) ?? null;
}

/**
 * Things the store sells that aren't merch: tour entry and the Phoenix trip
 * (kept in these collections), charity sponsorships (`<event>-sponsorships`),
 * and the GHIN club, which is in no collection at all.
 */
const NON_MERCH_COLLECTIONS = ["tours", "travel"];
const NON_MERCH_HANDLES = ["fn3p-ghin-club"];

function isMerch(handle: string, collections: string[]): boolean {
  if (NON_MERCH_HANDLES.includes(handle)) return false;
  return !collections.some(
    (h) => NON_MERCH_COLLECTIONS.includes(h) || h.endsWith("-sponsorships"),
  );
}

const ACRONYMS = new Set(["GHIN", "WMO", "USGA", "PGA", "LPGA", "USA"]);
const PREORDER_PREFIX =/^\s*pre[\s-]*order\s*[-–—:]?\s*/i;
/** How long a product wears the "New" badge. */
const NEW_FOR_DAYS = 45;

/**
 * "Pre Order - Links Polo" → "Links Polo", and "LADIES HAVANA SLEEVELESS" →
 * "Ladies Havana Sleeveless": titles are typed by hand in Shopify, and the card
 * sets its own case.
 */
function cleanTitle(raw: string): { title: string; preorder: boolean } {
  const preorder = PREORDER_PREFIX.test(raw);
  let title = raw.replace(PREORDER_PREFIX, "").trim();
  if (/[A-Z]{5}/.test(title) && title === title.toUpperCase()) {
    // Acronyms and digit-bearing words stay as typed: FN3P, GHIN, WMO.
    title = title
      .split(/(\s+)/)
      .map((w) =>
        /\d/.test(w) || ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase(),
      )
      .join("");
  }
  return { title, preorder };
}

export interface ProductVariant {
  /** Storefront global id, used as merchandiseId at checkout. */
  id: string;
  selectedOptions: { name: string; value: string }[];
  availableForSale: boolean;
  price: number;
  priceFormatted: string;
  /** Formatted original price when this variant is marked down. */
  compareAtFormatted?: string;
}

export interface Product {
  id: string;
  handle: string;
  /** Display title; see cleanTitle. */
  title: string;
  descriptionHtml: string;
  /** Plain text, for meta descriptions. */
  description: string;
  images: { url: string; alt: string; width: number; height: number }[];
  featuredImage: string;
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
  availableForSale: boolean;
  preorder: boolean;
  /** Null for non-merch products (the GHIN club, tour entry). */
  category: ShopCategory | null;
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
  createdAt: string;
  featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null;
  images: { edges: { node: { url: string } }[] };
  priceRange: { minVariantPrice: MoneyV1; maxVariantPrice: MoneyV1 };
  compareAtPriceRange: { maxVariantPrice: MoneyV1 };
}

const CARD_FIELDS = `
  handle
  title
  availableForSale
  createdAt
  featuredImage { url altText width height }
  images(first: 2) { edges { node { url } } }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
`;

function toProductCard(node: ProductCardNode): ProductCard {
  const { title, preorder } = cleanTitle(node.title);
  const min = node.priceRange.minVariantPrice;
  const max = node.priceRange.maxVariantPrice;
  const compareAt = node.compareAtPriceRange.maxVariantPrice;
  const onSale = parseFloat(compareAt.amount) > parseFloat(min.amount);
  const imageUrl = node.featuredImage?.url ?? "";
  const ageDays = (Date.now() - Date.parse(node.createdAt)) / 86_400_000;
  return {
    handle: node.handle,
    title,
    imageUrl,
    imageAlt: node.featuredImage?.altText ?? title,
    price:
      (parseFloat(max.amount) > parseFloat(min.amount) ? "From " : "") +
      formatMoney(min.amount, min.currencyCode),
    availableForSale: node.availableForSale,
    imageWide:
      (node.featuredImage?.width ?? 0) > (node.featuredImage?.height ?? 0) * 1.05,
    hoverImageUrl: node.images.edges.map(({ node: i }) => i.url).find((u) => u !== imageUrl),
    compareAtPrice: onSale ? formatMoney(compareAt.amount, compareAt.currencyCode) : undefined,
    preorder,
    isNew: ageDays >= 0 && ageDays <= NEW_FOR_DAYS,
  };
}

const CATALOGUE_QUERY = `
  query Catalogue($cursor: String) {
    products(first: 250, after: $cursor, sortKey: BEST_SELLING) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          ${CARD_FIELDS}
          productType
          description
          collections(first: 20) { edges { node { handle } } }
        }
      }
    }
  }
`;

type CatalogueNode = ProductCardNode & {
  productType: string;
  description: string;
  collections: { edges: { node: { handle: string } }[] };
};

/**
 * Every merch product published to the storefront, in best-selling order, with
 * its category. Tour entry, the trip, sponsorships and the GHIN club are left
 * out (see isMerch). Empty when Shopify is unconfigured or the request fails.
 */
export async function getShopProducts(): Promise<ShopProduct[]> {
  const nodes: CatalogueNode[] = [];
  let cursor: string | null = null;
  // 250 is the page cap; the catalogue is ~40 products, so this is one request.
  for (let page = 0; page < 8; page++) {
    const data: {
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: { node: CatalogueNode }[];
      };
    } | null = await storefront(CATALOGUE_QUERY, { cursor }, 300);
    if (!data) break;
    nodes.push(...data.products.edges.map((e) => e.node));
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }

  return nodes.flatMap((node, rank) => {
    const collections = node.collections.edges.map((e) => e.node.handle);
    if (!isMerch(node.handle, collections)) return [];
    const card = toProductCard(node);
    return [
      {
        ...card,
        category: categoryOf({
          productType: node.productType,
          title: node.title,
          description: node.description,
          collections,
        }),
        onSale: card.compareAtPrice != null,
        priceValue: parseFloat(node.priceRange.minVariantPrice.amount),
        createdAt: node.createdAt,
        rank,
      },
    ];
  });
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
      availableForSale
      productType
      description
      descriptionHtml
      collections(first: 20) { edges { node { handle } } }
      images(first: 20) { edges { node { url altText width height } } }
      featuredImage { url altText }
      options { name values }
      variants(first: 250) {
        edges {
          node {
            id
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
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
      availableForSale: boolean;
      productType: string;
      description: string;
      descriptionHtml: string | null;
      collections: { edges: { node: { handle: string } }[] };
      images: {
        edges: {
          node: { url: string; altText: string | null; width: number | null; height: number | null };
        }[];
      };
      featuredImage: { url: string; altText: string | null } | null;
      options: { name: string; values: string[] }[];
      variants: {
        edges: {
          node: {
            id: string;
            availableForSale: boolean;
            selectedOptions: { name: string; value: string }[];
            price: MoneyV1;
            compareAtPrice: MoneyV1 | null;
          };
        }[];
      };
    } | null;
  }>(PRODUCT_QUERY, { handle }, 300);

  const p = data?.productByHandle;
  if (!p) return null;

  const { title, preorder } = cleanTitle(p.title);
  const collections = p.collections.edges.map((e) => e.node.handle);
  const images = (p.images.edges ?? []).map(({ node }) => ({
    url: node.url,
    alt: node.altText ?? title,
    width: node.width ?? 1000,
    height: node.height ?? 1000,
  }));
  return {
    id: p.id,
    handle,
    title,
    descriptionHtml: p.descriptionHtml ?? "",
    description: p.description.replace(/\s+/g, " ").trim(),
    images,
    featuredImage: p.featuredImage?.url ?? images[0]?.url ?? "",
    options: p.options ?? [],
    availableForSale: p.availableForSale,
    preorder,
    category: isMerch(handle, collections)
      ? categoryOf({
          productType: p.productType,
          title: p.title,
          description: p.description,
          collections,
        })
      : null,
    variants: (p.variants.edges ?? []).map(({ node }) => ({
      id: node.id,
      selectedOptions: node.selectedOptions,
      availableForSale: node.availableForSale,
      price: parseFloat(node.price.amount),
      priceFormatted: formatMoney(node.price.amount, node.price.currencyCode),
      compareAtFormatted:
        node.compareAtPrice && parseFloat(node.compareAtPrice.amount) > parseFloat(node.price.amount)
          ? formatMoney(node.compareAtPrice.amount, node.compareAtPrice.currencyCode)
          : undefined,
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
    /** The price as a number, for ordering packages. */
    amount: number;
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
  // Most expensive first — the presenting sponsor leads — whatever order the
  // collection is in. Ranked by each package's top option.
  const top = (p: SponsorshipPackage) => Math.max(0, ...p.variants.map((v) => v.amount));
  return (await fetchSponsorshipPackages(eventSlug)).sort((a, b) => top(b) - top(a));
}

async function fetchSponsorshipPackages(eventSlug: string): Promise<SponsorshipPackage[]> {
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
        amount: parseFloat(v.price.amount) || 0,
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
        amount: parseFloat(v.price) || 0,
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

/* ----------------------------------------------------------------------------
 * The bag.
 *
 * A Shopify cart, kept server-side: its id lives in an httpOnly cookie (see
 * lib/cart-actions.ts) and every read and write goes through these functions,
 * so the token never reaches the browser. Checkout is Shopify's hosted page at
 * the cart's checkoutUrl.
 * ------------------------------------------------------------------------- */

export interface CartLine {
  id: string;
  quantity: number;
  variantId: string;
  /** "M", "Small (Navy Logo)"; "" for a product without options. */
  variantTitle: string;
  handle: string;
  title: string;
  preorder: boolean;
  imageUrl: string;
  /** Formatted line total. */
  total: string;
  /** Formatted unit price. */
  unitPrice: string;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  /** Formatted subtotal, before shipping and tax. */
  subtotal: string;
  lines: CartLine[];
}

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
          amountPerQuantity { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            image { url }
            product { handle title featuredImage { url } }
          }
        }
      }
    }
  }
`;

interface CartNode {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: MoneyV1 };
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        cost: { totalAmount: MoneyV1; amountPerQuantity: MoneyV1 };
        merchandise: {
          id: string;
          title: string;
          image: { url: string } | null;
          product: { handle: string; title: string; featuredImage: { url: string } | null };
        };
      };
    }[];
  };
}

function toCart(c: CartNode): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: formatMoney(c.cost.subtotalAmount.amount, c.cost.subtotalAmount.currencyCode),
    lines: c.lines.edges.map(({ node }) => {
      const { title, preorder } = cleanTitle(node.merchandise.product.title);
      return {
        id: node.id,
        quantity: node.quantity,
        variantId: node.merchandise.id,
        variantTitle: optionTitle(node.merchandise.title),
        handle: node.merchandise.product.handle,
        title,
        preorder,
        imageUrl:
          node.merchandise.image?.url ?? node.merchandise.product.featuredImage?.url ?? "",
        total: formatMoney(node.cost.totalAmount.amount, node.cost.totalAmount.currencyCode),
        unitPrice: formatMoney(
          node.cost.amountPerQuantity.amount,
          node.cost.amountPerQuantity.currencyCode,
        ),
      };
    }),
  };
}

/** A cart by id; null when it has expired, been checked out, or on error. */
export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: CartNode | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id: cartId },
  );
  return data?.cart ? toCart(data.cart) : null;
}

type CartPayload = { cart: CartNode | null; userErrors: { message: string }[] };

/** Run a cart mutation and return the cart it leaves, or null on any error. */
async function cartMutation(
  field: string,
  signature: string,
  args: string,
  variables: Record<string, unknown>,
): Promise<Cart | null> {
  const data = await storefront<Record<string, CartPayload>>(
    `mutation(${signature}) { ${field}(${args}) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    variables,
  );
  const payload = data?.[field];
  if (!payload?.cart || payload.userErrors.length > 0) return null;
  return toCart(payload.cart);
}

export function cartCreate(lines: { merchandiseId: string; quantity: number }[]) {
  return cartMutation("cartCreate", "$input: CartInput!", "input: $input", {
    input: { lines },
  });
}

export function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
) {
  return cartMutation(
    "cartLinesAdd",
    "$cartId: ID!, $lines: [CartLineInput!]!",
    "cartId: $cartId, lines: $lines",
    { cartId, lines },
  );
}

export function cartLinesUpdate(cartId: string, lines: { id: string; quantity: number }[]) {
  return cartMutation(
    "cartLinesUpdate",
    "$cartId: ID!, $lines: [CartLineUpdateInput!]!",
    "cartId: $cartId, lines: $lines",
    { cartId, lines },
  );
}

export function cartLinesRemove(cartId: string, lineIds: string[]) {
  return cartMutation(
    "cartLinesRemove",
    "$cartId: ID!, $lineIds: [ID!]!",
    "cartId: $cartId, lineIds: $lineIds",
    { cartId, lineIds },
  );
}
