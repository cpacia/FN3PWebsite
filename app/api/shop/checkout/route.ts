import { NextResponse } from "next/server";
import { createCheckoutForHandle, createCheckoutUrl } from "@/lib/shopify";

/**
 * Checkout proxy.
 *
 * The browser posts cart lines (or a single product handle) here; this route
 * runs Shopify's `cartCreate` server-side and returns the hosted checkout URL to
 * redirect to. Doing it this way is what keeps the Storefront token off the
 * client — it is never sent to the browser in any form.
 */
interface CheckoutBody {
  lines?: { merchandiseId: string; quantity: number }[];
  handle?: string;
  quantity?: number;
}

export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let url: string | null = null;
  if (body.handle) {
    url = await createCheckoutForHandle(body.handle, body.quantity ?? 1);
  } else if (Array.isArray(body.lines) && body.lines.length > 0) {
    const lines = body.lines
      .filter((l) => typeof l?.merchandiseId === "string" && l.merchandiseId)
      .map((l) => ({
        merchandiseId: l.merchandiseId,
        quantity: Math.max(1, Math.floor(Number(l.quantity) || 1)),
      }));
    if (lines.length === 0) {
      return NextResponse.json({ error: "No valid line items" }, { status: 400 });
    }
    url = await createCheckoutUrl(lines);
  } else {
    return NextResponse.json({ error: "Nothing to check out" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
  return NextResponse.json({ url });
}
