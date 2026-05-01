import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getPageHero } from "@/lib/repositories/pages";

export const metadata: Metadata = {
  title: "Contact — MotoLinkers",
  description:
    "Talk to a MotoLinkers consultant about importing your next EV or hybrid into Egypt.",
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const sp = await props.searchParams;
  const vehicleParam = sp?.vehicle;
  const initialVehicle = Array.isArray(vehicleParam) ? vehicleParam[0] : vehicleParam;
  const hero = await getPageHero("contact");

  return (
    <main
      className="calc"
      style={{ paddingTop: hero ? 0 : "9rem", minHeight: "100vh" }}
    >
      {hero && <PageHero hero={hero} />}
      <PageSections slug="contact" />
      <div className="wrap">
        <ContactForm initialVehicle={initialVehicle} />
      </div>
    </main>
  );
}
