"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Vehicle } from "@/data/vehicles";
import SpinViewer from "@/components/ui/SpinViewer";

const PanoViewer = dynamic(() => import("@/components/ui/PanoViewer"), {
  ssr: false,
  loading: () => (
    <div className="hero-media__loading">
      <span>Loading interior view…</span>
    </div>
  ),
});

const MIN_SPIN_FRAMES = 12;

type Tab = "spin" | "pano" | "photo";

interface Props {
  car: Vehicle;
}

export default function VehicleHeroMedia({ car }: Props) {
  const hasSpin = (car.spinFrames?.length ?? 0) >= MIN_SPIN_FRAMES;
  const hasPano = !!car.panoUrl;
  const hasPhoto = !!car.img;

  const tabs = useMemo(() => {
    const list: { key: Tab; label: string }[] = [];
    if (hasSpin) list.push({ key: "spin", label: "360°" });
    if (hasPano) list.push({ key: "pano", label: "Interior" });
    if (hasPhoto) list.push({ key: "photo", label: "Photo" });
    return list;
  }, [hasSpin, hasPano, hasPhoto]);

  const [active, setActive] = useState<Tab>(tabs[0]?.key ?? "photo");

  if (!hasSpin && !hasPano) {
    return (
      <div
        className="hero-media__photo"
        style={{
          backgroundImage: car.img ? `url('${car.img}')` : undefined,
        }}
      />
    );
  }

  return (
    <div className="hero-media">
      {tabs.length > 1 ? (
        <div className="hero-media__tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              className="hero-media__tab"
              data-active={active === t.key ? "true" : undefined}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="hero-media__stage">
        {active === "spin" && hasSpin ? (
          <SpinViewer frames={car.spinFrames ?? []} alt={`${car.name} 360 view`} />
        ) : null}
        {active === "pano" && hasPano && car.panoUrl ? (
          <PanoViewer url={car.panoUrl} />
        ) : null}
        {active === "photo" && hasPhoto ? (
          <div
            className="hero-media__photo"
            style={{ backgroundImage: `url('${car.img}')` }}
          />
        ) : null}
      </div>
    </div>
  );
}
