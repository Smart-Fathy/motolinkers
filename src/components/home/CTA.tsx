import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

export default function CTA() {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta__inner">
          <Reveal as="h2" className="cta__title">
            Move your <em>automotive vision</em> forward.
          </Reveal>
          <Reveal as="p" className="cta__body">
            Whether you&apos;re a business optimising supply chain or an
            individual importing your next vehicle — our consultants are on the
            other side of a short form.{" "}
            <span className="ar">كل خطوة موثّقة.</span>
          </Reveal>
          <div className="cta__ctas">
            <Button href="#calculator" variant="primary" withArrow="diagonal">
              Start your import plan
            </Button>
            <Button href="mailto:info@motolinkers.com" variant="ghost">
              Talk to a consultant
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
