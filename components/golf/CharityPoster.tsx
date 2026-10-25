import Image from "next/image";
import Link from "next/link";
import { DateStamp } from "@/components/golf/DateStamp";
import { eventPath, registrationState } from "@/lib/golf";
import { formatDate } from "@/lib/seo";
import type { EventSummary } from "@/lib/providers/types";

/**
 * A charity event as a poster: the event artwork up top with the date stamp
 * pinned to its corner, then the name and where it's played. The whole card is
 * the link — the event page is where you register.
 */
export function CharityPoster({ event }: { event: EventSummary }) {
  const r = registrationState(event);
  const cta =
    r.state === "open"
      ? "Register a team"
      : r.state === "soon"
        ? `Registration opens ${formatDate(r.opens, { year: undefined })}`
        : "See the details";
  return (
    <Link
      href={eventPath("charity", event.eventId)}
      className="group relative block rounded-3xl bg-fn-paper p-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-fn-ink"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
        {event.thumbnailUrl ? (
          <Image
            src={event.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-5"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: "var(--print-sm)", backgroundSize: "cover" }}
          />
        )}
      </div>
      <DateStamp date={event.date} className="absolute -top-4 -right-3" />
      <div className="px-4 pb-4 pt-6">
        <h3 className="font-display text-3xl font-black uppercase leading-[0.95] text-fn-ink">
          {event.name}
        </h3>
        <p className="mt-2 text-sm text-fn-ink-soft">
          {[event.course, [event.town, event.state].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(", ")}
        </p>
        <span className="mt-5 inline-flex rounded-full bg-fn-ink px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-fn-paper group-hover:bg-black">
          {cta}
        </span>
      </div>
    </Link>
  );
}
