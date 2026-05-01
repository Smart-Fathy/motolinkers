import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About — MotoLinkers",
  description:
    "Egypt-based automotive supply-chain consultancy. Five years moving EVs and hybrids from China and the UAE to Alexandria.",
};

export default async function AboutPage() {
  const hero = await getPageHero("about");
  return (
    <main style={{ paddingTop: hero ? 0 : "5rem" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="about" />
    </main>
  );
}
