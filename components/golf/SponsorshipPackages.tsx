"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { SponsorshipPackage } from "@/lib/shopify";

/**
 * A charity event's sponsorship packages, one card each, sold through Shopify.
 *
 * With `action` (the Storefront API is configured) a card posts its chosen
 * option to lib/checkout.ts, which mints a Shopify checkout. Without it, the
 * button links to the live store's product page with that option selected —
 * the same switch-over as the Phoenix trip's card checkout.
 */
export function SponsorshipPackages({
  packages,
  action,
  productUrl,
}: {
  packages: SponsorshipPackage[];
  action: ((form: FormData) => Promise<void>) | null;
  /** The store's product URL for a handle. */
  productUrl: Record<string, string>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((p) => (
        <PackageCard key={p.handle} pkg={p} action={action} productUrl={productUrl[p.handle]} />
      ))}
    </div>
  );
}

function PackageCard({
  pkg,
  action,
  productUrl,
}: {
  pkg: SponsorshipPackage;
  action: ((form: FormData) => Promise<void>) | null;
  productUrl: string;
}) {
  const [variant, setVariant] = useState(
    () => pkg.variants.find((v) => v.available)?.id ?? pkg.variants[0]?.id ?? "",
  );
  const chosen = pkg.variants.find((v) => v.id === variant);
  const soldOut = !pkg.variants.some((v) => v.available);
  const options = pkg.variants.filter((v) => v.title);

  const button =
    "inline-flex w-full items-center justify-center rounded-full bg-fn-ink px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50";

  const controls = (
    <>
      {options.length > 1 && (
        <label className="mb-4 block">
          <span className="sr-only">Option</span>
          <select
            name="variant"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="w-full cursor-pointer rounded-full border-2 border-fn-line bg-white px-4 py-2.5 text-sm text-fn-ink focus:border-fn-ink focus:outline-none"
          >
            {options.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.available}>
                {v.title} — {v.price}
                {v.available ? "" : " (sold out)"}
              </option>
            ))}
          </select>
        </label>
      )}
      {options.length <= 1 && <input type="hidden" name="variant" value={variant} />}
    </>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-fn-line">
      {pkg.imageUrl && (
        <div className="relative aspect-[16/9] bg-fn-accent-light">
          <Image
            src={pkg.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            // Package art is usually a logo or a graphic, so it's fitted, never cropped.
            className="object-contain p-4"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-2xl font-black uppercase leading-tight text-fn-ink">
          {pkg.title}
        </h3>
        {pkg.description && (
          <p className="mt-3 text-sm leading-relaxed text-fn-ink-soft">{pkg.description}</p>
        )}
        <p className="tabular mt-6 font-display text-3xl font-black text-fn-ink">
          {chosen?.price ?? pkg.variants[0]?.price}
        </p>
        <div className="mt-auto pt-6">
          {action ? (
            <form action={action}>
              {controls}
              <Submit className={button} disabled={soldOut} />
            </form>
          ) : (
            <>
              {controls}
              {soldOut ? (
                <button type="button" disabled className={button}>
                  Sold out
                </button>
              ) : (
                <a
                  href={`${productUrl}?variant=${encodeURIComponent(variant)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={button}
                >
                  Sponsor
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Submit({ className, disabled }: { className: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className} cursor-pointer`}
    >
      {disabled ? "Sold out" : pending ? "Starting checkout…" : "Sponsor"}
    </button>
  );
}
