import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/providers/front9";

/**
 * Newsletter signup proxy.
 *
 * The form posts here rather than straight to Front9 so the org slug and the
 * API shape stay server-side. Front9's endpoint is idempotent, so a repeat
 * subscribe is a success, not an error.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = (body.email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Cheap shape check only — Front9 does the real validation.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const ok = await subscribeToNewsletter(email);
  if (!ok) {
    return NextResponse.json({ error: "Subscription failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
