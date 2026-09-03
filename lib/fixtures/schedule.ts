/**
 * PLACEHOLDER 2026 schedule.
 *
 * The FN3P org does not exist on Front9 yet — "fn3p", "fn3p-golf" and "fn3pgolf"
 * all return ORG_NOT_FOUND — so there is no live schedule to render. These rows
 * are transcribed from the current fn3pgolf.com tour page purely so the home
 * page's tour band can be designed and reviewed against realistic content.
 *
 * They are only used when Front9 returns nothing (see app/(public)/page.tsx).
 * Delete this file once FRONT9_ORG_SLUG is set and the 2026 events exist —
 * nothing else imports it.
 */
import type { EventSummary } from "@/lib/providers/types";

function stub(
  partial: Pick<EventSummary, "eventId" | "name" | "date" | "course" | "town" | "state">,
): EventSummary {
  return {
    front9Id: null,
    eventType: "tournament",
    status: "published",
    endDate: "",
    description: "",
    thumbnailUrl: "",
    sponsorImageUrl: "",
    registrationOpen: true,
    registrationOpensAt: "",
    isComplete: false,
    maxPlayers: 40,
    totalPlayers: 0,
    rounds: [],
    ...partial,
  };
}

export const PLACEHOLDER_SCHEDULE: EventSummary[] = [
  stub({
    eventId: "2026-brunswick",
    name: "Brunswick",
    date: "2026-04-28",
    course: "Brunswick Golf Club",
    town: "Brunswick",
    state: "ME",
  }),
  stub({
    eventId: "2026-point-sebago",
    name: "Point Sebago",
    date: "2026-05-28",
    course: "Point Sebago Golf Club",
    town: "Casco",
    state: "ME",
  }),
  stub({
    eventId: "2026-winnipesaukee",
    name: "Lake Winnipesaukee",
    date: "2026-06-02",
    course: "Lake Winnipesaukee Golf Club",
    town: "New Durham",
    state: "NH",
  }),
  stub({
    eventId: "2026-sugarloaf",
    name: "Sugarloaf",
    date: "2026-06-24",
    course: "Sugarloaf Golf Club",
    town: "Carrabassett Valley",
    state: "ME",
  }),
  stub({
    eventId: "2026-fairlawn",
    name: "Fairlawn",
    date: "2026-07-15",
    course: "Fairlawn Golf Club",
    town: "Poland",
    state: "ME",
  }),
  stub({
    eventId: "2026-portsmouth",
    name: "Portsmouth CC",
    date: "2026-08-17",
    course: "Portsmouth Country Club",
    town: "Greenland",
    state: "NH",
  }),
  stub({
    eventId: "2026-championship-martindale",
    name: "Tour Championship · Leg 1",
    date: "2026-09-15",
    course: "Martindale Country Club",
    town: "Auburn",
    state: "ME",
  }),
  stub({
    eventId: "2026-championship-renaissance",
    name: "Tour Championship · Leg 2",
    date: "2026-10-06",
    course: "Renaissance Golf Club",
    town: "Haverhill",
    state: "MA",
  }),
];
