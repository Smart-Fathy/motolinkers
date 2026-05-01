import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { renderInlineHtml } from "@/lib/cms-html";

export interface RouteItem {
  flag_from: "cn" | "ae" | "eg";
  flag_to: "cn" | "ae" | "eg";
  from: string;
  to: string;
  lane_label: string;
  freight_value: string;
  freight_prefix?: string;
  transit_value: string;
  transit_suffix?: string;
  carriers_value: string;
  carriers_suffix?: string;
  svg_top_left: string;
  svg_top_right: string;
  svg_bottom: string;
  gradient_id: string;
  gradient_from: string;
  gradient_to: string;
  // Path geometry kept here so admin can tweak curves without code,
  // but defaults match the original art.
  svg_path: string;
  svg_dot_from: { cx: number; cy: number };
  svg_dot_to: { cx: number; cy: number };
  svg_top_left_pos: { x: number; y: number };
  svg_top_right_pos: { x: number; y: number };
  svg_bottom_pos: { x: number; y: number };
}

export interface RoutesData {
  kicker: string;
  title_html: string;
  routes: RouteItem[];
}

export const ROUTES_DEFAULT_DATA: RoutesData = {
  kicker: "Trade Lanes",
  title_html: "Two ports. <em>One destination.</em>",
  routes: [
    {
      flag_from: "cn",
      flag_to: "eg",
      from: "Nansha",
      to: "Alexandria",
      lane_label: "Lane 01",
      freight_prefix: "$",
      freight_value: "4,025",
      transit_value: "45",
      transit_suffix: "d",
      carriers_value: "12",
      carriers_suffix: "+",
      svg_top_left: "GZHOU · CN",
      svg_top_right: "ALX · EG",
      svg_bottom: "≈ 12,800 KM · SUEZ CANAL",
      gradient_id: "gradCN",
      gradient_from: "#DE2910",
      gradient_to: "#C9A84C",
      svg_path: "M30 110 Q 180 10, 300 80 T 570 60",
      svg_dot_from: { cx: 30, cy: 110 },
      svg_dot_to: { cx: 570, cy: 60 },
      svg_top_left_pos: { x: 30, y: 140 },
      svg_top_right_pos: { x: 570, y: 40 },
      svg_bottom_pos: { x: 300, y: 150 },
    },
    {
      flag_from: "ae",
      flag_to: "eg",
      from: "Jebel Ali",
      to: "Alexandria",
      lane_label: "Lane 02",
      freight_prefix: "$",
      freight_value: "2,900",
      transit_value: "28",
      transit_suffix: "d",
      carriers_value: "7",
      carriers_suffix: "+",
      svg_top_left: "DXB · AE",
      svg_top_right: "ALX · EG",
      svg_bottom: "≈ 5,200 KM · RED SEA",
      gradient_id: "gradAE",
      gradient_from: "#00732F",
      gradient_to: "#C9A84C",
      svg_path: "M30 80 Q 250 30, 570 80",
      svg_dot_from: { cx: 30, cy: 80 },
      svg_dot_to: { cx: 570, cy: 80 },
      svg_top_left_pos: { x: 30, y: 110 },
      svg_top_right_pos: { x: 570, y: 110 },
      svg_bottom_pos: { x: 300, y: 30 },
    },
  ],
};

export default function Routes({
  data = ROUTES_DEFAULT_DATA,
}: {
  data?: RoutesData;
}) {
  return (
    <section className="routes" id="routes">
      <div className="wrap">
        <Label>{data.kicker}</Label>
        <Reveal as="h2" className="routes__title">
          {renderInlineHtml(data.title_html)}
        </Reveal>

        <div className="routes__grid">
          {data.routes.map((r, i) => (
            <Reveal key={`${r.gradient_id}-${i}`} as="article" className="route">
              <div className="route__head">
                <div className="route__from-to">
                  <span
                    className={`route__flag route__flag--${r.flag_from}`}
                    aria-hidden="true"
                  />
                  {r.from}
                  <span className="route__arrow">→</span>
                  <span
                    className={`route__flag route__flag--${r.flag_to}`}
                    aria-hidden="true"
                  />
                  {r.to}
                </div>
                <span className="route__number">{r.lane_label}</span>
              </div>

              <div className="route__map" aria-hidden="true">
                <svg viewBox="0 0 600 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={r.gradient_id} x1="0" x2="1">
                      <stop offset="0%" stopColor={r.gradient_from} />
                      <stop offset="100%" stopColor={r.gradient_to} />
                    </linearGradient>
                  </defs>
                  <path
                    d={r.svg_path}
                    fill="none"
                    stroke={`url(#${r.gradient_id})`}
                    strokeWidth="2"
                    strokeDasharray="6 5"
                    className="route-path"
                  />
                  <circle cx={r.svg_dot_from.cx} cy={r.svg_dot_from.cy} r="7" fill={r.gradient_from} />
                  <circle
                    cx={r.svg_dot_from.cx}
                    cy={r.svg_dot_from.cy}
                    r="14"
                    fill="none"
                    stroke={r.gradient_from}
                    strokeOpacity=".3"
                  />
                  <circle cx={r.svg_dot_to.cx} cy={r.svg_dot_to.cy} r="7" fill={r.gradient_to} />
                  <circle
                    cx={r.svg_dot_to.cx}
                    cy={r.svg_dot_to.cy}
                    r="14"
                    fill="none"
                    stroke={r.gradient_to}
                    strokeOpacity=".3"
                  />
                  <text
                    x={r.svg_top_left_pos.x}
                    y={r.svg_top_left_pos.y}
                    fontFamily="Geist Mono, monospace"
                    fontSize="10"
                    fill="#EEE8DC"
                    opacity=".6"
                    textAnchor="middle"
                  >
                    {r.svg_top_left}
                  </text>
                  <text
                    x={r.svg_top_right_pos.x}
                    y={r.svg_top_right_pos.y}
                    fontFamily="Geist Mono, monospace"
                    fontSize="10"
                    fill="#EEE8DC"
                    opacity=".6"
                    textAnchor="middle"
                  >
                    {r.svg_top_right}
                  </text>
                  <text
                    x={r.svg_bottom_pos.x}
                    y={r.svg_bottom_pos.y}
                    fontFamily="Geist Mono, monospace"
                    fontSize="9"
                    fill="#C9A84C"
                    textAnchor="middle"
                    letterSpacing="2"
                  >
                    {r.svg_bottom}
                  </text>
                </svg>
              </div>

              <div className="route__stats">
                <div>
                  <div className="route__stat-label">Freight</div>
                  <div className="route__stat-value">
                    {r.freight_prefix}
                    <em>{r.freight_value}</em>
                  </div>
                </div>
                <div>
                  <div className="route__stat-label">Transit</div>
                  <div className="route__stat-value">
                    <em>{r.transit_value}</em>
                    {r.transit_suffix}
                  </div>
                </div>
                <div>
                  <div className="route__stat-label">Carriers</div>
                  <div className="route__stat-value">
                    <em>{r.carriers_value}</em>
                    {r.carriers_suffix}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
