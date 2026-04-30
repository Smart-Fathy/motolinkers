import type { ReactNode } from "react";
import Label from "@/components/ui/Label";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import type { PageHero as PageHeroData, PageSlug } from "@/lib/repositories/pages";

export default function LongPage({
  kicker,
  title,
  children,
  hero,
  slug,
}: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  hero?: PageHeroData | null;
  slug?: PageSlug;
}) {
  return (
    <main style={{ paddingTop: hero ? 0 : "9rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <div className="wrap" style={{ maxWidth: 820 }}>
        <Label>{kicker}</Label>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
            lineHeight: 0.95,
            letterSpacing: "-.035em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            color: "var(--bone)",
            margin: "0 0 2.5rem",
            maxWidth: "20ch",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            color: "var(--bone)",
            opacity: 0.82,
            fontSize: "1.05rem",
            lineHeight: 1.65,
          }}
          className="long-prose"
        >
          {children}
        </div>
      </div>
      {slug && <PageSections slug={slug} />}
    </main>
  );
}
