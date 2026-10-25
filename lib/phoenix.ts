/**
 * WM Phoenix Open trip details, transcribed from the current site's
 * /pages/fn3p-x-wm-phoenix-open-2027 and the trip's Shopify listing. Kept here
 * rather than inline because the home band, the announcement bar and the trip
 * page all need the same numbers, and one changing shouldn't mean editing three
 * files.
 *
 * The rounds themselves aren't listed here: they're Front9 events tagged
 * `wm-open` (see lib/golf.ts), so dates and courses come from there.
 */
export const PHOENIX_TRIP = {
  year: 2027,
  startDate: "2027-02-11",
  endDate: "2027-02-16",
  dateLabel: "Feb 11–16, 2027",
  location: "Scottsdale, AZ",
  /** Paid by Venmo, Cash App, cash or check — the price he'd rather people pay. */
  price: 3000,
  /** Paid by card through Shopify, which carries a 3% fee. */
  cardPrice: 3090,
  cardFeePercent: 3,
  installment: 750,
  installmentCount: 4,
  /** Money back until this date; after it, a spot is locked in. */
  lockDate: "October 1",
  venmo: { handle: "@fn3pgolf", href: "https://venmo.com/u/fn3pgolf" },
  email: "fn3pgolf@gmail.com",
  /** The Shopify product the card checkout sells. */
  productHandle: "fn3p-wmo-trip",
  included: [
    "5 nights lodging",
    "3 rounds of golf",
    "Sunday skybox + F&B",
    "Custom apparel drop",
    "Action money every round",
  ],
  notIncluded: ["Flights", "Rental car", "Food & drink (except Sunday on 16)"],
  lodging: {
    summary:
      "Condos a walk from Old Town Scottsdale. Each one is 2 bedrooms (4 beds), 2.5 baths and a full kitchen, about 1,500 sq ft. The complex has a hot tub, a grill and a putting green.",
    href: "https://www.fn3pgolf.com/pages/arizona-lodging",
  },
  /** Course websites, matched to the Front9 rounds by name. */
  courseLinks: [
    { match: /eagle mountain/i, href: "https://www.eaglemtn.com/" },
    { match: /estrella/i, href: "https://www.estrellagolf.com/" },
    { match: /we-?ko-?pa/i, href: "https://wekopa.com/cholla-course/" },
  ],
  courses: ["Eagle Mountain", "Golf Club of Estrella", "We-Ko-Pa · Cholla"],
} as const;

/** A round's course website, when it's one of the trip's courses. */
export function courseLink(course: string): string | null {
  return PHOENIX_TRIP.courseLinks.find((c) => c.match.test(course))?.href ?? null;
}

/**
 * Whole days until the trip starts, floored at 0.
 *
 * Lives here, not in a component: reading the clock during render is impure, and
 * React's purity rule rightly flags it. Callers are server components with a
 * revalidate window, so the value is recomputed on the same cadence as the page.
 */
export function daysUntilTrip(now: number = Date.now()): number {
  const start = Date.parse(`${PHOENIX_TRIP.startDate}T00:00:00Z`);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.ceil((start - now) / 86_400_000));
}
