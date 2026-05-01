import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { renderInlineHtml } from "@/lib/cms-html";

export interface TestimonialItem {
  initials: string;
  name: string;
  role: string;
  quote: string;
}

export interface TestimonialsData {
  kicker: string;
  title_html: string;
  items: TestimonialItem[];
}

export const TESTIMONIALS_DEFAULT_DATA: TestimonialsData = {
  kicker: "Voices",
  title_html: "Finance people, <em>logistics</em> people, <em>operators.</em>",
  items: [
    {
      initials: "YD",
      name: "Yasser Dawood",
      role: "Branch Manager · E-Bank",
      quote:
        "What impressed me most was the clarity. I knew exactly what I was paying for and why.",
    },
    {
      initials: "WZ",
      name: "Wael Zaky",
      role: "Finance Manager · E-Bank",
      quote:
        "As someone working in finance, transparency is critical for me. The entire process was structured and documented, from factory pricing to freight and delivery. There were no hidden costs.",
    },
    {
      initials: "MS",
      name: "Maha Shafiq",
      role: "Operations Manager · OSOCO",
      quote:
        "The car arrived exactly as promised and at a better value than what I was seeing locally. Overall, it felt trustworthy.",
    },
    {
      initials: "SM",
      name: "Seif Maged",
      role: "Logistics Manager · ArcelorMittal",
      quote:
        "How satisfied I felt once I started driving the car. The whole experience — from choosing the car to receiving it — was simple, professional, and exactly what I was hoping for.",
    },
    {
      initials: "TR",
      name: "Tamer Refaat",
      role: "Head of Central Ops · E-Bank",
      quote:
        "The team handled everything end-to-end — supplier verification, quality checks, shipping, delivery coordination. Stress-free.",
    },
  ],
};

export default function Testimonials({
  data = TESTIMONIALS_DEFAULT_DATA,
}: {
  data?: TestimonialsData;
}) {
  return (
    <section className="words" id="words">
      <div className="wrap">
        <Label>{data.kicker}</Label>
        <Reveal as="h2" className="words__title">
          {renderInlineHtml(data.title_html)}
        </Reveal>

        <div className="words__grid">
          {data.items.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} as="article" className="quote">
              <div className="quote__mark">&ldquo;</div>
              <p className="quote__text">{t.quote}</p>
              <div className="quote__by">
                <div className="quote__avatar">{t.initials}</div>
                <div className="quote__who">
                  <span className="quote__name">{t.name}</span>
                  <span className="quote__role">{t.role}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
