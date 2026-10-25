import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventBody } from "@/components/golf/EventBody";
import { EventHeader } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { dateLabel, eventPath, formatName, leagueStage, locateEvent } from "@/lib/golf";
import { getEventDetail } from "@/lib/providers/front9";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 60;

type Params = { params: Promise<{ league: string; event: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { league, event: slug } = await params;
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  if (!event) return socialMetadata({ title: "Indoor Leagues", path: "/indoor" });
  const week = where ? where.siblings.findIndex((e) => e.eventId === slug) + 1 : 0;
  return socialMetadata({
    title: `${event.course || event.name}${week ? ` · Week ${week}` : ""}${where?.league ? ` · ${where.league.name}` : ""}`,
    description: `Bays, the field and live scores for ${event.name}.`,
    path: `/indoor/${league}/${slug}`,
    image: event.thumbnailUrl || undefined,
  });
}

/**
 * One week of an indoor league. The week is identified by its simulator course,
 * so that's the headline; registration lives on the league page, since one
 * sign-up covers the season.
 */
export default async function LeagueNightPage({ params }: Params) {
  const { league: leagueSlug, event: slug } = await params;
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  if (!event || !where) notFound();
  if (where.kind !== "league" || where.league?.slug !== leagueSlug) {
    redirect(eventPath(where.kind, slug, where.league?.slug));
  }
  const league = where.league;
  const weeks = where.siblings;
  const i = weeks.findIndex((e) => e.eventId === slug);
  const prev = i > 0 ? weeks[i - 1] : null;
  const next = i >= 0 && i < weeks.length - 1 ? weeks[i + 1] : null;

  const round = event.roundDetails[0];
  const main =
    round?.competitions.find((c) => c.primary && !c.isContest) ??
    round?.competitions.find((c) => !c.isContest);
  const stage = leagueStage(league);

  return (
    <>
      <EventHeader
        back={{ href: `/indoor/${league.slug}`, label: league.name }}
        eyebrow={`Week ${i + 1} of ${weeks.length} · ${dateLabel(event.date, event.endDate)}`}
        title={event.course || event.name}
        subtitle={event.course && event.name !== event.course ? event.name : undefined}
        status={<EventStatus event={event} entry={false} />}
        imageUrl={event.thumbnailUrl}
        facts={[
          { label: "Format", value: main ? formatName(main.format) : "TBA" },
          {
            label: "Holes",
            value: round?.tee?.par ? `${round.holes} · Par ${round.tee.par}` : String(round?.holes || "—"),
          },
          { label: "Simulator", value: round?.sim?.vendor || "—" },
          { label: event.endDate ? "Play window" : "Date", value: dateLabel(event.date, event.endDate, { year: false }) },
        ]}
        aside={
          stage === "registering" || stage === "full" ? (
            <Link
              href={`/indoor/${league.slug}`}
              className="block border-2 border-fn-ink bg-fn-paper p-6 transition-colors hover:bg-white"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-fn-ink-soft">Not in yet?</p>
              <p className="mt-1 font-display text-2xl font-black uppercase leading-tight text-fn-ink">
                Join the league
              </p>
              <p className="mt-2 text-sm text-fn-ink-soft">One sign-up covers every week.</p>
            </Link>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <EventBody event={event} />
      </div>

      <nav aria-label="Other weeks" className="border-t border-fn-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-2 lg:px-8">
          {[
            { e: prev, label: "Previous week", n: i, right: false },
            { e: next, label: "Next week", n: i + 2, right: true },
          ].map(({ e, label, n, right }) =>
            e ? (
              <Link
                key={label}
                href={eventPath("league", e.eventId, league.slug)}
                className={`group block py-8 ${right ? "sm:text-right" : ""}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
                  {right ? `${label} →` : `← ${label}`}
                </p>
                <p className="mt-1 font-display text-xl font-extrabold uppercase text-fn-ink group-hover:underline">
                  Week {n} · {e.course || e.name}
                </p>
                <p className="tabular text-sm text-fn-ink-soft">{dateLabel(e.date, e.endDate)}</p>
              </Link>
            ) : (
              <div key={label} />
            ),
          )}
        </div>
      </nav>
    </>
  );
}
