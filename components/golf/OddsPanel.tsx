"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Flash } from "@/components/golf/Flash";
import { normalizeOdds, type RawOdds } from "@/lib/odds";
import type { EventOdds, OddsEntrant } from "@/lib/providers/types";

type Mode = "money" | "percent";
type Market = "win" | "top5" | "top10" | "top20";
type SortCol = "name" | Market;

const MARKETS: { key: Market; label: string }[] = [
  { key: "win", label: "Win" },
  { key: "top5", label: "Top 5" },
  { key: "top10", label: "Top 10" },
  { key: "top20", label: "Top 20" },
];

/** American money line: "+450", "-120"; "—" when not priced. */
function moneyLine(v: number | null): string {
  if (v == null) return "—";
  return v > 0 ? `+${v}` : `${v}`.replace("-", "−");
}

/** Probability 0–1 → "12.5%"; "—" when not priced. */
function pct(v: number | null): string {
  if (v == null) return "—";
  return `${Math.round(v * 1000) / 10}%`;
}

/**
 * Sort strength for a market, lower is better: a negative line beats a positive
 * one, and an unpriced entrant (odds so long they're ~zero) sorts last.
 */
function strength(p: OddsEntrant, m: Market): number {
  return p[`${m}Odds`] ?? Infinity;
}

/**
 * The Odds tab: Front9's simulated win and top-5/10/20 chances for every
 * entrant, as money lines or percentages, with Favorite / Best Value / Long
 * Shot picks on top. Mirrors the LFG site's tab in this site's data register.
 *
 * With a `streamUrl` it follows Front9's live odds stream (each frame is the
 * full payload) and changed prices flash.
 */
export function OddsPanel({ odds, streamUrl }: { odds: EventOdds; streamUrl?: string | null }) {
  const [mode, setMode] = useState<Mode>("money");
  const [sort, setSort] = useState<{ key: SortCol; dir: "asc" | "desc" } | null>(null);
  const [data, setData] = useState(odds);

  useEffect(() => {
    if (!streamUrl) return;
    const es = new EventSource(streamUrl);
    const onFrame = (e: MessageEvent) => {
      try {
        const next = normalizeOdds(JSON.parse(e.data) as RawOdds);
        // A frame without prices keeps the last good board.
        if (next.status === "ok" && (next.players.length || next.teams.length)) setData(next);
      } catch {
        // A malformed frame keeps the last good board.
      }
    };
    es.addEventListener("odds", onFrame);
    return () => es.close();
  }, [streamUrl]);

  // Team formats price teams, individual formats players.
  const isTeams = data.players.length === 0 && data.teams.length > 0;
  const entrants = isTeams ? data.teams : data.players;

  if (data.status !== "ok" || entrants.length === 0) {
    return (
      <div className="border-y border-fn-line py-14 text-center">
        <p className="font-display text-lg font-bold uppercase text-fn-ink">No odds yet</p>
        <p className="mt-1 text-sm text-fn-ink-soft">
          {data.message || "Odds post here once the field is set."}
        </p>
      </div>
    );
  }

  // Picks by win chance: the favorite is the shortest price, the long shot the
  // longest with any real chance, and best value the longest-priced genuine
  // contender (5%+) between them.
  const byWin = entrants
    .filter((p) => p.winPct != null && p.winPct > 0)
    .sort((a, b) => b.winPct! - a.winPct!);
  const favorite = byWin[0] ?? null;
  const longShot = byWin.length > 1 ? byWin[byWin.length - 1] : null;
  const contenders = byWin.filter((p) => p !== favorite && p !== longShot && p.winPct! >= 0.05);
  const bestValue = contenders.at(-1) ?? null;

  const val = (p: OddsEntrant, m: Market) =>
    mode === "money" ? moneyLine(p[`${m}Odds`]) : pct(p[`${m}Pct`]);

  // Keep each entrant's rank by win chance (Front9's order) through a re-sort.
  const ranked = entrants.map((p, i) => ({ p, rank: i + 1 }));
  const rows = !sort
    ? ranked
    : [...ranked].sort((a, b) => {
        const cmp =
          sort.key === "name"
            ? a.p.name.localeCompare(b.p.name)
            : strength(a.p, sort.key) - strength(b.p, sort.key);
        return sort.dir === "asc" ? cmp : -cmp;
      });

  const toggleSort = (key: SortCol) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const dirOf = (key: SortCol) => (sort?.key === key ? sort.dir : undefined);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {favorite && <PickCard label="Favorite" p={favorite} icon={<TrophyIcon />} />}
        {bestValue && <PickCard label="Best value" p={bestValue} icon={<TargetIcon />} />}
        {longShot && <PickCard label="Long shot" p={longShot} icon={<BoltIcon />} />}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {data.competitionName && (
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink-soft">
            {data.competitionName}
          </p>
        )}
        <div className="ml-auto flex gap-2">
          <Toggle on={mode === "money"} onClick={() => setMode("money")}>
            Money line
          </Toggle>
          <Toggle on={mode === "percent"} onClick={() => setMode("percent")}>
            Percent
          </Toggle>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="tabular w-full border-y-2 border-fn-ink text-sm">
          <thead>
            <tr className="border-b border-fn-ink text-left text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">
              <th scope="col" className="px-2 py-2.5 font-semibold sm:px-3">
                #
              </th>
              <th scope="col" className="w-full px-2 py-2.5 sm:px-3">
                <SortButton label={isTeams ? "Team" : "Player"} dir={dirOf("name")} onClick={() => toggleSort("name")} />
              </th>
              {MARKETS.map((m) => (
                <th key={m.key} scope="col" className="px-2 py-2.5 text-right sm:px-3">
                  <SortButton label={m.label} dir={dirOf(m.key)} onClick={() => toggleSort(m.key)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-fn-line">
            {rows.map(({ p, rank }) => (
              <tr key={`${rank}-${p.name}`}>
                <td className="px-2 py-2.5 text-fn-ink-soft sm:px-3">{rank}</td>
                <td className="px-2 py-2.5 font-medium text-fn-ink sm:px-3">
                  {p.name}
                  {p === favorite && <Tag>Fav</Tag>}
                  {p === bestValue && <Tag>Value</Tag>}
                </td>
                {MARKETS.map((m) => (
                  <td
                    key={m.key}
                    className={`whitespace-nowrap px-2 py-2.5 text-right sm:px-3 ${
                      m.key === "win" ? "font-bold text-fn-ink" : "text-fn-ink-soft"
                    }`}
                  >
                    <Flash value={val(p, m.key)} resetKey={mode} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-fn-ink-soft">
        Simulated by Front9 from the field and the scores so far, and updated live. Just for fun.
      </p>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 inline-block bg-fn-accent px-1.5 py-0.5 align-middle font-display text-[9px] font-bold uppercase tracking-[0.14em] text-fn-ink">
      {children}
    </span>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`cursor-pointer border-2 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
        on
          ? "border-fn-ink bg-fn-ink text-fn-paper"
          : "border-fn-line text-fn-ink-soft hover:border-fn-ink hover:text-fn-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({ label, dir, onClick }: { label: string; dir?: "asc" | "desc"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label}`}
      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-semibold uppercase hover:text-fn-ink"
    >
      {label}
      <span aria-hidden className="inline-flex flex-col leading-none">
        <svg viewBox="0 0 8 5" className={`h-[5px] w-2 fill-current ${dir === "asc" ? "" : "opacity-35"}`}>
          <path d="M4 0 8 5H0z" />
        </svg>
        <svg viewBox="0 0 8 5" className={`mt-px h-[5px] w-2 fill-current ${dir === "desc" ? "" : "opacity-35"}`}>
          <path d="M4 5 0 0h8z" />
        </svg>
      </span>
    </button>
  );
}

function PickCard({ label, p, icon }: { label: string; p: OddsEntrant; icon: ReactNode }) {
  return (
    <div className="relative flex items-center gap-4 border-2 border-fn-ink bg-fn-paper p-5">
      {/* The pin-flag notch, as on the home page's event card. */}
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-4 w-4 bg-fn-ink"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fn-accent text-fn-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-fn-accent-deep">
          {label}
        </p>
        <p className="truncate font-display text-lg font-extrabold uppercase leading-tight text-fn-ink">
          {p.name}
        </p>
        <p className="tabular text-sm text-fn-ink-soft">
          {moneyLine(p.winOdds)} · {pct(p.winPct)}
        </p>
      </div>
    </div>
  );
}

const ICON = {
  className: "h-5 w-5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function TrophyIcon() {
  return (
    <svg {...ICON}>
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...ICON} fill="currentColor" stroke="none">
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  );
}
