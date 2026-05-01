import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How it works — MotoLinkers",
  description:
    "From selection to steering wheel — selection, freight, customs, delivery. The four-step process behind every MotoLinkers import.",
};

export default async function HowItWorksPage() {
  const hero = await getPageHero("how-it-works");
  return (
    <main style={{ paddingTop: hero ? 0 : "5rem" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="how-it-works" />
    </main>
  );
}
