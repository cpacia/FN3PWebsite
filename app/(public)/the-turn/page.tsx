import type { Metadata } from "next";
import { Pagination } from "@/components/the-turn/Pagination";
import { PostCard } from "@/components/the-turn/PostCard";
import { PrintPanel } from "@/components/ui/PrintPanel";
import { StickerBadge } from "@/components/ui/StickerBadge";
import { listPosts } from "@/lib/providers/front9";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 300;

const PER_PAGE = 12;

export const metadata: Metadata = socialMetadata({
  title: "The Turn",
  description:
    "Recaps, drops and the rest of it, from FN3P Golf in Gray, Maine.",
  path: "/the-turn",
});

export default async function TheTurnPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise.
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const { posts, total } = await listPosts({
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PrintPanel className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <StickerBadge tone="ink" className="mb-5">
            Between nines
          </StickerBadge>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-fn-ink sm:text-7xl">
            The Turn
          </h1>
        </div>
      </PrintPanel>

      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        {posts.length === 0 ? (
          <p className="text-fn-ink-soft">
            Nothing posted yet. Check back after the next event.
          </p>
        ) : (
          <>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} />
          </>
        )}
      </div>
    </>
  );
}
