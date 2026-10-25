import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/seo";
import type { PostSummary } from "@/lib/providers/types";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/the-turn/${post.slug}`} className="group flex flex-col">
      <div
        className="relative aspect-16/10 overflow-hidden rounded-2xl bg-fn-accent"
        style={{
          backgroundImage: "var(--print-sm)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      {post.publishedAt && (
        <p className="tabular mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-fn-ink-soft">
          {formatDate(post.publishedAt)}
        </p>
      )}
      <h3 className="mt-2 font-display text-xl font-bold leading-tight text-fn-ink group-hover:underline">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fn-ink-soft">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
