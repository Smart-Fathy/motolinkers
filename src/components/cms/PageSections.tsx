import { getPageSections, type PageSlug } from "@/lib/repositories/pages";
import SectionRenderer, { type SectionContext } from "./SectionRenderer";

// Server component. Loads all visible sections for `slug` and renders
// them in order. Each renderer owns its own outer markup (most home
// components render their own <section> + .wrap; the inline renderers
// — paragraph, image, page_header, qa, legal_clause — render their
// own .wrap so the page composition stays consistent).
//
// `ctx` carries render-time data that some sections need but which
// isn't stored in the section row itself: the current vehicles list
// (fleet_grid) and the calculator config (calculator_widget). Pages
// that don't render those types can omit ctx.
export default async function PageSections({
  slug,
  ctx,
}: {
  slug: PageSlug;
  ctx?: SectionContext;
}) {
  const sections = await getPageSections(slug);
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} ctx={ctx} />
      ))}
    </>
  );
}
