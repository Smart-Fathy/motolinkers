import HomeAnimations from "@/components/home/HomeAnimations";
import SmoothAnchors from "@/components/layout/SmoothAnchors";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import {
  getAllVehicles,
  getFeaturedVehicles,
} from "@/lib/repositories/vehicles";
import { getCalculatorConfig } from "@/lib/repositories/calculator";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300; // 5 min ISR

export default async function Home() {
  const [vehicles, vehiclesFeatured, calcConfig, hero] = await Promise.all([
    getAllVehicles(),
    getFeaturedVehicles(),
    getCalculatorConfig(),
    getPageHero("home"),
  ]);

  return (
    <>
      {hero && <PageHero hero={hero} />}
      <PageSections
        slug="home"
        ctx={{ vehicles, vehiclesFeatured, calcConfig }}
      />
      <HomeAnimations />
      <SmoothAnchors />
    </>
  );
}
