"use server";

import { redirect } from "next/navigation";
import { PHOENIX_TRIP } from "@/lib/phoenix";
import { createCheckoutUrl, getProduct, getSponsorshipPackages } from "@/lib/shopify";

/**
 * Card checkout for the Phoenix trip: a Shopify cart for the chosen payment
 * option, handed off to Shopify's hosted checkout (Shop Pay included). Posted
 * from a plain form, like registration, so it works without JavaScript. The
 * variant is checked against the product, so a forged form can't buy anything
 * else. Failure lands back on the page with `?registration=failed`.
 *
 * redirect() works by throwing, so it's called outside any try/catch.
 */
export async function buyPhoenixTrip(form: FormData) {
  const variantId = String(form.get("variant") ?? "");
  const product = await getProduct(PHOENIX_TRIP.productHandle);
  const variant = product?.variants.find((v) => v.id === variantId && v.availableForSale);
  const target = variant
    ? await createCheckoutUrl([{ merchandiseId: variant.id, quantity: 1 }])
    : null;
  redirect(target ?? "/phoenix-open?registration=failed#book");
}

/**
 * Card checkout for a charity sponsorship package, the same way: a Shopify cart
 * for the chosen option, checked against the event's sponsorship collection so
 * a forged form can't buy anything else. Failure lands back on the event's
 * sponsorship section with `?checkout=failed`.
 */
export async function buySponsorship(eventSlug: string, form: FormData) {
  const variantId = String(form.get("variant") ?? "");
  const packages = await getSponsorshipPackages(eventSlug);
  const variant = packages
    .flatMap((p) => p.variants)
    .find((v) => v.id === variantId && v.available);
  const target = variant
    ? await createCheckoutUrl([{ merchandiseId: variant.id, quantity: 1 }])
    : null;
  redirect(target ?? `/charity/${encodeURIComponent(eventSlug)}?checkout=failed#sponsor`);
}
