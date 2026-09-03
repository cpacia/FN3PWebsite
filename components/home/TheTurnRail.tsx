import { PostCard } from "@/components/the-turn/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PrintPanel } from "@/components/ui/PrintPanel";
import type { PostSummary } from "@/lib/providers/types";

/**
 * The Turn — the site's writing, on the home page.
 *
 * Placed between the shop sections and the tour sections on purpose: it's the
 * one module that carries both kinds of content (drop stories and event
 * recaps), so it reads as the bridge rather than as either side's sub-section.
 */
export function TheTurnRail({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  return (
    <PrintPanel tint={0.08} className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Between nines"
          title="The Turn"
          link={{ href: "/the-turn", label: "Read all →" }}
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <div key={p.slug} className="rounded-3xl bg-fn-paper p-5">
              <PostCard post={p} />
            </div>
          ))}
        </div>
      </div>
    </PrintPanel>
  );
}
