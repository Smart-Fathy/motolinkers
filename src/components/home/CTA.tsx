import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { renderInlineHtml } from "@/lib/cms-html";

export interface CtaButton {
  label: string;
  href: string;
  variant: "primary" | "ghost";
}

export interface CtaBlockData {
  title_html: string;
  body_html: string;
  arabic_accent?: string;
  ctas: CtaButton[];
}

export const CTA_DEFAULT_DATA: CtaBlockData = {
  title_html: "Move your <em>automotive vision</em> forward.",
  body_html:
    "Whether you're a business optimising supply chain or an individual importing your next vehicle — our consultants are on the other side of a short form.",
  arabic_accent: "كل خطوة موثّقة.",
  ctas: [
    { label: "Start your import plan", href: "/contact", variant: "primary" },
    { label: "Run the calculator", href: "/calculator", variant: "ghost" },
  ],
};

export default function CTA({
  data = CTA_DEFAULT_DATA,
}: {
  data?: CtaBlockData;
}) {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta__inner">
          <Reveal as="h2" className="cta__title">
            {renderInlineHtml(data.title_html)}
          </Reveal>
          <Reveal as="p" className="cta__body">
            {renderInlineHtml(data.body_html)}
            {data.arabic_accent ? (
              <>
                {" "}
                <span className="ar">{data.arabic_accent}</span>
              </>
            ) : null}
          </Reveal>
          <div className="cta__ctas">
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
    </section>
  );
}
