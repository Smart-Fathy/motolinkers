import type { Metadata } from "next";
import Calculator from "@/components/home/Calculator";
import { getCalculatorConfig } from "@/lib/repositories/calculator";

export const metadata: Metadata = {
  title: "Landed-cost Calculator — MotoLinkers",
  description:
    "Compute the true landed cost of importing an EV or hybrid into Egypt. Customs, freight, insurance, VAT — every line exposed.",
};

export const revalidate = 300;

export default async function CalculatorPage() {
  const config = await getCalculatorConfig();
  return (
    <main style={{ paddingTop: "5rem" }}>
      <Calculator config={config} />
    </main>
  );
}
