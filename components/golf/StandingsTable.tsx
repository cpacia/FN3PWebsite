"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { loadStandingsContributions } from "@/lib/standings";
import type {
  StandingRow,
  StandingsContribution,
  StandingsTable as Standings,
} from "@/lib/providers/types";

/**
 * A season standings table in the data register. Team series print the members
 * under the team name. A name opens the entry's event-by-event breakdown in a
 * row beneath it — the same accordion as the leaderboards — fetched the first
 * time it's opened and kept after that.
 */
export function StandingsTable({
  standings,
  empty = "Standings post after the first event.",
}: {
  standings: Standings | null;
  empty?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, StandingsContribution[] | "error">>({});

  if (!standings || standings.rows.length === 0) {
    return <p className="border-y border-fn-line py-14 text-center text-sm text-fn-ink-soft">{empty}</p>;
  }
  const valueLabel = standings.isMoney ? "Money" : "Points";
  const keyOf = (r: StandingRow) => (r.teamId != null ? `t${r.teamId}` : `u${r.userId}`);
  const opens = (r: StandingRow) => r.teamId != null || r.userId > 0;

  function toggle(r: StandingRow) {
    const key = keyOf(r);
    if (open === key) return setOpen(null);
    setOpen(key);
    if (loaded[key] || !standings) return;
    loadStandingsContributions(
      standings.seriesId,
      { userId: r.userId, teamId: r.teamId },
      standings.seasonId,
      standings.isMoney,
    )
      .then((items) => setLoaded((m) => ({ ...m, [key]: items })))
      .catch(() => setLoaded((m) => ({ ...m, [key]: "error" })));
  }

  return (
    <table className="tabular w-full border-y-2 border-fn-ink text-sm">
      <thead>
        <tr className="border-b border-fn-ink text-left text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">
          <th scope="col" className="w-12 py-2.5 pr-3 font-semibold">
            Pos
          </th>
          <th scope="col" className="py-2.5 pr-3 font-semibold">
            {standings.rows.some((r) => r.members.length > 0) ? "Team" : "Player"}
          </th>
          <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
            Events
          </th>
          <th scope="col" className="py-2.5 text-right font-semibold">
            {valueLabel}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-fn-line">
        {standings.rows.map((r) => {
          const key = keyOf(r);
          const isOpen = open === key;
          return (
            <Fragment key={`${key}-${r.player}`}>
              <tr className={isOpen ? "bg-fn-paper" : ""}>
                <td className="py-2.5 pr-3 text-fn-ink-soft">{r.position}</td>
                <td className="py-2.5 pr-3">
                  {opens(r) ? (
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      aria-expanded={isOpen}
                      className="flex cursor-pointer items-baseline gap-1.5 text-left font-medium text-fn-ink hover:underline"
                    >
                      {r.player}
                      <span
                        aria-hidden
                        className={`text-[10px] text-fn-ink-soft transition-transform ${isOpen ? "rotate-90" : ""}`}
                      >
                        ▸
                      </span>
                    </button>
                  ) : (
                    <span className="font-medium text-fn-ink">{r.player}</span>
                  )}
                  {r.members.length > 0 && (
                    <span className="block text-xs text-fn-ink-soft">{r.members.join(" · ")}</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right text-fn-ink-soft">{r.events}</td>
                <td className="py-2.5 text-right font-bold text-fn-ink">{r.value}</td>
              </tr>
              {isOpen && (
                <tr className="bg-fn-paper">
                  <td colSpan={4} className="pb-5 pt-1 sm:pl-12">
                    <Breakdown items={loaded[key]} valueLabel={valueLabel} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function Breakdown({
  items,
  valueLabel,
}: {
  items: StandingsContribution[] | "error" | undefined;
  valueLabel: string;
}) {
  if (items === undefined) {
    return <p className="py-4 text-center text-sm text-fn-ink-soft">Loading results…</p>;
  }
  if (items === "error" || items.length === 0) {
    return <p className="py-4 text-center text-sm text-fn-ink-soft">No results to show yet.</p>;
  }
  const dropped = items.some((c) => !c.usedInCalc);
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-3xl border-y border-fn-line text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-fn-ink-soft">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Date
            </th>
            <th scope="col" className="w-5 py-2">
              <span className="sr-only">Counts</span>
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Event
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Score
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Place
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              {valueLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fn-line">
          {items.map((c, i) => (
            <tr key={i} className={c.usedInCalc ? "text-fn-ink" : "text-fn-ink-soft"}>
              <td className="whitespace-nowrap py-2 pr-3 text-fn-ink-soft">{c.date}</td>
              <td className="py-2 text-fn-accent-deep" title={c.usedInCalc ? "Counts toward the total" : undefined}>
                {c.usedInCalc ? "★" : ""}
              </td>
              <td className="py-2 pr-3">
                {c.href ? (
                  <Link href={c.href} className="hover:underline">
                    {c.eventName}
                  </Link>
                ) : (
                  c.eventName
                )}
              </td>
              <td className="py-2 pr-3 text-right">{c.score || "—"}</td>
              <td className="py-2 pr-3 text-right">{c.position}</td>
              <td className={`py-2 text-right ${c.usedInCalc ? "font-bold" : ""}`}>{c.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {dropped && (
        <p className="mt-2 text-xs text-fn-ink-soft">★ counts toward the total. Unstarred results are dropped.</p>
      )}
    </div>
  );
}
