import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate } from "@/lib/seo";
import type { EventSummary, StandingsTable } from "@/lib/providers/types";

/**
 * The tour band — the data register.
 *
 * This is the counterweight that keeps the league from reading as decoration on
 * a clothing site: flat ink on white, hairline rules, tabular figures, no print
 * and no colour beyond a single aqua accent. Results should look like a printed
 * results sheet, not like marketing.
 */
export function TourBand({
  nextEvent,
  schedule,
  standings,
  isPlaceholder,
}: {
  nextEvent: EventSummary | null;
  schedule: EventSummary[];
  standings: StandingsTable | null;
  isPlaceholder: boolean;
}) {
  if (!nextEvent && schedule.length === 0) return null;

  const spotsLeft =
    nextEvent?.maxPlayers != null
      ? Math.max(0, nextEvent.maxPlayers - nextEvent.totalPlayers)
      : null;

  return (
    <section className="border-y border-fn-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-fn-ink pb-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-fn-ink-soft">
              Handicapped · Individuals &amp; teams welcome
            </p>
            <h2 className="font-display text-4xl font-extrabold uppercase text-fn-ink sm:text-5xl">
              The FN3P Tour
            </h2>
          </div>
          <Link
            href="/tour"
            className="font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink underline underline-offset-4 hover:opacity-70"
          >
            Full schedule →
          </Link>
        </div>

        <div className="grid min-w-0 gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Next event */}
          {nextEvent && (
            <div className="min-w-0">
              <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-deep">
                Next event
              </p>
              <div className="relative border-2 border-fn-ink bg-fn-paper p-7">
                {/* The pin-flag notch from the logo's boxed P. Drawn as a filled
                    triangle rather than a clip-path, so it doesn't eat the border. */}
                <span
                  aria-hidden
                  className="absolute bottom-0 right-0 h-5 w-5 bg-fn-ink"
                  style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
                />
                <p className="tabular text-sm font-semibold uppercase tracking-[0.14em] text-fn-ink-soft">
                  {formatDate(nextEvent.date, { weekday: "short" })}
                </p>
                <h3 className="mt-2 break-words font-display text-3xl font-extrabold uppercase leading-tight text-fn-ink">
                  {nextEvent.course || nextEvent.name}
                </h3>
                {(nextEvent.town || nextEvent.state) && (
                  <p className="mt-1 text-sm text-fn-ink-soft">
                    {[nextEvent.town, nextEvent.state].filter(Boolean).join(", ")}
                  </p>
                )}

                {/*
                  * Entry counts are only shown for live Front9 data. The
                  * placeholder has no roster, and rendering "0/40 · 40 spots
                  * left" would state something we don't actually know.
                  */}
                {!isPlaceholder && (
                  <dl className="tabular mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-fn-line pt-5 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                        Field
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-bold text-fn-ink">
                        {nextEvent.maxPlayers != null
                          ? `${nextEvent.totalPlayers}/${nextEvent.maxPlayers}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                        {spotsLeft != null ? "Spots left" : "Status"}
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-bold text-fn-ink">
                        {spotsLeft != null ? spotsLeft : "Open"}
                      </dd>
                    </div>
                  </dl>
                )}

                <div className="mt-6 border-t border-fn-line pt-5">
                  <ButtonLink href="/tour">
                    {nextEvent.registrationOpen ? "Enter this event" : "Event details"}
                  </ButtonLink>
                </div>
              </div>
            </div>
          )}

          {/* Schedule + standings */}
          <div className="min-w-0 space-y-10">
            {schedule.length > 0 && (
              <div>
                <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-deep">
                  2026 season
                </p>
                <ol className="tabular divide-y divide-fn-line border-y border-fn-line">
                  {schedule.map((e, i) => (
                    <li
                      key={e.eventId}
                      className="flex items-baseline gap-4 py-2.5 text-sm"
                    >
                      <span className="w-6 shrink-0 text-xs font-semibold text-fn-ink-soft">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-fn-ink-soft">
                        {formatDate(e.date, { year: undefined })}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-fn-ink">
                        {e.course || e.name}
                      </span>
                      <span className="shrink-0 text-xs text-fn-ink-soft">
                        {e.state}
                      </span>
                    </li>
                  ))}
                </ol>
                {isPlaceholder && (
                  // Honest about provenance while the Front9 org is pending —
                  // better than silently presenting transcribed data as live.
                  <p className="mt-3 text-xs italic text-fn-ink-soft">
                    Schedule shown from the current site; live results arrive with
                    the Front9 season.
                  </p>
                )}
              </div>
            )}

            {standings && standings.rows.length > 0 && (
              <div>
                <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-deep">
                  {standings.name}
                </p>
                <table className="tabular w-full border-y border-fn-line text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                      <th scope="col" className="py-2 font-semibold">
                        Pos
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Player
                      </th>
                      <th scope="col" className="py-2 text-right font-semibold">
                        {standings.isMoney ? "Money" : "Points"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fn-line">
                    {standings.rows.map((r) => (
                      <tr key={r.userId}>
                        <td className="py-2 pr-3 text-fn-ink-soft">{r.position}</td>
                        <td className="py-2 pr-3 font-medium text-fn-ink">{r.player}</td>
                        <td className="py-2 text-right font-semibold text-fn-ink">
                          {r.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link
                  href="/tour/standings"
                  className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-fn-deep underline underline-offset-4"
                >
                  Full standings →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
