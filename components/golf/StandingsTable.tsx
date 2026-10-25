import type { StandingsTable as Standings } from "@/lib/providers/types";

/**
 * A season standings table in the data register. Team series print the members
 * under the team name.
 */
export function StandingsTable({
  standings,
  empty = "Standings post after the first event.",
}: {
  standings: Standings | null;
  empty?: string;
}) {
  if (!standings || standings.rows.length === 0) {
    return <p className="border-y border-fn-line py-14 text-center text-sm text-fn-ink-soft">{empty}</p>;
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
            {standings.isMoney ? "Money" : "Points"}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-fn-line">
        {standings.rows.map((r) => (
          <tr key={`${r.userId}-${r.player}`}>
            <td className="py-2.5 pr-3 text-fn-ink-soft">{r.position}</td>
            <td className="py-2.5 pr-3">
              <span className="font-medium text-fn-ink">{r.player}</span>
              {r.members.length > 0 && (
                <span className="block text-xs text-fn-ink-soft">{r.members.join(" · ")}</span>
              )}
            </td>
            <td className="py-2.5 pr-3 text-right text-fn-ink-soft">{r.events}</td>
            <td className="py-2.5 text-right font-bold text-fn-ink">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
