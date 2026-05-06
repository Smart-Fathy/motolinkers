import type { Metadata } from "next";
import HowItWorksSections from "./HowItWorksSections";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How it works — MotoLinkers",
  description:
    "From selection to steering wheel — selection, freight, customs, delivery. The four-step process behind every MotoLinkers import.",
};

export default function HowItWorksPage() {
  return (
    <main>
      <HowItWorksSections />
    </main>
  );
}
