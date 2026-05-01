import type { PageSection } from "@/lib/repositories/pages";
import type { CalculatorConfig } from "@/components/home/Calculator";
import type { Vehicle } from "@/data/vehicles";

import Hero, { HERO_DEFAULT_DATA, type HeroBlockData } from "@/components/home/Hero";
import Marquee, { MARQUEE_DEFAULT_DATA, type MarqueeData } from "@/components/home/Marquee";
import Manifesto, { MANIFESTO_DEFAULT_DATA, type ManifestoData } from "@/components/home/Manifesto";
import Fleet, { FLEET_DEFAULT_DATA, type FleetGridData } from "@/components/home/Fleet";
import Calculator, { CALCULATOR_WIDGET_DEFAULT_HEADER, type CalculatorWidgetHeader } from "@/components/home/Calculator";
import Routes, { ROUTES_DEFAULT_DATA, type RoutesData } from "@/components/home/Routes";
import Process, { PROCESS_DEFAULT_DATA, type ProcessData } from "@/components/home/Process";
import Testimonials, { TESTIMONIALS_DEFAULT_DATA, type TestimonialsData } from "@/components/home/Testimonials";
import Stats, { STATS_DEFAULT_DATA, type StatsData } from "@/components/home/Stats";
import CTA, { CTA_DEFAULT_DATA, type CtaBlockData } from "@/components/home/CTA";

import Label from "@/components/ui/Label";
import { renderInlineHtml } from "@/lib/cms-html";

// Optional render-time context. PageSections threads this in for
// renderers that need data the section row alone doesn't carry —
// today: the vehicles list (fleet_grid) and calculator config
// (calculator_widget). Other renderers ignore it.
export interface SectionContext {
  vehicles?: Vehicle[];
  vehiclesFeatured?: Vehicle[];
  calcConfig?: CalculatorConfig;
}

// `section.data` shape varies by `section.type`. Each renderer narrows
// inside, with a default fallback so a malformed jsonb row can't crash
// the page.

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

// ─── existing simple renderers ───────────────────────────────────────

function SectionParagraph({ data }: { data: ParagraphData }) {
  const text = asString(data.text).trim();
  if (!text) return null;
  const align = data.align === "center" ? "center" : "left";
  return (
    <div className="wrap" style={{ marginBlock: "1.5rem" }}>
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
    <div className="wrap" style={{ marginBlock: "1.5rem" }}>
      <figure style={{ margin: "0 auto", width: `${widthPct}%`, textAlign: "center" }}>
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
    </div>
  );
}

// ─── new typed renderers ─────────────────────────────────────────────

function SectionPageHeader({ data }: { data: unknown }) {
  const d = (data ?? {}) as { kicker?: unknown; title_html?: unknown };
  const kicker = asString(d.kicker);
  const titleHtml = asString(d.title_html);
  if (!kicker && !titleHtml) return null;
  return (
    <div className="wrap">
      {kicker && <Label>{kicker}</Label>}
      {titleHtml && (
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
            lineHeight: 0.95,
            letterSpacing: "-.035em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            color: "var(--bone)",
            margin: "0 0 2.5rem",
            maxWidth: "20ch",
          }}
        >
          {renderInlineHtml(titleHtml)}
        </h1>
      )}
    </div>
  );
}

function SectionQa({ data }: { data: unknown }) {
  const d = (data ?? {}) as { question?: unknown; answer_html?: unknown };
  const question = asString(d.question).trim();
  const answer = asString(d.answer_html).trim();
  if (!question && !answer) return null;
  return (
    <div
      className="wrap long-prose"
      style={{ maxWidth: 820, color: "var(--bone)", opacity: 0.82 }}
    >
      {question && <h2>{question}</h2>}
      {answer && <p>{renderInlineHtml(answer)}</p>}
    </div>
  );
}

function SectionLegalClause({ data }: { data: unknown }) {
  const d = (data ?? {}) as {
    heading?: unknown;
    body_html?: unknown;
    list_items?: unknown;
  };
  const heading = asString(d.heading).trim();
  const body = asString(d.body_html).trim();
  const items = Array.isArray(d.list_items)
    ? d.list_items.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  if (!heading && !body && items.length === 0) return null;
  return (
    <div
      className="wrap long-prose"
      style={{ maxWidth: 820, color: "var(--bone)", opacity: 0.82 }}
    >
      {heading && <h2>{heading}</h2>}
      {body && <p>{renderInlineHtml(body)}</p>}
      {items.length > 0 && (
        <ul>
          {items.map((it, i) => (
            <li key={i}>{renderInlineHtml(it)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── dispatch ───────────────────────────────────────────────────────

export default function SectionRenderer({
  section,
  ctx,
}: {
  section: PageSection;
  ctx?: SectionContext;
}) {
  switch (section.type) {
    case "paragraph":
      return <SectionParagraph data={(section.data ?? {}) as ParagraphData} />;
    case "image":
      return <SectionImage data={(section.data ?? {}) as ImageData} />;

    case "page_header":
      return <SectionPageHeader data={section.data} />;
    case "qa":
      return <SectionQa data={section.data} />;
    case "legal_clause":
      return <SectionLegalClause data={section.data} />;

    case "hero_block":
      return <Hero data={(section.data as HeroBlockData) ?? HERO_DEFAULT_DATA} />;
    case "marquee":
      return <Marquee data={(section.data as MarqueeData) ?? MARQUEE_DEFAULT_DATA} />;
    case "manifesto":
      return <Manifesto data={(section.data as ManifestoData) ?? MANIFESTO_DEFAULT_DATA} />;
    case "fleet_grid": {
      const data = (section.data as FleetGridData) ?? FLEET_DEFAULT_DATA;
      const vehicles =
        data.mode === "all" ? ctx?.vehicles ?? [] : ctx?.vehiclesFeatured ?? [];
      return <Fleet vehicles={vehicles} data={data} />;
    }
    case "calculator_widget": {
      const header =
        (section.data as CalculatorWidgetHeader) ?? CALCULATOR_WIDGET_DEFAULT_HEADER;
      if (!ctx?.calcConfig) return null;
      return <Calculator config={ctx.calcConfig} header={header} />;
    }
    case "routes":
      return <Routes data={(section.data as RoutesData) ?? ROUTES_DEFAULT_DATA} />;
    case "process":
      return <Process data={(section.data as ProcessData) ?? PROCESS_DEFAULT_DATA} />;
    case "testimonials":
      return (
        <Testimonials
          data={(section.data as TestimonialsData) ?? TESTIMONIALS_DEFAULT_DATA}
        />
      );
    case "stats_grid":
      return <Stats data={(section.data as StatsData) ?? STATS_DEFAULT_DATA} />;
    case "cta_block":
      return <CTA data={(section.data as CtaBlockData) ?? CTA_DEFAULT_DATA} />;

    // Reserved placeholder types that don't have renderers yet.
    default:
      return null;
  }
}
