"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export interface PaymentOption {
  /** Storefront variant gid when checkout is live; the store's numeric id otherwise. */
  id: string;
  label: string;
  price: string;
  available: boolean;
}

/**
 * The card-payment picker for the trip: one tile per Shopify variant (pay in
 * full, half, a single installment…), then a button.
 *
 * With `action` (the Storefront API is configured) the button posts the chosen
 * variant to lib/checkout.ts, which mints a Shopify checkout. Without it, the
 * button links to the live store's product page with that variant selected, so
 * the page sells the trip today and switches over by itself once Shopify is
 * wired up.
 */
export function TripCheckout({
  options,
  action,
  productUrl,
}: {
  options: PaymentOption[];
  action: ((form: FormData) => Promise<void>) | null;
  productUrl: string;
}) {
  const [selected, setSelected] = useState(
    () => options.find((o) => o.available)?.id ?? options[0]?.id ?? "",
  );
  if (options.length === 0) return null;

  const picker = (
    <fieldset>
      <legend className="sr-only">Payment option</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-2xl border-2 px-4 py-3 transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 ${
              selected === o.id
                ? "border-fn-paper bg-fn-paper text-fn-ink"
                : "border-fn-paper/25 text-fn-paper hover:border-fn-paper/60"
            }`}
          >
            <input
              type="radio"
              name="variant"
              value={o.id}
              checked={selected === o.id}
              disabled={!o.available}
              onChange={() => setSelected(o.id)}
              className="sr-only"
            />
            <span className="font-display text-sm font-bold uppercase tracking-[0.08em]">
              {o.label}
            </span>
            <span className="tabular font-display text-base font-black">{o.price}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const button =
    "inline-flex w-full items-center justify-center rounded-full bg-fn-marg px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-ink transition-colors hover:bg-fn-paper";

  if (!action) {
    return (
      <div className="space-y-4">
        {picker}
        <a
          href={`${productUrl}?variant=${encodeURIComponent(selected)}`}
          target="_blank"
          rel="noreferrer"
          className={button}
        >
          Pay by card
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {picker}
      <Submit className={button} />
    </form>
  );
}

function Submit({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} cursor-pointer disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? "Starting checkout…" : "Pay by card"}
    </button>
  );
}
