import { readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "About",
  description:
    "FN3P Golf: apparel, a summer tour, charity scrambles, indoor leagues and a trip to the WM Phoenix Open, out of Gray, Maine. Everyone 3-putts.",
  path: "/about",
});

const INSTAGRAM = { handle: "@fn3pgolf", href: "https://www.instagram.com/fn3pgolf/" };
const PHOTO_DIR = "images/about";
const PHOTO_EXT = /\.(jpe?g|png|webp|avif)$/i;

/**
 * The photo wall: every image in public/images/about, in filename order, so
 * adding a photo is dropping a file in — no code change. Name files for what's
 * in them ("01-phoenix-skybox.jpg"); the name, minus a leading number and the
 * extension, becomes the alt text. Read at build, and on revalidation.
 */
function aboutPhotos(): { src: string; alt: string }[] {
  try {
    return readdirSync(path.join(process.cwd(), "public", PHOTO_DIR))
      .filter((f) => PHOTO_EXT.test(f))
      // Number order, so "10-…" follows "9-…" rather than "1-…".
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
      .map((f) => ({
        src: `/${PHOTO_DIR}/${f}`,
        alt: f
          .replace(PHOTO_EXT, "")
          .replace(/^\d+[-_ ]*/, "")
          .replace(/[-_]+/g, " ")
          .trim(),
      }));
  } catch {
    return [];
  }
}

/** Everything FN3P runs, each pointing at its own corner of the site. */
const WHAT_WE_DO = [
  {
    title: "The gear",
    body: "Hats, polos and layers in prints you can spot from the next fairway.",
    href: "/shop",
    bg: "var(--tile-1)",
    on: "var(--tile-1-on)",
  },
  {
    title: "The Tour",
    body: "A handicapped summer league at the best tracks in Maine and New England.",
    href: "/tour",
    bg: "var(--tile-2)",
    on: "var(--tile-2-on)",
  },
  {
    title: "Charity scrambles",
    body: "Scrambles through the year that raise money for good causes.",
    href: "/charity",
    bg: "var(--tile-3)",
    on: "var(--tile-3-on)",
  },
  {
    title: "Indoor leagues",
    body: "Simulator leagues to keep the swing going all winter.",
    href: "/indoor",
    bg: "var(--tile-4)",
    on: "var(--tile-4-on)",
  },
  {
    title: "WM Phoenix Open",
    body: "Six days in Scottsdale every February. Ends in a skybox on 16.",
    href: "/phoenix-open",
    bg: "var(--color-fn-navy)",
    on: "var(--color-fn-paper)",
  },
];

/**
 * About. The rest of the site already explains each thing FN3P does, so this
 * page is the why and the who: a short story, the map of what's here, and the
 * photos that show what it actually looks like.
 */
export default function AboutPage() {
  const photos = aboutPhotos();
  // A big lead photo takes four cells, so only use one when that still fills
  // the four-across rows exactly; otherwise every tile is the same size.
  const lead = photos.length > 4 && (photos.length + 3) % 4 === 0;

  return (
    <>
      <PrintPanel className="px-5 pb-20 pt-14 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl rounded-3xl bg-fn-paper p-8 sm:p-12">
            <StickerBadge tone="accent" className="mb-6">
              Gray, Maine
            </StickerBadge>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] text-fn-ink sm:text-7xl">
              Everyone
              <br />
              3-putts.
            </h1>
            <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-fn-ink-soft sm:text-lg">
              <p>
                FN3P started with a simple idea: golf is more fun when nobody takes it too seriously.
                Everybody 3-putts. The trick is laughing about it and teeing it up again next week.
              </p>
              <p>
                What began as gear for the group has grown into a summer tour, charity scrambles,
                winter sim leagues and an annual trip to the WM Phoenix Open. Same idea the whole
                way through: play more golf, have fun doing it, and bring your friends.
              </p>
            </div>
          </div>
        </div>
      </PrintPanel>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <SectionHeading eyebrow="What we do" title="The Whole Bag" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {WHAT_WE_DO.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex min-h-56 flex-col justify-between overflow-hidden rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
              style={{ backgroundColor: t.bg, color: t.on }}
            >
              <span
                aria-hidden
                className="absolute inset-0 opacity-25 mix-blend-luminosity transition-opacity duration-300 group-hover:opacity-45"
                style={{
                  backgroundImage: "var(--print-sm)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <span className="relative font-display text-2xl font-extrabold uppercase leading-none">
                {t.title}
              </span>
              <span className="relative mt-6 text-sm leading-relaxed opacity-85">{t.body}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-fn-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="On the 'gram"
            title="Proof We Play"
            link={{ href: INSTAGRAM.href, label: `Follow ${INSTAGRAM.handle} →` }}
          />
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p, i) => (
                <a
                  key={p.src}
                  href={INSTAGRAM.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative block overflow-hidden rounded-2xl bg-fn-accent-light ${
                    lead && i === 0 ? "col-span-2 row-span-2" : ""
                  } aspect-[4/5]`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes={
                      lead && i === 0
                        ? "(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
                        : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    }
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            <a
              href={INSTAGRAM.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-3xl"
            >
              <PrintPanel size="sm" tint={0.35} className="px-8 py-20 text-center">
                <span className="inline-block rounded-3xl bg-fn-paper px-8 py-6">
                  <span className="block font-display text-3xl font-black uppercase text-fn-ink sm:text-4xl">
                    {INSTAGRAM.handle}
                  </span>
                  <span className="mt-1 block text-sm text-fn-ink-soft group-hover:underline">
                    Rounds, trips and new drops on Instagram →
                  </span>
                </span>
              </PrintPanel>
            </a>
          )}
        </div>
      </section>

      <section className="border-t border-fn-line">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:grid-cols-2 lg:px-8">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
              Say hi
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold uppercase text-fn-ink">
              <a href="mailto:fn3pgolf@gmail.com" className="hover:underline">
                fn3pgolf@gmail.com
              </a>
            </p>
            <p className="mt-2 text-sm text-fn-ink-soft">
              Questions about the tour, an event or an order. Or just a good 3-putt story.
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
              Follow along
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold uppercase text-fn-ink">
              <a href={INSTAGRAM.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {INSTAGRAM.handle}
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
