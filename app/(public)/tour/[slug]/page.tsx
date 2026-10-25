import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventBody } from "@/components/golf/EventBody";
import { EventHeader } from "@/components/golf/EventHeader";
import { EventStatus } from "@/components/golf/EventStatus";
import { RegisterCard } from "@/components/golf/RegisterCard";
import { dateLabel, eventPath, formatName, locateEvent, teamSizeLabel } from "@/lib/golf";
import { getEventDetail } from "@/lib/providers/front9";
import type { EventDetail, EventSummary } from "@/lib/providers/types";
import { socialMetadata } from "@/lib/seo";

/** Short, so a leaderboard settles within a minute of play finishing. */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  if (!event) return socialMetadata({ title: "FN3P Tour", path: "/tour" });
  return socialMetadata({
    title: `${event.name} · FN3P Tour`,
    description: [dateLabel(event.date, event.endDate), event.course, place(event)]
      .filter(Boolean)
      .join(" · "),
    path: `/tour/${slug}`,
    image: event.thumbnailUrl || undefined,
  });
}

export default async function TourEventPage({ params }: Params) {
  const { slug } = await params;
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  if (!event || !where) notFound();
  // Charity events and league nights have their own pages.
  if (where.kind !== "tour") redirect(eventPath(where.kind, slug, where.league?.slug));

  const year = event.date.slice(0, 4);
  const season = where.siblings.filter((e) => e.date.startsWith(year));
  const i = season.findIndex((e) => e.eventId === slug);
  const prev = i > 0 ? season[i - 1] : null;
  const next = i >= 0 && i < season.length - 1 ? season[i + 1] : null;

  const primary = primaryGame(event);
  const round = event.roundDetails[0];

  return (
    <>
      <EventHeader
        back={{ href: "/tour", label: `${year} Tour schedule` }}
        eyebrow={[
          i >= 0 ? `Event ${String(i + 1).padStart(2, "0")} of ${String(season.length).padStart(2, "0")}` : "",
          dateLabel(event.date, event.endDate),
        ]
          .filter(Boolean)
          .join(" · ")}
        title={event.name}
        subtitle={[event.course !== event.name ? event.course : "", place(event)].filter(Boolean).join(" · ")}
        status={<EventStatus event={event} />}
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
            value:
              event.teamSize > 1
                ? `${event.entries} teams`
                : event.maxPlayers != null
                  ? `${event.totalPlayers} / ${event.maxPlayers} players`
                  : `${event.totalPlayers} players`,
          },
        ]}
        aside={<RegisterCard event={event} />}
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <EventBody event={event} />
      </div>

      {(prev || next) && (
        <nav aria-label="More tour events" className="border-t border-fn-line bg-white">
          <div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-2 lg:px-8">
            <Neighbor event={prev} label="Previous stop" />
            <Neighbor event={next} label="Next stop" align="right" />
          </div>
        </nav>
      )}
    </>
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
      href={eventPath("tour", event.eventId)}
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

function place(e: EventSummary): string {
  return [e.town, e.state].filter(Boolean).join(", ");
}

function primaryGame(e: EventDetail) {
  const games = e.roundDetails[0]?.competitions ?? [];
  return games.find((c) => c.primary) ?? games.find((c) => !c.isContest) ?? null;
}
