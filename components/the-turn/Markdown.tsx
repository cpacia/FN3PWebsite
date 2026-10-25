import type { ReactNode } from "react";

/**
 * A small, dependency-free markdown renderer for Front9 post bodies.
 *
 * Posts use a limited subset — paragraphs, **bold**, *italic*, `-`/`*` bullets,
 * GFM tables, `![alt](url)` images, `[text](url)` links and `#` headings — so we
 * parse that subset into React elements rather than pulling in a markdown
 * library or reaching for dangerouslySetInnerHTML. Anything unrecognised falls
 * through as plain text, so unusual input degrades instead of breaking.
 */
export function Markdown({ content }: { content: string }) {
  const blocks = (content ?? "").replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className="space-y-5 text-base leading-relaxed text-fn-ink-soft">
      {blocks.map((block, i) => renderBlock(block, i)).filter(Boolean)}
    </div>
  );
}

/** A line that is nothing but an image, e.g. `![alt](https://…/pic.png)`. */
const IMAGE_ONLY = /^!\[([^\]]*)\]\(\s*([^)\s]+)\s*\)$/;

/**
 * Only http(s), protocol-relative and site-relative URLs render, so a
 * `javascript:` href in post content can never become a live link.
 */
function safeUrl(url: string): string | null {
  const u = (url ?? "").trim();
  return /^(https?:\/\/|\/\/|\/|#)/i.test(u) ? u : null;
}

/*
 * Post bodies are authored in Front9 and carry images of unknown intrinsic size
 * from an origin we don't control the paths of, so next/image (which needs
 * dimensions or a sized parent) is the wrong tool here — a plain lazy <img> is.
 */
/* eslint-disable @next/next/no-img-element */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re =
    /!\[([^\]]*)\]\(\s*([^)\s]+)\s*\)|\[([^\]]+)\]\(\s*([^)\s]+)\s*\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) {
      const src = safeUrl(m[2]);
      if (src) {
        nodes.push(
          <img
            key={`${keyPrefix}-img${i}`}
            src={src}
            alt={m[1]}
            loading="lazy"
            className="inline-block max-w-full rounded-lg"
          />,
        );
      }
    } else if (m[4] != null) {
      const href = safeUrl(m[4]);
      nodes.push(
        href ? (
          <a
            key={`${keyPrefix}-a${i}`}
            href={href}
            className="font-semibold text-fn-accent-deep underline underline-offset-2 hover:opacity-70"
            {...(href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {m[3]}
          </a>
        ) : (
          m[3]
        ),
      );
    } else if (m[5] != null) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-fn-ink">
          {m[5]}
        </strong>,
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i${i}`}>{m[6]}</em>);
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** True for a GFM table separator row like `|---|:--:|`. */
function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(line);
}

/** Split a table row into trimmed cells, dropping the leading/trailing pipe. */
function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function renderBlock(block: string, key: number): ReactNode {
  const lines = block.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return null;

  const heading = lines[0].match(/^(#{1,6})\s+(.*)$/);
  if (lines.length === 1 && heading) {
    const Tag = (heading[1].length <= 2 ? "h2" : "h3") as "h2" | "h3";
    return (
      <Tag
        key={key}
        className="font-display text-2xl font-extrabold uppercase tracking-tight text-fn-ink"
      >
        {renderInline(heading[2], `h${key}`)}
      </Tag>
    );
  }

  if (lines.every((l) => IMAGE_ONLY.test(l.trim()))) {
    return (
      <div key={key} className="space-y-5">
        {lines.map((l, li) => {
          const m = l.trim().match(IMAGE_ONLY);
          const src = m ? safeUrl(m[2]) : null;
          if (!m || !src) return null;
          return (
            <img key={li} src={src} alt={m[1]} loading="lazy" className="w-full rounded-2xl" />
          );
        })}
      </div>
    );
  }

  if (lines.length >= 2 && lines[0].includes("|") && isTableSeparator(lines[1])) {
    const headers = tableCells(lines[0]);
    const rows = lines.slice(2).map(tableCells);
    return (
      // Wide tables scroll inside their own box; the article never scrolls sideways.
      <div key={key} className="overflow-x-auto">
        <table className="tabular w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, c) => (
                <th
                  key={c}
                  className="border-b-2 border-fn-ink px-3 py-2 text-left font-display text-xs font-bold uppercase tracking-[0.12em] text-fn-ink"
                >
                  {renderInline(h, `th${key}-${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, c) => (
                  <td key={c} className="border-b border-fn-line px-3 py-2">
                    {renderInline(cell, `td${key}-${r}-${c}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
    return (
      <ul key={key} className="list-disc space-y-1.5 pl-6">
        {lines.map((l, li) => (
          <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ""), `li${key}-${li}`)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key}>
      {lines.map((l, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {renderInline(l, `p${key}-${li}`)}
        </span>
      ))}
    </p>
  );
}
