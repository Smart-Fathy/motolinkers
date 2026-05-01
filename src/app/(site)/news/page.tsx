import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import PageSections from "@/components/cms/PageSections";
import { getAllNews } from "@/lib/repositories/news";
import { getPageHero } from "@/lib/repositories/pages";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "News & Insights — MotoLinkers",
  description:
    "Updates from the EV import market — tariff changes, new manufacturers, shipping news.",
};

function formatDate(iso: string | null) {
  if (typeof iso !== "string" || !iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NewsPage() {
  const [items, hero] = await Promise.all([getAllNews(), getPageHero("news")]);

  return (
    <main style={{ paddingTop: hero ? 0 : "9rem", paddingBottom: "var(--sp-section)" }}>
      {hero && <PageHero hero={hero} />}
      <PageSections slug="news" />
      <div className="wrap">
        {items.length === 0 ? (
          <p style={{ color: "var(--stone)", fontSize: "1rem" }}>
            No articles yet — check back soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {items.map((n) => (
              <Link
                key={n.slug}
                href={`/news/${n.slug}`}
                className="pillar"
                data-hover
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: ".7rem",
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    color: "var(--volt)",
                    marginBottom: "1.2rem",
                  }}
                >
                  {formatDate(n.published_at)}
                </div>
                <h2
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontWeight: 400,
                    fontSize: "1.4rem",
                    color: "var(--bone)",
                    margin: "0 0 .6rem",
                    fontVariationSettings: '"opsz" 32, "SOFT" 50',
                  }}
                >
                  {n.title}
                </h2>
                {n.excerpt && (
                  <p
                    style={{
                      fontSize: ".95rem",
                      color: "var(--stone)",
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {n.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
