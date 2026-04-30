import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAGE_REGISTRY } from "./PAGE_REGISTRY";

export const dynamic = "force-dynamic";

export default async function AdminPagesIndex() {
  type HeroRow = {
    page_slug: string;
    image_url: string | null;
    is_enabled: boolean;
    updated_at: string;
  };
  const supabase = await createClient();
  const { data: heroes } = await supabase
    .from("page_heroes")
    .select("page_slug, image_url, is_enabled, updated_at");
  const heroBySlug = new Map<string, HeroRow>(
    ((heroes ?? []) as HeroRow[]).map((h) => [h.page_slug, h]),
  );

  const { data: sections } = await supabase
    .from("page_sections")
    .select("page_slug, id, is_visible");
  const sectionCounts = new Map<string, { total: number; visible: number }>();
  for (const s of sections ?? []) {
    const cur = sectionCounts.get(s.page_slug) ?? { total: 0, visible: 0 };
    cur.total += 1;
    if (s.is_visible) cur.visible += 1;
    sectionCounts.set(s.page_slug, cur);
  }

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">Pages</h1>
          <p className="adm__sub">
            Hero image and content sections per public page. Disabled heroes
            and hidden sections won&rsquo;t render on the public site.
          </p>
        </div>
      </div>

      <table className="adm__table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Path</th>
              <th>Hero</th>
              <th>Sections</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {PAGE_REGISTRY.map((p) => {
              const hero = heroBySlug.get(p.slug);
              const counts = sectionCounts.get(p.slug);
              return (
                <tr key={p.slug}>
                  <td>
                    <strong>{p.label}</strong>
                  </td>
                  <td>
                    <code style={{ fontFamily: "var(--ff-mono)", fontSize: ".82rem" }}>
                      {p.publicPath}
                    </code>
                  </td>
                  <td>
                    {hero?.image_url ? (
                      <span
                        className={`adm__pill adm__pill--${
                          hero.is_enabled ? "on" : "off"
                        }`}
                      >
                        {hero.is_enabled ? "Enabled" : "Set, off"}
                      </span>
                    ) : (
                      <span className="adm__pill adm__pill--off">No image</span>
                    )}
                  </td>
                  <td>
                    {counts ? (
                      <>
                        {counts.visible} visible
                        {counts.total > counts.visible && (
                          <span style={{ color: "var(--stone)" }}>
                            {" "}/ {counts.total} total
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--stone)" }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/admin/pages/${p.slug}/edit`}
                      className="adm__btn adm__btn--ghost"
                    >
                      Hero
                    </Link>
                    <Link
                      href={`/admin/pages/${p.slug}/sections`}
                      className="adm__btn adm__btn--ghost"
                      style={{ marginLeft: ".5rem" }}
                    >
                      Sections
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </>
  );
}
