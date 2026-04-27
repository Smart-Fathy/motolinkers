import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";

export default function Routes() {
  return (
    <section className="routes" id="routes">
      <div className="wrap">
        <Label>Trade Lanes</Label>
        <Reveal as="h2" className="routes__title">
          Two ports. <em>One destination.</em>
        </Reveal>

        <div className="routes__grid">
          <Reveal as="article" className="route">
            <div className="route__head">
              <div className="route__from-to">
                <span className="route__flag route__flag--cn" aria-hidden="true" />
                Nansha
                <span className="route__arrow">→</span>
                <span className="route__flag route__flag--eg" aria-hidden="true" />
                Alexandria
              </div>
              <span className="route__number">Lane 01</span>
            </div>

            <div className="route__map" aria-hidden="true">
              <svg viewBox="0 0 600 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradCN" x1="0" x2="1">
                    <stop offset="0%" stopColor="#DE2910" />
                    <stop offset="100%" stopColor="#B8411C" />
                  </linearGradient>
                </defs>
                <path
                  d="M30 110 Q 180 10, 300 80 T 570 60"
                  fill="none"
                  stroke="url(#gradCN)"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                  className="route-path"
                />
                <circle cx="30" cy="110" r="7" fill="#DE2910" />
                <circle
                  cx="30"
                  cy="110"
                  r="14"
                  fill="none"
                  stroke="#DE2910"
                  strokeOpacity=".3"
                />
                <circle cx="570" cy="60" r="7" fill="#B8411C" />
                <circle
                  cx="570"
                  cy="60"
                  r="14"
                  fill="none"
                  stroke="#B8411C"
                  strokeOpacity=".3"
                />
                <text
                  x="30"
                  y="140"
                  fontFamily="Geist Mono, monospace"
                  fontSize="10"
                  fill="#0A0A0B"
                  opacity=".6"
                  textAnchor="middle"
                >
                  GZHOU · CN
                </text>
                <text
                  x="570"
                  y="40"
                  fontFamily="Geist Mono, monospace"
                  fontSize="10"
                  fill="#0A0A0B"
                  opacity=".6"
                  textAnchor="middle"
                >
                  ALX · EG
                </text>
                <text
                  x="300"
                  y="150"
                  fontFamily="Geist Mono, monospace"
                  fontSize="9"
                  fill="#B8411C"
                  textAnchor="middle"
                  letterSpacing="2"
                >
                  ≈ 12,800 KM · SUEZ CANAL
                </text>
              </svg>
            </div>

            <div className="route__stats">
              <div>
                <div className="route__stat-label">Freight</div>
                <div className="route__stat-value">
                  $<em>4,025</em>
                </div>
              </div>
              <div>
                <div className="route__stat-label">Transit</div>
                <div className="route__stat-value">
                  <em>45</em>d
                </div>
              </div>
              <div>
                <div className="route__stat-label">Carriers</div>
                <div className="route__stat-value">
                  <em>12</em>+
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal as="article" className="route">
            <div className="route__head">
              <div className="route__from-to">
                <span className="route__flag route__flag--ae" aria-hidden="true" />
                Jebel Ali
                <span className="route__arrow">→</span>
                <span className="route__flag route__flag--eg" aria-hidden="true" />
                Alexandria
              </div>
              <span className="route__number">Lane 02</span>
            </div>

            <div className="route__map" aria-hidden="true">
              <svg viewBox="0 0 600 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradAE" x1="0" x2="1">
                    <stop offset="0%" stopColor="#00732F" />
                    <stop offset="100%" stopColor="#B8411C" />
                  </linearGradient>
                </defs>
                <path
                  d="M30 80 Q 250 30, 570 80"
                  fill="none"
                  stroke="url(#gradAE)"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                  className="route-path"
                />
                <circle cx="30" cy="80" r="7" fill="#00732F" />
                <circle
                  cx="30"
                  cy="80"
                  r="14"
                  fill="none"
                  stroke="#00732F"
                  strokeOpacity=".3"
                />
                <circle cx="570" cy="80" r="7" fill="#B8411C" />
                <circle
                  cx="570"
                  cy="80"
                  r="14"
                  fill="none"
                  stroke="#B8411C"
                  strokeOpacity=".3"
                />
                <text
                  x="30"
                  y="110"
                  fontFamily="Geist Mono, monospace"
                  fontSize="10"
                  fill="#0A0A0B"
                  opacity=".6"
                  textAnchor="middle"
                >
                  DXB · AE
                </text>
                <text
                  x="570"
                  y="110"
                  fontFamily="Geist Mono, monospace"
                  fontSize="10"
                  fill="#0A0A0B"
                  opacity=".6"
                  textAnchor="middle"
                >
                  ALX · EG
                </text>
                <text
                  x="300"
                  y="30"
                  fontFamily="Geist Mono, monospace"
                  fontSize="9"
                  fill="#B8411C"
                  textAnchor="middle"
                  letterSpacing="2"
                >
                  ≈ 5,200 KM · RED SEA
                </text>
              </svg>
            </div>

            <div className="route__stats">
              <div>
                <div className="route__stat-label">Freight</div>
                <div className="route__stat-value">
                  $<em>2,900</em>
                </div>
              </div>
              <div>
                <div className="route__stat-label">Transit</div>
                <div className="route__stat-value">
                  <em>28</em>d
                </div>
              </div>
              <div>
                <div className="route__stat-label">Carriers</div>
                <div className="route__stat-value">
                  <em>7</em>+
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
