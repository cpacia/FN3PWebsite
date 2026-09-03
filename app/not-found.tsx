import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ButtonLink } from "@/components/ui/Button";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";

/**
 * Branded 404.
 *
 * Lives at the app root, not inside the (public) group: a not-found file only
 * covers its own segment, so a group-level one leaves unmatched top-level URLs
 * on Next's default page. That means the chrome is assembled by hand here —
 * without the announcement marquee, which a 404 doesn't need.
 *
 * Most of the nav still points at routes that aren't built yet (shop, tour, the
 * Phoenix signup page), so this is where a lot of clicks currently land.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <PrintPanel className="flex min-h-[60vh] items-center px-5 py-20 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-xl rounded-3xl bg-fn-paper p-10 shadow-[0_24px_70px_-30px_rgba(11,79,99,0.55)] sm:p-14">
              <StickerBadge tone="aqua" className="mb-6">
                Lost ball
              </StickerBadge>
              <h1 className="font-display text-5xl font-black uppercase leading-none text-fn-ink sm:text-6xl">
                Out of
                <br />
                Bounds
              </h1>
              <p className="mt-5 text-base leading-relaxed text-fn-ink-soft">
                This one&apos;s not here. Take the stroke and play on — or head
                back to the tee.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/">Back home</ButtonLink>
                <ButtonLink href="/the-turn" variant="outline">
                  The Turn
                </ButtonLink>
              </div>
            </div>
          </div>
        </PrintPanel>
      </main>
      <Footer />
    </>
  );
}
