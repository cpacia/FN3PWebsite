import type { Metadata } from "next";
import Link from "next/link";
import { CharityPoster } from "@/components/golf/CharityPoster";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { dateLabel, eventPath, getGolfCalendar, isPast } from "@/lib/golf";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = socialMetadata({
  title: "Charity Events",
  description:
    "FN3P charity scrambles, all year round. Grab three friends, play for a good cause, and stay for the after-party.",
  path: "/charity",
});

/**
 * The charity schedule. Brand register end to end — these are invitations, not
 * a results sheet — so upcoming events are posters on the print, and only the
 * past events drop into a plain list.
 */
export default async function CharityPage() {
  const { charity } = await getGolfCalendar();
  const upcoming = charity.filter((e) => !isPast(e));
  const past = charity.filter((e) => isPast(e)).reverse();

  return (
    <>
      <PrintPanel className="px-5 pb-20 pt-16 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl rounded-3xl bg-fn-paper p-8 sm:p-12">
            <StickerBadge tone="accent" className="mb-6">
              Charity events
            </StickerBadge>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] text-fn-ink sm:text-7xl">
              Golf for a good cause
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-fn-ink-soft sm:text-lg">
              A handful of scrambles through the year, each one raising money for a cause
              close to home. Bring a team, bring your worst swing — everyone 3-putts, and
              it all goes to a good place.
            </p>
          </div>

          {upcoming.length > 0 ? (
            <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <CharityPoster key={e.eventId} event={e} />
              ))}
            </div>
          ) : (
            <div className="mt-12 max-w-2xl rounded-3xl bg-fn-paper/90 p-8">
              <p className="font-display text-2xl font-black uppercase text-fn-ink">
                Next one&apos;s coming soon
              </p>
              <p className="mt-2 text-fn-ink-soft">
                The next charity date hasn&apos;t been announced yet. Join the newsletter at
                the bottom of the page and you&apos;ll hear about it first.
              </p>
            </div>
          )}
        </div>
      </PrintPanel>

      {past.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink">
            Past events
          </h2>
          <ul className="mt-6 divide-y divide-fn-line border-y border-fn-line">
            {past.map((e) => (
              <li key={e.eventId}>
                <Link
                  href={eventPath("charity", e.eventId)}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="font-display text-lg font-extrabold uppercase text-fn-ink group-hover:underline">
                    {e.name}
                  </span>
                  <span className="tabular text-sm text-fn-ink-soft">
                    {[dateLabel(e.date, e.endDate), e.course].filter(Boolean).join(", ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
