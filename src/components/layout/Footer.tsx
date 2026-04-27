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
                <a href="#manifesto" data-hover>
                  About
                </a>
              </li>
              <li>
                <a href="#fleet" data-hover>
                  Fleet
                </a>
              </li>
              <li>
                <a href="#calculator" data-hover>
                  Calculator
                </a>
              </li>
              <li>
                <a href="#routes" data-hover>
                  Routes
                </a>
              </li>
              <li>
                <a href="#process" data-hover>
                  Process
                </a>
              </li>
            </ul>
          </div>

          <div className="foot__col">
            <h4>Brands</h4>
            <ul>
              <li>
                <a href="#fleet" data-hover>
                  BYD
                </a>
              </li>
              <li>
                <a href="#fleet" data-hover>
                  Denza
                </a>
              </li>
              <li>
                <a href="#fleet" data-hover>
                  Avatr
                </a>
              </li>
              <li>
                <a href="#fleet" data-hover>
                  Deepal
                </a>
              </li>
              <li>
                <a href="#fleet" data-hover>
                  Zeekr
                </a>
              </li>
            </ul>
          </div>

          <div className="foot__col">
            <h4>Hours</h4>
            <ul>
              <li style={{ opacity: 0.85 }}>Sun – Thu</li>
              <li style={{ opacity: 0.85 }}>11:00 – 23:00 EET</li>
              <li style={{ marginTop: ".5rem" }}>
                <a href="#calculator" data-hover>
                  Subscribe
                </a>
              </li>
              <li>
                <a href="#" data-hover>
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" data-hover>
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot__bottom">
          <div>© 2026 MotoLinkers · All rights reserved</div>
          <div className="foot__legal">
            <a href="#" data-hover>
              Terms
            </a>
            <a href="#" data-hover>
              Privacy
            </a>
            <a href="#" data-hover>
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
