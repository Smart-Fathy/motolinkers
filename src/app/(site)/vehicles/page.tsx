import type { Metadata } from "next";
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
      <PageSections slug="vehicles" />
      <div className="wrap">
        <VehiclesBrowser vehicles={vehicles} />
      </div>
    </main>
  );
}
