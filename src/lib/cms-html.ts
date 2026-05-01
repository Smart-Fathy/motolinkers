import type { ReactNode } from "react";
import { Fragment, createElement } from "react";

// Tiny inline-HTML renderer for the CMS allowlist. We only support
// <em>, <strong>, and <a href>; everything else is rendered as text.
// Implementation: split on a single regex, map each chunk to either a
// React element or a string. No external sanitiser dep — the pattern
// drives the allowlist directly.
//
// Server-side input gets the same allowlist applied at write time in
// the admin actions, but we re-validate at render to keep the surface
// small even if a row was inserted directly via SQL.

type Chunk =
  | { kind: "text"; value: string }
  | { kind: "em" | "strong"; children: Chunk[] }
  | { kind: "a"; href: string; children: Chunk[] };

const TAG_RE = /<(em|strong|\/em|\/strong|a\s+href="([^"]*)"|\/a)>/i;

export function renderInlineHtml(input: string): ReactNode {
  if (!input) return null;
  return renderChunks(parseInline(input));
}

function parseInline(input: string): Chunk[] {
  // Recursive-descent style parser: walks the input left-to-right,
  // building a tree. <em> and <strong> can nest; <a> nests but does
  // not nest inside another <a>.
  const tokens = tokenise(input);
  const root: Chunk[] = [];
  const stack: Chunk[][] = [root];
  const openTags: ("em" | "strong" | "a")[] = [];

  for (const tok of tokens) {
    const top = stack[stack.length - 1];
    if (tok.kind === "text") {
      top.push({ kind: "text", value: tok.value });
      continue;
    }
    if (tok.kind === "open") {
      const node: Chunk =
        tok.tag === "a"
          ? { kind: "a", href: tok.href ?? "", children: [] }
          : { kind: tok.tag, children: [] };
      top.push(node);
      stack.push(node.children);
      openTags.push(tok.tag);
      continue;
    }
    // close
    const idx = openTags.lastIndexOf(tok.tag);
    if (idx === -1) continue; // stray close tag — ignore
    // Pop everything down to the matching open. Anything in between
    // becomes implicit text via auto-closure.
    while (openTags.length > idx) {
      openTags.pop();
      stack.pop();
    }
  }
  return root;
}

type Token =
  | { kind: "text"; value: string }
  | { kind: "open"; tag: "em" | "strong" | "a"; href?: string }
  | { kind: "close"; tag: "em" | "strong" | "a" };

function tokenise(input: string): Token[] {
  const out: Token[] = [];
  let cursor = 0;
  while (cursor < input.length) {
    const remaining = input.slice(cursor);
    const m = remaining.match(TAG_RE);
    if (!m || m.index === undefined) {
      out.push({ kind: "text", value: remaining });
      break;
    }
    if (m.index > 0) {
      out.push({ kind: "text", value: remaining.slice(0, m.index) });
    }
    const raw = m[0].slice(1, -1).trim().toLowerCase();
    if (raw === "em" || raw === "strong") out.push({ kind: "open", tag: raw });
    else if (raw === "/em") out.push({ kind: "close", tag: "em" });
    else if (raw === "/strong") out.push({ kind: "close", tag: "strong" });
    else if (raw === "/a") out.push({ kind: "close", tag: "a" });
    else if (raw.startsWith("a ")) {
      const hrefMatch = m[0].match(/href="([^"]*)"/i);
      out.push({
        kind: "open",
        tag: "a",
        href: safeHref(hrefMatch ? hrefMatch[1] : ""),
      });
    }
    cursor += m.index + m[0].length;
  }
  return out;
}

// Allow http(s):, mailto:, tel:, and same-origin paths only. Everything
// else (javascript:, data:, etc.) is dropped.
function safeHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "";
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }
  return "";
}

function renderChunks(chunks: Chunk[]): ReactNode {
  return createElement(
    Fragment,
    null,
    ...chunks.map((c, i) => renderChunk(c, i)),
  );
}

function renderChunk(chunk: Chunk, key: number): ReactNode {
  if (chunk.kind === "text") return chunk.value;
  if (chunk.kind === "a") {
    if (!chunk.href) return renderChunks(chunk.children);
    const isExternal = /^https?:\/\//i.test(chunk.href);
    return createElement(
      "a",
      {
        key,
        href: chunk.href,
        rel: isExternal ? "noopener noreferrer" : undefined,
        target: isExternal ? "_blank" : undefined,
      },
      ...chunk.children.map((c, i) => renderChunk(c, i)),
    );
  }
  return createElement(
    chunk.kind,
    { key },
    ...chunk.children.map((c, i) => renderChunk(c, i)),
  );
}

// Server-side sanitiser: strips disallowed tags from a string before
// inserting into the DB. Allowed: <em>, <strong>, <a href="…">. All
// other tags are removed; their text content is preserved.
export function sanitiseInlineHtml(input: string): string {
  // Drop entire <script>/<style> blocks first (text + tags).
  let s = input.replace(/<\/?(script|style)\b[^>]*>/gi, "");
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  // Strip event-handler attributes pre-emptively.
  s = s.replace(/\son\w+="[^"]*"/gi, "");
  s = s.replace(/\son\w+='[^']*'/gi, "");
  // Walk every tag; keep allowed ones, drop the rest.
  return s.replace(/<\/?[a-z][a-z0-9]*(\s[^>]*)?>/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === "<em>" || lower === "</em>") return lower;
    if (lower === "<strong>" || lower === "</strong>") return lower;
    if (lower === "</a>") return "</a>";
    if (lower.startsWith("<a ")) {
      const hrefMatch = match.match(/href="([^"]*)"/i);
      const safe = hrefMatch ? safeHref(hrefMatch[1]) : "";
      return safe ? `<a href="${safe}">` : "";
    }
    return "";
  });
}
