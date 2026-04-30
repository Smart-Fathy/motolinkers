import type { PageSection } from "@/lib/repositories/pages";

// `data` is a free-shape jsonb column; each renderer narrows to its
// own per-type schema and falls back to a no-op if the data is missing
// or malformed. Render-time guards are deliberately strict — a single
// bad section row should never crash the rest of the page.

type ParagraphData = { text?: unknown; align?: unknown };
type ImageData = {
  url?: unknown;
  alt?: unknown;
  width_pct?: unknown;
  border_radius_px?: unknown;
  opacity?: unknown;
  caption?: unknown;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function SectionParagraph({ data }: { data: ParagraphData }) {
  const text = asString(data.text).trim();
  if (!text) return null;
  const align = data.align === "center" ? "center" : "left";
  return (
    <div className="cms-section cms-section--paragraph">
      {text.split(/\n\s*\n/).map((p, i) => (
        <p
          key={i}
          style={{
            textAlign: align,
            margin: i === 0 ? "0 0 1.1rem" : "1.1rem 0",
            color: "var(--bone)",
            fontSize: "1.02rem",
            lineHeight: 1.65,
          }}
        >
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

function SectionImage({ data }: { data: ImageData }) {
  const url = asString(data.url).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  const alt = asString(data.alt);
  const widthPct = Math.min(100, Math.max(20, asNumber(data.width_pct, 100)));
  const radius = Math.min(64, Math.max(0, asNumber(data.border_radius_px, 12)));
  const opacity = Math.min(1, Math.max(0.1, asNumber(data.opacity, 1)));
  const caption = asString(data.caption).trim();

  return (
    <figure
      className="cms-section cms-section--image"
      style={{ margin: "0 auto", width: `${widthPct}%`, textAlign: "center" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: `${radius}px`,
          opacity,
        }}
      />
      {caption && (
        <figcaption
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: ".78rem",
            letterSpacing: ".08em",
            color: "var(--stone)",
            marginTop: ".7rem",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function SectionRenderer({ section }: { section: PageSection }) {
  // `section.data` shape varies by `section.type`. The cast at each
  // dispatch is widened to the renderer's expected fields; strict
  // narrowing happens inside the renderer.
  switch (section.type) {
    case "paragraph":
      return <SectionParagraph data={(section.data ?? {}) as ParagraphData} />;
    case "image":
      return <SectionImage data={(section.data ?? {}) as ImageData} />;
    // Other types (heading, rich_text, gallery, list, cta, spacer,
    // divider, embed) come in a follow-up PR. Until then they're
    // stored in the DB but render as nothing on the public page.
    default:
      return null;
  }
}
