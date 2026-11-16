"use server";

import { cookies } from "next/headers";
import {
  cartCreate,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
  getCart,
  type Cart,
} from "@/lib/shopify";

/**
 * The bag's server side. The client (components/shop/CartProvider) calls these
 * directly; the cart id stays in an httpOnly cookie and the Storefront token
 * never leaves the server.
 *
 * Shopify validates every merchandise and line id against the store and the
 * cart, so the checks here are only shape and bounds: a forged id gets a
 * userError back, which surfaces as null.
 */
const COOKIE = "fn3p_cart";
const MAX_QTY = 20;

const isGid = (id: unknown, type: string): id is string =>
  typeof id === "string" && id.startsWith(`gid://shopify/${type}/`) && id.length < 300;

const clampQty = (n: unknown) => Math.min(MAX_QTY, Math.max(0, Math.floor(Number(n) || 0)));

async function cartId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

async function remember(cart: Cart) {
  (await cookies()).set(COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** The visitor's bag, or null when they don't have one (or it was checked out). */
export async function loadCart(): Promise<Cart | null> {
  const id = await cartId();
  return id ? getCart(id) : null;
}

/**
 * Add a variant. Starts a new cart when there's none, or when the old one has
 * expired or been checked out — Shopify rejects lines on a completed cart.
 */
export async function addToCart(variantId: string, quantity = 1): Promise<Cart | null> {
  const qty = clampQty(quantity);
  if (!isGid(variantId, "ProductVariant") || qty < 1) return null;
  const lines = [{ merchandiseId: variantId, quantity: qty }];

  const id = await cartId();
  if (id) {
    const cart = await cartLinesAdd(id, lines);
    if (cart) return cart;
  }
  const cart = await cartCreate(lines);
  if (cart) await remember(cart);
  return cart;
}

/** Set a line's quantity; zero removes it. */
export async function updateCartLine(lineId: string, quantity: number): Promise<Cart | null> {
  const id = await cartId();
  if (!id || !isGid(lineId, "CartLine")) return null;
  const qty = clampQty(quantity);
  return qty === 0
    ? cartLinesRemove(id, [lineId])
    : cartLinesUpdate(id, [{ id: lineId, quantity: qty }]);
}
