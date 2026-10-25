"use server";

import { redirect } from "next/navigation";
import { eventPath, leagueStage, locateEvent } from "@/lib/golf";
import {
  getEventDetail,
  getLeague,
  startEventRegistration,
  startLeagueRegistration,
} from "@/lib/providers/front9";

/**
 * Registration hands off to Front9's hosted form, and the hosted URL is minted
 * per registration — so the CTA is a form posting to these actions rather than
 * a link. Both re-read the event or league first, so a stale page can't start a
 * sign-up after the window has closed. Failure lands back on the page with
 * `?registration=failed`, which the page turns into a message.
 *
 * redirect() works by throwing, so it's called outside any try/catch.
 */

export async function registerForEvent(slug: string) {
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  const home = where ? eventPath(where.kind, slug, where.league?.slug) : "/";
  const target =
    event?.registrationOpen && event.front9Id != null
      ? await startEventRegistration(event.front9Id)
      : null;
  redirect(target ?? `${home}?registration=failed`);
}

export async function registerForLeague(slug: string) {
  const league = await getLeague(slug);
  const stage = league ? leagueStage(league) : null;
  // A full league still registers: Front9 puts the golfer on the waitlist.
  const target =
    league && (stage === "registering" || stage === "full")
      ? await startLeagueRegistration(league.id)
      : null;
  redirect(target ?? `/indoor/${slug}?registration=failed`);
}
