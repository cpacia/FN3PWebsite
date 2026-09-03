# FN3P Golf — Brand Direction & Home Page

> Copied from the approved implementation plan so the brand system and the four
> unchosen directions live with the code. Direction 5 (Resort Print) is what the
> site is built on; the appendix is kept for revisiting later.

## Context

FN3P Golf (Gray, Maine) currently runs on a stock Shopify theme at `fn3pgolf.com`. The business is
two things at once: an **apparel brand** that actually moves product, and the **FN3P Golf Tour**, an
amateur golf league. There's also an annual **WM Phoenix Open trip** that needs its own flashy
signup page.

We're building a greenfield Next.js site that gives the apparel brand and the league roughly equal
prominence, sourcing league data from the **Front9 public API** and commerce from **Shopify**. This
mirrors what we did for Live Free Golf (`/home/chris/workspace/LFGWebsite`), but with two important
differences: LFG's merch store was an afterthought and is likely being discontinued, whereas FN3P's
merch is the revenue engine and must read as a serious brand with a fun, trendy, "golf bro culture"
vibe; and the visual design must be markedly different from LFG's forest-green/gold country-club look.

**Step one — the scope of this plan — is the brand system and the home page.** Other pages (shop,
tour, event/leaderboard, Phoenix Open signup) are designed against the system afterwards.

Stretch goal, built into the architecture here rather than retrofitted: the home page shifts
apparel-forward during the winter offseason.

### What the research turned up

- **Tagline (verbatim from their meta description):** "Play more Golf, have fun doing it and don't
  take it too seriously. Everyone 3 Putts."
- **Logo:** geometric monoline wordmark `F N ③ P▣` — circle-3 as a golf ball, boxed P with a pin-flag
  notch. Pure black, rounded terminals, perfectly circular counters.
- **Catalog:** 32 products, all vendor `FN3P Golf`. Hats $34.99 → pullovers/crewnecks $64.99. Three
  non-apparel SKUs sold as Shopify products: **FN3P Golf Tour $160**, **GHIN Club $50**,
  **FN3P × Phoenix Open $3,090**. No `product_type` and no tags on any product — collections do all
  the categorization.
- **Product photography is flat ghost-mannequin cutouts on white.** No lifestyle imagery. This is the
  single biggest design constraint: the layout has to make cutouts look deliberate.
- **Brand tension:** the line splits between Maine-coastal (Sebago, Casco Bay, Allagash, Lone Pine,
  Black Bear, Shorebird, The Granite) and resort/vacation (Vaca Mode, Havana, Spicy Marg, Date Night
  Floral, Desert Dog). Any direction has to hold both or deliberately pick a side.
- **Tour:** Apr–Aug regular season (Brunswick, Point Sebago, Lake Winnipesaukee, Sugarloaf, Fairlawn,
  Portsmouth CC), two-leg championship Sept/Oct at Martindale CC and Renaissance GC. Individuals or
  teams of 2–4, min 2 scores. $160 public / $250 private. Sponsor: Modern Woodmen; Milagro as
  official spirits partner.
- **WM Phoenix Open 2027:** Feb 11–16, $3,000. 5 nights, 3 rounds (Eagle Mountain, Golf Club of
  Estrella, We-Ko-Pa Cholla), Sunday skybox with F&B, custom apparel gifts, action prize money.
  Quarterly payment plan ($750 on Jul 1, Aug 15, Oct 1, Nov 15), locks Oct 1.

### Reference asset

`banner.png` in the repo root — a two-tone hand-painted palm-frond print lifted from one of the hats.
Sampled palette: ground `#84D7E7`, fronds `#B5E6ED`–`#CCEEF0`. Narrow tonal range, nothing dark,
nothing saturated — so it cannot carry type on its own. It works as a **surface** with near-black ink
or a solid card on top. It's also firmly in the resort camp, which is what pushed the chosen
direction.

---

## Chosen direction: **Resort Print**

> Selected. The other four directions are preserved in the appendix for later revisiting.

**The core idea:** the brand isn't a color, it's a **library of hand-painted patterns**. Palm frond
aqua, the florals, Havana, Spicy Marg — the site rotates them by collection and by season. This is
how the category's strongest brands actually behave right now (Malbon, Bad Birdie, Foreplay), it
resolves the Maine/resort tension (both are just prints in the library), and it's what `banner.png`
argues for directly.

### The two-register system

This is the structural idea that makes the site work, and it's what solves the apparel/league balance:

| | **Brand register** | **Data register** |
|---|---|---|
| Used for | hero, apparel, drops, Phoenix trip, marketing | schedule, field, tee sheets, leaderboards, standings |
| Ground | print panels, color fields | flat white |
| Type | oversized rounded geometric display | tabular figures, hairline rules |
| Shape | rounded cards, sticker badges, pill buttons | tight rows, square corners, minimal chrome |
| Color | rotating collection color | ink only, single aqua hairline accent |

Competition data reads as serious; merch stays loose. The contrast *is* the system — and it means the
league never feels like a decoration on a clothing site, or vice versa.

### Palette

Tailwind v4 `@theme` tokens in `app/globals.css` (no `tailwind.config` — same as LFG):

```css
@theme {
  /* Constants */
  --color-fn-ink:        #111111;  /* near-black, matches the logo */
  --color-fn-paper:      #faf8f4;  /* off-white ground */
  --color-fn-white:      #ffffff;

  /* Signature print (from banner.png) */
  --color-fn-aqua:       #84d7e7;  /* print ground */
  --color-fn-aqua-light: #c3eaef;  /* print fronds */
  --color-fn-deep:       #0b4f63;  /* derived dark, for contrast on aqua */

  /* Rotating collection accents */
  --color-fn-royal:      #1b44e0;
  --color-fn-navy:       #16233f;
  --color-fn-seafoam:    #9fd8c8;
  --color-fn-sand:       #e4d3b8;
  --color-fn-pistachio:  #c7d89a;
  --color-fn-marg:       #ef7b45;
}
```

Accessibility note: ink on aqua is high-contrast and fine. The pale fronds on the aqua ground are
low-contrast **by design and decorative only** — never put text on the fronds themselves.

A single `--color-fn-accent` var is what section components actually consume, remapped per collection
or per season. Adding a print later is a token swap plus an image, not a redesign.

### Typography

Two families, both `next/font/google`, wired as CSS vars on `<html>` in `app/layout.tsx`:

- **Display — Outfit (700/800/900).** Geometric with circular counters and rounded terminals; it's
  the closest free match to the logo's construction. Used for headlines, section titles, product
  names. Set tight (`-0.03em`) and large.
- **Text/data — Inter (400/500/600).** Workhorse for body, UI, and — critically — leaderboards and
  schedules via `font-variant-numeric: tabular-nums`.

Deliberately avoiding Montserrat/Lora/Bricolage since those are LFG's.

### Motifs

- **Print panels** — full-bleed tileable pattern bands, the primary sectioning device.
- **Sticker badges** — the circle-3 lockup, an "EVERYONE 3-PUTTS" oval, "GRAY · MAINE · EST. 2019".
- **Logo-derived UI primitives** — the circle and the box are the two shapes. Circular icon buttons,
  boxed labels, and a **pin-flag corner notch** (from the logo's `P▣`) as a repeating device on cards
  and buttons.
- Rounded `2xl` cards floating on print panels; ink-on-white rows in the data register.

### Seasonal mode (the offseason pivot, built in from day one)

`lib/season.ts` exports `getSeasonMode(): "tour" | "apparel"` — date-driven (tour Apr–Oct, apparel
Nov–Mar) with a `SEASON_MODE_OVERRIDE` env var to force either for testing and manual control. The
home page hero, the section order below the fold, and the announcement-bar message all read from it.
Everything else is shared, so this stays a small, well-contained switch rather than two home pages.

---

## Home page composition

Recommended layout is a **seasonal single hero** — one full-bleed hero that swaps by season, then
alternating equal-weight sections. (Confirm before build; alternatives were split-screen two doors,
merch-first, and tour-first.)

1. **Announcement bar** — thin, ink on aqua. Rotates: next event / current promo / Phoenix countdown.
2. **Header** — logo left, nav center (Shop · Tour · Phoenix Open · The Turn · About), cart + search
   right. Sticky, translucent over the hero.
3. **Hero** — full-bleed print panel, white card carrying the display headline and dual CTA.
   Seasonal swap of headline, imagery, and CTA order. *Brand register.*
4. **The Drop** — 2026 collection rail, 4 product cards, each on its own tinted print swatch.
   Horizontal scroll on mobile. *Brand register.*
5. **Tour band** — *data register.* Next-event card (course, date, spots remaining, entry fee) beside
   a condensed season schedule and a top-5 standings snippet. Links into the tour section.
6. **Phoenix Open feature** — full-bleed dark desert panel; the one place the site goes dark.
   Countdown to Feb 11 2027, payment-plan callout, CTA into the dedicated signup page.
7. **Category tiles** — Hats / Polos / Layers / Accessories, each a print tile.
8. **The Turn rail** — 3 latest Front9 blog posts as cards (cover image, date, title, excerpt), on a
   tinted print band, with a "Read all" link into `/the-turn`. *Brand register.* Sits here deliberately:
   it's the bridge between the merch sections above and the tour sections, and it's the one module
   that carries both kinds of content (drop stories and event recaps).
9. **Tour goods strip** — GHIN Club and tour entry, presented as products.
10. **Sponsors** — quiet ink row (Modern Woodmen, Milagro).
11. **Newsletter + footer** — wired to Front9's newsletter subscribe endpoint.

### The Turn (blog)

Content is authored in Front9 and fetched from the public API — same as LFG, no CMS.

- **Name:** **The Turn.** Displayed that way in nav, headings, and the home rail. Nice fit: it's the
  break between nines, so it reads as the place the brand talks between rounds, and it works for both
  merch stories and event recaps without belonging to either side.
- **Routes:** `/the-turn` (paginated list, 12 per page) and `/the-turn/[slug]`. Greenfield domain, no
  legacy URLs to preserve, so the route matches the name rather than defaulting to `/blog`.
- **Register:** the index and cards are brand register (print bands, rounded cards, display type);
  the article body itself is a clean measured reading column in Inter, closer to the data register.
- Port `components/blog/Markdown.tsx` from LFG — it's a hand-written renderer with no dependency, and
  Front9 returns markdown in the post's `post` field.
- Port the per-post `opengraph-image.tsx` and the shared `BrandCard`/`ogOptions()` from `lib/og.tsx`.
  Note that Satori can't read woff2 or `next/font`, so Outfit has to be vendored as raw TTF in
  `assets/fonts/` for OG generation — LFG does exactly this with Montserrat.
- **Image gotcha:** Front9 image fields come back host-absolute (`/media/...`) relative to the **API
  origin**, not the `/api/public/v1` base. Use LFG's `resolveImage(url, origin)`, which prefixes
  `new URL(apiUrl).origin`.

---

## Technical plan

### Stack

Next.js 16 App Router, TypeScript strict, Tailwind v4 (`@theme` in `globals.css`, PostCSS plugin
only), Railway via Nixpacks autodetect with **no deploy config files** — exactly the LFG setup.
Hand-rolled `fetch` throughout; no Shopify SDK, no Front9 SDK, no UI kit.

**No database.** LFG's Postgres exists solely for its pre-Front9 legacy archive; FN3P is greenfield,
so Drizzle, postgres-js, the migrations, the admin CRUD, and the upload API all drop out.

### Port from LFG (`/home/chris/workspace/LFGWebsite`)

Copy and strip these — they're the reusable core:

- `lib/providers/config.ts` — env gate; `front9OrgBase()` returns `null` when unconfigured, which is
  what lets every page degrade to empty UI instead of throwing. Drop the cutover-date logic.
- `lib/providers/types.ts` — the public DTOs (`EventSummary`, `Leaderboard`, `StandingsTable`, …).
  Keep as-is; it's the contract the components consume.
- `lib/providers/front9.ts` — the `Front9Provider` class. Keep the defensive pattern verbatim: build
  URL → `fetch` with `next: { revalidate: N }` → `if (!res.ok) return <empty>` → `catch { return
  <empty> }`. Drop `lib/providers/index.ts`'s dual-provider router entirely; there's only one
  provider now.
- `lib/{leaderboard,odds,team-match,bracket}.ts` — the shared normalizers. **Front9's SSE frames are
  byte-identical to the GET responses**, so these are used by both the server fetch and the client
  `EventSource`. Preserve that split.
- `lib/shopify.ts` — Storefront GraphQL over raw `fetch`, server-only.
- `app/api/shop/checkout/route.ts` — the client posts here, the route runs `cartCreate` server-side
  and returns the hosted checkout URL, so **the Storefront token never reaches the browser**.
- `lib/seo.ts` and `lib/og.tsx` — note the documented gotcha that Next merges metadata shallowly, so
  any page overriding `openGraph` must rebuild the whole object.

### Front9 API

Base `https://api.front9.com/api/public/v1`, **completely unauthenticated**, org-scoped by slug. Full
local reference at `/home/chris/workspace/front9-docs/docs/`. Home page needs:

| Endpoint | Purpose | revalidate |
|---|---|---|
| `GET /orgs/{org}/events?filter=upcoming` | next-event card, schedule strip | 300 |
| `GET /orgs/{org}/standings` | series list | 300 |
| `GET /orgs/{org}/standings/{seriesId}/table` | top-5 snippet | 120 |
| `GET /orgs/{org}/blog?limit=3` | home "The Turn" rail | 300 |
| `GET /orgs/{org}/blog?limit=12&offset=` | `/the-turn` index | 300 |
| `GET /orgs/{org}/blog/{slug}` | `/the-turn/[slug]` | 300 |
| `POST /orgs/{org}/newsletter/subscribe` | footer signup | no-store |

### Shopify

Target is **fully headless**: `fn3pgolf.com` serves the Next.js site, Shopify becomes a backend only
— Storefront API for catalog and cart, then hand off to Shopify's hosted checkout. Home page needs
`getGearProducts()` against the `2026-collection` handle. (Confirm the domain/DNS handoff with the
owner; alternatives were a Shopify-cart deep link or keeping `shop.fn3pgolf.com` on the old theme.)

Unlike LFG — which uses a plain `<img>` wrapper to dodge `next.config` remote patterns — a merch
brand should use `next/image` with `images.remotePatterns` for `cdn.shopify.com` and the Front9
origin. Image quality is part of the product here.

### New files

First build step: copy this document into the repo as `docs/brand/design-directions.md` so the brand
system and the four unchosen directions live with the code rather than only in a plan file.

```
docs/brand/design-directions.md      this document
app/layout.tsx                       fonts, metadata, theme vars
app/(public)/layout.tsx              CartProvider + Header + Footer + CartDrawer
app/(public)/page.tsx                home
app/(public)/the-turn/page.tsx       The Turn index, 12/page
app/(public)/the-turn/[slug]/page.tsx  post + opengraph-image.tsx
app/globals.css                      @theme tokens
lib/season.ts                        getSeasonMode()
lib/providers/{config,types,front9}.ts
lib/shopify.ts
app/api/shop/checkout/route.ts
app/api/newsletter/route.ts
components/layout/{Header,Footer,AnnouncementBar}.tsx
components/home/{Hero,DropRail,TourBand,PhoenixFeature,CategoryTiles,TheTurnRail,Sponsors}.tsx
components/the-turn/{PostCard,Markdown,Pagination}.tsx
components/ui/{PrintPanel,StickerBadge,ProductCard,Button}.tsx
components/shop/{cart-context,CartDrawer}.tsx
lib/og.tsx                           shared OG BrandCard
assets/fonts/Outfit-*.ttf            raw TTF for Satori (can't read woff2)
public/patterns/palm-aqua.png        from banner.png
```

Components grouped **by feature, not by type** — same as LFG.

---

## Prerequisites (blocking, need the owner)

1. **The Front9 org does not exist yet.** `fn3p`, `fn3p-golf`, and `fn3pgolf` all return
   `ORG_NOT_FOUND`. The org plus its 2026 events must be created before any tour data is real. Until
   then the tour band renders from a local fixture behind the same DTOs.
2. **Shopify Storefront API access token** — needed for any catalog data.
3. **Pattern artwork** — how much exists beyond `banner.png` determines whether the print library is
   rich or thin. If `banner.png` is all we get, the build uses one hero print plus flat color fields
   derived from it, and the theme stays structured so more prints drop in as a token swap.
4. **Domain/DNS plan** for the headless cutover.
5. **Signup routing** — the tour entry, GHIN, and Phoenix trip are Shopify products today. Options:
   move tour signups to Front9's registration endpoints so entrants feed the field/leaderboard/
   standings automatically; keep everything in Shopify for one cart and one payout but with manual
   roster entry; or build the CTA swappable and decide per-product. Not blocking for the home page.

---

## Verification

- `npm run dev`, load `/` — check both seasonal modes via `SEASON_MODE_OVERRIDE=tour|apparel`.
- Responsive sweep at 375 / 768 / 1280 / 1920. The drop rail must scroll horizontally on mobile
  without the page scrolling sideways.
- Unset `FRONT9_ORG_SLUG` and the Shopify env vars — the page must still render with empty sections
  rather than erroring. This is the LFG degradation contract and it's what keeps the site up while
  the Front9 org is still being created.
- `/the-turn` and a post page render, paginate, and produce a valid OG image
  (`/the-turn/[slug]/opengraph-image` returns a PNG — the Satori font path is the usual failure point).
- Contrast-check ink on aqua and on every collection accent.
- `npm run build` must succeed with no network access to Front9 or Shopify.
- Lighthouse on `/` — watch LCP given the full-bleed hero print; the pattern PNG needs compressing
  and sizing, and `priority` on the hero image only.

---

# Build notes (step one, as shipped)

What's actually in the repo, and where it deviates from the plan above.

## Deviations, and why

- **Next 16.3.4, not 16.2.7.** LFG's pin carries nine high-severity advisories
  (including a DoS in the Image Optimization API, which this site uses). No
  legacy constraint here, so the patched release won.
- **No cart yet.** `CartProvider`/`CartDrawer` were planned, but nothing on the
  home page can add to a cart — the product pages don't exist. The header's
  "Bag" and every product card link out to the live Shopify storefront through
  `lib/links.ts`, which is the single place to change when `/shop` lands.
  `app/api/shop/checkout` is built and ready for it.
- **Leaderboard/odds/bracket normalizers not ported.** They belong with the
  event pages; porting them now would be four modules of dead code. The SSE
  design note still holds: Front9's stream frames are byte-identical to the GET
  responses, so those normalizers must be shared between the server fetch and
  the client `EventSource`.
- **`TourGoods` doesn't use `ProductCard`.** Tour entry, the GHIN club and the
  Phoenix trip use logo artwork as their product image, and the GHIN club has no
  image at all, so photo tiles read as a mistake. They render in the data
  register instead: ink on white, large tabular price, plain CTA. They're
  signups, not merch.
- **404 lives at `app/not-found.tsx`, not in the route group.** A group-level
  not-found only covers its own segment, leaving unmatched top-level URLs on
  Next's default page.

## Placeholders to delete

Both backends are unconfigured, so the shop and tour sections would otherwise be
invisible. Two fixture files stand in, and nothing else imports them:

- `lib/fixtures/products.ts` — real titles, handles, prices and image URLs read
  from the store's public `/products.json`. Delete once
  `SHOPIFY_STOREFRONT_TOKEN` is set.
- `lib/fixtures/schedule.ts` — the 2026 schedule transcribed from the current
  site's tour page. Delete once `FRONT9_ORG_SLUG` is set. While it's in use the
  tour band shows a provenance note and **suppresses entry counts**, since we
  don't actually know them.

The Turn has no fixture: transcribing real product and schedule data is one
thing, inventing editorial content to review a design against is another. That
rail and `/the-turn` render empty until Front9 has posts.

## Asset dependency this surfaced

The design sits every product cutout on a panel of the print, which **depends on
product images having transparent backgrounds**. 27 of 28 are transparent PNGs
and look right. The Full Swing Anorak is a JPG with a baked-in white background
and renders as a white box interrupting the pattern. It needs a transparent
re-export, and any new product photography should follow the same rule.

More pattern artwork is still the biggest single upgrade available: the whole
direction is built on a print library, and there is currently one print.

## Verified

- `npm run build` and `npm run lint` clean, with no network access to Front9 or
  Shopify — the degradation contract holds.
- No horizontal overflow at 375 / 768 / 1280 / 1920 (measured via CDP:
  `scrollWidth === clientWidth`). The drop rail scrolls inside itself on mobile.
- Both seasonal modes swap correctly under `SEASON_MODE_OVERRIDE`.
- `/the-turn` renders its empty state; unknown URLs get the branded 404.

---

# Appendix: design directions considered

Recorded in full so we can revisit. **Direction 5 was chosen.** Direction 2 is not recommended given
`banner.png`.

### 1. Tour Broadsheet — *editorial golf media*

Laid out like a printed tour media guide. Near-black `#0E0E0E` on bone `#F4F2ED`, hairline rules
everywhere, a strict column grid, huge condensed grotesk for display (Druk-adjacent; free routes are
Anton or Archivo Condensed) against a neutral text face. Numbers are the design: tabular figures, big
event numerals, `NO. 07`, `EST. 2019 — GRAY, MAINE`. Section headers are all-caps letterspaced
eyebrows over rules.

Apparel and tour unify because everything is treated as editorial content — a drop gets the same
treatment as a leaderboard. Product cutouts sit in generous white cells with a hairline border and a
numbered caption, which turns the flat photography into a deliberate catalog look. References:
Metalwood Studio, Random Golf Club, Eastside Golf lookbooks.

- **Risk:** cool and restrained; reads "serious brand" much more loudly than "fun."
- **Banner fit:** good, as an accent — full-bleed aqua bands between sections with black condensed
  type knocked over them. The accent becomes the aqua rather than an acid lime.
- **Best fallback if pattern artwork turns out to be scarce.**

### 2. Dark Clubhouse — *dark-first hype*

Near-black base, electric royal `#1B44E0` and acid green, glow and grain, a scrolling marquee ticker
under the header, oversized kinetic type, product cards that light up on hover. Leans into the
Phoenix Open party energy and the 16th-hole atmosphere.

- **Risk:** two real problems. Every product photo is a white-background cutout, so they'd all need
  knocking out or re-shooting to sit on black. And dark-mode hype ages fast.
- **Banner fit:** poor. Soft pastel painterly versus hard neon glow never reconciles.
- **Not recommended.**

### 3. Maine Coast Field Guide — *warm retro-outdoors*

Sand `#E8DCC8`, pine `#1F3D2B`, navy, seafoam. Paper grain overlay, patch and badge lockups, a
workhorse slab (Bitter, Zilla) paired with a heavy sans, topo lines and hand-drawn map marks. Leans
all the way into the 207 and the Maine product names.

- **Risk:** picks the Maine side of the brand and orphans the resort side — Vaca Mode and Spicy Marg
  become off-brand. Coziest and least "bro" of the five; reads more Duluth Trading than Malbon.
- **Banner fit:** mixed. The instinct (hand-painted textile as brand texture) is right, but a tropical
  palm print inside a Maine field guide is a genre collision.

### 4. Modern Tour Brand — *clean, geometric, confident*

White ground, near-black ink, one signature color, enormous type in a geometric grotesk echoing the
logo's monoline construction. Strict grid, generous space, scroll motion. The rule: black and white
are constant, and the collection supplies the color — honest to a brand whose logo is pure black but
whose products run aqua, royal, sand, seafoam, and pistachio.

- **Risk:** safest and most timeless, but the most anonymous — most likely to look like a good
  template.
- **Banner fit:** very good. Clean everywhere, loud in the panels; the print becomes the signature
  full-bleed surface.
- Note: the chosen direction 5 keeps this one's "collection supplies the color" rule.

### 5. Resort Print — **CHOSEN**

See the main body above.
