import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/shop/ProductForm";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { shopViewHref } from "@/components/shop/ShopPage";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE_URL, socialMetadata } from "@/lib/seo";
import { getProduct, getShopProducts, SHOP_CATEGORIES } from "@/lib/shopify";

export const revalidate = 300;

/** Prebuild every merch page; anything else (the GHIN club) renders on first visit. */
export async function generateStaticParams() {
  const products = await getShopProducts();
  return products.map((p) => ({ handle: p.handle }));
}

// Next 16: params is a Promise.
type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return socialMetadata({ title: "Shop", path: "/shop" });
  return socialMetadata({
    title: product.title,
    description: product.description.slice(0, 160) || undefined,
    path: `/products/${handle}`,
    image: product.featuredImage || undefined,
  });
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params;
  const [product, catalogue] = await Promise.all([getProduct(handle), getShopProducts()]);
  if (!product) notFound();

  const category = SHOP_CATEGORIES.find((c) => c.slug === product.category);
  const related = catalogue
    .filter((p) => p.handle !== handle && p.availableForSale)
    .sort(
      (a, b) =>
        Number(b.category === product.category) - Number(a.category === product.category) ||
        a.rank - b.rank,
    )
    .slice(0, 4);

  const prices = product.variants.map((v) => v.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "FN3P Golf" },
    url: `${SITE_URL}/products/${handle}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: product.variants.length,
      availability: product.availableForSale
        ? product.preorder
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so description text can't close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 lg:px-8 lg:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-fn-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-fn-ink">
                Shop
              </Link>
            </li>
            {category && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={shopViewHref(category.slug)} className="hover:text-fn-ink">
                    {category.label}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          <ProductGallery images={product.images} title={product.title} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            {product.preorder && (
              <span className="mb-4 inline-block rounded-full bg-fn-accent-light px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-fn-ink">
                Pre-order
              </span>
            )}
            <h1 className="font-display text-4xl font-black uppercase leading-[0.92] text-fn-ink sm:text-5xl">
              {product.title}
            </h1>

            <div className="mt-6">
              <ProductForm product={product} />
            </div>

            {product.descriptionHtml && (
              <div className="mt-10 border-t border-fn-line pt-8">
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink">
                  Details
                </h2>
                {/* The store owner's own copy from Shopify. */}
                <div
                  className="product-copy mt-4 text-[15px] leading-relaxed text-fn-ink-soft"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </div>
            )}

            <ul className="mt-8 space-y-2 border-t border-fn-line pt-8 text-sm text-fn-ink-soft">
              <li className="flex gap-3">
                <span aria-hidden className="font-display font-bold text-fn-ink">→</span>
                Secure checkout through Shopify, Shop Pay included.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="font-display font-bold text-fn-ink">→</span>
                Designed in Gray, Maine.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-fn-line">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Keep looking"
              title={category ? `More ${category.label}` : "More from the shop"}
              link={{ href: category ? shopViewHref(category.slug) : "/shop", label: "Shop all →" }}
            />
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.handle}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
