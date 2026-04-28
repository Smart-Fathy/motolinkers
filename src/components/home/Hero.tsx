import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <header className="hero" id="home">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__mesh" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />

      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero__meta">
          <div className="hero__meta-item">
            <strong>
              <span className="dot" />
              Cairo · Alexandria
            </strong>
            <span>Est. 2020 · Operator since</span>
          </div>
          <div className="hero__meta-item" style={{ textAlign: "right" }}>
            <strong>N 30.0444 · E 31.2357</strong>
            <span>Working hours · Sun–Thu · 11:00–23:00</span>
          </div>
        </div>

        <h1 className="hero__title" aria-label="Transparency is the new luxury.">
          <span className="line">
            <span>Transparency</span>
          </span>
          <span className="line">
            <span>is the new</span>
          </span>
          <span className="line">
            <span>
              <em>luxury.</em>
            </span>
          </span>
        </h1>

        <div className="hero__foot">
          <p className="hero__lede">
            Egypt&apos;s quietly radical EV import consultancy. We don&apos;t sell
            cars — we hand you the <em>factory price</em>, the real landed
            cost, and a verified path from a Chinese or Emirati port to your
            driveway.
          </p>
          <div className="hero__ctas">
            <Button href="/vehicles" variant="primary" withArrow="diagonal">
              Explore the fleet
            </Button>
            <Button href="/calculator" variant="ghost">
              Compute your cost
            </Button>
          </div>
        </div>
      </div>

      <aside className="hero__ticker" aria-hidden="true">
        <div>
          <strong>17%</strong>
          <span>EV tax rate</span>
        </div>
        <div>
          <strong>27%</strong>
          <span>REEV tax rate</span>
        </div>
        <div>
          <strong>58%</strong>
          <span>PHEV tax rate</span>
        </div>
        <div>
          <strong>
            28–45 <small>d</small>
          </strong>
          <span>Transit window</span>
        </div>
      </aside>

      <div className="hero__scroll">
        <span>Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </header>
  );
}
