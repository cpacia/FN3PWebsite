import { Markdown } from "@/components/the-turn/Markdown";
import { formatName, teamSizeLabel } from "@/lib/golf";
import { formatDate } from "@/lib/seo";
import type { EventDetail } from "@/lib/providers/types";

/**
 * The Overview tab for tour events and league nights: the organizer's notes,
 * then the games being played and the course (or simulator setup) for each
 * round. Everything is read off the event, so a format change in Front9 shows
 * up here without a deploy.
 */
export function EventOverview({ event }: { event: EventDetail }) {
  const multiRound = event.roundDetails.length > 1;
  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-10">
        {event.description && (
          <section>
            <PanelHeading>About this event</PanelHeading>
            <div className="max-w-prose">
              <Markdown content={event.description} />
            </div>
          </section>
        )}

        <section>
          <PanelHeading>The games</PanelHeading>
          <GamesList event={event} />
        </section>
      </div>

      <div className="min-w-0 space-y-6">
        {event.roundDetails.map((r, i) => (
          <section key={i} className="border-2 border-fn-ink bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
              {[multiRound ? r.name || `Round ${i + 1}` : r.sim ? "Simulator course" : "The course", r.date && multiRound ? formatDate(r.date, { weekday: "short", year: undefined }) : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-fn-ink">
              {r.club || event.course}
            </h3>
            {r.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.club} ${r.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm text-fn-ink-soft underline-offset-4 hover:underline"
              >
                {r.address}
              </a>
            )}
            <dl className="tabular mt-5 grid grid-cols-3 gap-4 border-t border-fn-line pt-4 text-sm">
              <Fact label="Holes" value={r.holes ? String(r.holes) : "—"} />
              <Fact label="Par" value={r.tee?.par ? String(r.tee.par) : "—"} />
              <Fact label="Yards" value={r.tee?.yards ? r.tee.yards.toLocaleString("en-US") : "—"} />
            </dl>
            {r.tee && (
              <p className="mt-3 text-xs text-fn-ink-soft">Playing the {r.tee.name} tees.</p>
            )}
            {r.sim && r.sim.settings.length > 0 && (
              <div className="mt-5 border-t border-fn-line pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
                  {r.sim.vendor ? `${r.sim.vendor} settings` : "Simulator settings"}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {r.sim.settings.map((s) => (
                    <div key={s.label} className="flex justify-between gap-3 border-b border-fn-line pb-1.5">
                      <dt className="text-fn-ink-soft">{s.label}</dt>
                      <dd className="font-medium text-fn-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** Scoring games first (primary on top), single-hole contests after. */
function GamesList({ event }: { event: EventDetail }) {
  // Games repeat across rounds; list each once.
  const seen = new Set<string>();
  const games = event.roundDetails
    .flatMap((r) => r.competitions)
    .filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)))
    .sort((a, b) => Number(a.isContest) - Number(b.isContest) || Number(b.primary) - Number(a.primary));

  if (games.length === 0) {
    return <p className="text-sm text-fn-ink-soft">Format to be announced.</p>;
  }
  return (
    <ul className="divide-y divide-fn-line border-y-2 border-fn-ink">
      {games.map((g) => (
        <li key={g.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
          <span className="font-display text-base font-bold uppercase text-fn-ink">
            {g.name}
            {g.primary && !g.isContest && (
              <span className="ml-2 align-middle text-[10px] font-semibold tracking-[0.16em] text-fn-accent-deep">
                Main event
              </span>
            )}
          </span>
          <span className="text-sm text-fn-ink-soft">
            {[
              g.name.toLowerCase() === formatName(g.format).toLowerCase() ? "" : formatName(g.format),
              g.isContest ? "Contest" : teamSizeLabel(g.teamSize),
              g.allowance,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold text-fn-ink">{value}</dd>
    </div>
  );
}

export function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
      {children}
    </h2>
  );
}
