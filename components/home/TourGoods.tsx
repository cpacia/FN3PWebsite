import { SectionHeading } from "@/components/ui/SectionHeading";
import { productHref, SHOP_IS_EXTERNAL } from "@/lib/links";
import type { ProductCard as ProductCardData } from "@/lib/shopify";

/**
 * Tour entry, the GHIN club and the Phoenix trip — the three non-apparel SKUs
 * the store sells as products.
 *
 * Deliberately *not* rendered with ProductCard. Their "product images" are logo
 * artwork rather than garments (the GHIN club has no image at all), so a photo
 * tile reads as a mistake. These are signups, so they take the data register:
 * ink on white, the price set large and tabular, and a plain CTA.
 */
const BLURBS: Record<string, string> = {
  "fn3p-golf-tour":
    "One entry, any stop on the schedule. Handicapped, so anyone can win.",
  "fn3p-ghin-club":
    "An official GHIN handicap through FN3P. Required to play the tour.",
  "fn3p-x-phoenix-open":
    "Six days in Scottsdale. Three courses, a Sunday skybox, payment plan available.",
};

export function TourGoods({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;
  const external = SHOP_IS_EXTERNAL ? { target: "_blank", rel: "noreferrer" as const } : {};

  return (
    <section className="border-t border-fn-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <SectionHeading eyebrow="Sign up" title="Get In" />
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <a
              key={p.handle}
              href={productHref(p.handle)}
              {...external}
              className="group flex flex-col justify-between border-2 border-fn-ink bg-fn-paper p-7 transition-colors hover:bg-fn-accent-light"
            >
              <div>
                <h3 className="font-display text-2xl font-extrabold uppercase leading-tight text-fn-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fn-ink-soft">
                  {BLURBS[p.handle] ?? ""}
                </p>
              </div>
              <div className="mt-8 flex items-baseline justify-between border-t border-fn-line pt-5">
                <span className="tabular font-display text-2xl font-black text-fn-ink">
                  {p.price}
                </span>
                <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-fn-accent-deep underline underline-offset-4">
                  {p.availableForSale ? "Sign up →" : "Sold out"}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
