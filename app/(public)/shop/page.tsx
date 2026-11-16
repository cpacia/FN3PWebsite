import type { Metadata } from "next";
import { ShopPage } from "@/components/shop/ShopPage";
import { socialMetadata } from "@/lib/seo";
import { getShopProducts } from "@/lib/shopify";

export const revalidate = 300;

export const metadata: Metadata = socialMetadata({
  title: "Shop",
  description:
    "FN3P Golf apparel: printed polos, snapbacks, layers and headcovers, from Gray, Maine.",
  path: "/shop",
});

export default async function ShopIndexPage() {
  const products = await getShopProducts();
  return <ShopPage products={products} view="all" />;
}
