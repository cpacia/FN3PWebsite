"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

/**
 * Footer newsletter signup. Posts to the same-origin proxy rather than straight
 * to Front9, so the org slug stays server-side and the browser never needs to
 * know the API shape.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-aqua">
        You&apos;re in. See you on the tee.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full border border-fn-paper/30 bg-transparent px-4 py-2.5 text-sm text-fn-paper placeholder:text-fn-paper/40 focus:border-fn-aqua focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded-full bg-fn-aqua px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.14em] text-fn-ink transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {state === "sending" ? "…" : "Join"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-xs text-fn-marg">
          That didn&apos;t go through. Try again in a moment.
        </p>
      )}
    </form>
  );
}
