import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { renderInlineHtml } from "@/lib/cms-html";

export interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

export interface ProcessData {
  kicker: string;
  title_html: string;
  steps: ProcessStep[];
}

export const PROCESS_DEFAULT_DATA: ProcessData = {
  kicker: "How it works",
  title_html: "From selection to <em>steering wheel.</em>",
  steps: [
    {
      number: "01",
      title: "Selection",
      body: "Choose a verified model, brand, and trim from our daily-indexed global database. We validate VIN, factory batch, and export permit before you commit.",
    },
    {
      number: "02",
      title: "Freight",
      body: "We book roll-on/roll-off or container on the next sailing from Nansha or Jebel Ali. Insurance, consolidation, and shipping-line coordination handled in-house.",
    },
    {
      number: "03",
      title: "Customs",
      body: "ACI, Nafeza, Ministry of Trade, Ministry of Communications, Cargo-X. We file every document, pay every duty, and walk the car through Egyptian clearance.",
    },
    {
      number: "04",
      title: "Delivery",
      body: "From Alexandria port to your address or dealership. Plate registration, cellular pairing, first service — all included.",
    },
  ],
};

export default function Process({
  data = PROCESS_DEFAULT_DATA,
}: {
  data?: ProcessData;
}) {
  return (
    <section className="process" id="process">
      <div className="wrap">
        <div className="process__head">
          <Label>{data.kicker}</Label>
          <Reveal as="h2" className="process__title">
            {renderInlineHtml(data.title_html)}
          </Reveal>
        </div>

        <div className="process__rail" id="processRail">
          <div className="process__line" />
          <div className="process__line-fill" id="processFill" />

          {data.steps.map((s, i) => (
            <Reveal
              key={`${s.number}-${i}`}
              as="article"
              className={`step-card${i === 0 ? " is-active" : ""}`}
            >
              <div className="step-card__num">{s.number}</div>
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__text">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
