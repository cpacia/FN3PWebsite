import type { Metadata } from "next";
import Link from "next/link";
import { EventHeader, StatusChip } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import {
  COUNTING_SCORES,
  getChampionship,
  type ChampionshipTeam,
} from "@/lib/championship";
import { dateLabel, eventPath } from "@/lib/golf";
import { socialMetadata } from "@/lib/seo";

/** Short, like an event page, so the board settles soon after a leg finishes. */
export const revalidate = 60;

export const metadata: Metadata = socialMetadata({
  title: "Tour Championship · FN3P Tour",
  description:
    "The FN3P Tour Championship — a two-leg team final. Each team's best two net rounds of eight decide the title.",
  path: "/tour/championship",
});

/**
 * The two-leg team final. Front9 scores each leg on its own; this page compiles
 * the championship board the format actually calls for (see lib/championship.ts).
 */
export default async function ChampionshipPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: rawSeason } = await searchParams;
  const champ = await getChampionship(Number(rawSeason) || undefined);

  if (!champ) {
    return (
      <EventHeader
        back={{ href: "/tour", label: "Tour schedule" }}
        eyebrow="The FN3P Tour"
        title="Tour Championship"
        subtitle="The championship legs haven't been posted yet."
        facts={[]}
      />
    );
  }

  const { season, seasons, legs, teams } = champ;
  const rounds = legs.length * 4;
  const final = legs.length > 0 && legs.every((e) => e.status === "completed");
  const live = legs.some((e) => e.status === "in_progress");
  const leader = teams[0]?.total != null ? teams[0] : null;

  return (
    <>
      <EventHeader
        back={{ href: "/tour", label: `${season} Tour schedule` }}
        eyebrow={`The FN3P Tour · ${season}`}
        title="Tour Championship"
        subtitle={`${legs.length === 2 ? "Two legs" : `${legs.length} legs`} · 4-player teams · best ${COUNTING_SCORES} net rounds count`}
        status={
          live ? (
            <StatusChip tone="live">Live</StatusChip>
          ) : final ? (
            <StatusChip>Final</StatusChip>
          ) : null
        }
        facts={[
          { label: "Legs", value: String(legs.length) },
          { label: "Teams", value: String(teams.length) },
          { label: "Counting", value: `Best ${COUNTING_SCORES} of ${rounds}` },
          { label: final ? "Champion" : "Leader", value: !leader ? "—" : leader.position.startsWith("T") ? "Tied" : leader.name },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1fr_24rem] lg:px-8">
          <div className="min-w-0">
            <h2 className="mb-4 font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
              The format
            </h2>
            <div className="max-w-2xl space-y-4 text-base leading-relaxed text-fn-ink-soft">
              <p>
                The season ends with a two-leg team final. Teams of four play both legs, and every
                player plays their own full round each time, with handicaps applied. That gives each
                team up to {rounds} net rounds over the two legs.
              </p>
              <p>
                Only the best two count. A team&apos;s championship score is its two lowest net
                rounds out of all {rounds}, added together. It doesn&apos;t matter who shot them or
                which leg they came from, and one player&apos;s two rounds can both count. Lowest
                total wins.
              </p>
              <p>
                A sub who fills in for a leg plays for the team, and their round counts the same as
                anyone else&apos;s.
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
              The legs
            </p>
            <ol className="tabular divide-y divide-fn-line border-y-2 border-fn-ink">
              {legs.map((e, i) => (
                <li key={e.eventId}>
                  <Link
                    href={eventPath("tour", e.eventId)}
                    className="group flex items-center gap-4 py-4 transition-colors hover:bg-fn-paper"
                  >
                    <span className="w-12 shrink-0 font-display text-xs font-bold uppercase tracking-[0.12em] text-fn-ink-soft">
                      Leg {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-extrabold uppercase leading-tight text-fn-ink group-hover:underline">
                        {e.course || e.name}
                      </span>
                      <span className="block text-sm text-fn-ink-soft">
                        {dateLabel(e.date, e.endDate, { year: false })}
                      </span>
                    </span>
                    <EventStatus event={e} entry={false} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="leaderboard" className="scroll-mt-24 border-t border-fn-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
              {season} Leaderboard
            </h2>
            {seasons.length > 1 && (
              <nav aria-label="Season" className="flex flex-wrap gap-2">
                {seasons.map((y) => (
                  <Link
                    key={y}
                    href={y === seasons[0] ? "/tour/championship" : `/tour/championship?season=${y}`}
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

          {teams.length === 0 ? (
            <p className="border-y-2 border-fn-ink py-14 text-center text-sm text-fn-ink-soft">
              Teams post here once the first leg&apos;s field is set.
            </p>
          ) : (
            <>
              <ol className="tabular divide-y divide-fn-line border-y-2 border-fn-ink">
                <li
                  aria-hidden
                  className="grid grid-cols-[2.5rem_1fr_4rem] gap-x-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fn-ink-soft sm:grid-cols-[3rem_1fr_1fr_5rem]"
                >
                  <span>Pos</span>
                  <span>Team</span>
                  <span className="hidden sm:block">Counting rounds</span>
                  <span className="text-right">Total</span>
                </li>
                {teams.map((t) => (
                  <TeamRow key={t.name} team={t} legs={legs.length} />
                ))}
              </ol>
              <p className="mt-4 text-xs text-fn-ink-soft">
                Net scores from each leg&apos;s individual stroke play. A round counts once it&apos;s
                finished. Open a team to see all of its rounds.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function TeamRow({ team, legs }: { team: ChampionshipTeam; legs: number }) {
  const counting = team.rounds.filter((r) => r.counting).sort((a, b) => a.net! - b.net!);
  return (
    <li>
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_4rem] items-baseline gap-x-4 py-4 transition-colors hover:bg-fn-paper sm:grid-cols-[3rem_1fr_1fr_5rem] [&::-webkit-details-marker]:hidden">
          <span className="text-sm text-fn-ink-soft">{team.position || "—"}</span>
          <span className="min-w-0">
            <span className="flex items-baseline gap-2 font-display text-lg font-extrabold uppercase leading-tight text-fn-ink">
              <span className="truncate">{team.name}</span>
              <span
                aria-hidden
                className="shrink-0 text-xs text-fn-ink-soft transition-transform group-open:rotate-90"
              >
                ▸
              </span>
            </span>
            <span className="block truncate text-xs text-fn-ink-soft">{team.players.join(" · ")}</span>
            <span className="mt-1 block text-xs text-fn-ink sm:hidden">
              <CountingList rounds={counting} />
            </span>
          </span>
          <span className="hidden text-sm text-fn-ink sm:block">
            <CountingList rounds={counting} />
          </span>
          <span className="text-right font-display text-xl font-bold text-fn-ink">
            {team.total ?? "—"}
          </span>
        </summary>

        <div className="pb-5 sm:pl-[4rem]">
          <table className="w-full max-w-xl border-y border-fn-line text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Player
                </th>
                {Array.from({ length: legs }, (_, i) => (
                  <th key={i} scope="col" className="w-20 py-2 text-right font-semibold">
                    Leg {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fn-line">
              {team.players.map((name) => (
                <tr key={name}>
                  <td className="py-2 pr-3 text-fn-ink">{name}</td>
                  {Array.from({ length: legs }, (_, i) => {
                    const r = team.rounds.find((x) => x.leg === i && x.player === name);
                    return (
                      <td key={i} className="py-2 text-right">
                        {r?.net != null ? (
                          <span
                            className={
                              r.counting
                                ? "bg-fn-accent px-1.5 py-0.5 font-bold text-fn-ink"
                                : "text-fn-ink"
                            }
                          >
                            {r.net}
                          </span>
                        ) : (
                          <span className="text-fn-ink-soft">{r ? "—" : ""}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </li>
  );
}

/** "Isaiah Garcia 48 (L2) + Isabella Schiller 51 (L2)", lowest first. */
function CountingList({ rounds }: { rounds: ChampionshipTeam["rounds"] }) {
  if (rounds.length === 0) return <span className="text-fn-ink-soft">No finished rounds yet</span>;
  return (
    <>
      {rounds.map((r, i) => (
        <span key={`${r.player}-${r.leg}`}>
          {i > 0 && <span className="text-fn-ink-soft"> + </span>}
          {r.player} <span className="font-bold">{r.net}</span>{" "}
          <span className="text-xs text-fn-ink-soft">(L{r.leg + 1})</span>
        </span>
      ))}
    </>
  );
}
