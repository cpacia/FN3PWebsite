import Link from "next/link";

/** Prev/next controls for the post index. Hidden when everything fits on one page. */
export function Pagination({
  page,
  pageCount,
  basePath = "/the-turn",
}: {
  page: number;
  pageCount: number;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);
  const linkClass =
    "rounded-full border-2 border-fn-ink px-5 py-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-fn-ink transition-colors hover:bg-fn-ink hover:text-fn-paper";
  return (
    <nav
      aria-label="Pagination"
      className="mt-14 flex items-center justify-between gap-4 border-t border-fn-line pt-8"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass} rel="prev">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="tabular text-xs uppercase tracking-[0.14em] text-fn-ink-soft">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={linkClass} rel="next">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
