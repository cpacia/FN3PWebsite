import Link from "next/link";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { SHOP_CATEGORIES, type ShopCategory, type ShopProduct } from "@/lib/shopify";

/** A shop view: everything, one category, or the markdowns. */
export type ShopView = "all" | ShopCategory | "sale";

export function shopViewHref(view: ShopView): string {
  return view === "all" ? "/shop" : `/shop/${view}`;
}

export function inView(p: ShopProduct, view: ShopView): boolean {
  return view === "all" ? true : view === "sale" ? p.onSale : p.category === view;
}

const HEADINGS: Record<ShopView, { title: string; blurb: string }> = {
  all: {
    title: "The Shop",
    blurb: "Golf apparel from Gray, Maine. Loud prints, good fits, built for the course and the after-party.",
  },
  sale: { title: "Sale", blurb: "Last season's prints, marked down. Once a size is gone, it's gone." },
  ...Object.fromEntries(SHOP_CATEGORIES.map((c) => [c.slug, { title: c.label, blurb: c.blurb }])),
} as Record<ShopView, { title: string; blurb: string }>;

/**
 * The shop index and every category page: a print band with the heading, the
 * category tabs, then the grid. Tabs only list views that have products in
 * them, so an empty category never shows up as a dead end.
 */
export function ShopPage({ products, view }: { products: ShopProduct[]; view: ShopView }) {
  type Tab = { view: ShopView; label: string; count: number };
  const tabs = ([
    { view: "all", label: "All", count: products.length },
    ...SHOP_CATEGORIES.map((c) => ({
      view: c.slug as ShopView,
      label: c.label,
      count: products.filter((p) => p.category === c.slug).length,
    })),
    { view: "sale", label: "Sale", count: products.filter((p) => p.onSale).length },
  ] as Tab[]).filter((t) => t.count > 0 || t.view === view);

  const shown = products.filter((p) => inView(p, view));
  const heading = HEADINGS[view];

  return (
    <>
      <PrintPanel className="px-5 py-8 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl rounded-3xl bg-fn-paper p-6 sm:p-8">
            <StickerBadge tone="accent" className="mb-4">
              {view === "all" ? "FN3P Golf" : "The Shop"}
            </StickerBadge>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] text-fn-ink sm:text-6xl">
              {heading.title}
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-fn-ink-soft">{heading.blurb}</p>
          </div>
        </div>
      </PrintPanel>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8">
        <nav aria-label="Shop categories" className="-mx-5 mb-8 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            {tabs.map((t) => {
              const active = t.view === view;
              return (
                <li key={t.view}>
                  <Link
                    href={shopViewHref(t.view)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? "border-fn-ink bg-fn-ink text-fn-paper"
                        : "border-fn-ink/15 text-fn-ink hover:border-fn-ink"
                    }`}
                  >
                    {t.label}
                    <span className={`tabular ${active ? "text-fn-paper/60" : "text-fn-ink/40"}`}>
                      {t.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {shown.length > 0 ? (
          <ShopGrid products={shown} />
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-fn-line px-6 py-20 text-center">
            <p className="font-display text-3xl font-black uppercase text-fn-ink">
              {products.length === 0 ? "Restocking the rack" : "Nothing here right now"}
            </p>
            <p className="mx-auto mt-3 max-w-md text-fn-ink-soft">
              {products.length === 0
                ? "The shop couldn't load just now. Give it a minute and refresh."
                : "This one's sold through. Check back for the next drop."}
            </p>
            {view !== "all" && products.length > 0 && (
              <Link
                href="/shop"
                className="mt-8 inline-flex rounded-full bg-fn-ink px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-paper hover:bg-black"
              >
                Shop everything
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}
