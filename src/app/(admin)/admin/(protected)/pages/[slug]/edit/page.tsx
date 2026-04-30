import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAGE_REGISTRY, isValidPageSlug } from "../../PAGE_REGISTRY";
import HeroEditorForm from "../../HeroEditorForm";

export const dynamic = "force-dynamic";

export default async function EditPageHero({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("page_heroes")
    .select(
      "page_slug, image_url, alt, height_vh, border_radius_px, opacity, overlay_color, overlay_opacity, is_enabled",
    )
    .eq("page_slug", slug)
    .maybeSingle();

  // The seed migration creates one row per known slug, but we still
  // synthesise a sensible default if the row is missing (e.g. the
  // migration hasn't been applied yet on this environment).
  const hero = data ?? {
    page_slug: slug,
    image_url: null,
    alt: null,
    height_vh: 60,
    border_radius_px: 0,
    opacity: 1,
    overlay_color: "#0a0a0a",
    overlay_opacity: 0.35,
    is_enabled: false,
  };

  const meta = PAGE_REGISTRY.find((p) => p.slug === slug)!;

  return (
    <>
      <div className="adm__page-head">
        <div>
          <p style={{ margin: 0, fontSize: ".82rem" }}>
            <Link href="/admin/pages" style={{ color: "var(--volt)" }}>
              ← All pages
            </Link>
          </p>
          <h1 className="adm__h1">{meta.label} — Hero</h1>
          <p className="adm__sub">
            Image renders above {meta.publicPath}. Disabled heroes are hidden
            on the public page; the row stays so settings persist between
            on/off cycles.
          </p>
        </div>
      </div>
      <HeroEditorForm hero={hero} />
    </>
  );
}
