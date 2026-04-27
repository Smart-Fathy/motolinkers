import type { Metadata } from "next";
import Calculator from "@/components/home/Calculator";

export const metadata: Metadata = {
  title: "Landed-cost Calculator — MotoLinkers",
  description:
    "Compute the true landed cost of importing an EV or hybrid into Egypt. Customs, freight, insurance, VAT — every line exposed.",
};

export default function CalculatorPage() {
  return (
    <main style={{ paddingTop: "5rem" }}>
      <Calculator />
    </main>
  );
}
