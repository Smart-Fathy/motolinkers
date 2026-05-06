"use client";

import Link from "next/link";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import RevealStagger from "@/components/ui/RevealStagger";

// ─── SVG icon paths ─────────────────────────────────────────────────────────

function IcoCar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M6 13l1.5-4.2A2 2 0 0 1 9.4 7.5h5.2a2 2 0 0 1 1.9 1.3L18 13"/>
      <path d="M4 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2M16 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2"/>
      <path d="M4 13h16"/><circle cx="8" cy="16.5" r=".7" fill="currentColor"/><circle cx="16" cy="16.5" r=".7" fill="currentColor"/>
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
      <path d="M14 3v4h4M9 12h6M9 16h4M9 8h2"/>
    </svg>
  );
}
function IcoShip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/>
      <path d="M5 16l1-5h12l1 5"/><path d="M12 11V5l5 3"/><path d="M9 11V8h3"/>
    </svg>
  );
}
function IcoKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="14" r="4"/><path d="M11 11l9-9"/><path d="M16 6l3 3"/><path d="M14 8l3 3"/>
    </svg>
  );
}
function IcoMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>
    </svg>
  );
}
function IcoPen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16"/><path d="M14 4l6 6L9 21H3v-6z"/><path d="M13 5l6 6"/>
    </svg>
  );
}
function IcoTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/>
      <circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>
    </svg>
  );
}
function IcoStack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/>
    </svg>
  );
}
function IcoShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/><path d="M9 12l2 2 4-4"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5L16 9.5"/>
    </svg>
  );
}
function IcoHeadset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1"/>
      <rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/>
      <path d="M20 19c0 1.5-1.5 3-4 3"/>
    </svg>
  );
}
function IcoArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  );
}

function Icon({ children, node }: { children: React.ReactNode; node?: boolean }) {
  return (
    <span className={`hiw-icon${node ? " hiw-icon--node" : ""}`}>
      {children}
    </span>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hiw-hero">
      <div className="hiw-hero__ornament" aria-hidden />
      <div className="wrap">
        <Reveal as="div" className="hiw-hero__grid">
          <div>
            <Label>How it works <span style={{ color: "var(--stone)", marginLeft: ".5rem" }}>— 04 chapters</span></Label>
            <h1 className="hiw-hero__title">
              Vehicle importing, <em>made simple.</em>
            </h1>
          </div>
          <aside className="hiw-hero__side">
            <p className="hiw-hero__lede">
              Whether you&apos;re importing your next car or optimising an automotive supply chain — our four-step process gives you clarity, transparency, and full control from selection to delivery.
            </p>
            <div className="hiw-hero__meta">
              <div className="hiw-hero__meta-item">
                <span className="k">Lead time</span>
                <span className="v"><em>6–10</em> weeks</span>
              </div>
              <div className="hiw-hero__meta-item">
                <span className="k">Routes</span>
                <span className="v">CN · UAE · EG</span>
              </div>
              <div className="hiw-hero__meta-item">
                <span className="k">Cleared by</span>
                <span className="v">MotoLinkers</span>
              </div>
              <div className="hiw-hero__meta-item">
                <span className="k">Visibility</span>
                <span className="v"><em>End</em> to end</span>
              </div>
            </div>
          </aside>
        </Reveal>

        <div className="hiw-hero__rule">
          <span>On this page</span>
          <div className="pages">
            <a href="#tracks"><span className="i">01</span>Audiences</a>
            <a href="#timeline"><span className="i">02</span>Timeline</a>
            <a href="#included"><span className="i">03</span>Included</a>
            <a href="#start"><span className="i">04</span>Start</a>
          </div>
          <span>EG · 2026</span>
        </div>
      </div>
    </section>
  );
}

// ─── Track card ──────────────────────────────────────────────────────────────

interface Step {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}

function TrackCard({
  label,
  sigil,
  title,
  titleEm,
  lede,
  steps,
  ctaLabel,
  ctaHref,
  timeLabel,
}: {
  label: string;
  sigil: string;
  title: string;
  titleEm: string;
  lede: string;
  steps: Step[];
  ctaLabel: string;
  ctaHref: string;
  timeLabel: React.ReactNode;
}) {
  return (
    <article className="hiw-track">
      <header className="hiw-track__head">
        <div>
          <Label>{label}</Label>
          <h3 className="hiw-track__title">{title} <em>{titleEm}</em></h3>
        </div>
        <span className="hiw-track__sigil"><em>{sigil}</em></span>
      </header>
      <p className="hiw-track__lede">{lede}</p>
      <ol className="hiw-steps">
        {steps.map((s) => (
          <li key={s.n}>
            <span className="hiw-steps__n">{s.n}</span>
            <Icon>{s.icon}</Icon>
            <div className="hiw-steps__body">
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <footer className="hiw-track__foot">
        <Link href={ctaHref} className="hiw-track__cta">
          {ctaLabel} <IcoArrow />
        </Link>
        <span className="hiw-track__time">{timeLabel}</span>
      </footer>
    </article>
  );
}

// ─── Tracks section ───────────────────────────────────────────────────────────

function Tracks() {
  const individualSteps: Step[] = [
    { n: "01", title: "Select your vehicle", body: "Browse our curated fleet or send a target spec — we'll match a unit and lock pricing in writing.", icon: <IcoCar /> },
    { n: "02", title: "Quote & deposit", body: "Itemised landed-cost quote: vehicle, freight, duty, VAT, registration. 30% deposit secures the unit.", icon: <IcoDoc /> },
    { n: "03", title: "Freight & customs", body: "RoRo or container shipping with weekly status. We clear customs at Alexandria — you don't lift a finger.", icon: <IcoShip /> },
    { n: "04", title: "Delivery & plates", body: "Registration, plates, and a 100-point pre-delivery inspection. Keys handed over at your address.", icon: <IcoKey /> },
  ];
  const businessSteps: Step[] = [
    { n: "01", title: "Sourcing strategy", body: "We map factory-direct supply across China and the UAE against your model mix, margin targets and timing.", icon: <IcoMap /> },
    { n: "02", title: "Volume contracts", body: "Negotiated allocations, locked unit costs and SLA-backed delivery windows — quarter by quarter.", icon: <IcoPen /> },
    { n: "03", title: "Consolidated logistics", body: "Container or RoRo at scale, with dedicated lanes and live shipment dashboards for your operations team.", icon: <IcoTruck /> },
    { n: "04", title: "Cleared & delivered", body: "Bonded clearance, batch registration, and white-glove handover to your forecourt or storage yard.", icon: <IcoKey /> },
  ];
  return (
    <section className="hiw-section" id="tracks">
      <div className="wrap">
        <Reveal as="header" className="hiw-tracks__head">
          <div>
            <Label>Two audiences <span style={{ color: "var(--stone)", marginLeft: ".5rem" }}>— one process</span></Label>
            <h2 className="hiw-tracks__title">
              Built for individuals importing a single car, and for businesses importing <em>at scale.</em>
            </h2>
          </div>
          <div className="hiw-tracks__legend">
            <span><span className="swatch" />Individuals</span>
            <span><span className="swatch alt" />Businesses</span>
          </div>
        </Reveal>

        <RevealStagger as="div" className="hiw-tracks__grid">
          <TrackCard
            label="For individuals"
            sigil="i"
            title="Import your car to"
            titleEm="Egypt."
            lede="A simple, transparent process for individual importers. We source the exact vehicle you want, handle the freight and customs, and deliver it cleared and ready to drive."
            steps={individualSteps}
            ctaLabel="Import a vehicle"
            ctaHref="/contact"
            timeLabel={<>Typical: <em>6–10</em> weeks</>}
          />
          <TrackCard
            label="For businesses"
            sigil="b"
            title="Optimise your"
            titleEm="supply chain."
            lede="For dealers, fleets and OEMs. Volume sourcing, consolidated freight and bonded clearance — engineered for predictable monthly throughput."
            steps={businessSteps}
            ctaLabel="Talk to logistics"
            ctaHref="/contact"
            timeLabel={<>From <em>20</em> units / month</>}
          />
        </RevealStagger>
      </div>
    </section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline() {
  const stages = [
    { n: "Stage 01", title: "Selection", text: "Spec, source and price are confirmed. You sign off before anything moves.", time: "Week 01", icon: <IcoPen /> },
    { n: "Stage 02", title: "Freight", text: "RoRo or container booking, vessel tracking, weekly status reports.", time: "Weeks 02–06", icon: <IcoShip /> },
    { n: "Stage 03", title: "Customs", text: "Alexandria clearance, duty & VAT settled, paperwork legalised.", time: "Weeks 07–08", icon: <IcoShield /> },
    { n: "Stage 04", title: "Delivery", text: "Registration, plates, inspection, handover. Keys at your address.", time: "Weeks 09–10", icon: <IcoKey /> },
  ];
  return (
    <section className="hiw-section" id="timeline">
      <div className="wrap">
        <Reveal as="header" className="hiw-tl-head">
          <div>
            <Label>The four stages</Label>
            <h2 className="hiw-tl-head__title">From selection to <em>steering wheel.</em></h2>
          </div>
          <p className="hiw-tl-head__lede">
            The same four stages run every import — only the scale changes. You see status, costs and ETA at every step, in writing.
          </p>
        </Reveal>

        <Reveal as="ol" className="hiw-tl" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {stages.map((s) => (
            <li key={s.n} className="hiw-tl__step">
              <div className="hiw-tl__node">{s.icon}</div>
              <div className="hiw-tl__num">{s.n}</div>
              <h3 className="hiw-tl__title"><em>{s.title}</em></h3>
              <p className="hiw-tl__text">{s.text}</p>
              <span className="hiw-tl__time">{s.time}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Included matrix ──────────────────────────────────────────────────────────

function Matrix() {
  const cells = [
    { k: "01 / Sourcing", title: "Factory-direct units", body: "Verified VINs, locked pricing, original documentation from the manufacturer.", icon: <IcoStack /> },
    { k: "02 / Freight", title: <><em>RoRo</em> &amp; container</>, body: "Insured shipping from Shanghai, Tianjin, Jebel Ali and Khalifa to Alexandria.", icon: <IcoShip /> },
    { k: "03 / Customs", title: "Cleared, in writing", body: "Duty, VAT, development fee, registration tax — calculated upfront, settled by us.", icon: <IcoDoc /> },
    { k: "04 / Compliance", title: "Egyptian standards", body: "EOS testing, plate registration and fully legal road documentation in your name.", icon: <IcoShield /> },
    { k: "05 / Delivery", title: "100-point handover", body: "Pre-delivery inspection, charge-up, detail, and door-step delivery anywhere in Egypt.", icon: <IcoCheck /> },
    { k: "06 / Aftercare", title: <><em>12-month</em> support</>, body: "Warranty coordination, parts sourcing, and a single point of contact post-delivery.", icon: <IcoHeadset /> },
  ];
  return (
    <section className="hiw-section" id="included">
      <div className="wrap">
        <Reveal>
          <Label>What&apos;s included</Label>
          <h2 className="hiw-matrix__title">Every import comes <em>fully managed.</em></h2>
        </Reveal>
        <RevealStagger as="div" className="hiw-matrix__grid">
          {cells.map((c) => (
            <div key={c.k} className="hiw-cell">
              <Icon>{c.icon}</Icon>
              <span className="hiw-cell__k">{c.k}</span>
              <h4 className="hiw-cell__t">{c.title}</h4>
              <p className="hiw-cell__d">{c.body}</p>
            </div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="hiw-section" id="start" style={{ borderTop: "none", paddingBottom: "clamp(5rem, 10vw, 7rem)" }}>
      <div className="wrap">
        <Reveal className="hiw-cta__inner">
          <span className="hiw-corner">— Start · EG · 2026</span>
          <div className="hiw-cta__grid">
            <div>
              <Label>Ready when you are</Label>
              <h2 className="hiw-cta__title">Tell us what you want to <em>import.</em></h2>
            </div>
            <div>
              <p className="hiw-cta__body">
                Send us a target vehicle, a fleet plan, or just a question. You&apos;ll get a written response inside one working day — with an itemised quote attached.
              </p>
              <div className="hiw-cta__actions">
                <Link href="/contact" className="btn btn--primary">
                  Import a vehicle <IcoArrow />
                </Link>
                <Link href="/contact" className="btn btn--ghost">
                  Talk to logistics <IcoArrow />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function HowItWorksSections() {
  return (
    <>
      <Hero />
      <Tracks />
      <Timeline />
      <Matrix />
      <CtaSection />
    </>
  );
}
