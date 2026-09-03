/**
 * PLACEHOLDER product data.
 *
 * SHOPIFY_STOREFRONT_TOKEN isn't available yet, so there is no live catalogue to
 * render and the shop sections of the home page would otherwise be invisible.
 * These rows are real: titles, handles, prices and image URLs read from the
 * store's public /products.json, so the design can be reviewed against the
 * actual catalogue rather than lorem.
 *
 * Only used when the Storefront API returns nothing (see app/(public)/page.tsx).
 * Delete this file once the token is set -- nothing else imports it.
 */
import type { ProductCard } from "@/lib/shopify";

/** Apparel for the home page drop rail. */
export const PLACEHOLDER_DROP: ProductCard[] = [
  {
    handle: "sunrise-country-club-hoodie-pre-order",
    title: "Sunrise Country Club Hoodie",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/CCHoodie-Sunrise-NavyLogo.png?v=1779034459",
    imageAlt: "Sunrise Country Club Hoodie",
    price: "$64.99",
    availableForSale: true,
  },
  {
    handle: "overcast-country-club-q-zip",
    title: "Overcast Country Club Q Zip",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/CountryClub-QZip-Grey.png?v=1779717117",
    imageAlt: "Overcast Country Club Q Zip",
    price: "$64.99",
    availableForSale: true,
  },
  {
    handle: "full-swing-anorak",
    title: "Full Swing Anorak",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/5DA413F6-6520-4B05-A72D-30D116D4A5DD.jpg?v=1777161778",
    imageAlt: "Full Swing Anorak",
    price: "$69.99",
    availableForSale: true,
  },
  {
    handle: "shorebird-snapback",
    title: "Shorebird Snapback",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/69576B1F-7CC2-4B92-94D1-F06A2A557E43.png?v=1766867996",
    imageAlt: "Shorebird Snapback",
    price: "$34.99",
    availableForSale: true,
  },
  {
    handle: "lone-pine-snapback",
    title: "Lone Pine Two Tone Snapback",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/BC15358B-3FDE-4ABF-A8F8-1F14CC9080EE.png?v=1766867839",
    imageAlt: "Lone Pine Two Tone Snapback",
    price: "$34.99",
    availableForSale: true,
  },
  {
    handle: "vaca-mode-polo-pre-order",
    title: "Vaca Mode Polo",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/POLO-VacationMode-LeafElectricBlue_5511d143-6777-46bf-b839-189579d9d9e4.png?v=1766868532",
    imageAlt: "Vaca Mode Polo",
    price: "$59.99",
    availableForSale: true,
  },
  {
    handle: "country-club-crewneck",
    title: "Allagash Country Club Crewneck",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/Crewneck_ForestGreen_9c5f1e67-6fac-444e-8a48-e527908aac9b.png?v=1770126326",
    imageAlt: "Allagash Country Club Crewneck",
    price: "$64.99",
    availableForSale: true,
  },
  {
    handle: "fenway-polo-pre-order",
    title: "Fenway Polo",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/POLO-FenwayGreen-Pique_435bed58-1c35-4b23-97f2-77a6e33afdca.png?v=1771080102",
    imageAlt: "Fenway Polo",
    price: "$49.99",
    availableForSale: true,
  },
];

/** The three non-apparel SKUs the store sells as products. */
export const PLACEHOLDER_TOUR_GOODS: ProductCard[] = [
  {
    handle: "fn3p-golf-tour",
    title: "FN3P GOLF TOUR",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/FN3PTOURLOGO_2026_linear_c2f93529-bd40-49c1-a350-a216c304ff52.png?v=1771589639",
    imageAlt: "FN3P GOLF TOUR",
    price: "$160.00",
    availableForSale: true,
  },
  {
    handle: "fn3p-ghin-club",
    title: "FN3P GHIN CLUB",
    imageUrl:
      "",
    imageAlt: "FN3P GHIN CLUB",
    price: "$50.00",
    availableForSale: true,
  },
  {
    handle: "fn3p-wmo-trip",
    title: "FN3P x Phoenix Open",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0090/5740/2985/files/FN3PxWMPHOENIXOPEN-2027-logo_ebdbc52d-5c54-4ef9-9bc8-d8c072bd9faf.png?v=1780170540",
    imageAlt: "FN3P x Phoenix Open",
    price: "$3090.00",
    availableForSale: true,
  },
];
