/**
 * The charity pages' signature: the event date as a round stamp, borrowed from
 * the circle-3 golf ball in the logo. Slightly rotated, like the stickers, so
 * it reads as stuck onto the poster rather than laid out on it.
 */
export function DateStamp({
  date,
  size = "md",
  className = "",
}: {
  /** "YYYY-MM-DD" */
  date: string;
  size?: "md" | "lg";
  className?: string;
}) {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(d);
  const dims = size === "lg" ? "h-32 w-32 sm:h-36 sm:w-36" : "h-24 w-24";
  return (
    <div
      className={`flex shrink-0 -rotate-6 flex-col items-center justify-center rounded-full border-4 border-fn-ink bg-fn-paper text-fn-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] ${dims} ${className}`}
    >
      <span className="font-display text-xs font-bold uppercase tracking-[0.2em]">
        {fmt({ month: "short" })}
      </span>
      <span
        className={`font-display font-black leading-none ${size === "lg" ? "text-5xl sm:text-6xl" : "text-4xl"}`}
      >
        {fmt({ day: "numeric" })}
      </span>
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em]">
        {fmt({ weekday: "short" })}
      </span>
    </div>
  );
}
