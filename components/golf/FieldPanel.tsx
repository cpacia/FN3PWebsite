import type { EventField, FieldPlayer } from "@/lib/providers/types";

/**
 * The registered field. Team events list their teams (named, with members);
 * individual events list players with hometown and handicap. Waitlisted
 * players are split out below the field rather than mixed into it.
 *
 * `variant="cards"` is the charity page's take: teams as rounded cards, no
 * handicaps — at a scramble the field is a list of who's coming, not a draw sheet.
 */
export function FieldPanel({
  field,
  variant = "rows",
  empty = "No one's registered yet.",
}: {
  field: EventField;
  variant?: "rows" | "cards";
  empty?: string;
}) {
  const asTeams = field.isTeamEvent && field.teams.length > 0;
  const registered = field.players.filter((p) => p.waitlistPosition == null);
  const waitlist = field.players
    .filter((p) => p.waitlistPosition != null)
    .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));

  if (!asTeams && registered.length === 0 && waitlist.length === 0) {
    return <p className="border-y border-fn-line py-14 text-center text-sm text-fn-ink-soft">{empty}</p>;
  }

  const count = asTeams
    ? `${field.teams.length} ${field.teams.length === 1 ? "team" : "teams"} · ${registered.length} players`
    : `${registered.length} ${registered.length === 1 ? "player" : "players"}`;

  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">{count}</p>

      {asTeams ? (
        variant === "cards" ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field.teams.map((t, i) => (
              <li key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-fn-line">
                <p className="font-display text-lg font-extrabold uppercase leading-tight text-fn-ink">
                  {t.name || `Team ${i + 1}`}
                </p>
                <p className="mt-1 text-sm text-fn-ink-soft">
                  {t.players.map((p) => p.name).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <ol className="divide-y divide-fn-line border-y-2 border-fn-ink">
            {field.teams.map((t, i) => (
              <li key={i} className="grid gap-1 py-3 sm:grid-cols-[2rem_14rem_1fr] sm:gap-4">
                <span className="tabular hidden text-xs font-semibold text-fn-ink-soft sm:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display font-bold uppercase text-fn-ink">
                  {t.name || `Team ${i + 1}`}
                </span>
                <span className="text-sm text-fn-ink-soft">
                  {t.players
                    .map((p) => (p.handicap ? `${p.name} (${p.handicap})` : p.name))
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ol>
        )
      ) : (
        <PlayerTable players={registered} />
      )}

      {waitlist.length > 0 && (
        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
            Waitlist · {waitlist.length}
          </p>
          <PlayerTable players={waitlist} waitlist />
        </div>
      )}
    </div>
  );
}

function PlayerTable({ players, waitlist = false }: { players: FieldPlayer[]; waitlist?: boolean }) {
  return (
    <table className="tabular w-full border-y-2 border-fn-ink text-sm">
      <thead>
        <tr className="border-b border-fn-ink text-left text-[11px] uppercase tracking-[0.14em] text-fn-ink-soft">
          <th scope="col" className="w-10 py-2.5 pr-3 font-semibold">
            {waitlist ? "#" : ""}
          </th>
          <th scope="col" className="py-2.5 pr-3 font-semibold">
            Player
          </th>
          <th scope="col" className="hidden py-2.5 pr-3 font-semibold sm:table-cell">
            Hometown
          </th>
          <th scope="col" className="py-2.5 text-right font-semibold">
            HCP
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-fn-line">
        {players.map((p, i) => (
          <tr key={p.playerId}>
            <td className="py-2.5 pr-3 text-xs text-fn-ink-soft">
              {waitlist ? p.waitlistPosition : String(i + 1).padStart(2, "0")}
            </td>
            <td className="py-2.5 pr-3 font-medium text-fn-ink">
              {p.name}
              {p.hometown && (
                <span className="block text-xs font-normal text-fn-ink-soft sm:hidden">{p.hometown}</span>
              )}
            </td>
            <td className="hidden py-2.5 pr-3 text-fn-ink-soft sm:table-cell">{p.hometown || "—"}</td>
            <td className="py-2.5 text-right font-semibold text-fn-ink">{p.handicap || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
