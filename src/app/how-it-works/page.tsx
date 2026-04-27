import type { Metadata } from "next";
import Process from "@/components/home/Process";
import Routes from "@/components/home/Routes";

export const metadata: Metadata = {
  title: "How it works — MotoLinkers",
  description:
    "From selection to steering wheel — selection, freight, customs, delivery. The four-step process behind every MotoLinkers import.",
};

export default function HowItWorksPage() {
  return (
    <main style={{ paddingTop: "5rem" }}>
      <Process />
      <Routes />
    </main>
  );
}
