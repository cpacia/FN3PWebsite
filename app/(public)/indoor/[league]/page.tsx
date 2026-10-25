import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventHeader, StatusChip } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { LeagueRegister } from "@/components/golf/LeagueRegister";
import { StandingsTable } from "@/components/golf/StandingsTable";
import { Markdown } from "@/components/the-turn/Markdown";
import {
  LEAGUE_STAGE_LABEL,
  dateLabel,
  eventPath,
  getGolfCalendar,
  leagueStage,
  nextUp,
  teamSizeLabel,
} from "@/lib/golf";
import { getLeague, getLeagueStandings } from "@/lib/providers/front9";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 60;

type Params = { params: Promise<{ league: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { league: slug } = await params;
  const league = await getLeague(slug);
  if (!league) return socialMetadata({ title: "Indoor Leagues", path: "/indoor" });
  return socialMetadata({
    title: league.name,
    description:
      league.description ||
      [league.seasonLabel, league.scheduleLabel].filter(Boolean).join(", ") ||
      "An FN3P indoor simulator league.",
    path: `/indoor/${slug}`,
    image: league.imageUrl || undefined,
  });
}

/** One indoor league: sign-up, the weekly schedule, and the season standings. */
export default async function LeaguePage({ params }: Params) {
  const { league: slug } = await params;
  const [league, calendar, standings] = await Promise.all([
    getLeague(slug),
    getGolfCalendar(),
    getLeagueStandings(slug),
  ]);
  if (!league) notFound();

  const weeks = calendar.leagues.find((l) => l.league.slug === slug)?.events ?? [];
  const next = nextUp(weeks);
  const stage = leagueStage(league);

  return (
    <>
      <EventHeader
        back={{ href: "/indoor", label: "Indoor leagues" }}
        eyebrow={league.scheduleLabel || dateLabel(league.startDate, league.endDate)}
        title={league.name}
        subtitle={league.seasonLabel}
        status={
          <StatusChip tone={stage === "registering" ? "accent" : stage === "playing" ? "ink" : "muted"}>
            {LEAGUE_STAGE_LABEL[stage]}
          </StatusChip>
        }
        imageUrl={league.imageUrl}
        facts={[
          { label: "Play", value: teamSizeLabel(league.entrySize) },
          { label: "Weeks", value: String(weeks.length || league.linkedEventCount) },
          {
            label: "Field",
            value:
              league.maxEntries != null
                ? `Up to ${league.maxEntries} ${league.entrySize > 1 ? "teams" : "players"}`
                : `${league.memberCount} signed up`,
          },
          {
            label: "This week",
            value: next ? `${weekLabel(weeks, next.eventId)}` : stage === "finished" ? "Season over" : "—",
          },
        ]}
        aside={<LeagueRegister league={league} />}
      />

      {league.description && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 pt-14 lg:px-8">
            <div className="max-w-prose">
              <Markdown content={league.description} />
            </div>
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <h2 className="mb-6 font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
            Schedule
          </h2>
          {weeks.length === 0 ? (
            <p className="border-y-2 border-fn-ink py-14 text-center text-sm text-fn-ink-soft">
              The weekly schedule hasn&apos;t been posted yet.
            </p>
          ) : (
            <ol className="tabular divide-y divide-fn-line border-y-2 border-fn-ink">
              {weeks.map((e, i) => (
                <li key={e.eventId}>
                  <Link
                    href={eventPath("league", e.eventId, slug)}
                    className={`group grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-4 py-4 transition-colors hover:bg-fn-paper sm:grid-cols-[5rem_1fr_11rem_9rem] ${
                      next?.eventId === e.eventId ? "bg-fn-accent-light/40" : ""
                    }`}
                  >
                    <span className="font-display text-sm font-bold uppercase text-fn-ink">
                      Week {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-extrabold uppercase leading-tight text-fn-ink group-hover:underline">
                        {e.course || e.name}
                      </span>
                      <span className="block text-xs text-fn-ink-soft sm:hidden">
                        {dateLabel(e.date, e.endDate, { year: false })}
                      </span>
                    </span>
                    <span className="hidden text-sm text-fn-ink-soft sm:block">
                      {dateLabel(e.date, e.endDate, { year: false })}
                    </span>
                    <span className="text-right">
                      <EventStatus event={e} entry={false} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section id="standings" className="scroll-mt-24 border-t border-fn-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <h2 className="mb-6 font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
            Standings
          </h2>
          <StandingsTable standings={standings} empty="Standings post after week one is final." />
        </div>
      </section>
    </>
  );
}

function weekLabel(weeks: { eventId: string }[], id: string): string {
  return `Week ${weeks.findIndex((w) => w.eventId === id) + 1}`;
}
