"use client";

import { useMemo, useState } from "react";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import VehicleCard from "@/components/ui/VehicleCard";
import { renderInlineHtml } from "@/lib/cms-html";
import type { Vehicle } from "@/data/vehicles";

type Filter = "all" | "cn" | "ae" | "ev" | "hybrid";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cn", label: "🇨🇳 From China" },
  { id: "ae", label: "🇦🇪 From UAE" },
  { id: "ev", label: "⚡ Pure EV" },
  { id: "hybrid", label: "🔋 Hybrid / REEV" },
];

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
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    if (filter === "all") return vehicles;
    if (filter === "cn" || filter === "ae")
      return vehicles.filter((c) => c.origin === filter);
    return vehicles.filter((c) => c.type === filter);
  }, [filter, vehicles]);

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

        <div
          className="fleet__filters"
          role="tablist"
          aria-label="Filter fleet by origin"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`chip${filter === f.id ? " is-active" : ""}`}
              data-filter={f.id}
              role="tab"
              onClick={() => setFilter(f.id)}
            >
              {f.id === "all" ? `${f.label} · ${items.length}` : f.label}
            </button>
          ))}
        </div>

        <div className="fleet__grid" id="fleetGrid">
          {items.map((car) => (
            <VehicleCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
