export interface MarqueeItem {
  text: string;
  italic?: boolean;
}

export interface MarqueeData {
  items: MarqueeItem[];
}

export const MARQUEE_DEFAULT_DATA: MarqueeData = {
  items: [
    { text: "BYD" },
    { text: "Denza", italic: true },
    { text: "Avatr" },
    { text: "Zeekr" },
    { text: "Deepal", italic: true },
    { text: "Changan" },
    { text: "GAC" },
    { text: "Leapmotor", italic: true },
    { text: "Nio" },
    { text: "Xpeng", italic: true },
  ],
};

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
              {item.italic ? <em>{item.text}</em> : item.text}
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
              {item.italic ? <em>{item.text}</em> : item.text}
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
