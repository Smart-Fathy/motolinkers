"use client";

import { useEffect, useRef } from "react";

export interface StatItem {
  target: number;
  suffix: string;
  label: string;
}

export interface StatsData {
  items: StatItem[];
}

export const STATS_DEFAULT_DATA: StatsData = {
  items: [
    { target: 5, suffix: "+", label: "Years in Operation" },
    { target: 220, suffix: "", label: "Vehicles Landed" },
    { target: 17, suffix: "", label: "Verified Manufacturers" },
    { target: 100, suffix: "%", label: "Clearance Success Rate" },
  ],
};

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const start = performance.now();
          const duration = 1600;
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 2);
            el.textContent = String(Math.floor(target * eased));
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = String(target);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <em ref={ref} data-count={target}>
      0
    </em>
  );
}

export default function Stats({ data = STATS_DEFAULT_DATA }: { data?: StatsData }) {
  return (
    <section className="stats">
      <div className="wrap">
        <div className="stats__grid">
          {data.items.map((s, i) => (
            <div key={`${s.label}-${i}`} className="stat">
              <div className="stat__value">
                <Counter target={s.target} />
                {s.suffix}
              </div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
