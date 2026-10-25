"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Scorecard } from "@/components/golf/Scorecard";
import { hasResults, normalizeLeaderboards, type RawLeaderboardResponse } from "@/lib/leaderboard";
import type { Leaderboard, LeaderboardTable } from "@/lib/providers/types";

type Cell = string | number | boolean | null | undefined;

const text = (v: Cell) => (v == null ? "" : String(v));
const v0 = (v: Cell) => text(v).trim();

/** Single-hole contests: a distance, not a card, so their rows don't open. */
const CONTEST_FORMATS = new Set(["closest_to_pin", "long_drive"]);

/** To-par columns: the total, today, and each round. */
const isToPar = (key: string) => key === "totalDisplay" || key === "todayDisplay" || /^r\d+$/.test(key);

/**
 * Every competition's board for an event, one pill per competition. Columns and
 * rows come straight from Front9, so a scramble, a skins game and a closest-to-
 * the-pin board all render without format-specific code.
 *
 * With a `streamUrl` it subscribes to Front9's live SSE stream (each frame is the
 * full leaderboard payload) and changed cells flash.
 *
 * A player or team name opens their hole-by-hole scorecard in a row beneath it.
 */
export function LeaderboardView({
  slug,
  leaderboards,
  netCompetitionIds = [],
  streamUrl,
  empty = "Scores post here once play starts.",
}: {
  /** The event, for fetching scorecards. */
  slug: string;
  leaderboards: Leaderboard[];
  /** Competitions played off handicap, whose cards print the handicap block. */
  netCompetitionIds?: number[];
  streamUrl?: string | null;
  empty?: string;
}) {
  const [data, setData] = useState(leaderboards);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!streamUrl) return;
    const es = new EventSource(streamUrl);
    const onFrame = (e: MessageEvent) => {
      try {
        const next = normalizeLeaderboards(JSON.parse(e.data) as RawLeaderboardResponse);
        if (next.length) setData(next);
      } catch {
        // A malformed frame keeps the last good board.
      }
    };
    es.addEventListener("leaderboard", onFrame);
    return () => es.close();
  }, [streamUrl]);

  if (!hasResults(data)) {
    return (
      <div className="border-y border-fn-line py-14 text-center">
        <p className="font-display text-lg font-bold uppercase text-fn-ink">No scores yet</p>
        <p className="mt-1 text-sm text-fn-ink-soft">{empty}</p>
        {data.length > 0 && (
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-fn-ink-soft">
            {data.map((b) => b.competitionName).filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    );
  }

  const idx = Math.min(active, data.length - 1);
  const current = data[idx];

  return (
    <div>
      {streamUrl && (
        <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          Live · updates automatically
        </p>
      )}

      {data.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {data.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === idx}
              className={`cursor-pointer border-2 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                i === idx
                  ? "border-fn-ink bg-fn-ink text-fn-paper"
                  : "border-fn-line text-fn-ink-soft hover:border-fn-ink hover:text-fn-ink"
              }`}
            >
              {b.competitionName || "Leaderboard"}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {current.tables.map((t, i) => (
          <Table
            key={`${idx}-${i}`}
            table={t}
            showLabel={current.tables.length > 1}
            resetKey={idx}
            card={
              CONTEST_FORMATS.has(current.format)
                ? null
                : {
                    slug,
                    competitionId: current.competitionIds[0],
                    handicapped: current.competitionIds.some((id) => netCompetitionIds.includes(id)),
                  }
            }
          />
        ))}
      </div>
    </div>
  );
}

function Table({
  table,
  showLabel,
  resetKey,
  card,
}: {
  table: LeaderboardTable;
  showLabel: boolean;
  resetKey: number;
  /** Where this board's scorecards come from; null when its rows don't open. */
  card: { slug: string; competitionId?: number; handicapped: boolean } | null;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const nameCol = table.columns.findIndex((c) => c.key === "displayName");
  // Quota formats print "+3"/"-2" relative to quota, where below is bad, so they
  // don't get the under-par red. Front9 marks them with a "Pts" strokes column.
  const isQuota = table.columns.some((c) => c.key === "totalStrokes" && c.label === "Pts");

  return (
    <div>
      {showLabel && table.label && (
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-fn-ink">
          {table.label}
        </h3>
      )}
      <div className="overflow-x-auto">
        <table className="tabular w-full border-y-2 border-fn-ink text-sm">
          <thead>
            <tr className="border-b border-fn-ink text-left text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">
              {table.columns.map((c, i) => (
                <th
                  key={c.key || i}
                  scope="col"
                  className={`whitespace-nowrap px-2 py-2.5 font-semibold sm:px-3 ${
                    i === nameCol ? "w-full" : ""
                  } ${nameCol >= 0 && i > nameCol ? "text-right" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-fn-line">
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length || 1} className="py-8 text-center text-fn-ink-soft">
                  Nothing posted for this game yet.
                </td>
              </tr>
            )}
            {table.rows.map((row, ri) => {
              const key = text(row.playerId ?? row.teamId ?? row.displayName ?? ri);
              const playerId = typeof row.playerId === "number" ? row.playerId : undefined;
              const teamId = typeof row.teamId === "number" ? row.teamId : undefined;
              const opens = !!card && (playerId != null || teamId != null);
              const isOpen = opens && open === key;
              return (
                <Fragment key={key}>
                  <tr className={isOpen ? "bg-fn-paper" : ""}>
                    {table.columns.map((c, i) => {
                      const v = text(row[c.key]);
                      const under = !isQuota && isToPar(c.key) && /^-\d/.test(v);
                      const flash = (
                        <Flash
                          value={c.key === "totalDisplay" ? v.replace(/^-/, "−") : v}
                          resetKey={resetKey}
                          className={under ? "!text-red-700" : ""}
                        />
                      );
                      return (
                        <td
                          key={c.key || i}
                          className={`px-2 py-2.5 sm:px-3 ${
                            i === nameCol ? "font-medium text-fn-ink" : "text-fn-ink-soft"
                          } ${nameCol >= 0 && i > nameCol ? "text-right" : ""} ${
                            c.key === "totalDisplay" ? "font-bold !text-fn-ink" : ""
                          }`}
                        >
                          {i === nameCol && opens ? (
                            <button
                              type="button"
                              onClick={() => setOpen(isOpen ? null : key)}
                              aria-expanded={isOpen}
                              className="group flex cursor-pointer items-baseline gap-1.5 text-left hover:underline"
                            >
                              {flash}
                              <span
                                aria-hidden
                                className={`text-[10px] text-fn-ink-soft transition-transform ${
                                  isOpen ? "rotate-90" : ""
                                }`}
                              >
                                ▸
                              </span>
                            </button>
                          ) : (
                            flash
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {isOpen && (
                    <tr className="bg-fn-paper">
                      <td colSpan={table.columns.length} className="px-2 sm:px-3">
                        <Scorecard
                          slug={card.slug}
                          target={{
                            name: v0(row.displayName),
                            playerId,
                            teamId,
                            competitionId: card.competitionId,
                            handicapped: card.handicapped,
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * A value that briefly highlights when it changes under a live stream. Skips the
 * first render and any change caused by switching competitions (`resetKey`), so
 * only a genuine score change flashes.
 */
function Flash({ value, resetKey, className }: { value: string; resetKey: number; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<{ value: string; reset: number } | null>(null);

  useEffect(() => {
    const last = prev.current;
    prev.current = { value, reset: resetKey };
    if (!last || last.reset !== resetKey || last.value === value) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    // Resolved here rather than written as var() in the keyframes, which not
    // every engine interpolates.
    const accent = getComputedStyle(el).getPropertyValue("--color-fn-accent").trim() || "#84d7e7";
    el.animate(
      [
        { backgroundColor: accent },
        { backgroundColor: accent, offset: 0.2 },
        { backgroundColor: "transparent" },
      ],
      { duration: 1300, easing: "ease-out" },
    );
  }, [value, resetKey]);

  return (
    <span ref={ref} className={`inline-block px-1 ${className}`}>
      {value}
    </span>
  );
}
