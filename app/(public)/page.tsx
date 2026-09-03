import { CategoryTiles } from "@/components/home/CategoryTiles";
import { DropRail } from "@/components/home/DropRail";
import { Hero } from "@/components/home/Hero";
import { PhoenixFeature } from "@/components/home/PhoenixFeature";
import { Sponsors } from "@/components/home/Sponsors";
import { TheTurnRail } from "@/components/home/TheTurnRail";
import { TourBand } from "@/components/home/TourBand";
import { TourGoods } from "@/components/home/TourGoods";
import { PLACEHOLDER_DROP, PLACEHOLDER_TOUR_GOODS } from "@/lib/fixtures/products";
import { PLACEHOLDER_SCHEDULE } from "@/lib/fixtures/schedule";
import { daysUntilTrip } from "@/lib/phoenix";
import { getSeasonMode } from "@/lib/season";
import {
  getNextEvent,
  getSeasonStandings,
  listEvents,
  listPosts,
} from "@/lib/providers/front9";
import { getDropProducts, getProductsByHandle } from "@/lib/shopify";

/**
 * Every data source degrades to empty rather than throwing, so this revalidate
 * window is safe even while Front9 and Shopify are unconfigured — the page just
 * renders the sections that have content.
 */
export const revalidate = 300;

/** The three non-apparel SKUs the store sells as products. */
const TOUR_GOODS_HANDLES = ["fn3p-golf-tour", "fn3p-ghin-club", "fn3p-x-phoenix-open"];

export default async function HomePage() {
  const mode = getSeasonMode();

  const [liveDrop, liveSchedule, liveNextEvent, standings, turn, liveTourGoods] =
    await Promise.all([
      getDropProducts(8),
      listEvents({ filter: "upcoming", limit: 12 }),
      getNextEvent(),
      getSeasonStandings(5),
      listPosts({ limit: 3 }),
      getProductsByHandle(TOUR_GOODS_HANDLES),
    ]);

  // Neither backend is wired up yet, so both fall back to placeholders drawn
  // from the store's public catalogue and the current site's tour page. Delete
  // lib/fixtures/* once FRONT9_ORG_SLUG and SHOPIFY_STOREFRONT_TOKEN are set --
  // see docs/brand/design-directions.md.
  const drop = liveDrop.length > 0 ? liveDrop : PLACEHOLDER_DROP;
  const tourGoods = liveTourGoods.length > 0 ? liveTourGoods : PLACEHOLDER_TOUR_GOODS;

  const isPlaceholder = liveSchedule.length === 0;
  const schedule = isPlaceholder ? PLACEHOLDER_SCHEDULE : liveSchedule;
  const nextEvent = liveNextEvent ?? (isPlaceholder ? PLACEHOLDER_SCHEDULE[0] : null);

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
            standings={standings}
            isPlaceholder={isPlaceholder}
          />
          <DropRail products={drop} />
        </>
      ) : (
        <>
          <DropRail products={drop} />
          <TourBand
            nextEvent={nextEvent}
            schedule={schedule}
            standings={standings}
            isPlaceholder={isPlaceholder}
          />
        </>
      )}

      <PhoenixFeature daysOut={daysUntilTrip()} />
      <CategoryTiles />
      <TheTurnRail posts={turn.posts} />
      <TourGoods products={tourGoods} />
      <Sponsors />
    </>
  );
}
