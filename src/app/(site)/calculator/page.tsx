import type { Metadata } from "next";
import Calculator from "@/components/home/Calculator";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getCalculatorConfig } from "@/lib/repositories/calculator";
import { getPageHero } from "@/lib/repositories/pages";

export const metadata: Metadata = {
  title: "Landed-cost Calculator — MotoLinkers",
  description:
    "Compute the true landed cost of importing an EV or hybrid into Egypt. Customs, freight, insurance, VAT — every line exposed.",
};

export const revalidate = 300;

export default async function CalculatorPage() {
  const [config, hero] = await Promise.all([
    getCalculatorConfig(),
    getPageHero("calculator"),
  ]);
  return (
    <main style={{ paddingTop: hero ? 0 : "5rem" }}>
      {hero && <PageHero hero={hero} />}
      <Calculator config={config} />
      <PageSections slug="calculator" />
    </main>
  );
}
