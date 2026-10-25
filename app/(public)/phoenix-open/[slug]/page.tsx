import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventBody } from "@/components/golf/EventBody";
import { EventHeader } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { dateLabel, eventPath, formatName, locateEvent, teamSizeLabel } from "@/lib/golf";
import { courseLink, PHOENIX_TRIP } from "@/lib/phoenix";
import { getEventDetail } from "@/lib/providers/front9";
import type { EventDetail, EventSummary } from "@/lib/providers/types";
import { socialMetadata } from "@/lib/seo";

/** Short, so a leaderboard settles within a minute of play finishing. */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  if (!event) return socialMetadata({ title: "FN3P × WM Phoenix Open", path: "/phoenix-open" });
  return socialMetadata({
    title: `${event.name} · FN3P × WM Phoenix Open`,
    description: [dateLabel(event.date, event.endDate), event.course, place(event)]
      .filter(Boolean)
      .join(" · "),
    path: `/phoenix-open/${slug}`,
    image: event.thumbnailUrl || undefined,
  });
}

/**
 * One round of the Phoenix trip. The data register, like a tour event page —
 * the trip page is where the brand register lives — with the round's place in
 * the trip in the header and a way back to the trip instead of a sign-up card:
 * the trip is booked as a whole, not round by round.
 */
export default async function PhoenixRoundPage({ params }: Params) {
  const { slug } = await params;
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  if (!event || !where) notFound();
  if (where.kind !== "phoenix") redirect(eventPath(where.kind, slug, where.league?.slug));

  const rounds = where.siblings;
  const i = rounds.findIndex((e) => e.eventId === slug);
  const prev = i > 0 ? rounds[i - 1] : null;
  const next = i >= 0 && i < rounds.length - 1 ? rounds[i + 1] : null;
  const games = event.roundDetails[0]?.competitions ?? [];
  const primary = games.find((c) => c.primary) ?? games.find((c) => !c.isContest) ?? null;
  const round = event.roundDetails[0];
  const site = courseLink(event.course);

  return (
    <>
      <EventHeader
        back={{ href: "/phoenix-open", label: `FN3P × WM Phoenix Open ${PHOENIX_TRIP.year}` }}
        eyebrow={[i >= 0 ? `Round ${i + 1} of ${rounds.length}` : "", dateLabel(event.date, event.endDate)]
          .filter(Boolean)
          .join(" · ")}
        title={event.name}
        subtitle={[event.course !== event.name ? event.course : "", place(event)].filter(Boolean).join(" · ")}
        status={<EventStatus event={event} entry={false} />}
        imageUrl={event.thumbnailUrl}
        facts={[
          { label: "Format", value: primary ? formatName(primary.format) : "TBA" },
          { label: "Play", value: teamSizeLabel(event.teamSize) },
          {
            label: "Course",
            value: round?.tee?.par
              ? `${round.holes} holes · Par ${round.tee.par}`
              : round?.holes
                ? `${round.holes} holes`
                : "—",
          },
          {
            label: "Field",
            value: event.teamSize > 1 ? `${event.entries} teams` : `${event.totalPlayers} players`,
          },
        ]}
        aside={<TripCard site={site} />}
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <EventBody event={event} />
      </div>

      {(prev || next) && (
        <nav aria-label="More trip rounds" className="border-t border-fn-line bg-white">
          <div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-2 lg:px-8">
            <Neighbor event={prev} label="Previous round" />
            <Neighbor event={next} label="Next round" align="right" />
          </div>
        </nav>
      )}
    </>
  );
}

/** Beside the title: what this round is part of, and how to get on the trip. */
function TripCard({ site }: { site: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-fn-navy p-6 text-fn-paper">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 120%, #ef7b45 0%, rgba(239,123,69,0.3) 30%, rgba(22,35,63,0) 65%)",
        }}
      />
      <div className="relative">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
          Part of the trip
        </p>
        <p className="mt-2 font-display text-xl font-extrabold uppercase leading-tight">
          FN3P × WM Phoenix Open
        </p>
        <p className="mt-1 text-sm text-fn-paper/70">
          {PHOENIX_TRIP.dateLabel} · 5 nights, 3 rounds, Sunday on 16
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href="/phoenix-open"
            className="inline-flex items-center justify-center rounded-full bg-fn-marg px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-fn-ink transition-colors hover:bg-fn-paper"
          >
            Trip details
          </Link>
          {site && (
            <a
              href={site}
              target="_blank"
              rel="noreferrer"
              className="font-display text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4 hover:opacity-70"
            >
              Course site ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Neighbor({
  event,
  label,
  align = "left",
}: {
  event: EventSummary | null;
  label: string;
  align?: "left" | "right";
}) {
  if (!event) return <div />;
  return (
    <Link
      href={eventPath("phoenix", event.eventId)}
      className={`group block py-8 ${align === "right" ? "sm:text-right" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
        {align === "right" ? `${label} →` : `← ${label}`}
      </p>
      <p className="mt-1 font-display text-xl font-extrabold uppercase text-fn-ink group-hover:underline">
        {event.name}
      </p>
      <p className="tabular text-sm text-fn-ink-soft">
        {[dateLabel(event.date, event.endDate), event.course].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}

function place(e: EventSummary | EventDetail): string {
  return [e.town, e.state].filter(Boolean).join(", ");
}
