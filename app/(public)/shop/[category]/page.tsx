import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopPage, type ShopView } from "@/components/shop/ShopPage";
import { socialMetadata } from "@/lib/seo";
import { getShopProducts, SHOP_CATEGORIES } from "@/lib/shopify";

export const revalidate = 300;
export const dynamicParams = false;

const VIEWS: Exclude<ShopView, "all">[] = [...SHOP_CATEGORIES.map((c) => c.slug), "sale"];

export function generateStaticParams() {
  return VIEWS.map((category) => ({ category }));
}

// Next 16: params is a Promise.
type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const c = SHOP_CATEGORIES.find((x) => x.slug === category);
  return socialMetadata({
    title: c ? `${c.label} | Shop` : "Sale | Shop",
    description: c?.blurb ?? "FN3P Golf apparel, marked down.",
    path: `/shop/${category}`,
  });
}

export default async function ShopCategoryPage({ params }: Params) {
  const { category } = await params;
  const view = VIEWS.find((v) => v === category);
  if (!view) notFound();
  const products = await getShopProducts();
  return <ShopPage products={products} view={view} />;
}
