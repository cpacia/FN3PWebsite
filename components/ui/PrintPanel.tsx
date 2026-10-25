import type { CSSProperties, ReactNode } from "react";

/**
 * A band of the active print, the primary sectioning device of the brand
 * register.
 *
 * The print comes from CSS variables set once per season on a layout wrapper
 * (lib/print-theme.ts), never from a path passed in here — so the same component
 * renders the resort palm in season and the Lone Pine colourway in the
 * offseason with no prop changes.
 *
 * A print's tones are mid-to-light by design, so it can't carry type on its own:
 * content sits on a solid card, or uses the near-black ink. `tint` washes the
 * panel when a section needs more separation than the raw print gives.
 */
export function PrintPanel({
  children,
  className = "",
  tint = 0,
  size = "lg",
  style,
}: {
  children?: ReactNode;
  className?: string;
  /** 0-1 wash of the print's deep tone, for contrast under light content. */
  tint?: number;
  /** Which asset to pull — "sm" for cards, "lg" for full-bleed bands. */
  size?: "sm" | "lg";
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative isolate overflow-hidden bg-fn-accent ${className}`}
      style={{
        backgroundImage: size === "sm" ? "var(--print-sm)" : "var(--print-lg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    >
      {tint > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-fn-accent-deep"
          style={{ opacity: tint }}
        />
      )}
      {children}
    </div>
  );
}
