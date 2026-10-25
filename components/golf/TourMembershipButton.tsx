import type { ReactNode } from "react";
import { RegisterButton } from "@/components/golf/RegisterButton";
import { TOUR_MEMBERSHIP_PRODUCT } from "@/lib/golf";
import { productHref } from "@/lib/links";
import type { MembershipType } from "@/lib/providers/types";
import { joinTour } from "@/lib/registration";

/**
 * The tour membership CTA. With the Front9 plan it's a form that mints a hosted
 * checkout (lib/registration.ts); until the plan exists in Front9 it falls back
 * to the Shopify product, so the button never goes dead.
 */
export function TourMembershipButton({
  plan,
  back,
  className = "",
  unstyled = false,
  children,
}: {
  plan: MembershipType | null;
  /** The page to return to if checkout can't be started. */
  back: string;
  className?: string;
  /** Drop the pill styling, for a CTA drawn as a text link. */
  unstyled?: boolean;
  children: ReactNode;
}) {
  if (!plan) {
    return (
      <a
        href={productHref(TOUR_MEMBERSHIP_PRODUCT)}
        target="_blank"
        rel="noreferrer"
        className={
          unstyled
            ? className
            : `inline-flex items-center justify-center rounded-full px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] transition-colors ${className}`
        }
      >
        {children}
      </a>
    );
  }
  return (
    <form action={joinTour.bind(null, back)} className="contents">
      <RegisterButton className={className} unstyled={unstyled}>
        {children}
      </RegisterButton>
    </form>
  );
}
