import Link from "next/link";

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
              }}
            >
              <a href="mailto:info@motolinkers.com" data-hover>
                info@motolinkers.com
              </a>
              <span>·</span>
              <a href="tel:+20100078104" data-hover>
                +20 100 007 8104
              </a>
            </div>
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
                  BYD
                </Link>
              </li>
              <li>
                <Link href="/vehicles" data-hover>
                  Denza
                </Link>
              </li>
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
            </ul>
          </div>

          <div className="foot__col">
            <h4>Hours</h4>
            <ul>
              <li style={{ opacity: 0.85 }}>Sun – Thu</li>
              <li style={{ opacity: 0.85 }}>11:00 – 23:00 EET</li>
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
