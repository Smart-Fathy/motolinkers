import type { PageHero as PageHeroData } from "@/lib/repositories/pages";

// Server component. Renders a full-bleed hero section with admin-tunable
// height, image opacity, border radius, and a colour overlay sitting on
// top of the image. Children render above the overlay (typically the
// page's <h1> / lede).
export default function PageHero({
  hero,
  children,
}: {
  hero: PageHeroData;
  children?: React.ReactNode;
}) {
  if (!hero.image_url) return null;

  return (
    <section
      className="page-hero"
      style={{
        position: "relative",
        width: "100%",
        height: `${hero.height_vh}dvh`,
        borderRadius: hero.border_radius_px ? `${hero.border_radius_px}px` : 0,
        overflow: "hidden",
        marginBottom: "2.5rem",
        background: "var(--ink)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${encodeURI(hero.image_url)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: hero.opacity,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: hero.overlay_color,
          opacity: hero.overlay_opacity,
        }}
      />
      {hero.alt && (
        <span
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          {hero.alt}
        </span>
      )}
      {children && (
        <div
          className="wrap"
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            paddingBottom: "3rem",
            color: "var(--bone)",
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
