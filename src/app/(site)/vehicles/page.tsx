import type { Metadata } from "next";
import Fleet from "@/components/home/Fleet";
import { getAllVehicles } from "@/lib/repositories/vehicles";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Fleet — MotoLinkers",
  description:
    "Curated EVs and hybrids from China and the UAE, indexed daily against factory price sheets. Prices in EGP, fully landed.",
};

export default async function VehiclesPage() {
  const vehicles = await getAllVehicles();
  return (
    <main style={{ paddingTop: "5rem" }}>
      <Fleet vehicles={vehicles} />
    </main>
  );
}
