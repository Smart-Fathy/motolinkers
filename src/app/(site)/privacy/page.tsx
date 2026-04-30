import type { Metadata } from "next";
import LongPage from "@/components/ui/LongPage";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy Policy — MotoLinkers",
  description: "How MotoLinkers collects and uses your information.",
};

export default async function PrivacyPage() {
  const hero = await getPageHero("privacy");
  return (
    <LongPage
      kicker="Legal"
      title={
        <>
          Privacy <em>Policy.</em>
        </>
      }
      hero={hero}
      slug="privacy"
    >
      <p>Last updated: April 2026.</p>

      <h2>What we collect</h2>
      <p>
        When you submit a contact form, we collect your name, email or phone
        number, the vehicle you&apos;re interested in, and any message you
        write. We also receive standard server logs (IP, user agent, page
        viewed) on every request.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To contact you about your inquiry.</li>
        <li>To prepare a quote and shipping plan.</li>
        <li>
          To improve the site (aggregated analytics — never tied to your name
          or email).
        </li>
      </ul>

      <h2>Who can see it</h2>
      <p>
        Only MotoLinkers staff and the systems we use to operate the business
        (Supabase for our database, Cloudflare for hosting). We do not sell or
        rent contact information.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Lead data is retained for 24 months after last contact, then deleted.
        Server logs are retained for 30 days.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only essential cookies needed to operate the site (no third-party
        ad cookies). The Respond.io chat widget sets its own cookies if you
        engage with it.
      </p>

      <h2>Your rights</h2>
      <p>
        Email us at <a href="mailto:info@motolinkers.com">info@motolinkers.com</a>{" "}
        to request a copy of your data, correct it, or have it deleted.
      </p>
    </LongPage>
  );
}
