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
      <div
        className="car__img"
        style={car.img ? { backgroundImage: `url('${car.img}')` } : undefined}
      />
      <div className="car__body">
        <h3 className="car__title">{car.name}</h3>
        <div className="car__price-row">
          <div className="car__price">
            {car.price.toLocaleString()}
            <small>EGP</small>
          </div>
          <span className="car__link">
            View details
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M7 17L17 7M17 7H9M17 7v8" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
