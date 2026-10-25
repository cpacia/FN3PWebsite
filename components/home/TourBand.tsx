import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { eventPath, registrationState } from "@/lib/golf";
import { formatDate } from "@/lib/seo";
import type { EventSummary } from "@/lib/providers/types";

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
  season,
}: {
  nextEvent: EventSummary | null;
  /** The tour events of `season`, in date order. */
  schedule: EventSummary[];
  season: number;
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
          {/* Next event, or the season recap once the schedule has run out */}
          {nextEvent ? (
            <div className="min-w-0">
              <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
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

                <dl className="tabular mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-fn-line pt-5 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                      Field
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-bold text-fn-ink">
                      {nextEvent.teamSize > 1
                        ? `${nextEvent.entries} teams`
                        : nextEvent.maxPlayers != null
                          ? `${nextEvent.totalPlayers}/${nextEvent.maxPlayers}`
                          : `${nextEvent.totalPlayers} players`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                      {spotsLeft != null ? "Spots left" : "Entry"}
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-bold text-fn-ink">
                      {spotsLeft != null ? spotsLeft : registrationShort(nextEvent)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 border-t border-fn-line pt-5">
                  <ButtonLink href={eventPath("tour", nextEvent.eventId)}>
                    {nextEvent.registrationOpen ? "Enter this event" : "Event details"}
                  </ButtonLink>
                </div>
              </div>
            </div>
          ) : (
            <SeasonWrap schedule={schedule} season={season} />
          )}

          {/* Schedule */}
          <div className="min-w-0">
            {schedule.length > 0 && (
              <div>
                <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
                  {season} season
                </p>
                <ol className="tabular divide-y divide-fn-line border-y border-fn-line">
                  {schedule.map((e, i) => (
                    <li key={e.eventId}>
                      <Link
                        href={eventPath("tour", e.eventId)}
                        className="flex items-baseline gap-4 py-2.5 text-sm transition-colors hover:bg-fn-paper"
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
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Stands in for the next-event card when nothing is left on the calendar, so
 * the band keeps its two columns through the offseason instead of collapsing
 * to a lone schedule list. Same frame as the event card; the facts are the
 * season's rather than one event's.
 */
function SeasonWrap({ schedule, season }: { schedule: EventSummary[]; season: number }) {
  const played = schedule.filter((e) => e.status !== "canceled");
  const finale = played.at(-1) ?? null;

  return (
    <div className="min-w-0">
      <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
        Offseason
      </p>
      <div className="relative border-2 border-fn-ink bg-fn-paper p-7">
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-5 w-5 bg-fn-ink"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        />
        <p className="tabular text-sm font-semibold uppercase tracking-[0.14em] text-fn-ink-soft">
          {season} season · Final
        </p>
        <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-tight text-fn-ink">
          That&apos;s a wrap
        </h3>
        <p className="mt-1 text-sm text-fn-ink-soft">
          The {season + 1} schedule is coming. Thanks to everyone who teed it up this year.
        </p>

        <dl className="tabular mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-fn-line pt-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
              Events played
            </dt>
            <dd className="mt-0.5 font-display text-lg font-bold text-fn-ink">
              {played.length}
            </dd>
          </div>
          {finale && (
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
                Season finale
              </dt>
              <dd className="mt-0.5 truncate font-display text-lg font-bold text-fn-ink">
                {finale.course || finale.name}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-fn-line pt-5">
          {finale && (
            <ButtonLink href={eventPath("tour", finale.eventId)}>Final results</ButtonLink>
          )}
          <ButtonLink href="/tour" variant="outline">
            Season recap
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/** "Open", "Opens Mar 1", or "Closed" — the one-word entry status for the stat grid. */
function registrationShort(e: EventSummary): string {
  const r = registrationState(e);
  if (r.state === "open") return "Open";
  if (r.state === "soon") return `Opens ${formatDate(r.opens, { year: undefined })}`;
  return "Closed";
}
