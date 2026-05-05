import Link from "next/link";

const SOCIALS = [
  { label: "Facebook", href: "https://web.facebook.com/profile.php?id=61585199878906" },
  { label: "Instagram", href: "https://www.instagram.com/motolinkers" },
  { label: "TikTok", href: "https://www.tiktok.com/@motolinkers" },
];

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__top">
          <div className="foot__brand">
            <div className="foot__logo">
              Moto<em>Linkers</em>
            </div>
            <p className="foot__tag">
              Egypt-based automotive supply-chain consultancy, connecting
              manufacturers, importers, and logistics partners across three
              continents.
            </p>
            <div
              style={{
                display: "flex",
                gap: ".8rem",
                fontFamily: "var(--ff-mono)",
                fontSize: ".78rem",
                color: "var(--bone)",
                opacity: 0.7,
                marginTop: ".4rem",
                flexWrap: "wrap",
              }}
            >
              <a href="mailto:info@motolinkers.com" data-hover>
                info@motolinkers.com
              </a>
              <span>·</span>
              <a href="tel:+201000078104" data-hover>
                +20 100 000 78104
              </a>
            </div>
            <div
              style={{
                display: "flex",
                gap: ".7rem",
                fontFamily: "var(--ff-mono)",
                fontSize: ".74rem",
                color: "var(--bone)",
                opacity: 0.7,
                marginTop: ".7rem",
                flexWrap: "wrap",
              }}
            >
              {SOCIALS.map((s, i) => (
                <span
                  key={s.label}
                  style={{ display: "inline-flex", gap: ".7rem" }}
                >
                  {i > 0 && <span style={{ opacity: 0.5 }}>·</span>}
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-hover
                  >
                    {s.label}
                  </a>
                </span>
              ))}
            </div>
            <p
              style={{
                fontSize: ".78rem",
                color: "var(--stone)",
                margin: ".9rem 0 0",
                lineHeight: 1.5,
              }}
            >
              Office (ACO2), Floor 4, Building 100,
              <br />
              Al-Mirghani Street, Heliopolis, Cairo
            </p>
          </div>

          <div className="foot__col">
            <h4>Navigate</h4>
            <ul>
              <li>
                <Link href="/about" data-hover>
                  About
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Vehicles
                </Link>
              </li>
              <li>
                <Link href="/calculator" data-hover>
                  Calculator
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" data-hover>
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/news" data-hover>
                  News
                </Link>
              </li>
              <li>
                <Link href="/contact" data-hover>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="foot__col">
            <h4>Brands</h4>
            <ul>
              <li>
                <Link href="/vehicles" data-hover>
                  Avatr
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Deepal
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Zeekr
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Mazda
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  GAC
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Changan
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  ROX
                </Link>
              </li>
            </ul>
          </div>

          <div className="foot__col">
            <h4>Hours</h4>
            <ul>
              <li style={{ opacity: 0.85 }}>Sun – Thu · 11:00 – 23:00</li>
              <li style={{ opacity: 0.85 }}>Saturday · 15:00 – 23:00</li>
              <li style={{ opacity: 0.6 }}>Friday · Closed</li>
              <li style={{ marginTop: ".5rem" }}>
                <Link href="/contact" data-hover>
                  Subscribe
                </Link>
              </li>
              <li>
                <Link href="/faq" data-hover>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/privacy" data-hover>
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot__bottom">
          <div>© 2026 MotoLinkers · All rights reserved</div>
          <div className="foot__legal">
            <Link href="/terms" data-hover>
              Terms
            </Link>
            <Link href="/privacy" data-hover>
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
