"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cartHref } from "@/lib/links";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/tour", label: "Tour" },
  { href: "/phoenix-open", label: "Phoenix Open" },
  { href: "/the-turn", label: "The Turn" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-fn-ink/10 bg-fn-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="FN3P Golf — home">
          <Image
            src="/fn3p-logo.png"
            alt="FN3P Golf"
            width={907}
            height={213}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink transition-opacity hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={cartHref()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border-2 border-fn-ink px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-fn-ink transition-colors hover:bg-fn-ink hover:text-fn-paper"
          >
            Bag
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="rounded-full border-2 border-fn-ink p-2 lg:hidden"
          >
            <span className="block h-0.5 w-4 bg-fn-ink" />
            <span className="mt-1 block h-0.5 w-4 bg-fn-ink" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-fn-ink/10 bg-fn-paper px-5 pb-5 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-fn-ink/10 py-3 font-display text-lg font-bold uppercase tracking-wide text-fn-ink last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
