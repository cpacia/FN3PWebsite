"use client";

import { useEffect, useRef } from "react";

/**
 * A value that briefly highlights when it changes under a live stream. Skips the
 * first render and any change caused by a context switch (`resetKey`: another
 * competition, the money/percent toggle), so only a genuine change flashes.
 */
export function Flash({
  value,
  resetKey,
  className = "",
}: {
  value: string;
  resetKey: number | string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<{ value: string; reset: number | string } | null>(null);

  useEffect(() => {
    const last = prev.current;
    prev.current = { value, reset: resetKey };
    if (!last || last.reset !== resetKey || last.value === value) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    // Resolved here rather than written as var() in the keyframes, which not
    // every engine interpolates.
    const accent = getComputedStyle(el).getPropertyValue("--color-fn-accent").trim() || "#84d7e7";
    el.animate(
      [
        { backgroundColor: accent },
        { backgroundColor: accent, offset: 0.2 },
        { backgroundColor: "transparent" },
      ],
      { duration: 1300, easing: "ease-out" },
    );
  }, [value, resetKey]);

  return (
    <span ref={ref} className={`inline-block px-1 ${className}`}>
      {value}
    </span>
  );
}
