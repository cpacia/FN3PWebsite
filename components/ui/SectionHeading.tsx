import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Section header for the brand register: an eyebrow over an oversized display
 * title, with an optional right-aligned link.
 */
export function SectionHeading({
  eyebrow,
  title,
  link,
  tone = "ink",
  children,
}: {
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
  tone?: "ink" | "paper";
  children?: ReactNode;
}) {
  const text = tone === "paper" ? "text-fn-paper" : "text-fn-ink";
  const soft = tone === "paper" ? "text-fn-paper/70" : "text-fn-ink-soft";
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.22em] ${soft}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`font-display text-4xl font-extrabold uppercase sm:text-5xl ${text}`}>
          {title}
        </h2>
        {children}
      </div>
      {link && (
        <Link
          href={link.href}
          className={`font-display text-sm font-bold uppercase tracking-[0.12em] underline underline-offset-4 ${text} hover:opacity-70`}
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
