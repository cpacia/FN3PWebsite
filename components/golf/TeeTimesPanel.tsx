import { formatDate } from "@/lib/seo";
import type { TeeSheet } from "@/lib/providers/types";

/**
 * Published tee sheets — or bay assignments, for a simulator night. Every round
 * is printed in order (FN3P events are one or two rounds, so there's nothing to
 * gain from a picker). A player's tee is shown only when the sheet varies it,
 * and the course only when the slots don't all share one.
 */
export function TeeTimesPanel({
  sheets,
  roundNames = [],
}: {
  sheets: TeeSheet[];
  /** The event's own round names, by index, since the sheet only carries a number. */
  roundNames?: string[];
}) {
  const published = sheets.filter((s) => s.slots.length > 0);
  if (published.length === 0) {
    return (
      <p className="border-y border-fn-line py-14 text-center text-sm text-fn-ink-soft">
        Tee times haven&apos;t been posted yet. They usually go up a few days before play.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {published.map((sheet) => {
        const tees = new Set(sheet.slots.flatMap((s) => s.players.map((p) => p.tee)).filter(Boolean));
        const showTee = tees.size > 1;
        const showCourse = new Set(sheet.slots.map((s) => s.course).filter(Boolean)).size > 1;
        const heading = [
          published.length > 1 ? roundNames[sheet.round - 1] || `Round ${sheet.round}` : "",
          sheet.date ? formatDate(sheet.date, { weekday: "long", year: undefined }) : "",
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <section key={sheet.round}>
            {heading && (
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-fn-ink">
                {heading}
              </h3>
            )}
            <ol className="tabular divide-y divide-fn-line border-y-2 border-fn-ink">
              {sheet.slots.map((slot, i) => (
                <li key={i} className="grid gap-1 py-3 sm:grid-cols-[7rem_6rem_1fr] sm:gap-4">
                  <span className="font-display text-base font-bold text-fn-ink">
                    {slot.time || "Shotgun"}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-fn-ink-soft sm:pt-1">
                    {[slot.where, showCourse ? slot.course : ""].filter(Boolean).join(" · ") || "—"}
                  </span>
                  <span className="text-sm text-fn-ink">
                    {slot.players.length === 0
                      ? "Open"
                      : slot.players.map((p, j) => (
                          <span key={j}>
                            {j > 0 && <span className="px-1.5 text-fn-line">/</span>}
                            {p.name}
                            {showTee && p.tee && (
                              <span className="ml-1 text-xs text-fn-ink-soft">({p.tee})</span>
                            )}
                          </span>
                        ))}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
