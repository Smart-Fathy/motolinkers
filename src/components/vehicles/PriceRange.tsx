"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  format?: (n: number) => string;
};

// Dual-thumb range slider built from two stacked <input type="range">.
// The fill of the track between the two thumbs is rendered via a CSS
// gradient driven by --p-low / --p-high custom properties.
export default function PriceRange({
  min,
  max,
  step = 1,
  value,
  onChange,
  format = (n) => n.toLocaleString(),
}: Props) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [low, high] = value;

  // Keep the track gradient in sync with the values.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const span = max - min || 1;
    el.style.setProperty("--p-low", `${((low - min) / span) * 100}%`);
    el.style.setProperty("--p-high", `${((high - min) / span) * 100}%`);
  }, [low, high, min, max]);

  const onLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), high - step);
    onChange([Math.max(min, v), high]);
  };
  const onHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), low + step);
    onChange([low, Math.min(max, v)]);
  };

  return (
    <div className="price-range">
      <div className="price-range__values">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
      <div className="price-range__track" ref={trackRef}>
        <input
          aria-label="Minimum price"
          id={`${id}-min`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={onLow}
          className="price-range__input price-range__input--low"
        />
        <input
          aria-label="Maximum price"
          id={`${id}-max`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={onHigh}
          className="price-range__input price-range__input--high"
        />
      </div>
    </div>
  );
}
