import type { Metadata } from "next";
import LongPage from "@/components/ui/LongPage";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms of Service — MotoLinkers",
  description: "Terms and conditions for using motolinkers.com.",
};

export default async function TermsPage() {
  const hero = await getPageHero("terms");
  return (
    <LongPage
      kicker="Legal"
      title={
        <>
          Terms of <em>Service.</em>
        </>
      }
      hero={hero}
      slug="terms"
    >
      <p>Last updated: April 2026.</p>

      <h2>1. About this site</h2>
      <p>
        motolinkers.com is operated by MotoLinkers, an automotive supply-chain
        consultancy registered in Cairo, Egypt. By using the site you agree to
        these terms.
      </p>

      <h2>2. Information accuracy</h2>
      <p>
        Vehicle prices and tax rates shown are estimates based on factory price
        sheets and current Egyptian tariff structures. Final landed cost is
        confirmed in writing before any commitment. Exchange rates fluctuate;
        EGP figures are indicative only.
      </p>

      <h2>3. No vehicle sales on this site</h2>
      <p>
        MotoLinkers is a logistics consultancy, not a dealership. We do not
        sell vehicles directly through this website. All transactions are
        contracted separately, in writing, after a consultation.
      </p>

      <h2>4. Intellectual property</h2>
      <p>
        Site design, copy, and the MotoLinkers brand are the property of
        MotoLinkers. Vehicle imagery and manufacturer marks belong to their
        respective owners.
      </p>

      <h2>5. Liability</h2>
      <p>
        We do not accept liability for decisions made solely on the basis of
        figures shown on this website. Always confirm pricing and timelines
        with a consultant before transferring funds.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:info@motolinkers.com">info@motolinkers.com</a>
      </p>
    </LongPage>
  );
}
