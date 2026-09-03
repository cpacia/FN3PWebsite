import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProductCard as ProductCardData } from "@/lib/shopify";

/**
 * The current drop. A horizontal scroller on mobile and a grid from `sm` up —
 * the rail must scroll inside itself, never take the page sideways with it.
 *
 * Renders nothing when Shopify is unconfigured or the collection is empty,
 * rather than showing an empty shelf.
 */
export function DropRail({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
      <SectionHeading
        eyebrow="New gear"
        title="The Drop"
        link={{ href: "/shop", label: "Shop all →" }}
      />
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.handle} className="w-[68vw] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
