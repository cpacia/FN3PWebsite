import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Header for the data-register event pages (tour events, league nights): a thin
 * strip of the season's print — the one brand-register touch — then flat ink on
 * white. The event artwork sits beside the title as a square tile rather than a
 * washed-out background, so it reads as the event's badge.
 */
export function EventHeader({
  back,
  eyebrow,
  title,
  subtitle,
  status,
  imageUrl,
  facts,
  aside,
}: {
  back: { href: string; label: string };
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  imageUrl?: string;
  facts: { label: string; value: string }[];
  /** The registration card, or anything else that belongs beside the title. */
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-fn-line bg-white">
      <div
        aria-hidden
        className="h-3 bg-fn-accent"
        style={{ backgroundImage: "var(--print-lg)", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 lg:px-8 lg:pb-14">
        <Link
          href={back.href}
          className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-accent-deep underline underline-offset-4 hover:opacity-70"
        >
          ← {back.label}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="flex min-w-0 gap-6">
            {imageUrl && (
              <div className="relative hidden h-28 w-28 shrink-0 overflow-hidden border-2 border-fn-ink bg-fn-accent-light sm:block">
                <Image src={imageUrl} alt="" fill sizes="112px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {status}
                <p className="tabular text-xs font-semibold uppercase tracking-[0.2em] text-fn-ink-soft">
                  {eyebrow}
                </p>
              </div>
              <h1 className="mt-3 break-words font-display text-4xl font-black uppercase leading-[0.92] text-fn-ink sm:text-6xl">
                {title}
              </h1>
              {subtitle && <p className="mt-3 text-base text-fn-ink-soft sm:text-lg">{subtitle}</p>}
            </div>
          </div>
          {aside}
        </div>

        {facts.length > 0 && <FactStrip facts={facts} className="mt-10" />}
      </div>
    </header>
  );
}

/**
 * A row of headline numbers between two heavy rules — four across on desktop,
 * two by two on a phone, hairline-divided either way.
 */
export function FactStrip({
  facts,
  className = "",
}: {
  facts: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl className={`tabular grid grid-cols-2 border-y-2 border-fn-ink sm:grid-cols-4 ${className}`}>
      {facts.map((f, i) => (
        <div
          key={f.label}
          className={`border-fn-line py-4 pr-4 ${i % 2 === 1 ? "border-l pl-4" : ""} ${
            i >= 2 ? "border-t sm:border-t-0" : ""
          } ${i > 0 ? "sm:border-l sm:pl-5" : ""}`}
        >
          <dt className="text-[11px] uppercase tracking-[0.16em] text-fn-ink-soft">{f.label}</dt>
          <dd className="mt-1 font-display text-lg font-bold leading-tight text-fn-ink sm:text-xl">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The square status chip used across the data register. */
export function StatusChip({
  tone = "ink",
  children,
}: {
  tone?: "ink" | "live" | "accent" | "muted";
  children: ReactNode;
}) {
  const tones = {
    ink: "bg-fn-ink text-fn-paper",
    live: "bg-red-600 text-white",
    accent: "bg-fn-accent text-fn-ink",
    muted: "border border-fn-line text-fn-ink-soft",
  } as const;
  return (
    <span
      className={`inline-block px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
