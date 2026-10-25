import { RegisterButton, RegistrationFailed } from "@/components/golf/RegisterButton";
import { LEAGUE_STAGE_LABEL, leagueStage, money } from "@/lib/golf";
import { registerForLeague } from "@/lib/registration";
import { formatDate } from "@/lib/seo";
import type { League } from "@/lib/providers/types";

/**
 * The league's sign-up card. One registration covers every week, so this is
 * the only register button in the indoor section — league nights link back here.
 */
export function LeagueRegister({ league }: { league: League }) {
  const stage = leagueStage(league);
  const fee = league.feeNonMembersCents ?? league.feeMembersCents;
  const per = league.entrySize > 1 ? (league.feePerEntry ? "per team" : "per player") : "per player";

  return (
    <div className="relative border-2 border-fn-ink bg-fn-paper p-6">
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-5 w-5 bg-fn-ink"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <p className="text-[11px] uppercase tracking-[0.16em] text-fn-ink-soft">
        {LEAGUE_STAGE_LABEL[stage]}
      </p>
      {fee != null && (
        <p className="tabular mt-1 text-sm text-fn-ink-soft">
          <span className="font-display text-3xl font-black text-fn-ink">{money(fee)}</span> {per}
        </p>
      )}
      <div className="mt-5 border-t border-fn-line pt-5">
        {stage === "registering" || stage === "full" ? (
          <form action={registerForLeague.bind(null, league.slug)}>
            <RegisterButton className="w-full bg-fn-ink text-fn-paper hover:bg-black">
              {stage === "full" ? "Join the waitlist" : "Join the league"}
            </RegisterButton>
          </form>
        ) : (
          <p className="text-center font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink-soft">
            {stage === "upcoming" && league.registrationOpensAt
              ? `Sign-ups open ${formatDate(league.registrationOpensAt, { weekday: "short" })}`
              : stage === "finished"
                ? "Season complete"
                : "Sign-ups closed"}
          </p>
        )}
        {stage === "registering" && league.registrationClosesAt && (
          <p className="mt-3 text-center text-xs text-fn-ink-soft">
            Sign-ups close {formatDate(league.registrationClosesAt, { weekday: "short" })}
          </p>
        )}
        <RegistrationFailed />
      </div>
    </div>
  );
}
