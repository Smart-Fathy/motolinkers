import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Label from "@/components/ui/Label";
import { getAllNews, getNewsBySlug } from "@/lib/repositories/news";

export const revalidate = 600;

export async function generateStaticParams() {
  const items = await getAllNews();
  return items.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata(
  props: PageProps<"/news/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: "Article — MotoLinkers" };
  return {
    title: `${article.title} — MotoLinkers`,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

function renderBody(md: string) {
  // Minimal renderer: paragraph splits + bold/italic markdown removed (we keep things simple).
  return md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function NewsArticlePage(
  props: PageProps<"/news/[slug]">,
) {
  const { slug } = await props.params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  return (
    <main style={{ paddingTop: "9rem", paddingBottom: "var(--sp-section)" }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <Label>News</Label>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            lineHeight: 1,
            letterSpacing: "-.035em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            color: "var(--bone)",
            margin: "0 0 1.4rem",
          }}
        >
          {article.title}
        </h1>
        {article.published_at && (
          <p
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: ".74rem",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--stone)",
              margin: "0 0 2.5rem",
            }}
          >
            {new Date(article.published_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {article.cover_image_url && (
          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              backgroundImage: `url('${article.cover_image_url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: "2rem",
            }}
          />
        )}

        <div className="long-prose">
          {(article.body_md ? renderBody(article.body_md) : []).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
