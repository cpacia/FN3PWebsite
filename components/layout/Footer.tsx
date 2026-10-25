import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All gear" },
      { href: "/shop/hats", label: "Hats" },
      { href: "/shop/polos", label: "Polos" },
      { href: "/shop/layers", label: "Layers" },
    ],
  },
  {
    title: "Golf",
    links: [
      { href: "/tour", label: "FN3P Tour" },
      { href: "/tour#standings", label: "Tour standings" },
      { href: "/tour/rules", label: "Tour rules" },
      { href: "/charity", label: "Charity events" },
      { href: "/indoor", label: "Indoor leagues" },
    ],
  },
  {
    title: "More",
    links: [
      { href: "/phoenix-open", label: "WM Phoenix Open" },
      { href: "/the-turn", label: "The Turn" },
      { href: "/about", label: "About" },
      { href: "/custom", label: "Custom apparel" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-fn-ink text-fn-paper">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Image
              src="/fn3p-logo-white.png"
              alt="FN3P Golf"
              width={907}
              height={213}
              className="h-8 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-fn-paper/60">
              Play more golf, have fun doing it, and don&apos;t take it too
              seriously. Apparel and the FN3P Golf Tour, out of Gray, Maine.
            </p>
            <div className="mt-7">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-paper/50">
                Get the drops first
              </p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-light">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-fn-paper/70 transition-colors hover:text-fn-paper"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-fn-paper/15 pt-7">
          <p className="text-xs text-fn-paper/45">
            © {new Date().getFullYear()} FN3P Golf · Gray, Maine
          </p>
          <a
            href="https://front9.com/products"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-fn-paper/45 transition-colors hover:text-fn-paper"
          >
            <Image
              src="/images/f9-logo-white.png"
              alt="Front9 Golf"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <span>
              Powered by <span className="font-brand">Front9 Golf</span>
            </span>
          </a>
          <a
            href="mailto:fn3pgolf@gmail.com"
            className="text-xs text-fn-paper/45 transition-colors hover:text-fn-paper"
          >
            fn3pgolf@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
