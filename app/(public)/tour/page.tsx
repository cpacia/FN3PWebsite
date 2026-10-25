import type { Metadata } from "next";
import Link from "next/link";
import { FactStrip } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { EventTabs } from "@/components/golf/EventTabs";
import { StandingsTable } from "@/components/golf/StandingsTable";
import { ButtonLink } from "@/components/ui/Button";
import {
  dateLabel,
  defaultSeason,
  eventPath,
  getGolfCalendar,
  nextUp,
  seasonYears,
} from "@/lib/golf";
import { productHref } from "@/lib/links";
import { getTourStandings } from "@/lib/providers/front9";
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
  const [{ season: rawSeason }, calendar, standings] = await Promise.all([
    searchParams,
    getGolfCalendar(),
    getTourStandings(),
  ]);

  const years = seasonYears(calendar.tour);
  const requested = Number(rawSeason);
  const season = years.includes(requested) ? requested : defaultSeason(calendar.tour);
  const isCurrent = season === defaultSeason(calendar.tour);
  const schedule = calendar.tour.filter((e) => e.date.startsWith(String(season)));
  const next = isCurrent ? nextUp(schedule) : null;
  const played = schedule.filter((e) => e.status === "completed").length;

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
            <a
              href={productHref("fn3p-golf-tour")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border-2 border-fn-ink px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink transition-colors hover:bg-fn-ink hover:text-fn-paper"
            >
              Tour membership
            </a>
          </div>
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

