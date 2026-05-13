import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import { renderInlineHtml } from "@/lib/cms-html";

export interface HeroMeta {
  col1_top: string;
  col1_bot: string;
  col2_top: string;
  col2_bot: string;
}

export interface HeroCta {
  label: string;
  href: string;
  variant: "primary" | "ghost";
}

export interface HeroTickerItem {
  value: string;
  label: string;
  // Optional small superscript appended to the value (e.g. "d" for "28-45 d").
  value_suffix?: string;
}

export interface HeroBlockData {
  meta: HeroMeta;
  /** Optional gold kicker label that sits above the title (e.g. "Egypt's EV import consultancy — 2026"). */
  kicker?: string;
  title_lines: string[]; // each line may contain <em> for accent
  aria_label: string;
  lede_html: string;
  ctas: HeroCta[];
  ticker: HeroTickerItem[];
  scroll_label: string;
}

export const HERO_DEFAULT_DATA: HeroBlockData = {
  meta: {
    col1_top: "Cairo · Alexandria",
    col1_bot: "Est. 2020 · Operator since",
    col2_top: "N 30.0444 · E 31.2357",
    col2_bot: "Sun–Thu 11:00–23:00 · Sat 15:00–23:00 · Fri closed",
  },
  kicker: "Egypt's EV import consultancy — 2026",
  title_lines: ["Transparency", "is the new", "<em>luxury.</em>"],
  aria_label: "Transparency is the new luxury.",
  lede_html:
    "Egypt's quietly radical EV import consultancy. We don't sell cars — we hand you the <em>factory price</em>, the real landed cost, and a verified path from a Chinese or Emirati port to your driveway.",
  ctas: [
    { label: "Explore the fleet", href: "/vehicles", variant: "primary" },
    { label: "Compute your cost", href: "/calculator", variant: "ghost" },
  ],
  ticker: [
    { value: "17%", label: "EV tax rate" },
    { value: "27%", label: "REEV tax rate" },
    { value: "58%", label: "PHEV tax rate" },
    { value: "28–45", value_suffix: "d", label: "Transit window" },
  ],
  scroll_label: "Scroll",
};

export default function Hero({
  data = HERO_DEFAULT_DATA,
}: {
  data?: HeroBlockData;
}) {
  return (
    <header className="hero" id="home">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__mesh" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__ornament" aria-hidden="true" />

      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero__meta">
          <div className="hero__meta-item">
            <strong>
              <span className="dot" />
              {data.meta.col1_top}
            </strong>
            <span>{data.meta.col1_bot}</span>
          </div>
          <div className="hero__meta-item" style={{ textAlign: "right" }}>
            <strong>{data.meta.col2_top}</strong>
            <span>{data.meta.col2_bot}</span>
          </div>
        </div>

        {data.kicker && (
          <div className="hero__kicker">
            <Label>{data.kicker}</Label>
          </div>
        )}

        <h1 className="hero__title" aria-label={data.aria_label}>
          {data.title_lines.map((line, i) => (
            <span key={i} className="line">
              <span>{renderInlineHtml(line)}</span>
            </span>
          ))}
        </h1>

        <div className="hero__foot">
          <p className="hero__lede">{renderInlineHtml(data.lede_html)}</p>
          <div className="hero__ctas">
            {data.ctas.map((c, i) => (
              <Button
                key={`${c.href}-${i}`}
                href={c.href}
                variant={c.variant}
                withArrow={c.variant === "primary" ? "diagonal" : undefined}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <aside className="hero__ticker" aria-hidden="true">
        {data.ticker.map((t, i) => (
          <div key={i}>
            <strong>
              {t.value}
              {t.value_suffix && (
                <>
                  {" "}
                  <small>{t.value_suffix}</small>
                </>
              )}
            </strong>
            <span>{t.label}</span>
          </div>
        ))}
      </aside>

      <div className="hero__scroll">
        <span>{data.scroll_label}</span>
        <span className="hero__scroll-line" />
      </div>
    </header>
  );
}
