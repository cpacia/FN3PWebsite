import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CharityPoster } from "@/components/golf/CharityPoster";
import { DateStamp } from "@/components/golf/DateStamp";
import { FieldPanel } from "@/components/golf/FieldPanel";
import { LeaderboardView } from "@/components/golf/LeaderboardView";
import { RegisterButton, RegistrationFailed } from "@/components/golf/RegisterButton";
import { SponsorshipPackages } from "@/components/golf/SponsorshipPackages";
import { TeeTimesPanel } from "@/components/golf/TeeTimesPanel";
import { Markdown } from "@/components/the-turn/Markdown";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import {
  eventPath,
  formatName,
  isPast,
  localToday,
  locateEvent,
  money,
  netCompetitionIds,
  registrationState,
  teamSizeLabel,
} from "@/lib/golf";
import { buySponsorship } from "@/lib/checkout";
import { hasResults } from "@/lib/leaderboard";
import { productHref } from "@/lib/links";
import {
  getEventDetail,
  getEventField,
  getLeaderboards,
  getTeeSheets,
  leaderboardStreamUrl,
} from "@/lib/providers/front9";
import type { EventDetail, EventSponsor } from "@/lib/providers/types";
import { registerForEvent } from "@/lib/registration";
import { formatDate, socialMetadata } from "@/lib/seo";
import { getSponsorshipPackages, isShopifyConfigured } from "@/lib/shopify";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  if (!event) return socialMetadata({ title: "Charity Events", path: "/charity" });
  return socialMetadata({
    title: event.name,
    description: `A FN3P charity ${formatName(mainGame(event)?.format ?? "scramble").toLowerCase()} — ${formatDate(event.date, { weekday: "long" })} at ${event.course}.`,
    path: `/charity/${slug}`,
    image: event.thumbnailUrl || undefined,
  });
}

/**
 * A charity event, built as a promotional landing page rather than a results
 * sheet: the poster and the "register your team" ask lead, the details of the
 * day follow, and the scores only move to the top once there are some. Brand
 * register throughout, except the leaderboard itself.
 */
export default async function CharityEventPage({ params }: Params) {
  const { slug } = await params;
  const [event, where] = await Promise.all([getEventDetail(slug), locateEvent(slug)]);
  if (!event || !where) notFound();
  if (where.kind !== "charity") redirect(eventPath(where.kind, slug, where.league?.slug));

  const [field, sheets, boards, packages] = await Promise.all([
    getEventField(slug),
    getTeeSheets(slug),
    getLeaderboards(slug),
    getSponsorshipPackages(slug),
  ]);

  const today = localToday();
  const live =
    event.status === "in_progress" ||
    (event.status === "published" && event.date !== "" && event.date <= today && !isPast(event));
  const scored = hasResults(boards);
  const showResultsFirst = live || scored;

  const main = mainGame(event);
  const contests = uniqueGames(event).filter((g) => g.isContest);
  const round = event.roundDetails[0];
  const fee = event.feeNonMembersCents ?? event.feeMembersCents;
  const teams = event.teamSize > 1;
  const r = registrationState(event);
  const more = where.siblings.filter((e) => e.eventId !== slug && !isPast(e)).slice(0, 3);
  // Sponsorships sell alongside entries: only while registration is open.
  const sponsoring = r.state === "open" && event.status !== "canceled" && packages.length > 0;

  const results = (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <h2 className="mb-8 font-display text-4xl font-black uppercase text-fn-ink">
          {event.isComplete ? "Results" : "Leaderboard"}
        </h2>
        <LeaderboardView
          slug={slug}
          leaderboards={boards}
          netCompetitionIds={netCompetitionIds(event)}
          streamUrl={live ? leaderboardStreamUrl(slug) : null}
        />
      </div>
    </section>
  );

  return (
    <>
      <PrintPanel className="px-5 pb-20 pt-12 sm:pt-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-rise rounded-3xl bg-fn-paper p-8 sm:p-12">
            <StickerBadge tone="accent" className="mb-6">
              FN3P charity {main ? formatName(main.format).toLowerCase() : "event"}
            </StickerBadge>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] text-fn-ink sm:text-7xl">
              {event.name}
            </h1>
            <p className="mt-6 text-lg font-medium text-fn-ink">
              {formatDate(event.date, { weekday: "long", month: "long" })}
            </p>
            <p className="text-base text-fn-ink-soft">
              {[event.course, [event.town, event.state].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(", ")}
            </p>

            {event.status === "canceled" ? (
              <p className="mt-8 font-display text-xl font-black uppercase text-fn-ink">
                This event has been canceled.
              </p>
            ) : isPast(event) ? (
              <p className="mt-8 text-base text-fn-ink-soft">
                Thanks to every team that came out and played.
              </p>
            ) : (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                {r.state === "open" ? (
                  <form action={registerForEvent.bind(null, slug)}>
                    <RegisterButton className="bg-fn-ink text-fn-paper hover:bg-black">
                      {teams ? "Register your team" : "Register"}
                    </RegisterButton>
                  </form>
                ) : (
                  <p className="font-display text-base font-bold uppercase tracking-[0.08em] text-fn-ink">
                    {r.state === "soon"
                      ? `Registration opens ${formatDate(r.opens, { weekday: "long", month: "long", year: undefined })}`
                      : "Registration is closed"}
                  </p>
                )}
                {sponsoring && (
                  <a
                    href="#sponsor"
                    className="font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink underline underline-offset-4 hover:opacity-70"
                  >
                    Become a sponsor
                  </a>
                )}
                {fee != null && (
                  <p className="text-sm text-fn-ink-soft">
                    <span className="font-display text-2xl font-black text-fn-ink">{money(fee)}</span>{" "}
                    {teams ? "per player" : "entry"}
                  </p>
                )}
              </div>
            )}
            <RegistrationFailed />
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative aspect-square rotate-2 overflow-hidden rounded-3xl border-[10px] border-fn-paper bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
              {event.thumbnailUrl ? (
                <Image
                  src={event.thumbnailUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 32rem"
                  // Event artwork is usually a logo, so it's fitted, never cropped.
                  className="object-contain p-6"
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundImage: "var(--print-sm)", backgroundSize: "cover" }}
                />
              )}
            </div>
            <DateStamp date={event.date} size="lg" className="absolute -bottom-8 -left-6" />
          </div>
        </div>
      </PrintPanel>

      {showResultsFirst && results}

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <h2 className="font-display text-4xl font-black uppercase text-fn-ink sm:text-5xl">
          The day
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Tile title="Format">
            <p className="font-display text-3xl font-black uppercase leading-none text-fn-ink">
              {main ? formatName(main.format) : "TBA"}
            </p>
            <p className="mt-2 text-fn-ink-soft">
              {teams ? `${teamSizeLabel(event.teamSize)}.` : "Individual play."}
              {main?.allowance ? ` ${main.allowance}.` : ""}
            </p>
          </Tile>
          <Tile title="Contests">
            {contests.length > 0 ? (
              <ul className="space-y-1.5">
                {contests.map((c) => (
                  <li key={c.id} className="font-display text-xl font-extrabold uppercase text-fn-ink">
                    {c.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fn-ink-soft">Contests and prizes announced on the day.</p>
            )}
          </Tile>
          <Tile title="Where">
            <p className="font-display text-2xl font-black uppercase leading-tight text-fn-ink">
              {round?.club || event.course}
            </p>
            {round?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${round.club} ${round.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-fn-ink-soft underline underline-offset-4 hover:text-fn-ink"
              >
                {round.address}
              </a>
            )}
          </Tile>
        </div>

        {event.description && (
          <div className="mt-12 grid gap-5 rounded-3xl bg-white p-8 ring-1 ring-fn-line sm:p-10 lg:grid-cols-[12rem_1fr] lg:gap-10">
            <h3 className="text-sm font-semibold text-fn-accent-deep">About the event</h3>
            {/* The opening paragraph leads, set in the display face; the rest reads as body. */}
            <div className="max-w-prose [&>div>p:first-child]:font-display [&>div>p:first-child]:text-2xl [&>div>p:first-child]:font-extrabold [&>div>p:first-child]:leading-snug [&>div>p:first-child]:tracking-normal [&>div>p:first-child]:text-fn-ink">
              <Markdown content={event.description} />
            </div>
          </div>
        )}
      </section>

      {event.sponsors.length > 0 && (
        <section className="border-t border-fn-line">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <h2 className="font-display text-4xl font-black uppercase text-fn-ink sm:text-5xl">
              Thank you to our sponsors!
            </h2>
            <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {event.sponsors.map((sp) => (
                <li key={sp.id}>
                  <SponsorTile sponsor={sp} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {sponsoring && (
        <section id="sponsor" className="scroll-mt-24 border-t border-fn-line">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <h2 className="font-display text-4xl font-black uppercase text-fn-ink sm:text-5xl">
              Sponsor the day
            </h2>
            <p className="mt-4 max-w-2xl text-base text-fn-ink-soft">
              Put your name on the event and help the cause. Packages are paid through the FN3P
              shop.
            </p>
            <div className="mt-10">
              <SponsorshipPackages
                packages={packages}
                action={isShopifyConfigured() ? buySponsorship.bind(null, slug) : null}
                productUrl={Object.fromEntries(packages.map((p) => [p.handle, productHref(p.handle)]))}
              />
            </div>
            <RegistrationFailed
              param="checkout"
              message="Checkout couldn't be started. Please try again, or email fn3pgolf@gmail.com and we'll sort it out."
            />
          </div>
        </section>
      )}

      <section className="border-t border-fn-line bg-fn-accent-light/40">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="mb-8 font-display text-4xl font-black uppercase text-fn-ink">
            Who&apos;s playing
          </h2>
          <FieldPanel
            field={field}
            variant="cards"
            empty={
              isPast(event)
                ? "The field for this event wasn't published."
                : "No teams yet — yours could be the first one on the board."
            }
          />
          {sheets.some((s) => s.slots.length > 0) && (
            <div className="mt-14">
              <h3 className="mb-6 font-display text-2xl font-black uppercase text-fn-ink">
                Starting holes
              </h3>
              <TeeTimesPanel sheets={sheets} />
            </div>
          )}
        </div>
      </section>

      {!showResultsFirst && scored && results}

      {more.length > 0 && (
        <PrintPanel size="sm" className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-10 inline-block rounded-full bg-fn-paper px-6 py-2 font-display text-2xl font-black uppercase text-fn-ink">
              More charity events
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((e) => (
                <CharityPoster key={e.eventId} event={e} />
              ))}
            </div>
          </div>
        </PrintPanel>
      )}
    </>
  );
}

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-7 ring-1 ring-fn-line">
      <h3 className="mb-4 text-sm font-semibold text-fn-accent-deep">{title}</h3>
      {children}
    </div>
  );
}

/** A sponsor's logo on white (logos usually arrive on a white ground), named beneath when Front9 has a name. */
function SponsorTile({ sponsor }: { sponsor: EventSponsor }) {
  const body = (
    <>
      <div className="relative flex aspect-[3/2] items-center justify-center rounded-3xl bg-white p-6 ring-1 ring-fn-line transition group-hover:ring-fn-ink">
        {sponsor.imageUrl ? (
          <Image
            src={sponsor.imageUrl}
            alt={sponsor.name || "Event sponsor"}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18rem"
            className="object-contain p-6"
          />
        ) : (
          <span className="text-center font-display text-xl font-black uppercase leading-tight text-fn-ink">
            {sponsor.name}
          </span>
        )}
      </div>
      {sponsor.imageUrl && sponsor.name && (
        <p className="mt-3 text-center font-display text-sm font-bold uppercase tracking-[0.08em] text-fn-ink">
          {sponsor.name}
        </p>
      )}
    </>
  );
  return sponsor.linkUrl ? (
    <a href={sponsor.linkUrl} target="_blank" rel="noreferrer" className="group block">
      {body}
    </a>
  ) : (
    body
  );
}

function uniqueGames(e: EventDetail) {
  const seen = new Set<string>();
  return e.roundDetails
    .flatMap((r) => r.competitions)
    .filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)));
}

function mainGame(e: EventDetail) {
  const games = uniqueGames(e);
  return games.find((c) => c.primary && !c.isContest) ?? games.find((c) => !c.isContest) ?? null;
}
