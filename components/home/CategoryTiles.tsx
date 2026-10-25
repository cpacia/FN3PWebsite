import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Category entry points.
 *
 * The catalogue carries no product_type and no tags — collections do all the
 * categorising — so these map to collection handles rather than to a computed
 * taxonomy.
 *
 * Tile colours come from the active print's palette (--tile-1..4, set per season
 * by lib/print-theme.ts) rather than fixed hues, so the row re-skins with the
 * print instead of staying summer-aqua in the offseason. Each tile carries the
 * print itself at low opacity, which is what makes the row read as the print
 * library rather than as four swatches.
 */
const TILES = [
  { label: "Hats", handle: "all-hats", bg: "var(--tile-1)", on: "var(--tile-1-on)" },
  { label: "Polos", handle: "new-polos", bg: "var(--tile-2)", on: "var(--tile-2-on)" },
  {
    label: "Layers",
    handle: "country-club-pullovers",
    bg: "var(--tile-3)",
    on: "var(--tile-3-on)",
  },
  { label: "Accessories", handle: "accessories", bg: "var(--tile-4)", on: "var(--tile-4-on)" },
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
            style={{ backgroundColor: tile.bg }}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-35 mix-blend-luminosity transition-opacity duration-300 group-hover:opacity-55"
              style={{
                backgroundImage: "var(--print-sm)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <span
              className="relative font-display text-2xl font-extrabold uppercase leading-none sm:text-3xl"
              style={{ color: tile.on }}
            >
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
