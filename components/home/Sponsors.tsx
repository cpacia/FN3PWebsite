const SPONSORS = [
  { name: "Modern Woodmen", role: "Tour sponsor" },
  { name: "Milagro Tequila", role: "Official spirits partner" },
];

/**
 * Sponsor row. Deliberately quiet — ink on paper, no cards, no logos-in-boxes.
 * The partners read as credits rather than as advertising.
 */
export function Sponsors() {
  return (
    <section className="border-t border-fn-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-6 px-5 py-12 lg:px-8">
        {SPONSORS.map((s) => (
          <div key={s.name} className="text-center">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-fn-ink">
              {s.name}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-fn-ink-soft">
              {s.role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
