import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";

export default function Manifesto() {
  return (
    <section className="manifesto" id="manifesto">
      <div className="wrap">
        <div className="manifesto__grid">
          <div>
            <Label>Who we are</Label>
            <Reveal as="h2" className="manifesto__title">
              A logistics firm, not a <em>dealership.</em>
            </Reveal>
          </div>
          <div>
            <Reveal className="manifesto__body">
              <p>
                MotoLinkers is an Egypt-based automotive supply-chain
                consultancy with over <strong>five years</strong> of experience
                connecting manufacturers, importers, and logistics partners. We
                specialise in moving vehicles and parts through trusted supplier
                networks, freight solutions, customs expertise, and data-driven
                logistics strategy.
              </p>
              <p>
                We are <strong>not a car trading company</strong>. We are a
                professional logistics partner focused on building efficient,
                transparent, and performance-driven automotive supply chains —
                between the Pearl River Delta, Jebel Ali, and Alexandria.
              </p>
            </Reveal>

            <div className="pillars">
              <Reveal as="article" className="pillar">
                <div className="pillar__num">01 — Truth</div>
                <h3 className="pillar__title">Factory-direct pricing</h3>
                <p className="pillar__text">
                  The FOB number on our page is the number the manufacturer
                  invoices. No hidden margins, no rebranded markups.
                </p>
              </Reveal>
              <Reveal as="article" className="pillar">
                <div className="pillar__num">02 — Proof</div>
                <h3 className="pillar__title">Verified network</h3>
                <p className="pillar__text">
                  Every manufacturer in our pipeline has passed a five-stage
                  quality and documentation audit before we ship a single unit.
                </p>
              </Reveal>
              <Reveal as="article" className="pillar">
                <div className="pillar__num">03 — Path</div>
                <h3 className="pillar__title">End-to-end ownership</h3>
                <p className="pillar__text">
                  ACI, Nafeza, customs, 3PL, last-mile. We move the car from the
                  factory floor to your plate in one unbroken chain.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
