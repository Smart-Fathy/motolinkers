import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms of Service — MotoLinkers",
  description: "Terms and conditions for using motolinkers.com.",
};

export default async function TermsPage() {
  const hero = await getPageHero("terms");
  return (
    <main style={{ paddingTop: hero ? 0 : "9rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="terms" />
    </main>
  );
}
