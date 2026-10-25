import type { Metadata } from "next";
import Link from "next/link";
import { FactStrip } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { EventTabs } from "@/components/golf/EventTabs";
import { RegistrationFailed } from "@/components/golf/RegisterButton";
import { StandingsTable } from "@/components/golf/StandingsTable";
import { TourMembershipButton } from "@/components/golf/TourMembershipButton";
import { ButtonLink } from "@/components/ui/Button";
import {
  dateLabel,
  defaultSeason,
  eventPath,
  getGolfCalendar,
  nextUp,
  seasonYears,
  TOUR_MEMBERSHIP,
} from "@/lib/golf";
import { CHAMPIONSHIP_TAGS } from "@/lib/championship";
import { getMembershipType, getTourStandings, listEvents } from "@/lib/providers/front9";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 300;

const STANDINGS_EMPTY = "Season points post after the first tour event is final.";

export const metadata: Metadata = socialMetadata({
  title: "The FN3P Tour",
  description:
    "The FN3P Golf Tour — a handicapped summer league across Maine and New England. Schedule, results and season standings.",
  path: "/tour",
});

/**
 * The tour's home: the season schedule as a results sheet, and the standings.
 * Data register throughout — the brand register is the home page's job; this is
 * where people come to check where they stand.
 */
export default async function TourPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const [{ season: rawSeason }, calendar, standings, playoffs, membership] = await Promise.all([
    searchParams,
    getGolfCalendar(),
    getTourStandings(),
    listEvents({ tag: CHAMPIONSHIP_TAGS }),
    getMembershipType(TOUR_MEMBERSHIP),
  ]);

  const years = seasonYears(calendar.tour);
  const requested = Number(rawSeason);
  const season = years.includes(requested) ? requested : defaultSeason(calendar.tour);
  const isCurrent = season === defaultSeason(calendar.tour);
  const schedule = calendar.tour.filter((e) => e.date.startsWith(String(season)));
  const next = isCurrent ? nextUp(schedule) : null;
  const played = schedule.filter((e) => e.status === "completed").length;
  // The championship legs stay on the schedule as ordinary events; they're
  // labelled there, and the band below links to the compiled board.
  const playoffIds = new Set(playoffs.map((e) => e.eventId));
  const legs = schedule.filter((e) => playoffIds.has(e.eventId));

  return (
    <>
      <header className="border-b border-fn-line bg-white">
        <div
          aria-hidden
          className="h-3 bg-fn-accent"
          style={{ backgroundImage: "var(--print-lg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-12 lg:px-8 lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fn-ink-soft">
            Handicapped · Individuals &amp; teams welcome
          </p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] text-fn-ink sm:text-7xl">
            The FN3P Tour
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-fn-ink-soft sm:text-lg">
            A summer of handicapped golf at some of the best tracks in Maine and New England.
            Enter the events you can make, post your scores, and chase the season points.
          </p>

          <FactStrip
            className="mt-10"
            facts={[
              { label: "Season", value: String(season) },
              { label: "Events", value: String(schedule.length) },
              { label: "Played", value: `${played} / ${schedule.length}` },
              {
                label: "Next up",
                value: next ? dateLabel(next.date, next.endDate, { year: false }) : "—",
              },
            ]}
          />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {next && (
              <ButtonLink href={eventPath("tour", next.eventId)}>
                {next.registrationOpen ? "Enter the next event" : "Next event"}
              </ButtonLink>
            )}
            <TourMembershipButton
              plan={membership}
              back="/tour"
              className="border-2 border-fn-ink text-fn-ink hover:bg-fn-ink hover:text-fn-paper"
            >
              Tour membership
            </TourMembershipButton>
            <Link
              href="/tour/rules"
              className="font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink underline underline-offset-4 hover:opacity-70"
            >
              Tour rules
            </Link>
          </div>
          <RegistrationFailed message="Checkout couldn't be started. Please try again, or reach out and we'll get you signed up." />
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
              {season} Schedule
            </h2>
            {years.length > 1 && (
              <nav aria-label="Season" className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <Link
                    key={y}
                    href={y === defaultSeason(calendar.tour) ? "/tour" : `/tour?season=${y}`}
                    aria-current={y === season ? "page" : undefined}
                    className={`tabular border-2 px-3 py-1 font-display text-xs font-bold tracking-[0.12em] ${
                      y === season
                        ? "border-fn-ink bg-fn-ink text-fn-paper"
                        : "border-fn-line text-fn-ink-soft hover:border-fn-ink hover:text-fn-ink"
                    }`}
                  >
                    {y}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {schedule.length === 0 ? (
            <p className="border-y-2 border-fn-ink py-14 text-center text-sm text-fn-ink-soft">
              The {season} schedule hasn&apos;t been posted yet.
            </p>
          ) : (
            <ol className="tabular divide-y divide-fn-line border-y-2 border-fn-ink">
              {schedule.map((e, i) => (
                <li key={e.eventId}>
                  <Link
                    href={eventPath("tour", e.eventId)}
                    className={`group grid grid-cols-[2.25rem_1fr_auto] items-center gap-x-4 py-4 transition-colors hover:bg-fn-paper sm:grid-cols-[2.5rem_8rem_1fr_10rem_9rem] ${
                      next?.eventId === e.eventId ? "bg-fn-accent-light/40" : ""
                    }`}
                  >
                    <span className="text-xs font-semibold text-fn-ink-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="hidden text-sm uppercase tracking-wide text-fn-ink-soft sm:block">
                      {dateLabel(e.date, e.endDate, { year: false })}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-extrabold uppercase leading-tight text-fn-ink group-hover:underline">
                        {e.name}
                      </span>
                      {playoffIds.has(e.eventId) && (
                        <span className="block font-display text-[11px] font-bold uppercase tracking-[0.16em] text-fn-accent-deep">
                          Championship · Leg {legs.indexOf(e) + 1}
                        </span>
                      )}
                      <span className="block truncate text-sm text-fn-ink-soft">
                        <span className="sm:hidden">{dateLabel(e.date, e.endDate, { year: false })} · </span>
                        {e.course !== e.name ? e.course : ""}
                      </span>
                    </span>
                    <span className="hidden text-sm text-fn-ink-soft sm:block">
                      {[e.town, e.state].filter(Boolean).join(", ")}
                    </span>
                    <span className="text-right">
                      <EventStatus event={e} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {legs.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
            <div className="relative flex flex-wrap items-center justify-between gap-6 border-2 border-fn-ink bg-fn-paper p-7">
              {/* The pin-flag notch, as on the home page's next-event card. */}
              <span
                aria-hidden
                className="absolute bottom-0 right-0 h-5 w-5 bg-fn-ink"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
              />
              <div className="min-w-0 max-w-2xl">
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
                  {season} Tour Championship
                </p>
                <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-fn-ink sm:text-3xl">
                  Two legs. Best two net rounds of eight.
                </h2>
                <p className="mt-2 text-sm text-fn-ink-soft">
                  Teams of four play both legs. Each team&apos;s two lowest individual net rounds
                  are added together, and the lowest total wins.
                </p>
              </div>
              <ButtonLink
                href={season === defaultSeason(calendar.tour) ? "/tour/championship" : `/tour/championship?season=${season}`}
              >
                Championship board
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      <section id="standings" className="scroll-mt-24 border-t border-fn-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="mb-6 font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
            {standings.length === 1 ? standings[0].name || "Season standings" : "Season standings"}
          </h2>
          {standings.length > 1 ? (
            <EventTabs
              label="Standings"
              tabs={standings.map((t) => ({
                key: `standings-${t.seriesId}`,
                label: t.name || `Series ${t.seriesId}`,
                panel: <StandingsTable standings={t} empty={STANDINGS_EMPTY} />,
              }))}
            />
          ) : (
            <StandingsTable standings={standings[0] ?? null} empty={STANDINGS_EMPTY} />
          )}
        </div>
      </section>
    </>
  );
}

