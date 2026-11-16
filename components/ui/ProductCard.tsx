import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/shopify";
import { productHref } from "@/lib/links";

/**
 * A product card.
 *
 * The catalogue mixes transparent cutouts with photos shot on white, so the
 * photo is multiplied onto a neutral panel: white melts into it and cutouts sit
 * on it the same way, and the grid reads as one shoot. (The print used to sit
 * behind the cutouts, which turned every white-ground photo into a box; the
 * print now frames the shop instead of each card.)
 *
 * On devices that hover, the second photo (usually the back) crossfades in.
 */
export function ProductCard({
  product,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: {
  product: ProductCardData;
  sizes?: string;
  priority?: boolean;
}) {
  const pad = product.imageWide ? "p-[4%]" : "p-[9%]";
  const badge = !product.availableForSale
    ? { label: "Sold out", tone: "bg-fn-ink text-fn-paper" }
    : product.compareAtPrice
      ? { label: "Sale", tone: "bg-fn-marg text-fn-ink" }
      : product.preorder
        ? { label: "Pre-order", tone: "bg-fn-paper text-fn-ink" }
        : product.isNew
          ? { label: "New", tone: "bg-fn-accent text-fn-ink" }
          : null;

  return (
    <Link href={productHref(product.handle)} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-fn-panel">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes={sizes}
              priority={priority}
              className={`object-contain ${pad} mix-blend-multiply transition duration-500 ease-out group-hover:scale-[1.04] ${
                product.hoverImageUrl ? "[@media(hover:hover)]:group-hover:opacity-0" : ""
              } ${product.availableForSale ? "" : "opacity-60"}`}
            />
            {product.hoverImageUrl && (
              <Image
                src={product.hoverImageUrl}
                alt=""
                fill
                sizes={sizes}
                className={`hidden object-contain ${pad} opacity-0 mix-blend-multiply transition duration-500 ease-out group-hover:scale-[1.04] [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:opacity-100`}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-display text-sm font-bold uppercase tracking-widest text-fn-ink/30">
            FN3P
          </div>
        )}
        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] shadow-sm ${badge.tone}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h3 className="font-display text-[15px] font-bold leading-snug text-fn-ink decoration-2 underline-offset-4 group-hover:underline sm:text-base">
          {product.title}
        </h3>
        <p className="tabular shrink-0 text-sm font-medium leading-snug sm:text-right">
          <span className={product.compareAtPrice ? "text-fn-ink" : "text-fn-ink-soft"}>
            {product.price}
          </span>
          {product.compareAtPrice && (
            <span className="ml-2 text-xs text-fn-ink-soft line-through sm:ml-0 sm:block">
              {product.compareAtPrice}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
