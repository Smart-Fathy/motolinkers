import type { Metadata } from "next";
import LongPage from "@/components/ui/LongPage";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ — MotoLinkers",
  description: "Common questions about importing EVs and hybrids into Egypt.",
};

export default async function FAQPage() {
  const hero = await getPageHero("faq");
  return (
    <LongPage
      kicker="Frequently Asked"
      title={
        <>
          The questions, <em>answered.</em>
        </>
      }
      hero={hero}
      slug="faq"
    >
      <h2>How long does an import take?</h2>
      <p>
        From China: roughly <strong>45 days</strong> port-to-port (Nansha →
        Alexandria), plus 5–10 days for customs and registration. From the UAE:
        about <strong>28 days</strong> (Jebel Ali → Alexandria), plus the same
        clearance window.
      </p>

      <h2>What taxes apply?</h2>
      <p>
        Egyptian customs duty depends on drivetrain: <strong>17%</strong> for
        pure EVs, <strong>27%</strong> for range-extended EVs, and{" "}
        <strong>58%</strong> for plug-in hybrids. <strong>14% VAT</strong>{" "}
        applies on top of CIF + duty for all categories.
      </p>

      <h2>Do I pay you in EGP or USD?</h2>
      <p>
        Both are supported. Bank-to-bank transfers in EGP are typically 1.5%
        cheaper on the FX spread; direct USD wires are about 3% but settle
        within 24 hours.
      </p>

      <h2>What&apos;s included in the MotoLinkers fee?</h2>
      <p>
        Our 4% consulting fee covers: model verification, supplier audit, freight
        coordination, insurance, ACI/Nafeza filing, customs clearance, last-mile
        delivery, plate registration, and first-service handover.
      </p>

      <h2>Can I see the car before paying?</h2>
      <p>
        Yes. We arrange video walkthroughs of pre-shipment inspections, and for
        UAE units, in-person visits to Jebel Ali on request.
      </p>

      <h2>What happens if customs clearance fails?</h2>
      <p>
        We retain a 1% risk reserve against documentation issues. In the rare
        case of a clearance failure caused by us, we cover the remediation in
        full.
      </p>
    </LongPage>
  );
}
