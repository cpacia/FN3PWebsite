/**
 * WM Phoenix Open trip details, transcribed from the current site's
 * /pages/fn3p-x-wm-phoenix-open-2027. Kept here rather than inline in the
 * component because the dedicated signup page needs the same numbers, and one
 * of them changing shouldn't mean editing two files.
 */
export const PHOENIX_TRIP = {
  year: 2027,
  startDate: "2027-02-11",
  endDate: "2027-02-16",
  dateLabel: "Feb 11–16, 2027",
  location: "Scottsdale, AZ",
  price: 3000,
  installment: 750,
  installmentCount: 4,
  lockDate: "October 1",
  included: [
    "5 nights lodging",
    "3 rounds of golf",
    "Sunday skybox + F&B",
    "Custom apparel drop",
    "Action money every round",
  ],
  courses: ["Eagle Mountain", "Golf Club of Estrella", "We-Ko-Pa · Cholla"],
} as const;

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
