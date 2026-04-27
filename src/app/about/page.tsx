import type { Metadata } from "next";
import Manifesto from "@/components/home/Manifesto";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";

export const metadata: Metadata = {
  title: "About — MotoLinkers",
  description:
    "Egypt-based automotive supply-chain consultancy. Five years moving EVs and hybrids from China and the UAE to Alexandria.",
};

export default function AboutPage() {
  return (
    <main style={{ paddingTop: "5rem" }}>
      <Manifesto />
      <Stats />
      <Testimonials />
    </main>
  );
}
