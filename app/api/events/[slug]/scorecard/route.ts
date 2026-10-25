import { NextResponse } from "next/server";
import { getScorecard } from "@/lib/providers/front9";

/**
 * A player's or team's hole-by-hole scorecard, for the leaderboard's expanding
 * rows. Proxied so the API base and org slug stay server-side.
 *
 *   GET /api/events/{slug}/scorecard?playerId=..&competitionId=..
 *   GET /api/events/{slug}/scorecard?teamId=..&competitionId=..
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sp = new URL(req.url).searchParams;
  const id = (k: string) => {
    const n = Number(sp.get(k));
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const scorecard = await getScorecard(slug, {
    playerId: id("playerId"),
    teamId: id("teamId"),
    competitionId: id("competitionId"),
    name: (sp.get("name") ?? "").slice(0, 100),
  });
  if (!scorecard) {
    return NextResponse.json({ error: "Scorecard unavailable" }, { status: 502 });
  }
  return NextResponse.json(scorecard);
}
