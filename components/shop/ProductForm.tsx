"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import type { Product } from "@/lib/shopify";

/**
 * Price, option pickers and the add-to-bag button.
 *
 * A product with several sizes starts with none chosen, so nobody gets a
 * Medium they didn't pick. Values that can't be bought with the rest of the
 * current selection are struck through but still visible, so a sold-out size
 * reads as sold out rather than missing.
 */
export function ProductForm({ product }: { product: Product }) {
  const { add, error } = useCart();
  const options = product.options.filter(
    (o) => !(o.values.length === 1 && o.values[0] === "Default Title"),
  );
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      options.filter((o) => o.values.length === 1).map((o) => [o.name, o.values[0]]),
    ),
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const matches = (v: Product["variants"][number], sel: Record<string, string>) =>
    v.selectedOptions.every((so) => sel[so.name] == null || sel[so.name] === so.value);

  const complete = options.every((o) => selected[o.name] != null);
  const variant = useMemo(
    () =>
      options.length === 0
        ? product.variants[0]
        : complete
          ? product.variants.find((v) => matches(v, selected))
          : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, product.variants, complete],
  );

  const prices = product.variants.map((v) => v.price);
  const priceLabel =
    variant?.priceFormatted ??
    (Math.min(...prices) < Math.max(...prices)
      ? `From ${product.variants.find((v) => v.price === Math.min(...prices))?.priceFormatted}`
      : product.variants[0]?.priceFormatted);
  const compareAt = (variant ?? product.variants[0])?.compareAtFormatted;

  const valueAvailable = (name: string, value: string) =>
    product.variants.some(
      (v) => v.availableForSale && matches(v, { ...selected, [name]: value }),
    );

  const soldOut = !product.availableForSale || (variant != null && !variant.availableForSale);
  const missing = options.find((o) => selected[o.name] == null);

  async function onAdd() {
    if (!variant || soldOut) return;
    setAdding(true);
    setAdded(false);
    const ok = await add(variant.id, 1);
    setAdding(false);
    if (ok) setAdded(true);
  }

  return (
    <div>
      <p className="flex items-baseline gap-3">
        <span className="tabular font-display text-3xl font-black text-fn-ink">{priceLabel}</span>
        {compareAt && (
          <>
            <span className="tabular text-lg text-fn-ink-soft line-through">{compareAt}</span>
            <span className="rounded-full bg-fn-marg px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-fn-ink">
              Sale
            </span>
          </>
        )}
      </p>

      {options.map((o) => (
        <fieldset key={o.name} className="mt-8">
          <legend className="mb-3 flex w-full items-baseline justify-between font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-ink">
            <span>
              {o.name}
              {selected[o.name] && (
                <span className="ml-2 font-body normal-case tracking-normal text-fn-ink-soft">
                  {selected[o.name]}
                </span>
              )}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {o.values.map((value) => {
              const on = selected[o.name] === value;
              const available = valueAvailable(o.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setAdded(false);
                    setSelected((s) => ({ ...s, [o.name]: value }));
                  }}
                  className={`min-w-14 cursor-pointer rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    on
                      ? "border-fn-ink bg-fn-ink text-fn-paper"
                      : available
                        ? "border-fn-ink/15 bg-white text-fn-ink hover:border-fn-ink"
                        : "border-fn-ink/10 bg-transparent text-fn-ink/35 line-through"
                  }`}
                >
                  {value}
                  {!available && <span className="sr-only"> (sold out)</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={adding || soldOut || !variant}
        className="mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-fn-ink px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-fn-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-fn-ink/30"
      >
        {soldOut
          ? "Sold out"
          : missing
            ? `Select ${missing.name.toLowerCase()}`
            : adding
              ? "Adding…"
              : product.preorder
                ? "Pre-order"
                : "Add to bag"}
      </button>

      <p className="mt-3 min-h-5 text-sm" aria-live="polite">
        {error ? (
          <span className="font-medium text-red-700">{error}</span>
        ) : added ? (
          <span className="text-fn-ink-soft">Added to your bag.</span>
        ) : product.preorder ? (
          <span className="text-fn-ink-soft">
            Pre-order: this ships once the production run arrives.
          </span>
        ) : null}
      </p>
    </div>
  );
}
