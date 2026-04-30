import { getPageSections, type PageSlug } from "@/lib/repositories/pages";
import SectionRenderer from "./SectionRenderer";

// Server component. Loads all visible sections for `slug` and renders
// them in order. Returns null if the page has no sections, so callers
// can drop this in unconditionally without risking an empty wrapper
// element on every page.
export default async function PageSections({ slug }: { slug: PageSlug }) {
  const sections = await getPageSections(slug);
  if (sections.length === 0) return null;

  return (
    <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "3rem" }}>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
