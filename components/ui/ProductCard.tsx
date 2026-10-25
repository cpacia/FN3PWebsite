import Image from "next/image";
import type { ProductCard as ProductCardData } from "@/lib/shopify";
import { productHref, SHOP_IS_EXTERNAL } from "@/lib/links";

/**
 * A product card.
 *
 * Every product photo in the catalogue is a flat ghost-mannequin cutout on
 * white, with no lifestyle imagery behind it. Rather than fight that, each card
 * sits the cutout on its own panel of the print — which turns the constraint
 * into the brand's most recognisable move.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const external = SHOP_IS_EXTERNAL
    ? { target: "_blank", rel: "noreferrer" as const }
    : {};
  return (
    <a
      href={productHref(product.handle)}
      {...external}
      className="group block"
    >
      <div
        className="relative aspect-4/5 overflow-hidden rounded-2xl bg-fn-accent"
        style={{
          backgroundImage: "var(--print-sm)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 22vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-sm font-bold uppercase tracking-widest text-fn-ink/40">
            FN3P
          </div>
        )}
        {!product.availableForSale && (
          <span className="absolute left-3 top-3 rounded-full bg-fn-ink px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-fn-paper">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-bold leading-tight text-fn-ink group-hover:underline">
          {product.title}
        </h3>
        <span className="tabular shrink-0 text-sm font-medium text-fn-ink-soft">
          {product.price}
        </span>
      </div>
    </a>
  );
}
