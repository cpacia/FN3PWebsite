import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/the-turn/Markdown";
import { getPost } from "@/lib/providers/front9";
import { formatDate, socialMetadata } from "@/lib/seo";

export const revalidate = 300;

// Next 16: params is a Promise.
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return socialMetadata({ title: "The Turn", path: "/the-turn" });
  return socialMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/the-turn/${post.slug}`,
    image: post.imageUrl || undefined,
  });
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
      <Link
        href="/the-turn"
        className="font-display text-xs font-bold uppercase tracking-[0.16em] text-fn-accent-deep underline underline-offset-4 hover:opacity-70"
      >
        ← The Turn
      </Link>

      <header className="mt-6">
        {post.publishedAt && (
          <p className="tabular text-xs font-semibold uppercase tracking-[0.18em] text-fn-ink-soft">
            {formatDate(post.publishedAt)}
          </p>
        )}
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] text-fn-ink sm:text-5xl">
          {post.title}
        </h1>
      </header>

      {post.imageUrl && (
        <div className="relative mt-8 aspect-16/9 overflow-hidden rounded-2xl bg-fn-accent">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* The article body drops into the data register: a plain measured
          reading column, no print behind it. */}
      <div className="mt-10">
        <Markdown content={post.body} />
      </div>
    </article>
  );
}
