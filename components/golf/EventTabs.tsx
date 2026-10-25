"use client";

import { useEffect, useState, type ReactNode } from "react";

export type EventTab = { key: string; label: string; panel: ReactNode };

/**
 * Hash-routable tabs for the event pages (/tour/x#leaderboard). Panels are
 * rendered on the server and all stay mounted — hidden when inactive — so the
 * live leaderboard keeps its stream open while you look at tee times.
 *
 * Data register: square, hairline, ink. The active tab is marked with the one
 * accent the register allows.
 */
export function EventTabs({
  tabs,
  initial,
  label = "Event sections",
}: {
  tabs: EventTab[];
  initial?: string;
  label?: string;
}) {
  const keys = tabs.map((t) => t.key).join(",");
  const [active, setActive] = useState(initial ?? tabs[0]?.key ?? "");

  useEffect(() => {
    const valid = keys.split(",");
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (valid.includes(h)) setActive(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [keys]);

  const select = (key: string) => {
    setActive(key);
    // replaceState keeps the tab shareable without stacking history or scrolling.
    window.history.replaceState(null, "", `#${key}`);
  };

  return (
    <div>
      <div className="border-b-2 border-fn-ink">
        <div role="tablist" aria-label={label} className="-mb-0.5 flex overflow-x-auto">
          {tabs.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`panel-${t.key}`}
                onClick={() => select(t.key)}
                className={`shrink-0 cursor-pointer border-b-4 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] transition-colors sm:px-6 ${
                  on
                    ? "border-fn-accent text-fn-ink"
                    : "border-transparent text-fn-ink-soft hover:text-fn-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          id={`panel-${t.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.key}`}
          hidden={active !== t.key}
          className="pt-8"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
