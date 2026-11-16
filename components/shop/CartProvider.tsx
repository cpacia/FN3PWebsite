"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addToCart, loadCart, updateCartLine } from "@/lib/cart-actions";
import type { Cart } from "@/lib/shopify";

/**
 * The bag, shared by the header button, the drawer and every add-to-bag form.
 *
 * Loaded on mount rather than in the layout: reading the cart cookie during
 * render would make every page dynamic, and the catalogue pages are static.
 */
interface CartContextValue {
  cart: Cart | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Add a variant and open the drawer. Resolves false when Shopify refused. */
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  update: (lineId: string, quantity: number) => Promise<void>;
  /** The line id being changed, so its row can dim. */
  busyLine: string | null;
  error: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadCart()
      .then((c) => live && setCart(c))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const add = useCallback(async (variantId: string, quantity = 1) => {
    setError(null);
    try {
      const next = await addToCart(variantId, quantity);
      if (next) {
        setCart(next);
        setOpen(true);
        return true;
      }
    } catch {}
    setError("That couldn't be added to your bag. Please try again.");
    return false;
  }, []);

  const update = useCallback(async (lineId: string, quantity: number) => {
    setError(null);
    setBusyLine(lineId);
    try {
      const next = await updateCartLine(lineId, quantity);
      if (next) setCart(next);
      else setError("Your bag couldn't be updated. Please try again.");
    } catch {
      setError("Your bag couldn't be updated. Please try again.");
    } finally {
      setBusyLine(null);
    }
  }, []);

  const value = useMemo(
    () => ({ cart, open, setOpen, add, update, busyLine, error }),
    [cart, open, add, update, busyLine, error],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
