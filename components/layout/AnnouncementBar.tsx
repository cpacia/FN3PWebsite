/**
 * The thin bar above the header. Messages scroll as a marquee — the one piece of
 * unapologetic hype on the page, and where the tour and the shop share space
 * without either one owning the hero.
 */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  // The track is rendered twice and translated by -50%, so the loop is seamless.
  const track = [...messages, ...messages];
  return (
    <div className="overflow-hidden border-b border-fn-ink/10 bg-fn-accent-light text-fn-ink">
      <div
        className="flex w-max gap-10 whitespace-nowrap py-2"
        style={{ animation: "fn-marquee 38s linear infinite" }}
      >
        {track.map((m, i) => (
          <span
            key={i}
            className="font-display text-[11px] font-bold uppercase tracking-[0.22em]"
            // The second copy is a visual duplicate of the first.
            aria-hidden={i >= messages.length}
          >
            {m}
            <span className="pl-10 opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
