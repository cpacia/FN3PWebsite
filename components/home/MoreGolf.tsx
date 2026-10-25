import Link from "next/link";
import { DateStamp } from "@/components/golf/DateStamp";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  LEAGUE_STAGE_LABEL,
  type GolfCalendar,
  eventPath,
  leagueStage,
  nextUp,
} from "@/lib/golf";

/**
 * The rest of the golf calendar, under the tour band: the next charity event and
 * the indoor league that's open or playing. Brand register, two big doors — it
 * exists so the off-tour golf is findable from the home page, not to repeat the
 * detail its own pages carry. Renders nothing when neither has anything coming.
 */
export function MoreGolf({ calendar }: { calendar: GolfCalendar }) {
  const charity = nextUp(calendar.charity);
  const league =
    calendar.leagues.find((l) => leagueStage(l.league) === "registering") ??
    calendar.leagues.find((l) => leagueStage(l.league) !== "finished") ??
    null;
  if (!charity && !league) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <SectionHeading eyebrow="All year round" title="More ways to play" />
      <div className="grid gap-6 md:grid-cols-2">
        {charity ? (
          <Link
            href={eventPath("charity", charity.eventId)}
            className="group flex items-center gap-6 rounded-3xl bg-fn-accent-light p-8 transition-colors hover:bg-fn-accent"
          >
            <DateStamp date={charity.date} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fn-accent-deep">Next charity scramble</p>
              <p className="mt-1 font-display text-3xl font-black uppercase leading-[0.95] text-fn-ink">
                {charity.name}
              </p>
              <p className="mt-2 text-sm text-fn-ink-soft">{charity.course}</p>
            </div>
          </Link>
        ) : (
          <DoorLink href="/charity" kicker="Charity events" title="Golf for a good cause" />
        )}
        {league ? (
          <Link
            href={`/indoor/${league.league.slug}`}
            className="group flex flex-col justify-center rounded-3xl bg-fn-ink p-8 text-fn-paper transition-colors hover:bg-black"
          >
            <p className="text-sm font-semibold text-fn-accent-light">
              Indoor league · {LEAGUE_STAGE_LABEL[leagueStage(league.league)].toLowerCase()}
            </p>
            <p className="mt-1 font-display text-3xl font-black uppercase leading-[0.95]">
              {league.league.name}
            </p>
            <p className="mt-2 text-sm text-fn-paper/70">
              {[league.league.seasonLabel, league.league.scheduleLabel].filter(Boolean).join(", ")}
            </p>
          </Link>
        ) : (
          <DoorLink href="/indoor" kicker="Indoor leagues" title="Simulator golf all winter" />
        )}
      </div>
    </section>
  );
}

function DoorLink({ href, kicker, title }: { href: string; kicker: string; title: string }) {
  return (
    <Link href={href} className="rounded-3xl bg-white p-8 ring-1 ring-fn-line hover:ring-fn-ink">
      <p className="text-sm font-semibold text-fn-accent-deep">{kicker}</p>
      <p className="mt-1 font-display text-3xl font-black uppercase leading-[0.95] text-fn-ink">{title}</p>
    </Link>
  );
}
