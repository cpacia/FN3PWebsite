"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for the registration forms (lib/registration.ts). A plain
 * <form action> works without JavaScript; this only adds the pending state, since
 * minting the hosted URL takes a round trip to Front9.
 */
export function RegisterButton({
  children,
  className = "",
  unstyled = false,
}: {
  children: ReactNode;
  className?: string;
  /** Drop the pill styling, for a submit drawn as a text link. */
  unstyled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={
        unstyled
          ? `cursor-pointer disabled:cursor-wait disabled:opacity-70 ${className}`
          : `inline-flex cursor-pointer items-center justify-center rounded-full px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-wait disabled:opacity-70 ${className}`
      }
    >
      {pending ? "Starting…" : children}
    </button>
  );
}

/**
 * Shown when a registration action bounced back with ?registration=failed.
 * Reads the query on the client so the event pages themselves stay statically
 * cached; the Suspense boundary is what lets them.
 */
export function RegistrationFailed({
  tone = "ink",
  message,
  param = "registration",
}: {
  tone?: "ink" | "paper";
  message?: string;
  /** The query flag to watch: `?registration=failed` by default, `?checkout=failed`… */
  param?: string;
}) {
  return (
    <Suspense fallback={null}>
      <FailedNotice tone={tone} message={message} param={param} />
    </Suspense>
  );
}

function FailedNotice({
  tone,
  message,
  param,
}: {
  tone: "ink" | "paper";
  message?: string;
  param: string;
}) {
  const failed = useSearchParams().get(param) === "failed";
  if (!failed) return null;
  return (
    <p
      role="alert"
      className={`mt-3 text-sm font-medium ${tone === "paper" ? "text-fn-paper" : "text-red-700"}`}
    >
      {message ??
        "Registration couldn't be started — it may have just closed. Please try again, or reach out and we'll get you in."}
    </p>
  );
}
