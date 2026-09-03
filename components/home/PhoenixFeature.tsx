import { ButtonLink } from "@/components/ui/Button";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { PHOENIX_TRIP } from "@/lib/phoenix";

/**
 * The WM Phoenix Open trip.
 *
 * The one place the site goes dark — a desert-dusk band that reads as a
 * different world from the Maine-coastal print above it, which is exactly what
 * the trip is.
 *
 * `daysOut` is passed in rather than computed here: reading the clock during
 * render is impure. See daysUntilTrip() in lib/phoenix.ts.
 */
export function PhoenixFeature({ daysOut }: { daysOut: number }) {
  const { dateLabel, location, included, courses, price, installment, installmentCount, lockDate } =
    PHOENIX_TRIP;

  return (
    <section className="relative overflow-hidden bg-fn-navy text-fn-paper">
      {/* Desert dusk: warm at the horizon, deep overhead. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 115%, #ef7b45 0%, rgba(239,123,69,0.35) 28%, rgba(22,35,63,0) 62%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <StickerBadge tone="paper" className="mb-6">
              {dateLabel} · {location}
            </StickerBadge>
            <h2 className="font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
              FN3P ×<br />
              WM Phoenix
              <br />
              Open
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-fn-paper/70">
              Six days in the desert: three courses, a skybox on Sunday at the
              loudest hole in golf, and the rest of it exactly as unserious as it
              sounds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/phoenix-open" variant="paper">
                Trip details
              </ButtonLink>
              {daysOut > 0 && (
                <span className="tabular font-display text-xs font-bold uppercase tracking-[0.18em] text-fn-paper/60">
                  {daysOut.toLocaleString("en-US")} days out
                </span>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-fn-paper/20 bg-black/25 p-8 backdrop-blur-sm">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
              What&apos;s included
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-fn-paper/85">
              {included.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="text-fn-marg">
                    ✦
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-7 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-marg">
              The rota
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-fn-paper/85">
              {courses.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            <div className="tabular mt-7 border-t border-fn-paper/20 pt-5">
              <p className="font-display text-3xl font-black">
                ${price.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-xs text-fn-paper/55">
                Or {installmentCount} payments of ${installment} · locks {lockDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
