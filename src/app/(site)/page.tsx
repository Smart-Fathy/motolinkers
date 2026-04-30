import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Manifesto from "@/components/home/Manifesto";
import Fleet from "@/components/home/Fleet";
import Calculator from "@/components/home/Calculator";
import Routes from "@/components/home/Routes";
import Process from "@/components/home/Process";
import Testimonials from "@/components/home/Testimonials";
import Stats from "@/components/home/Stats";
import CTA from "@/components/home/CTA";
import HomeAnimations from "@/components/home/HomeAnimations";
import SmoothAnchors from "@/components/layout/SmoothAnchors";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getFeaturedVehicles } from "@/lib/repositories/vehicles";
import { getCalculatorConfig } from "@/lib/repositories/calculator";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300; // 5 min ISR

export default async function Home() {
  const [vehicles, calcConfig, hero] = await Promise.all([
    getFeaturedVehicles(),
    getCalculatorConfig(),
    getPageHero("home"),
  ]);

  return (
    <>
      {hero && <PageHero hero={hero} />}
      <Hero />
      <Marquee />
      <Manifesto />
      <Fleet vehicles={vehicles} />
      <Calculator config={calcConfig} />
      <Routes />
      <Process />
      <Testimonials />
      <Stats />
      <CTA />
      <PageSections slug="home" />
      <HomeAnimations />
      <SmoothAnchors />
    </>
  );
}
