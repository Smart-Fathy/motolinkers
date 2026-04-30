import type { Metadata } from "next";
import Label from "@/components/ui/Label";
import VehiclesBrowser from "@/components/vehicles/VehiclesBrowser";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getAllVehicles } from "@/lib/repositories/vehicles";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Fleet — MotoLinkers",
  description:
    "Curated EVs and hybrids from China and the UAE, indexed daily against factory price sheets. Prices in EGP, fully landed.",
};

export default async function VehiclesPage() {
  const [vehicles, hero] = await Promise.all([
    getAllVehicles(),
    getPageHero("vehicles"),
  ]);
  return (
    <main style={{ paddingTop: hero ? 0 : "7rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <div className="wrap">
        <Label>The Fleet · 2026</Label>
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
          A curated <em style={{ color: "var(--volt)", fontStyle: "italic" }}>shelf.</em>
        </h1>
        <VehiclesBrowser vehicles={vehicles} />
      </div>
      <PageSections slug="vehicles" />
    </main>
  );
}
