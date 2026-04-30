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
  try {
    const { slug } = await props.params;
    const article = await getNewsBySlug(slug);
    if (!article) return { title: "Article — MotoLinkers" };
    const cover = isHttpUrl(article.cover_image_url) ? article.cover_image_url! : undefined;
    return {
      title: `${article.title} — MotoLinkers`,
      description: article.excerpt ?? undefined,
      openGraph: {
        title: article.title,
        description: article.excerpt ?? undefined,
        images: cover ? [cover] : undefined,
      },
    };
  } catch (e) {
    console.error("[news] generateMetadata threw:", e);
    return { title: "Article — MotoLinkers" };
  }
}

function isHttpUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value.trim());
}

// Format a published_at timestamp without ever throwing — bad/missing
// values fall back to "" so a single malformed row can't bring the page
// down with "Invalid time value".
function safeFormatDate(iso: string | null | undefined): string {
  if (typeof iso !== "string" || !iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderBody(md: unknown): string[] {
  // Minimal renderer: split on blank lines into paragraphs. Coerce
  // defensively — Supabase columns are typed as `string | null`, but
  // JSON columns or admin imports occasionally surface other shapes.
  const text = typeof md === "string" ? md : "";
  if (!text) return [];
  return text
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
        {safeFormatDate(article.published_at) && (
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
            {safeFormatDate(article.published_at)}
          </p>
        )}

        {isHttpUrl(article.cover_image_url) && (
          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              backgroundImage: `url("${encodeURI(article.cover_image_url!)}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: "2rem",
            }}
          />
        )}

        <div className="long-prose">
          {renderBody(article.body_md).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
