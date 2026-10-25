import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import {
  LEAGUE_STAGE_LABEL,
  type LeagueSchedule,
  dateLabel,
  getGolfCalendar,
  leagueStage,
  money,
  teamSizeLabel,
} from "@/lib/golf";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = socialMetadata({
  title: "Indoor Leagues",
  description:
    "FN3P's fall and winter simulator leagues — keep your swing going all offseason.",
  path: "/indoor",
});

/**
 * Every indoor league, current ones as cards and finished seasons in a list
 * below. Built for more than one league from the start: today there's a single
 * fall league, but adding a second in Front9 is all it takes to show it here.
 */
export default async function IndoorPage() {
  const { leagues } = await getGolfCalendar();
  const current = leagues.filter((l) => leagueStage(l.league) !== "finished");
  const finished = leagues.filter((l) => leagueStage(l.league) === "finished");

  return (
    <>
      <PrintPanel className="px-5 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl rounded-3xl bg-fn-paper p-8 sm:p-12">
            <StickerBadge tone="accent" className="mb-6">
              Fall &amp; winter
            </StickerBadge>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] text-fn-ink sm:text-7xl">
              Indoor leagues
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-fn-ink-soft sm:text-lg">
              When the courses close, the tour moves inside. Simulator leagues through the
              fall and winter — sign up once and you&apos;re in for every week of the season.
            </p>
          </div>
        </div>
      </PrintPanel>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        {current.length === 0 ? (
          <p className="max-w-xl text-fn-ink-soft">
            No leagues are open right now. The next season will show up here as soon as
            sign-ups are announced.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {current.map((s) => (
              <LeagueCard key={s.league.id} schedule={s} />
            ))}
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink">
            Past seasons
          </h2>
          <ul className="mt-6 divide-y divide-fn-line border-y border-fn-line">
            {finished.map(({ league }) => (
              <li key={league.id}>
                <Link
                  href={`/indoor/${league.slug}`}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="font-display text-lg font-extrabold uppercase text-fn-ink group-hover:underline">
                    {league.name}
                  </span>
                  <span className="tabular text-sm text-fn-ink-soft">
                    {dateLabel(league.startDate, league.endDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function LeagueCard({ schedule: { league, events } }: { schedule: LeagueSchedule }) {
  const stage = leagueStage(league);
  const fee = league.feeNonMembersCents ?? league.feeMembersCents;
  const facts = [
    { label: "Format", value: league.seasonLabel || teamSizeLabel(league.entrySize) },
    { label: "When", value: league.scheduleLabel || dateLabel(league.startDate, league.endDate) },
    { label: "Weeks", value: String(events.length || league.linkedEventCount) },
    {
      label: "Entry",
      value: fee != null ? `${money(fee)} ${league.feePerEntry ? "/ team" : "/ player"}` : "—",
    },
  ];
  return (
    <Link
      href={`/indoor/${league.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-fn-line transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-fn-ink"
    >
      <div className="relative aspect-[2/1] bg-white">
        {league.imageUrl && (
          <Image
            src={league.imageUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-8"
          />
        )}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em] ${
            stage === "registering" ? "bg-fn-ink text-fn-paper" : "bg-fn-paper text-fn-ink"
          }`}
        >
          {LEAGUE_STAGE_LABEL[stage]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] text-fn-ink group-hover:underline">
          {league.name}
        </h2>
        {league.description && (
          <p className="mt-3 line-clamp-3 text-fn-ink-soft">{league.description}</p>
        )}
        <dl className="tabular mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-fn-line pt-5 text-sm">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">{f.label}</dt>
              <dd className="mt-0.5 font-medium text-fn-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}
