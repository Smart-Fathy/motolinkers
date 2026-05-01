import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { renderInlineHtml } from "@/lib/cms-html";

export interface ManifestoPillar {
  number: string;
  title: string;
  body: string;
}

export interface ManifestoData {
  kicker: string;
  title_html: string;
  body_paragraphs_html: string[];
  pillars: ManifestoPillar[];
}

export const MANIFESTO_DEFAULT_DATA: ManifestoData = {
  kicker: "Who we are",
  title_html: "A logistics firm, not a <em>dealership.</em>",
  body_paragraphs_html: [
    "MotoLinkers is an Egypt-based automotive supply-chain consultancy with over <strong>five years</strong> of experience connecting manufacturers, importers, and logistics partners. We specialise in moving vehicles and parts through trusted supplier networks, freight solutions, customs expertise, and data-driven logistics strategy.",
    "We are <strong>not a car trading company</strong>. We are a professional logistics partner focused on building efficient, transparent, and performance-driven automotive supply chains — between the Pearl River Delta, Jebel Ali, and Alexandria.",
  ],
  pillars: [
    {
      number: "01 — Truth",
      title: "Factory-direct pricing",
      body: "The FOB number on our page is the number the manufacturer invoices. No hidden margins, no rebranded markups.",
    },
    {
      number: "02 — Proof",
      title: "Verified network",
      body: "Every manufacturer in our pipeline has passed a five-stage quality and documentation audit before we ship a single unit.",
    },
    {
      number: "03 — Path",
      title: "End-to-end ownership",
      body: "ACI, Nafeza, customs, 3PL, last-mile. We move the car from the factory floor to your plate in one unbroken chain.",
    },
  ],
};

export default function Manifesto({
  data = MANIFESTO_DEFAULT_DATA,
}: {
  data?: ManifestoData;
}) {
  return (
    <section className="manifesto" id="manifesto">
      <div className="wrap">
        <div className="manifesto__grid">
          <div>
            <Label>{data.kicker}</Label>
            <Reveal as="h2" className="manifesto__title">
              {renderInlineHtml(data.title_html)}
            </Reveal>
          </div>
          <div>
            <Reveal className="manifesto__body">
              {data.body_paragraphs_html.map((p, i) => (
                <p key={i}>{renderInlineHtml(p)}</p>
              ))}
            </Reveal>

            <div className="pillars">
              {data.pillars.map((p, i) => (
                <Reveal key={i} as="article" className="pillar">
                  <div className="pillar__num">{p.number}</div>
                  <h3 className="pillar__title">{p.title}</h3>
                  <p className="pillar__text">{p.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
