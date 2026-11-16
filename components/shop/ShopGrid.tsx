"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { ShopProduct } from "@/lib/shopify";

const SORTS = {
  // New arrivals lead, then Shopify's best-selling order: by sales alone, last
  // season's markdowns would bury every new drop.
  featured: {
    label: "Featured",
    by: (a: ShopProduct, b: ShopProduct) => Number(!!b.isNew) - Number(!!a.isNew) || a.rank - b.rank,
  },
  newest: {
    label: "Newest",
    by: (a: ShopProduct, b: ShopProduct) => b.createdAt.localeCompare(a.createdAt),
  },
  "price-asc": {
    label: "Price: low to high",
    by: (a: ShopProduct, b: ShopProduct) => a.priceValue - b.priceValue || a.rank - b.rank,
  },
  "price-desc": {
    label: "Price: high to low",
    by: (a: ShopProduct, b: ShopProduct) => b.priceValue - a.priceValue || a.rank - b.rank,
  },
} as const;

type SortKey = keyof typeof SORTS;

/**
 * The product grid and its sort. Sorting happens here, over the products the
 * page already rendered, so category pages stay static. Sold-out products sink
 * to the end whatever the sort.
 */
export function ShopGrid({ products }: { products: ShopProduct[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) => Number(!a.availableForSale) - Number(!b.availableForSale) || SORTS[sort].by(a, b),
      ),
    [products, sort],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-fn-line pb-4">
        <p className="tabular text-sm text-fn-ink-soft">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
        <label className="flex items-center gap-2 text-sm text-fn-ink-soft">
          <span className="hidden sm:inline">Sort by</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort products"
              className="cursor-pointer appearance-none rounded-full border border-fn-ink/20 bg-fn-paper py-2 pl-4 pr-9 font-medium text-fn-ink hover:border-fn-ink/50 focus:border-fn-ink focus:outline-none"
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fn-ink"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </label>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-12">
        {sorted.map((p, i) => (
          <li key={p.handle}>
            <ProductCard product={p} priority={i < 4} />
          </li>
        ))}
      </ul>
    </>
  );
}
