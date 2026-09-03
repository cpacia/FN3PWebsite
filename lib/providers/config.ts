/**
 * Front9 API configuration.
 *
 * FN3P is greenfield: there's no pre-Front9 archive to merge, so unlike LFG
 * there is no era-cutover logic here and no second data provider. This module is
 * only the env gate — the single "is Front9 configured?" check every caller goes
 * through, which is what lets the site render with empty sections instead of
 * throwing while the org is still being created.
 */

/** Fallback API base when FRONT9_API_URL is unset, including the version prefix. */
const DEFAULT_API_URL = "https://api.front9.com/api/public/v1";

/** The Front9 API base, trailing slashes stripped. */
export function front9ApiUrl(): string {
  return (process.env.FRONT9_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, "");
}

/** FN3P's organization slug on Front9; "" when unconfigured. */
export function front9OrgSlug(): string {
  return (process.env.FRONT9_ORG_SLUG ?? "").trim();
}

/**
 * `{ apiUrl, org }` for the org-scoped calls, or null when the org slug is unset.
 * Every fetch in lib/providers/front9.ts starts with this; null means "not
 * configured yet" and the caller returns its empty value.
 */
export function front9OrgBase(): { apiUrl: string; org: string } | null {
  const org = front9OrgSlug();
  return org ? { apiUrl: front9ApiUrl(), org } : null;
}

/**
 * Scheme+host of the API base (e.g. "https://api.front9.com").
 *
 * Front9 returns image fields as host-absolute paths ("/media/...") served from
 * the API *origin*, not from the /api/public/v1 base — so they have to be
 * resolved against this, not against apiUrl.
 */
export function apiOrigin(apiUrl: string): string {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

/**
 * Season-points standings series id, for the home page top-5 snippet. Blank
 * means "auto-detect the first season-scoped, non-money series".
 */
export const SEASON_STANDINGS_SERIES_ID = (
  process.env.SEASON_STANDINGS_SERIES_ID ?? ""
).trim();
