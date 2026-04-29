import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import { getVehicleBySlug, getAllVehicles } from "@/lib/repositories/vehicles";

export const revalidate = 300;

export async function generateStaticParams() {
  const all = await getAllVehicles();
  return all.map((v) => ({ slug: v.id }));
}

export async function generateMetadata(
  props: PageProps<"/vehicles/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const car = await getVehicleBySlug(slug);
  if (!car) return { title: "Vehicle — MotoLinkers" };
  return {
    title: `${car.name} — MotoLinkers`,
    description: `${car.name}. ${car.drive}. From ${car.origin === "cn" ? "China" : "UAE"}. Landed cost in EGP.`,
    openGraph: {
      title: car.name,
      description: `${car.drive} · ${car.year} · ${car.trans}`,
      images: car.img ? [car.img] : undefined,
    },
  };
}

export default async function VehiclePage(props: PageProps<"/vehicles/[slug]">) {
  const { slug } = await props.params;
  const car = await getVehicleBySlug(slug);
  if (!car) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: car.name,
    image: car.img,
    brand: { "@type": "Brand", name: "MotoLinkers" },
    category: car.type === "ev" ? "Electric Vehicle" : "Hybrid Vehicle",
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "MotoLinkers" },
    },
  };

  return (
    <main style={{ paddingTop: "7rem", paddingBottom: "var(--sp-section)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <Label>
          {car.origin === "cn" ? "From China" : "From UAE"} · {car.year}
        </Label>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
            lineHeight: 0.95,
            letterSpacing: "-.035em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            color: "var(--bone)",
            margin: "0 0 2.5rem",
            maxWidth: "20ch",
          }}
        >
          {car.name}
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "2.5rem",
            alignItems: "start",
          }}
          className="vehicle-detail__grid"
        >
          <div
            style={{
              borderRadius: 22,
              overflow: "hidden",
              background: "var(--ink-2)",
              aspectRatio: "16 / 10",
              backgroundImage: car.img ? `url('${car.img}')` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <aside
            style={{
              padding: "2rem",
              borderRadius: 22,
              border: "1px solid var(--line)",
              background: "rgba(238,232,220,.03)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: "1.4rem",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: ".72rem",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--stone)",
                  marginBottom: ".5rem",
                }}
              >
                Landed price (EGP)
              </div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontWeight: 500,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "-.02em",
                  color: "var(--volt)",
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                {car.price.toLocaleString()} EGP
              </div>
            </div>

            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem 2rem",
                margin: 0,
              }}
            >
              <Spec label="Drivetrain" value={car.drive} />
              <Spec label="Transmission" value={car.trans || "—"} />
              <Spec label="Year" value={String(car.year)} />
              <Spec
                label="Origin"
                value={car.origin === "cn" ? "Nansha · CN" : "Jebel Ali · AE"}
              />
            </dl>

            <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
              <Button
                href={`/contact?vehicle=${encodeURIComponent(car.name)}`}
                variant="primary"
                withArrow="diagonal"
              >
                Request a quote
              </Button>
              <Button href="/calculator" variant="ghost">
                Recalculate
              </Button>
            </div>
          </aside>
        </div>

        {car.gallery && car.gallery.length > 0 && (
          <section style={{ marginTop: "3.5rem" }}>
            <Label>Gallery</Label>
            <div className="vehicle-detail__gallery">
              {car.gallery.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt={`${car.name} — ${i + 1}`}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        {car.features && Object.keys(car.features).length > 0 && (
          <section style={{ marginTop: "3.5rem" }}>
            <Label>Features</Label>
            <div className="vehicle-detail__features">
              {Object.entries(car.features).map(([section, items]) => (
                <div key={section} className="vehicle-detail__features-group">
                  <h3>{section}</h3>
                  <ul>
                    {items.map((item, i) => (
                      <li key={`${section}-${i}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: ".68rem",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--stone)",
          marginBottom: ".3rem",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: "var(--ff-display)",
          fontSize: "1.05rem",
          color: "var(--bone)",
          fontVariationSettings: '"opsz" 24, "SOFT" 50',
        }}
      >
        {value}
      </dd>
    </div>
  );
}
