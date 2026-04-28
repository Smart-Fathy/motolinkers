import Link from "next/link";
import type { Vehicle } from "@/data/vehicles";

export default function VehicleCard({ car }: { car: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${car.id}`}
      className="car"
      data-hover
      data-origin={car.origin}
      data-type={car.type}
    >
      <div className={`car__badge car__badge--${car.origin}`}>
        <span className="flag" />
        {car.origin === "cn" ? "China" : "UAE"} ·{" "}
        {car.type === "ev" ? "EV" : "Hybrid"}
      </div>
      <div
        className="car__img"
        style={{ backgroundImage: `url('${car.img}')` }}
      />
      <div className="car__body">
        <h3 className="car__title">{car.name}</h3>
        <div className="car__specs">
          <span>{car.drive}</span>
          <span>{car.trans}</span>
          <span>{car.year}</span>
        </div>
        <div className="car__price-row">
          <div className="car__price">
            {car.price.toLocaleString()}
            <small>EGP</small>
          </div>
          <span className="car__link">View →</span>
        </div>
      </div>
    </Link>
  );
}
