import type { Metadata } from "next";
import Label from "@/components/ui/Label";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — MotoLinkers",
  description:
    "Talk to a MotoLinkers consultant about importing your next EV or hybrid into Egypt.",
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const sp = await props.searchParams;
  const vehicleParam = sp?.vehicle;
  const initialVehicle = Array.isArray(vehicleParam) ? vehicleParam[0] : vehicleParam;

  return (
    <main
      className="calc"
      style={{ paddingTop: "9rem", minHeight: "100vh" }}
    >
      <div className="wrap">
        <div className="calc__head">
          <div>
            <Label>Contact</Label>
            <h1 className="calc__title">
              Talk to a <em>consultant.</em>
            </h1>
          </div>
          <p className="calc__sub">
            Tell us about the vehicle you have in mind and how to reach you.
            We&apos;ll come back with a confidential price breakdown and a
            shipping window.
          </p>
        </div>

        <ContactForm initialVehicle={initialVehicle} />
      </div>
    </main>
  );
}
