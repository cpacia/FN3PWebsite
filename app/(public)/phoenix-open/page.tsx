import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DateStamp } from "@/components/golf/DateStamp";
import { EventStatus } from "@/components/golf/EventStatus";
import { RegistrationFailed } from "@/components/golf/RegisterButton";
import { TripCheckout, type PaymentOption } from "@/components/phoenix/TripCheckout";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { buyPhoenixTrip } from "@/lib/checkout";
import { PLACEHOLDER_PHOENIX_PAYMENTS } from "@/lib/fixtures/products";
import { eventPath, getGolfCalendar } from "@/lib/golf";
import { productHref } from "@/lib/links";
import { courseLink, daysUntilTrip, PHOENIX_TRIP } from "@/lib/phoenix";
import { socialMetadata } from "@/lib/seo";
import { getProduct } from "@/lib/shopify";

export const revalidate = 300;

const T = PHOENIX_TRIP;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export const metadata: Metadata = socialMetadata({
  title: `FN3P × WM Phoenix Open ${T.year}`,
  description: `${T.dateLabel} in ${T.location}: 5 nights, 3 rounds, and a Sunday skybox on 16. ${usd(T.price)}.`,
  path: "/phoenix-open",
  image: "/images/phoenix/tpc-scottsdale-18.jpg",
});

/**
 * The Phoenix trip page — the brand register gone dark, like the home page's
 * desert band: navy dusk, marg-orange accents, and photography doing the work.
 *
 * Payment: Venmo (and cash, check, Cash App) is preferred and cheaper; card
 * goes through Shopify with a 3% fee. The rounds are Front9 events tagged
 * `wm-open`, each with its own page and leaderboard.
 */
export default async function PhoenixOpenPage() {
  const [calendar, product] = await Promise.all([
    getGolfCalendar(),
    getProduct(T.productHandle),
  ]);
  const rounds = calendar.phoenix;
  const daysOut = daysUntilTrip();

  // Live variants once the Storefront API is configured; the store's listing until then.
  const options: PaymentOption[] = product
    ? product.variants.map((v) => ({
        id: v.id,
        label: v.selectedOptions.map((o) => o.value).join(" · "),
        price: v.priceFormatted,
        available: v.availableForSale,
      }))
    : PLACEHOLDER_PHOENIX_PAYMENTS.map((o) => ({
        id: o.variantId,
        label: o.label,
        price: o.price,
        available: true,
      }));

  return (
    <div className="bg-fn-navy text-fn-paper">
      {/* Hero */}
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        <Image
          src="/images/phoenix/tpc-scottsdale-18.jpg"
          alt="The 18th hole at TPC Scottsdale during the WM Phoenix Open, mountains behind the grandstands"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_40%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            // Up from the bottom for the fact strip, in from the left for the
            // headline, which otherwise sits on the white grandstands.
            background:
              "linear-gradient(to top, #16233f 0%, rgba(22,35,63,0.85) 28%, rgba(22,35,63,0.25) 62%, rgba(22,35,63,0.1) 100%), linear-gradient(to right, rgba(22,35,63,0.75) 0%, rgba(22,35,63,0.35) 45%, rgba(22,35,63,0) 75%)",
          }}
        />
        <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-40 lg:px-8 lg:pb-20">
          <StickerBadge tone="paper" className="mb-6">
            {T.dateLabel} · {T.location}
          </StickerBadge>
          <h1 className="font-display text-6xl font-black uppercase leading-[0.86] sm:text-7xl lg:text-8xl">
            FN3P ×<br />
            WM Phoenix Open
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fn-paper/80">
            A once in a lifetime trip, until you go the next year.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#book"
              className="inline-flex items-center justify-center rounded-full bg-fn-marg px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink transition-colors hover:bg-fn-paper"
            >
              Lock in your spot
            </a>
            {daysOut > 0 && (
              <span className="tabular font-display text-xs font-bold uppercase tracking-[0.18em] text-fn-paper/70">
                {daysOut.toLocaleString("en-US")} days out
              </span>
            )}
          </div>

          <dl className="tabular mt-14 grid grid-cols-2 border-y border-fn-paper/25 sm:grid-cols-4">
            {[
              ["Nights", "5"],
              ["Rounds", "3"],
              ["Sunday", "Skybox on 16"],
              ["From", usd(T.price)],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={`py-4 pr-4 ${i % 2 === 1 ? "border-l border-fn-paper/25 pl-4" : ""} ${
                  i >= 2 ? "border-t border-fn-paper/25 sm:border-t-0" : ""
                } ${i > 0 ? "sm:border-l sm:pl-5" : ""}`}
              >
                <dt className="text-[11px] uppercase tracking-[0.16em] text-fn-paper/60">{label}</dt>
                <dd className="mt-1 font-display text-xl font-bold leading-tight sm:text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-28">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
            The trip
          </p>
          <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
            Six days in the desert
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-fn-paper/75">
            Three rounds at three of the best courses around Scottsdale, a skybox on Sunday at the
            loudest hole in golf, and the rest of it exactly as unserious as it sounds. Cash payouts
            every round.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-fn-paper/60">
            Questions? Email{" "}
            <a href={`mailto:${T.email}`} className="text-fn-paper underline underline-offset-4">
              {T.email}
            </a>
            .
          </p>
        </div>

        <div className="rounded-3xl border border-fn-paper/20 bg-black/25 p-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
            What&apos;s included
          </p>
          <ul className="mt-4 space-y-2.5 text-base text-fn-paper/90">
            {T.included.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="text-fn-marg">
                  ✦
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-7 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-paper/50">
            Not included
          </p>
          <p className="mt-2 text-sm text-fn-paper/60">{T.notIncluded.join(" · ")}</p>
        </div>
      </section>

      {/* The rounds */}
      <section className="border-t border-fn-paper/15">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-end">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
                {T.year} course lineup
              </p>
              <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
                The rounds
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-fn-paper/75">
                Every round is its own event, with tee times and a live leaderboard. Cash on the
                line each day.
              </p>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
              <Image
                src="/images/phoenix/we-ko-pa-cholla.jpg"
                alt="Desert and palo verde trees around a green on the Cholla course at We-Ko-Pa"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>

          {rounds.length > 0 ? (
            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rounds.map((e, i) => {
                const site = courseLink(e.course);
                return (
                  <li
                    key={e.eventId}
                    className="relative flex flex-col rounded-3xl border border-fn-paper/20 bg-black/25 p-7 transition-colors hover:border-fn-paper/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <DateStamp date={e.date} />
                      <EventStatus event={e} entry={false} />
                    </div>
                    <p className="mt-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
                      Round {i + 1}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight">
                      <Link
                        href={eventPath("phoenix", e.eventId)}
                        className="after:absolute after:inset-0 hover:underline"
                      >
                        {e.course || e.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-fn-paper/60">
                      {[e.town, e.state].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-xs font-bold uppercase tracking-[0.14em]">
                      <span className="font-display text-fn-paper">Round page →</span>
                      {site && (
                        // Above the card's stretched link, so it opens the course site instead.
                        <a
                          href={site}
                          target="_blank"
                          rel="noreferrer"
                          className="relative font-display text-fn-paper/60 underline underline-offset-4 hover:text-fn-paper"
                        >
                          Course site ↗
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <ul className="mt-12 grid gap-3 sm:grid-cols-3">
              {T.courses.map((c) => (
                <li
                  key={c}
                  className="rounded-3xl border border-fn-paper/20 bg-black/25 p-7 font-display text-xl font-extrabold uppercase"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Sunday on 16 + lodging */}
      <section className="border-t border-fn-paper/15">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl lg:max-w-none">
            <Image
              src="/images/phoenix/skybox-16.jpg"
              alt="The view from the skybox over the 16th hole at TPC Scottsdale, the stadium full and the Goodyear blimp overhead"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
              Sunday
            </p>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
              The skybox on 16
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-fn-paper/75">
              The trip ends where the tournament gets loudest: a skybox ticket on the 16th hole on
              Sunday, with food and drink included all day. That&apos;s the view.
            </p>

            <div className="mt-12 border-t border-fn-paper/20 pt-8">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
                Where you&apos;ll stay
              </p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-fn-paper/75">
                {T.lodging.summary}
              </p>
              <a
                href={T.lodging.href}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block font-display text-xs font-bold uppercase tracking-[0.14em] text-fn-paper underline underline-offset-4 hover:opacity-70"
              >
                Lodging details ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Book */}
      <section
        id="book"
        className="relative scroll-mt-20 overflow-hidden border-t border-fn-paper/15"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 115%, #ef7b45 0%, rgba(239,123,69,0.35) 28%, rgba(22,35,63,0) 62%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
            Lock in your spot
          </p>
          <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
            {usd(T.price)} all in
          </h2>
          <p className="mt-4 max-w-2xl text-base text-fn-paper/75">
            Pay in full or in installments. Money back until {T.lockDate}; after that your spot is
            locked.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Venmo — preferred */}
            <div className="relative rounded-3xl bg-fn-paper p-8 text-fn-ink">
              <StickerBadge tone="accent" rotate={4} className="absolute -top-3 right-6">
                Preferred
              </StickerBadge>
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
                Venmo, Cash App, cash or check
              </p>
              <p className="tabular mt-3 font-display text-5xl font-black">{usd(T.price)}</p>
              <p className="mt-1 text-sm text-fn-ink-soft">
                No fees. Or {T.installmentCount} payments of {usd(T.installment)}.
              </p>
              <a
                href={T.venmo.href}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-fn-ink px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-paper transition-colors hover:bg-black"
              >
                Pay {T.venmo.handle} on Venmo
              </a>
              <p className="mt-4 text-xs leading-relaxed text-fn-ink-soft">
                Put your name and &ldquo;Phoenix {T.year}&rdquo; in the note. For Cash App, cash or
                check, email{" "}
                <a href={`mailto:${T.email}`} className="text-fn-ink underline underline-offset-2">
                  {T.email}
                </a>
                .
              </p>
            </div>

            {/* Card — Shopify */}
            <div className="rounded-3xl border border-fn-paper/25 bg-black/30 p-8">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-paper/60">
                Card · includes {T.cardFeePercent}% fee
              </p>
              <p className="tabular mt-3 font-display text-5xl font-black">{usd(T.cardPrice)}</p>
              <p className="mt-1 mb-6 text-sm text-fn-paper/60">
                Checkout through the FN3P shop, Shop Pay included.
              </p>
              <TripCheckout
                options={options}
                action={product ? buyPhoenixTrip : null}
                productUrl={productHref(T.productHandle)}
              />
              <RegistrationFailed
                tone="paper"
                message="Checkout couldn't be started. Please try again, or email us and we'll get you booked."
              />
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-7xl px-5 pb-10 text-[11px] leading-relaxed text-fn-paper/40 lg:px-8">
        Photos: TPC Scottsdale by{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Waste_Management_Phoenix_Open_(51876358748).jpg"
          className="underline"
        >
          Gage Skidmore
        </a>{" "}
        (
        <a href="https://creativecommons.org/licenses/by-sa/2.0" className="underline">
          CC BY-SA 2.0
        </a>
        ); We-Ko-Pa Cholla by{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:We-Ko-Pa_Golf_Club_(Cholla)_no_3.jpg"
          className="underline"
        >
          Bernard Gagnon
        </a>{" "}
        (
        <a href="https://creativecommons.org/licenses/by-sa/3.0" className="underline">
          CC BY-SA 3.0
        </a>
        ). Both resized.
      </p>
    </div>
  );
}
