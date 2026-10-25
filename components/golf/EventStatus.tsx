import { StatusChip } from "@/components/golf/EventHeader";
import { isPast, registrationState } from "@/lib/golf";
import { formatDate } from "@/lib/seo";
import type { EventSummary } from "@/lib/providers/types";

/** One chip saying where an event stands: Live, Final, Canceled, or its entry status. */
export function EventStatus({ event, entry = true }: { event: EventSummary; entry?: boolean }) {
  if (event.status === "in_progress") return <StatusChip tone="live">Live</StatusChip>;
  if (event.status === "canceled") return <StatusChip tone="muted">Canceled</StatusChip>;
  if (event.status === "completed") return <StatusChip>Final</StatusChip>;
  if (isPast(event)) return <StatusChip tone="muted">Played</StatusChip>;
  if (!entry) return null;
  const r = registrationState(event);
  if (r.state === "open") return <StatusChip tone="accent">Entry open</StatusChip>;
  if (r.state === "soon") {
    return <StatusChip tone="muted">Opens {formatDate(r.opens, { year: undefined })}</StatusChip>;
  }
  return null;
}
