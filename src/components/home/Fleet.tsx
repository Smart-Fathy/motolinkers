import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import VehicleCard from "@/components/ui/VehicleCard";
import { renderInlineHtml } from "@/lib/cms-html";
import type { Vehicle } from "@/data/vehicles";

export interface FleetGridData {
  kicker: string;
  title_html: string;
  subtitle: string;
  // "featured" pulls vehicles flagged is_featured; "all" lists every
  // published vehicle. The vehicles array is still passed in as a
  // prop — Fleet doesn't fetch on its own — so the parent picks the
  // right repository function based on the section's mode.
  mode: "featured" | "all";
}

export const FLEET_DEFAULT_DATA: FleetGridData = {
  kicker: "The Fleet · 2026",
  title_html: "Select from a <em>curated</em> global shelf.",
  subtitle:
    "Every unit below is live inventory — indexed daily against factory price sheets in Guangzhou, Shenzhen, and Dubai. Prices in EGP include our full landed-cost calculation.",
  mode: "featured",
};

export default function Fleet({
  vehicles,
  data = FLEET_DEFAULT_DATA,
}: {
  vehicles: Vehicle[];
  data?: FleetGridData;
}) {
  return (
    <section className="fleet" id="fleet">
      <div className="wrap">
        <div className="fleet__head">
          <div>
            <Label>{data.kicker}</Label>
            <Reveal as="h2" className="fleet__title">
              {renderInlineHtml(data.title_html)}
            </Reveal>
          </div>
          <Reveal as="p" className="fleet__sub">
            {data.subtitle}
          </Reveal>
        </div>

        <div className="fleet__grid" id="fleetGrid">
          {vehicles.map((car) => (
            <VehicleCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
