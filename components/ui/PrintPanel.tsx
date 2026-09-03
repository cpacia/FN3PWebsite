import type { CSSProperties, ReactNode } from "react";

/**
 * A band of the signature print, the primary sectioning device of the brand
 * register.
 *
 * The print is all mid-to-light values (ground #84d7e7, fronds #c3eaef), so it
 * cannot carry type on its own — content either sits on a solid card or uses the
 * near-black ink. `tint` darkens the panel behind content when a section needs
 * more separation than the raw print gives.
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
  /** 0-1 ink wash over the print, for contrast under light content. */
  tint?: number;
  /** Which pattern asset to pull — "sm" for cards, "lg" for full-bleed bands. */
  size?: "sm" | "lg";
  style?: CSSProperties;
}) {
  const src = size === "sm" ? "/patterns/palm-aqua-sm.webp" : "/patterns/palm-aqua.webp";
  return (
    <div
      className={`relative isolate overflow-hidden bg-fn-aqua ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    >
      {tint > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-fn-deep"
          style={{ opacity: tint }}
        />
      )}
      {children}
    </div>
  );
}
