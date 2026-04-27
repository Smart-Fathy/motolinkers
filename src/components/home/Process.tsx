import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Selection",
    text: "Choose a verified model, brand, and trim from our daily-indexed global database. We validate VIN, factory batch, and export permit before you commit.",
  },
  {
    n: "02",
    title: "Freight",
    text: "We book roll-on/roll-off or container on the next sailing from Nansha or Jebel Ali. Insurance, consolidation, and shipping-line coordination handled in-house.",
  },
  {
    n: "03",
    title: "Customs",
    text: "ACI, Nafeza, Ministry of Trade, Ministry of Communications, Cargo-X. We file every document, pay every duty, and walk the car through Egyptian clearance.",
  },
  {
    n: "04",
    title: "Delivery",
    text: "From Alexandria port to your address or dealership. Plate registration, cellular pairing, first service — all included.",
  },
];

export default function Process() {
  return (
    <section className="process" id="process">
      <div className="wrap">
        <div className="process__head">
          <Label>How it works</Label>
          <Reveal as="h2" className="process__title">
            From selection to <em>steering wheel.</em>
          </Reveal>
        </div>

        <div className="process__rail" id="processRail">
          <div className="process__line" />
          <div className="process__line-fill" id="processFill" />

          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              as="article"
              className={`step-card${i === 0 ? " is-active" : ""}`}
            >
              <div className="step-card__num">{s.n}</div>
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__text">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
