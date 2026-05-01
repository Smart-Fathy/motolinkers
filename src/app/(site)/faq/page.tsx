import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ — MotoLinkers",
  description: "Common questions about importing EVs and hybrids into Egypt.",
};

export default async function FAQPage() {
  const hero = await getPageHero("faq");
  return (
    <main style={{ paddingTop: hero ? 0 : "9rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="faq" />
    </main>
  );
}
