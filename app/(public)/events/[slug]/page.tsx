import { notFound, redirect } from "next/navigation";
import { eventPath, locateEvent } from "@/lib/golf";

export const revalidate = 300;

/**
 * A stable link for any event, whatever kind it is — for announcements, emails
 * and Front9 itself, which only know the event slug. Sends the visitor on to the
 * event's real page under /tour, /charity or /indoor.
 */
export default async function EventRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const where = await locateEvent(slug);
  if (!where) notFound();
  redirect(eventPath(where.kind, slug, where.league?.slug));
}
