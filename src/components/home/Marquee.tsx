const ITEMS = [
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
];

function Track() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className="marquee__item"
          aria-hidden={i > 0 ? undefined : undefined}
        >
          {item.italic ? <em>{item.text}</em> : item.text}
          <span className="marquee__dot" />
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  return (
    <section className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {/* original */}
        {ITEMS.map((item, i) => (
          <span key={`a-${i}`} className="marquee__item">
            {item.italic ? <em>{item.text}</em> : item.text}
          </span>
        )).flatMap((node, i) => [
          node,
          <span key={`a-dot-${i}`} className="marquee__dot" />,
        ])}
        {/* duplicate for infinite scroll */}
        {ITEMS.map((item, i) => (
          <span key={`b-${i}`} className="marquee__item">
            {item.italic ? <em>{item.text}</em> : item.text}
          </span>
        )).flatMap((node, i) => [
          node,
          <span key={`b-dot-${i}`} className="marquee__dot" />,
        ])}
      </div>
    </section>
  );
}

void Track;
