import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy Policy — MotoLinkers",
  description: "How MotoLinkers collects and uses your information.",
};

export default async function PrivacyPage() {
  const hero = await getPageHero("privacy");
  return (
    <main style={{ paddingTop: hero ? 0 : "9rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="privacy" />
    </main>
  );
}
