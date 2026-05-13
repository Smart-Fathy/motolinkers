import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import RouteMap, { type RouteMapConfig } from "@/components/home/RouteMap";
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
  /** DOM id for the Leaflet container. Must be unique across the page. */
  map_id: string;
  /** Real-world map configuration: bounds, waypoint polyline, ports, vias. */
  map: RouteMapConfig;
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
      freight_value: "5,800",
      transit_value: "60",
      transit_suffix: "d",
      carriers_value: "12",
      carriers_suffix: "+",
      map_id: "map-lane-01",
      map: {
        // Bounds frame the South-China-Sea → Cape → Mediterranean arc.
        bounds: [
          [-40, -25],
          [38, 118],
        ],
        // Nansha → Malacca → Indian Ocean → Cape of Good Hope → up West
        // Africa → Gibraltar → Mediterranean → Alexandria.
        route: [
          [22.75, 113.6],
          [18.0, 112.0],
          [10.5, 108.0],
          [4.0, 104.0],
          [1.27, 103.85],
          [3.5, 98.0],
          [0.0, 90.0],
          [-6.0, 80.0],
          [-15.0, 65.0],
          [-25.0, 50.0],
          [-34.0, 30.0],
          [-34.36, 18.47],
          [-25.0, 12.0],
          [-10.0, 9.0],
          [0.0, 5.0],
          [10.0, -16.0],
          [25.0, -16.0],
          [33.0, -8.0],
          [35.95, -5.6],
          [37.0, 10.0],
          [33.5, 25.0],
          [31.2, 29.92],
        ],
        ports: [
          { latlng: [22.75, 113.6], name: "NANSHA · CN", color: "#DE2910", dir: "bottom", offset: [0, 8] },
          { latlng: [31.2, 29.92], name: "ALEXANDRIA · EG", color: "#C9A84C", dir: "top", offset: [0, -6] },
        ],
        via: [
          { latlng: [-34.36, 18.47], name: "Cape of Good Hope", dir: "bottom", offset: [0, 8] },
          { latlng: [35.95, -5.6], name: "Gibraltar", dir: "left", offset: [-6, 0] },
          { latlng: [1.27, 103.85], name: "Malacca", dir: "bottom", offset: [0, 6] },
        ],
        distance: { latlng: [-20, 70], text: "≈ 22,000 KM · 60 D" },
      },
    },
    {
      flag_from: "ae",
      flag_to: "eg",
      from: "Jebel Ali",
      to: "Alexandria",
      lane_label: "Lane 02",
      freight_prefix: "$",
      freight_value: "4,800",
      transit_value: "55",
      transit_suffix: "d",
      carriers_value: "7",
      carriers_suffix: "+",
      map_id: "map-lane-02",
      map: {
        bounds: [
          [-40, -25],
          [38, 75],
        ],
        // Jebel Ali → Hormuz → Indian Ocean → Cape → West Africa → Gibraltar → Alexandria.
        route: [
          [25.01, 55.06],
          [25.5, 56.5],
          [26.5, 56.9],
          [22.0, 60.0],
          [15.0, 64.0],
          [5.0, 68.0],
          [-8.0, 65.0],
          [-20.0, 55.0],
          [-30.0, 38.0],
          [-34.36, 18.47],
          [-25.0, 12.0],
          [-10.0, 9.0],
          [0.0, 5.0],
          [10.0, -16.0],
          [25.0, -16.0],
          [33.0, -8.0],
          [35.95, -5.6],
          [37.0, 10.0],
          [33.5, 25.0],
          [31.2, 29.92],
        ],
        ports: [
          { latlng: [25.01, 55.06], name: "JEBEL ALI · AE", color: "#00732F", dir: "top", offset: [0, -6] },
          { latlng: [31.2, 29.92], name: "ALEXANDRIA · EG", color: "#C9A84C", dir: "top", offset: [0, -6] },
        ],
        via: [
          { latlng: [26.5, 56.9], name: "Hormuz", dir: "right", offset: [6, 0] },
          { latlng: [-34.36, 18.47], name: "Cape of Good Hope", dir: "bottom", offset: [0, 8] },
          { latlng: [35.95, -5.6], name: "Gibraltar", dir: "left", offset: [-6, 0] },
        ],
        distance: { latlng: [-18, 40], text: "≈ 18,500 KM · 55 D" },
      },
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
            <Reveal key={`${r.map_id}-${i}`} as="article" className="route">
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

              <RouteMap id={r.map_id} config={r.map} />

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
