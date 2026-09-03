import Link from "next/link";
import type { ReactNode } from "react";

const VARIANTS = {
  ink: "bg-fn-ink text-fn-paper hover:bg-black",
  paper: "bg-fn-paper text-fn-ink hover:bg-white",
  outline: "border-2 border-fn-ink text-fn-ink hover:bg-fn-ink hover:text-fn-paper",
  outlinePaper: "border-2 border-fn-paper text-fn-paper hover:bg-fn-paper hover:text-fn-ink",
} as const;

/**
 * Pill CTA. The logo is built from circles and squares, so the brand register's
 * buttons are fully rounded to echo the circle half of that pair.
 */
export function ButtonLink({
  href,
  children,
  variant = "ink",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
