import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAGE_REGISTRY, isValidPageSlug } from "../../PAGE_REGISTRY";
import SectionsEditor from "../../SectionsEditor";

export const dynamic = "force-dynamic";

export default async function SectionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  if (!isValidPageSlug(rawSlug)) notFound();
  // After the guard, rawSlug is narrowed to PageSlug. The cast is
  // belt-and-braces — some toolchains drop the narrowing across the
  // `notFound()` call because Next.js's typing of `notFound` as `never`
  // depends on @types being installed.
  const slug = rawSlug as import("@/lib/repositories/pages").PageSlug;

  const supabase = await createClient();
  const { data } = await supabase
    .from("page_sections")
    .select("id, page_slug, position, type, data, is_visible")
    .eq("page_slug", slug)
    .order("position", { ascending: true });

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
          <h1 className="adm__h1">{meta.label} — Sections</h1>
          <p className="adm__sub">
            Sections render below the page&rsquo;s built-in content. Hidden
            sections stay in the database but won&rsquo;t appear on the public
            page.
          </p>
        </div>
      </div>
      <SectionsEditor slug={slug} sections={data ?? []} />
    </>
  );
}
