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
import { getAllVehicles } from "@/lib/repositories/vehicles";

export const revalidate = 300; // 5 min ISR

export default async function Home() {
  const vehicles = await getAllVehicles();

  return (
    <>
      <Hero />
      <Marquee />
      <Manifesto />
      <Fleet vehicles={vehicles} />
      <Calculator />
      <Routes />
      <Process />
      <Testimonials />
      <Stats />
      <CTA />
      <HomeAnimations />
      <SmoothAnchors />
    </>
  );
}
