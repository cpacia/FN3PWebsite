import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Category entry points.
 *
 * The catalogue carries no product_type and no tags — collections do all the
 * categorising — so these map to collection handles rather than to a computed
 * taxonomy. Each tile takes a different accent so the row reads as the print
 * library rather than one repeated swatch.
 */
const TILES = [
  { label: "Hats", handle: "all-hats", accent: "var(--color-fn-aqua)" },
  { label: "Polos", handle: "new-polos", accent: "var(--color-fn-seafoam)" },
  { label: "Layers", handle: "country-club-pullovers", accent: "var(--color-fn-sand)" },
  { label: "Accessories", handle: "accessories", accent: "var(--color-fn-pistachio)" },
];

export function CategoryTiles() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
      <SectionHeading eyebrow="Browse" title="The Rack" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {TILES.map((tile) => (
          <Link
            key={tile.handle}
            href={`/shop/${tile.handle}`}
            className="group relative flex aspect-square items-end overflow-hidden rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
            style={{ backgroundColor: tile.accent }}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-35 mix-blend-luminosity transition-opacity duration-300 group-hover:opacity-55"
              style={{
                backgroundImage: "url(/patterns/palm-aqua-sm.webp)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <span className="relative font-display text-2xl font-extrabold uppercase leading-none text-fn-ink sm:text-3xl">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
