import type { ReactNode } from "react";

/**
 * A patch/sticker lockup — the brand register's label device. Rotated slightly
 * so it reads as something stuck on rather than laid out.
 */
export function StickerBadge({
  children,
  tone = "ink",
  rotate = -3,
  className = "",
}: {
  children: ReactNode;
  tone?: "ink" | "paper" | "accent";
  rotate?: number;
  className?: string;
}) {
  const tones = {
    ink: "bg-fn-ink text-fn-paper",
    paper: "bg-fn-paper text-fn-ink",
    accent: "bg-fn-accent-light text-fn-ink",
  } as const;
  return (
    <span
      className={`inline-block rounded-full px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.18em] ${tones[tone]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
