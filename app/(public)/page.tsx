import { CategoryTiles } from "@/components/home/CategoryTiles";
import { DropRail } from "@/components/home/DropRail";
import { Hero } from "@/components/home/Hero";
import { MoreGolf } from "@/components/home/MoreGolf";
import { PhoenixFeature } from "@/components/home/PhoenixFeature";
import { Sponsors } from "@/components/home/Sponsors";
import { TheTurnRail } from "@/components/home/TheTurnRail";
import { TourBand } from "@/components/home/TourBand";
import { TourGoods } from "@/components/home/TourGoods";
import { PLACEHOLDER_DROP, PLACEHOLDER_TOUR_GOODS } from "@/lib/fixtures/products";
import { daysUntilTrip } from "@/lib/phoenix";
import { getSeasonMode } from "@/lib/season";
import { defaultSeason, getGolfCalendar, nextUp, TOUR_MEMBERSHIP, TOUR_MEMBERSHIP_PRODUCT } from "@/lib/golf";
import { getMembershipType, listPosts } from "@/lib/providers/front9";
import { getDropProducts, getProductsByHandle } from "@/lib/shopify";

/**
 * Every data source degrades to empty rather than throwing, so this revalidate
 * window is safe even while Shopify is unconfigured — the page just renders the
 * sections that have content.
 */
export const revalidate = 300;

/** The three non-apparel SKUs the store sells as products. */
const TOUR_GOODS_HANDLES = [TOUR_MEMBERSHIP_PRODUCT, "fn3p-ghin-club", "fn3p-x-phoenix-open"];

export default async function HomePage() {
  const mode = getSeasonMode();

  const [liveDrop, calendar, turn, liveTourGoods, membership] =
    await Promise.all([
      getDropProducts(8),
      getGolfCalendar(),
      listPosts({ limit: 3 }),
      getProductsByHandle(TOUR_GOODS_HANDLES),
      getMembershipType(TOUR_MEMBERSHIP),
    ]);

  // Shopify isn't wired up yet, so products fall back to placeholders drawn from
  // the store's public catalogue. Delete lib/fixtures/products.ts once
  // SHOPIFY_STOREFRONT_TOKEN is set -- see docs/brand/design-directions.md.
  const drop = liveDrop.length > 0 ? liveDrop : PLACEHOLDER_DROP;
  const tourGoods = liveTourGoods.length > 0 ? liveTourGoods : PLACEHOLDER_TOUR_GOODS;

  // The band shows the whole tour season, not just what's left of it — in the
  // offseason that's last summer's schedule, which still reads as the tour.
  const season = defaultSeason(calendar.tour);
  const schedule = calendar.tour.filter((e) => e.date.startsWith(String(season)));
  const nextEvent = nextUp(calendar.tour);

  return (
    <>
      <Hero mode={mode} nextEvent={nextEvent} />

      {/*
       * Section order follows the season: in tour mode the band sits directly
       * under the hero, in the offseason the drop does. Everything below is
       * shared, so this is a swap of two blocks rather than two pages.
       */}
      {mode === "tour" ? (
        <>
          <TourBand
            nextEvent={nextEvent}
            schedule={schedule}
            season={season}
          />
          <DropRail products={drop} />
        </>
      ) : (
        <>
          <DropRail products={drop} />
          <TourBand
            nextEvent={nextEvent}
            schedule={schedule}
            season={season}
          />
        </>
      )}

      <MoreGolf calendar={calendar} />
      <PhoenixFeature daysOut={daysUntilTrip()} />
      <CategoryTiles />
      <TheTurnRail posts={turn.posts} />
      <TourGoods products={tourGoods} membership={membership} />
      <Sponsors />
    </>
  );
}
