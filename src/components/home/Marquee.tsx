export interface MarqueeItem {
  text: string;
  italic?: boolean;
  /** Optional brand logo URL. When present, renders an <img> tinted to
   *  bone-white; the `text` value is still used as the alt attribute. */
  logo_url?: string;
  /** If true, the logo image keeps its native colors (no white tint).
   *  Used for multi-color emblems like a real BMW roundel. */
  logo_keep_color?: boolean;
}

export interface MarqueeData {
  items: MarqueeItem[];
}

export const MARQUEE_DEFAULT_DATA: MarqueeData = {
  items: [
    { text: "Toyota", logo_url: "/logos/toyota.png" },
    { text: "Nissan", logo_url: "/logos/nissan.png" },
    { text: "Mazda", logo_url: "/logos/mazda.png" },
    { text: "iCar", logo_url: "/logos/icar.png" },
    { text: "Deepal", logo_url: "/logos/deepal.png" },
    { text: "Avatr", logo_url: "/logos/avatr.png" },
    { text: "BYD", logo_url: "/logos/byd.png" },
    { text: "BMW", logo_url: "/logos/bmw.png" },
  ],
};

function MarqueeItemContent({ item }: { item: MarqueeItem }) {
  if (item.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.logo_url}
        alt={item.text}
        className={`marquee__logo${item.logo_keep_color ? " marquee__logo--keep" : ""}`}
        loading="lazy"
      />
    );
  }
  return item.italic ? <em>{item.text}</em> : <>{item.text}</>;
}

export default function Marquee({
  data = MARQUEE_DEFAULT_DATA,
}: {
  data?: MarqueeData;
}) {
  const items = data.items;
  return (
    <section className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {/* original */}
        {items
          .map((item, i) => (
            <span key={`a-${i}`} className="marquee__item">
              <MarqueeItemContent item={item} />
            </span>
          ))
          .flatMap((node, i) => [
            node,
            <span key={`a-dot-${i}`} className="marquee__dot" />,
          ])}
        {/* duplicate for infinite scroll */}
        {items
          .map((item, i) => (
            <span key={`b-${i}`} className="marquee__item">
              <MarqueeItemContent item={item} />
            </span>
          ))
          .flatMap((node, i) => [
            node,
            <span key={`b-dot-${i}`} className="marquee__dot" />,
          ])}
      </div>
    </section>
  );
}
