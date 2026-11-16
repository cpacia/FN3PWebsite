"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/shop/CartProvider";
import { productHref } from "@/lib/links";

/**
 * The bag, as a drawer from the right. Always mounted, so it can slide; while
 * closed it's `inert`, which keeps it out of the tab order and screen readers.
 * Checkout hands off to Shopify's hosted checkout at the cart's checkoutUrl.
 */
export function CartDrawer() {
  const { cart, open, setOpen, update, busyLine, error } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lines = cart?.lines ?? [];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-fn-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-fn-paper shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-fn-line px-6 py-5">
          <h2 className="font-display text-2xl font-black uppercase text-fn-ink">
            Your bag
            {lines.length > 0 && (
              <span className="tabular ml-2 text-fn-ink-soft">({cart?.totalQuantity})</span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="-mr-2 cursor-pointer rounded-full p-2 text-fn-ink transition-colors hover:bg-fn-ink/5"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-3xl font-black uppercase text-fn-ink">Nothing in here yet</p>
            <p className="mt-3 text-fn-ink-soft">Polos, lids, layers. Go fill it up.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex rounded-full bg-fn-ink px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-fn-paper transition-colors hover:bg-black"
            >
              Shop the line
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-fn-line overflow-y-auto px-6">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className={`flex gap-4 py-5 transition-opacity ${
                    busyLine === line.id ? "opacity-50" : ""
                  }`}
                >
                  <Link
                    href={productHref(line.handle)}
                    onClick={() => setOpen(false)}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-fn-panel"
                  >
                    {line.imageUrl && (
                      <Image
                        src={line.imageUrl}
                        alt={line.title}
                        fill
                        sizes="96px"
                        className="object-contain p-2 mix-blend-multiply"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={productHref(line.handle)}
                          onClick={() => setOpen(false)}
                          className="font-display text-base font-bold leading-tight text-fn-ink hover:underline"
                        >
                          {line.title}
                        </Link>
                        <p className="mt-1 text-sm text-fn-ink-soft">
                          {[line.variantTitle, line.preorder ? "Pre-order" : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-sm font-semibold text-fn-ink">{line.total}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-fn-ink/20">
                        <button
                          type="button"
                          disabled={busyLine != null}
                          onClick={() => update(line.id, line.quantity - 1)}
                          aria-label={`One fewer ${line.title}`}
                          className="h-9 w-9 cursor-pointer rounded-full text-lg leading-none text-fn-ink hover:bg-fn-ink/5 disabled:cursor-wait"
                        >
                          −
                        </button>
                        <span className="tabular w-7 text-center text-sm font-semibold" aria-live="polite">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={busyLine != null}
                          onClick={() => update(line.id, line.quantity + 1)}
                          aria-label={`One more ${line.title}`}
                          className="h-9 w-9 cursor-pointer rounded-full text-lg leading-none text-fn-ink hover:bg-fn-ink/5 disabled:cursor-wait"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busyLine != null}
                        onClick={() => update(line.id, 0)}
                        className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-fn-ink-soft underline underline-offset-4 hover:text-fn-ink disabled:cursor-wait"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-fn-line bg-white px-6 pb-6 pt-5">
              {error && (
                <p role="alert" className="mb-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-fn-ink">
                  Subtotal
                </span>
                <span className="tabular font-display text-2xl font-black text-fn-ink">{cart?.subtotal}</span>
              </div>
              <p className="mt-1 text-sm text-fn-ink-soft">Shipping and tax calculated at checkout.</p>
              <a
                href={cart?.checkoutUrl}
                className="mt-5 flex w-full items-center justify-center rounded-full bg-fn-ink px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-fn-paper transition-colors hover:bg-black"
              >
                Check out
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full cursor-pointer text-center text-xs font-semibold uppercase tracking-[0.14em] text-fn-ink-soft underline underline-offset-4 hover:text-fn-ink"
              >
                Keep shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
