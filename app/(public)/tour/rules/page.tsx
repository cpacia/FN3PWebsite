import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EventHeader } from "@/components/golf/EventHeader";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Tour Rules · FN3P Tour",
  description:
    "Local rules for the FN3P Golf Tour: tees and handicaps, scoring, relief, penalty areas, and how teams earn points toward the playoffs.",
  path: "/tour/rules",
});

/**
 * The tour's local rules and team format. Static copy, so it lives here rather
 * than in Front9. The rules are numbered straight through across the groups,
 * so "rule 11" still means the same thing on the course.
 */
const RULE_GROUPS: { title: string; rules: { text: ReactNode; note?: ReactNode }[] }[] = [
  {
    title: "Setup & scoring",
    rules: [
      {
        text: "Tees are chosen by the Tour Director. Senior and ladies' tees will be designated if necessary. The Tour Director sets the percentage of handicap everyone plays under at each event.",
      },
      { text: "All putts must be holed out. No gimmies." },
      {
        text: "The FN3P Tour scorecard is the official scorecard. It's on each player to double-check their score before the card is handed in. Any discrepancies are handled by the Tour Director.",
      },
      { text: "Mark your ball and tell your playing partners how it's marked." },
      { text: "GPS, rangefinders (with slope) and phones may all be used during play." },
      { text: "All golfers are recommended to have a USGA official handicap." },
      { text: "The Tour Director has the final say on official tour handicaps." },
    ],
  },
  {
    title: "On the course",
    rules: [
      { text: "Preferred lies in your own fairway, always." },
      { text: "Bunkers are played as they lie unless the Tour Director declares rake and place." },
      { text: "Maximum score on any hole is double par." },
    ],
  },
  {
    title: "Penalties & relief",
    rules: [
      {
        text: "Out of bounds (white stakes) is played as a mandatory 1-stroke-penalty lateral hazard. You may not hit the ball if it's found. Take the 1-stroke penalty and follow red-stake rules, minus the option of playing it as it lies.",
        note: "This is for pace of play, and because not every golfer gets a chance to play practice rounds. See the USGA rule videos below.",
      },
      { text: "Relief from the cart path may be taken on either side." },
      {
        text: "Unmarked ground under repair: use common sense and get a group consensus on whether free relief should be granted. If there's a disagreement, take a picture of the area, take a drop, and the Tour Director will decide after the round. Relief is one club length, including stance, no closer to the hole. You can always choose to play it as it lies, and if there's a disagreement that's the best option.",
        note: "See Abnormal Course Condition below.",
      },
      {
        text: "Extended cart path free relief: where carts have worn the turf beside a path into an unlikely playable surface. Handle it the same way, by group consensus.",
        note: "See Abnormal Course Condition below.",
      },
      {
        text: "Defined woods or brush can be played as a lateral hazard with a group consensus. This is because some courses are poorly marked; it isn't there to be taken advantage of. Generally, if your ball goes into the trees but the ground in and around them is cleared, there are no defined woods. If a tee shot is in question, play a provisional.",
      },
    ],
  },
];

const USGA_VIDEOS = [
  { label: "Abnormal course condition", href: "https://www.youtube.com/watch?v=pFKVq4HmMjY" },
  { label: "Unplayable ball", href: "https://www.youtube.com/watch?v=2KYoSvWx3MI" },
  { label: "Penalty areas", href: "https://www.youtube.com/watch?v=gfjY8G79MEI" },
];

const SECTIONS = [
  { id: "rules", label: "Local rules" },
  { id: "teams", label: "Teams & points" },
  { id: "playoffs", label: "Playoffs" },
];

/** Each group's first rule number, so numbering runs on across groups. */
const FIRST_RULE = RULE_GROUPS.map((_, gi) =>
  RULE_GROUPS.slice(0, gi).reduce((sum, g) => sum + g.rules.length, 1),
);

export default function TourRulesPage() {
  return (
    <>
      <EventHeader
        back={{ href: "/tour", label: "The FN3P Tour" }}
        eyebrow="The FN3P Tour"
        title="Tour Rules"
        subtitle="Local rules for every tour event. Anything not covered here follows the USGA Rules of Golf."
        facts={[]}
      />

      <div className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[14rem_1fr] lg:px-8">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-28 space-y-3 border-l-2 border-fn-ink pl-4">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink-soft hover:text-fn-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-20">
            <section id="rules" className="scroll-mt-28">
              <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
                Local rules
              </h2>
              {RULE_GROUPS.map((g, gi) => (
                <div key={g.title} className="mt-10">
                  <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
                    {g.title}
                  </h3>
                  <ol className="divide-y divide-fn-line border-y-2 border-fn-ink">
                    {g.rules.map((r, ri) => {
                      const n = FIRST_RULE[gi] + ri;
                      return (
                        <li key={n} className="grid grid-cols-[2.5rem_1fr] gap-x-3 py-4">
                          <span className="tabular font-display text-lg font-bold text-fn-ink-soft">
                            {String(n).padStart(2, "0")}
                          </span>
                          <div className="text-base leading-relaxed text-fn-ink">
                            <p>{r.text}</p>
                            {r.note && <p className="mt-1.5 text-sm text-fn-ink-soft">{r.note}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}

              <div className="mt-10 border-2 border-fn-ink bg-fn-paper p-6">
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fn-accent-deep">
                  USGA rules, explained
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {USGA_VIDEOS.map((v) => (
                    <li key={v.href}>
                      <a
                        href={v.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-fn-ink underline underline-offset-4 hover:opacity-70"
                      >
                        {v.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink">
                  All other USGA rules apply.
                </p>
              </div>
            </section>

            <section id="teams" className="scroll-mt-28">
              <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
                Teams &amp; points
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fn-ink-soft">
                Every event is net stroke play, at a percentage of handicap set by the Tour
                Commissioner. Teams and individuals both compete in a season-long points race into
                the playoffs.
              </p>
              <dl className="mt-8 divide-y divide-fn-line border-y-2 border-fn-ink">
                <Term label="Handicaps">
                  The team and individual percentages are different.
                </Term>
                <Term label="Team score">
                  A team combines its two best net stroke-play scores. Teams may have up to 4
                  players per event and 8 total on their roster.
                </Term>
                <Term label="Team points">
                  1st place earns 15 × the number of teams in the event, then each place down
                  earns 10 fewer.
                </Term>
                <Term label="Individual points">
                  1st place earns 5 × the number of players in the event, then each place down
                  earns 5 fewer. All individual points are added to the team&apos;s total.
                </Term>
                <Term label="Roster lock">
                  A player is locked to a team once they&apos;ve played 3 regular-season events for
                  it, and is then eligible for the playoffs and the final prize payout.
                </Term>
              </dl>
            </section>

            <section id="playoffs" className="scroll-mt-28">
              <h2 className="font-display text-3xl font-extrabold uppercase text-fn-ink sm:text-4xl">
                Playoffs
              </h2>
              <dl className="mt-8 divide-y divide-fn-line border-y-2 border-fn-ink">
                <Term label="Format">
                  Two team events. The team with the 2 lowest net stroke-play scores across both
                  events wins.
                </Term>
                <Term label="Who's in">
                  Every team is invited if it has 2 eligible players.
                </Term>
                <Term label="Seeding">
                  Teams are seeded on points through the 6 regular-season events, and the seed
                  sets where each team starts the first leg: for example, 1st place starts at even
                  par and 2nd at +4.
                </Term>
                <Term label="Payout">Top 2 or 3 teams.</Term>
                <Term label="Individuals">Individual playoffs to be announced.</Term>
              </dl>
              <Link
                href="/tour/championship"
                className="mt-6 inline-block font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink underline underline-offset-4 hover:opacity-70"
              >
                Championship leaderboard →
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[10rem_1fr]">
      <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink-soft sm:pt-1">
        {label}
      </dt>
      <dd className="text-base leading-relaxed text-fn-ink">{children}</dd>
    </div>
  );
}
