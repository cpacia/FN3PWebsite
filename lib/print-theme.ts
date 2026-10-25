import type { CSSProperties } from "react";
import { getSeasonMode, type SeasonMode } from "@/lib/season";

/**
 * The print library.
 *
 * The brand isn't a colour, it's a set of hand-painted prints — so the print
 * itself is the thing that changes, and the surrounding colours change with it.
 * The catalogue already splits into two families that map onto the calendar:
 * resort (Vaca Mode, Havana, Spicy Marg, the palm) in season, and Maine (Lone
 * Pine, The Granite, Black Bear, Sebago) in the offseason. So the seasonal shift
 * isn't a hue rotation, it's a different print family — which is also how the
 * Maine/resort tension in the line stops being a problem and becomes the
 * mechanism.
 *
 * Nothing reads a pattern path or an accent colour directly. Themes are applied
 * once as CSS variables on a layout wrapper (see printThemeVars) and every
 * surface inherits them, so adding a print is an entry in PRINT_THEMES plus two
 * image files.
 */
export interface PrintTile {
  bg: string;
  /** Which of the two constants reads on `bg`. */
  on: "ink" | "paper";
}

export interface PrintTheme {
  id: string;
  /** Human label, for the offseason/AB switch and for docs. */
  label: string;
  /**
   * The print assets, or null for a print-free season — a flat ground with the
   * pattern withheld is a legitimate seasonal look, not a missing asset.
   */
  print: { src: string; srcSm: string } | null;
  /**
   * The band asset's darker tone; also the solid fallback behind it. Note that
   * `print.srcSm` is not required to share this colourway: bands can run dark
   * while cards run light, which is what keeps dark garments from disappearing
   * into a moody ground.
   */
  ground: string;
  /** The card asset's pale tone, for tinted surfaces and hover states. */
  groundLight: string;
  /** A darkened relative of the ground, for small accent type on paper. */
  deep: string;
  /**
   * Category tile colours — the collection palette for this season. `on` names
   * the label colour explicitly rather than deriving it: the palette spans pale
   * sand to deep spruce across the year, and a blend mode picks arbitrary hues
   * off whatever it lands on.
   */
  tiles: [PrintTile, PrintTile, PrintTile, PrintTile];
}

export const PRINT_THEMES = {
  "palm-aqua": {
    id: "palm-aqua",
    label: "Palm — resort",
    print: {
      src: "/patterns/palm-aqua.webp",
      srcSm: "/patterns/palm-aqua-sm.webp",
    },
    ground: "#84d7e7",
    groundLight: "#c3eaef",
    deep: "#0b4f63",
    tiles: [
      { bg: "#84d7e7", on: "ink" },
      { bg: "#9fd8c8", on: "ink" },
      { bg: "#e4d3b8", on: "ink" },
      { bg: "#c7d89a", on: "ink" },
    ],
  },
  "lone-pine": {
    id: "lone-pine",
    label: "Lone Pine — offseason",
    print: {
      src: "/patterns/lone-pine.webp",
      srcSm: "/patterns/lone-pine-sm.webp",
    },
    ground: "#1f3d2b",
    groundLight: "#cfd8c9",
    deep: "#16233f",
    tiles: [
      { bg: "#1f3d2b", on: "paper" },
      { bg: "#c8d4c4", on: "ink" },
      { bg: "#e4d3b8", on: "ink" },
      { bg: "#16233f", on: "paper" },
    ],
  },
  /**
   * The second Maine print, and the first one drawn from real artwork rather
   * than a recolour of the palm (banner2.png). No season leads with it — it's
   * reachable through PRINT_THEME_OVERRIDE, which is what that switch is for:
   * a drop wearing its own print without touching the page's ordering.
   */
  "casco-bay": {
    id: "casco-bay",
    label: "Casco Bay — offseason",
    print: {
      src: "/patterns/casco-bay.webp",
      srcSm: "/patterns/casco-bay-sm.webp",
    },
    ground: "#1b3a4d",
    groundLight: "#cfe0e8",
    deep: "#0f2a3a",
    tiles: [
      { bg: "#1b3a4d", on: "paper" },
      { bg: "#b9cfd8", on: "ink" },
      { bg: "#e4d3b8", on: "ink" },
      { bg: "#3f5a52", on: "paper" },
    ],
  },
} as const satisfies Record<string, PrintTheme>;

export type PrintThemeId = keyof typeof PRINT_THEMES;

/** Which print leads in each season. */
const BY_SEASON: Record<SeasonMode, PrintThemeId> = {
  tour: "palm-aqua",
  apparel: "lone-pine",
};

/**
 * The active print. Follows the season by default; PRINT_THEME_OVERRIDE pins one
 * independently of SEASON_MODE_OVERRIDE, so a drop can carry its own print
 * without also flipping the page's tour/apparel ordering.
 */
export function getPrintTheme(mode: SeasonMode = getSeasonMode()): PrintTheme {
  const override = (process.env.PRINT_THEME_OVERRIDE ?? "").trim();
  if (override && override in PRINT_THEMES) {
    return PRINT_THEMES[override as PrintThemeId];
  }
  return PRINT_THEMES[BY_SEASON[mode]];
}

/**
 * The theme as CSS variables, applied once on a layout wrapper. Every print
 * surface reads these rather than importing the theme, which keeps the pattern
 * out of component props and lets a swap happen in one place.
 */
export function printThemeVars(theme: PrintTheme): CSSProperties {
  const none = "none";
  return {
    "--print-lg": theme.print ? `url(${theme.print.src})` : none,
    "--print-sm": theme.print ? `url(${theme.print.srcSm})` : none,
    "--color-fn-accent": theme.ground,
    "--color-fn-accent-light": theme.groundLight,
    "--color-fn-accent-deep": theme.deep,
    ...Object.fromEntries(
      theme.tiles.flatMap((t, i) => [
        [`--tile-${i + 1}`, t.bg],
        [
          `--tile-${i + 1}-on`,
          t.on === "paper" ? "var(--color-fn-paper)" : "var(--color-fn-ink)",
        ],
      ]),
    ),
  } as CSSProperties;
}
