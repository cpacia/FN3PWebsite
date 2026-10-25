import { RegisterButton, RegistrationFailed } from "@/components/golf/RegisterButton";
import { isPast, money, registrationState } from "@/lib/golf";
import { registerForEvent } from "@/lib/registration";
import { formatDate } from "@/lib/seo";
import type { EventDetail } from "@/lib/providers/types";

/**
 * Entry card for a tour event: the fee, how full it is, and the button into
 * Front9's hosted registration. Says plainly when entry isn't open yet or has
 * closed, rather than hiding — "opens Mar 1" is information people come for.
 */
export function RegisterCard({ event }: { event: EventDetail }) {
  const r = registrationState(event);
  const fee = event.feeNonMembersCents ?? event.feeMembersCents;
  const memberFee =
    event.feeMembersCents != null &&
    event.feeNonMembersCents != null &&
    event.feeMembersCents !== event.feeNonMembersCents
      ? event.feeMembersCents
      : null;
  const spots =
    event.maxPlayers != null ? Math.max(0, event.maxPlayers - event.totalPlayers) : null;

  if (isPast(event) && r.state !== "open") return null;

  return (
    <div className="relative border-2 border-fn-ink bg-fn-paper p-6">
      {/* The pin-flag notch from the logo's boxed P. */}
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-5 w-5 bg-fn-ink"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="tabular flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-fn-ink-soft">Entry</p>
          <p className="font-display text-3xl font-black text-fn-ink">{fee != null ? money(fee) : "—"}</p>
          {memberFee != null && (
            <p className="text-xs text-fn-ink-soft">{money(memberFee)} for members</p>
          )}
        </div>
        {spots != null && (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-fn-ink-soft">Spots left</p>
            <p className="font-display text-3xl font-black text-fn-ink">{spots}</p>
          </div>
        )}
      </div>
      <div className="mt-5 border-t border-fn-line pt-5">
        {r.state === "open" ? (
          <form action={registerForEvent.bind(null, event.eventId)}>
            <RegisterButton className="w-full bg-fn-ink text-fn-paper hover:bg-black">
              {spots === 0 ? "Join the waitlist" : "Enter this event"}
            </RegisterButton>
          </form>
        ) : (
          <p className="text-center font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink-soft">
            {r.state === "soon"
              ? `Entry opens ${formatDate(r.opens, { weekday: "short" })}`
              : "Entry closed"}
          </p>
        )}
        <RegistrationFailed />
      </div>
    </div>
  );
}
