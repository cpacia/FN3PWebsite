"use client";

import { useEffect, useState } from "react";
import type { Scorecard as Card, ScorecardRound, ScorecardSeries } from "@/lib/providers/types";

export interface ScorecardTarget {
  name: string;
  playerId?: number;
  teamId?: number;
  competitionId?: number;
  /** Net game: print the tee-and-handicap block above each round. */
  handicapped: boolean;
}

/**
 * A player's or team's hole-by-hole card, fetched when it's opened. Lives inside
 * a leaderboard row, so it's drawn as a sheet of the results page rather than a
 * card of its own: hairline rules, tabular figures, the ink header.
 */
export function Scorecard({ slug, target }: { slug: string; target: ScorecardTarget }) {
  const [card, setCard] = useState<Card | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ok">("loading");
  const { name, playerId, teamId, competitionId } = target;

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ name });
    if (playerId != null) qs.set("playerId", String(playerId));
    if (teamId != null) qs.set("teamId", String(teamId));
    if (competitionId != null) qs.set("competitionId", String(competitionId));
    fetch(`/api/events/${encodeURIComponent(slug)}/scorecard?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Card) => {
        if (cancelled) return;
        setCard(d);
        setState(d.rounds.some((r) => r.rows.length > 0) ? "ok" : "error");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [slug, name, playerId, teamId, competitionId]);

  if (state !== "ok" || !card) {
    return (
      <p className="py-6 text-center text-sm text-fn-ink-soft">
        {state === "loading" ? "Loading scorecard…" : "This scorecard isn't available yet."}
      </p>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {card.rounds.map((round) => (
        <div key={round.roundNumber}>
          {card.rounds.length > 1 && round.roundName && (
            <h4 className="mb-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink">
              {round.roundName}
            </h4>
          )}
          {target.handicapped && <Handicaps round={round} />}
          <RoundGrid round={round} />
        </div>
      ))}
    </div>
  );
}

const dash = (v: number | string | null | undefined) => (v == null || v === "" ? "–" : String(v));

/** Tee, rating and handicaps for the round: one line, or one per team member. */
function Handicaps({ round }: { round: ScorecardRound }) {
  if (round.handicaps.length === 0) return null;
  const team = round.handicaps.length > 1;
  return (
    <div className="mb-3 overflow-x-auto">
      <table className="tabular w-full border-y border-fn-line text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-fn-ink-soft">
            {team && <th className="py-1.5 pr-3 font-semibold">Player</th>}
            <th className="py-1.5 pr-3 font-semibold">Tee</th>
            <th className="py-1.5 pr-3 font-semibold">Rating / Slope</th>
            <th className="py-1.5 pr-3 text-right font-semibold">Index</th>
            <th className="py-1.5 pr-3 text-right font-semibold">Course hcp</th>
            <th className="py-1.5 text-right font-semibold">Playing hcp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fn-line">
          {round.handicaps.map((h, i) => (
            <tr key={i} className="text-fn-ink">
              {team && <td className="whitespace-nowrap py-1.5 pr-3 font-medium">{h.name}</td>}
              <td className="py-1.5 pr-3">{h.tee || "–"}</td>
              <td className="whitespace-nowrap py-1.5 pr-3">
                {h.courseRating == null && h.slopeRating == null
                  ? "–"
                  : `${dash(h.courseRating)} / ${dash(h.slopeRating)}`}
              </td>
              <td className="py-1.5 pr-3 text-right">{h.index || "–"}</td>
              <td className="py-1.5 pr-3 text-right">{dash(h.courseHandicap)}</td>
              <td className="py-1.5 text-right font-bold">{dash(h.playingHandicap)}</td>
            </tr>
          ))}
          {team && round.teamPlayingHandicap != null && (
            <tr className="text-fn-ink">
              <td colSpan={5} className="py-1.5 pr-3 text-right uppercase tracking-[0.12em] text-fn-ink-soft">
                Team playing handicap
              </td>
              <td className="py-1.5 text-right font-bold">{round.teamPlayingHandicap}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** No score yet (0, blank, null) is an empty cell. */
function cell(v: number | string | null | undefined): string {
  return v == null || v === "" || v === 0 || v === "0" ? "" : String(v);
}

type Col = { type: "label" } | { type: "hole"; i: number } | { type: "out" | "in" | "total" };

function RoundGrid({ round }: { round: ScorecardRound }) {
  const holes = Math.max(0, ...round.rows.map((r) => r.values.length));
  if (holes === 0) return null;
  const split = holes > 9;
  const front = Array.from({ length: Math.min(9, holes) }, (_, i) => i);
  const back = split ? Array.from({ length: holes - 9 }, (_, i) => i + 9) : [];
  const cols: Col[] = [
    { type: "label" },
    ...front.map((i): Col => ({ type: "hole", i })),
    ...(split ? [{ type: "out" } as Col] : []),
    ...back.map((i): Col => ({ type: "hole", i })),
    ...(split ? [{ type: "in" } as Col] : []),
    { type: "total" },
  ];
  const summary = (c: Col) => c.type === "out" || c.type === "in" || c.type === "total";
  const head = (c: Col) =>
    c.type === "label" ? "Hole" : c.type === "hole" ? String(c.i + 1) : c.type === "total" ? "Tot" : c.type === "out" ? "Out" : "In";
  const parRow = round.rows.find((r) => r.key === "par");
  const par = parRow?.values;
  // An aggregate line (Team Gross on a four-ball aggregate) sums several
  // players' scores, so birdie/bogey shapes against one par would be noise.
  // A single score line never totals anywhere near double par.
  const shaped = (s: ScorecardSeries) =>
    s.formatted && !(Number(s.total) > 1.6 * Number(parRow?.total ?? Infinity));

  const content = (s: ScorecardSeries, c: Col) => {
    if (c.type === "label") return s.label;
    if (c.type === "out") return cell(s.out);
    if (c.type === "in") return cell(s.in);
    if (c.type !== "hole") return cell(s.total);
    const given = Number(s.strokesGiven?.[c.i]) || 0;
    const value = cell(s.values[c.i]);
    if (shaped(s)) return <ScoreShape value={value} toPar={toPar(s.values[c.i], par?.[c.i])} dots={given} />;
    return given > 0 ? <Dotted value={value} dots={given} /> : value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="tabular w-full border-b border-fn-line text-xs">
        <thead className="bg-fn-ink text-fn-paper">
          <tr>
            {cols.map((c, i) => (
              <th
                key={i}
                scope="col"
                className={`whitespace-nowrap px-1.5 py-1.5 font-display font-bold uppercase tracking-[0.08em] ${
                  c.type === "label" ? "sticky left-0 bg-fn-ink pl-2 text-left" : "text-center"
                } ${summary(c) ? "bg-black" : ""}`}
              >
                {head(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-fn-line">
          {round.rows.map((s, ri) => {
            const muted = s.key === "par" || s.key === "holeIndex";
            return (
              <tr key={ri} className={muted ? "bg-fn-paper text-fn-ink-soft" : "bg-white text-fn-ink"}>
                {cols.map((c, ci) => (
                  <td
                    key={ci}
                    className={`whitespace-nowrap px-1.5 ${s.formatted ? "pb-1.5 pt-2.5" : "py-1.5"} ${
                      c.type === "label"
                        ? `sticky left-0 pl-2 text-left font-semibold ${muted ? "bg-fn-paper" : "bg-white"}`
                        : "text-center"
                    } ${summary(c) ? "bg-fn-paper font-bold text-fn-ink" : ""}`}
                  >
                    {content(s, c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-fn-ink-soft">
        <span className="mr-1 inline-block h-1 w-1 translate-y-[-2px] rounded-full bg-fn-accent-deep" />
        Handicap stroke · ○ birdie or better · □ bogey or worse
      </p>
    </div>
  );
}

/** Hole score against par; null when either is missing. */
function toPar(score: number | string | null | undefined, par: number | string | null | undefined): number | null {
  const sc = Number(score);
  const p = Number(par);
  if (!Number.isInteger(sc) || sc <= 0 || !Number.isInteger(p) || p <= 0) return null;
  return sc - p;
}

function Dots({ n, lift = "pb-px" }: { n: number; lift?: string }) {
  return (
    <span className={`absolute bottom-full left-1/2 flex -translate-x-1/2 gap-0.5 ${lift}`}>
      {Array.from({ length: Math.min(n, 4) }, (_, k) => (
        <span key={k} className="h-[3px] w-[3px] rounded-full bg-fn-accent-deep" />
      ))}
    </span>
  );
}

/**
 * A stroke score in the scorecard shapes: circle for a birdie, double circle for
 * an eagle or better, square for a bogey, double square for worse. Every score
 * sits in the same fixed box so shaped and plain holes line up; handicap-stroke
 * dots float above it, out of flow.
 */
function ScoreShape({ value, toPar, dots }: { value: string; toPar: number | null; dots: number }) {
  const shape =
    toPar == null || toPar === 0 ? "" : toPar < 0 ? "rounded-full border border-red-700 text-red-700" : "border border-fn-ink";
  const double = toPar != null && Math.abs(toPar) >= 2;
  const ring = double ? `outline outline-1 outline-offset-2 ${toPar! < 0 ? "outline-red-700" : "outline-fn-ink"}` : "";
  return (
    <span className={`relative inline-flex h-5 w-5 items-center justify-center ${shape} ${ring}`}>
      {dots > 0 && <Dots n={dots} lift={double ? "pb-[5px]" : "pb-[3px]"} />}
      {value}
    </span>
  );
}

function Dotted({ value, dots }: { value: string; dots: number }) {
  return (
    <span className="relative inline-block">
      <Dots n={dots} />
      {value || " "}
    </span>
  );
}
