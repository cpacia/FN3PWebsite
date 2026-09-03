import { ButtonLink } from "@/components/ui/Button";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { formatDate } from "@/lib/seo";
import type { SeasonMode } from "@/lib/season";
import type { EventSummary } from "@/lib/providers/types";

/**
 * The seasonal hero.
 *
 * One hero that swaps its lead by season rather than two home pages: the tour
 * leads Apr-Oct, the current drop leads Nov-Mar. Both modes keep the same
 * structure — print panel, floating card, dual CTA — so the page reads as one
 * site whichever way round it is. See lib/season.ts.
 */
export function Hero({
  mode,
  nextEvent,
}: {
  mode: SeasonMode;
  nextEvent: EventSummary | null;
}) {
  const tourFirst = mode === "tour";

  // In tour mode the strapline names the next stop when we have one; otherwise
  // both modes fall back to the brand line, which always works.
  const kicker =
    tourFirst && nextEvent
      ? `Next up · ${nextEvent.course || nextEvent.name}${
          nextEvent.date ? ` · ${formatDate(nextEvent.date)}` : ""
        }`
      : tourFirst
        ? "The FN3P Golf Tour · Maine & New England"
        : "2026 Collection · Out now";

  const primary = tourFirst
    ? { href: "/tour", label: "Join the tour" }
    : { href: "/shop", label: "Shop 2026" };
  const secondary = tourFirst
    ? { href: "/shop", label: "Shop 2026" }
    : { href: "/tour", label: "The tour" };

  return (
    <PrintPanel className="px-5 py-20 sm:py-28 lg:px-8 lg:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="animate-rise max-w-3xl rounded-3xl bg-fn-paper p-8 shadow-[0_24px_70px_-30px_rgba(11,79,99,0.55)] sm:p-12 lg:p-14">
          <StickerBadge tone="aqua" className="mb-6">
            Gray, Maine · Est. 2019
          </StickerBadge>

          <h1 className="font-display text-5xl font-black uppercase leading-[0.88] text-fn-ink sm:text-7xl lg:text-8xl">
            Everyone
            <br />
            3-Putts
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-fn-ink-soft sm:text-lg">
            Play more golf, have fun doing it, and don&apos;t take it too
            seriously. Gear worth wearing and a tour worth entering.
          </p>

          <p className="tabular mt-7 font-display text-xs font-bold uppercase tracking-[0.18em] text-fn-deep">
            {kicker}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <ButtonLink href={secondary.href} variant="outline">
              {secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </PrintPanel>
  );
}
