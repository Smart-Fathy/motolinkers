import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { TESTIMONIALS } from "@/data/testimonials";

export default function Testimonials() {
  return (
    <section className="words" id="words">
      <div className="wrap">
        <Label>Voices</Label>
        <Reveal as="h2" className="words__title">
          Finance people, <em>logistics</em> people, <em>operators.</em>
        </Reveal>

        <div className="words__grid">
          {TESTIMONIALS.map((t) => (
            <Reveal key={t.name} as="article" className="quote">
              <div className="quote__mark">&ldquo;</div>
              <p className="quote__text">{t.text}</p>
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
