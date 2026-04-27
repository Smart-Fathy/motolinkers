"use client";

import { useEffect, useRef } from "react";

export default function Loader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pct = pctRef.current;
    const bar = barRef.current;
    if (!root || !pct || !bar) return;

    let p = 0;
    let timer = 0;

    const tick = () => {
      p = Math.min(p + Math.random() * 8 + 3, 100);
      pct.textContent = String(Math.floor(p)).padStart(2, "0");
      bar.style.transform = `scaleX(${p / 100})`;
      if (p < 100) {
        timer = window.setTimeout(tick, 50);
      } else {
        window.setTimeout(() => {
          root.style.transition =
            "transform .9s cubic-bezier(0.83,0,0.17,1), opacity .5s";
          root.style.transform = "translateY(-100%)";
          root.style.opacity = "0";
          bar.style.transition = "opacity .5s";
          bar.style.opacity = "0";
          window.setTimeout(() => {
            root.style.display = "none";
            bar.style.display = "none";
            window.dispatchEvent(new Event("motolinkers:loader-done"));
          }, 900);
        }, 200);
      }
    };

    tick();

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div ref={rootRef} className="loader" id="loader">
        <div className="loader__mark">
          Moto<em>Linkers</em>
        </div>
        <div ref={pctRef} className="loader__pct" id="loader-pct">
          00
        </div>
      </div>
      <div ref={barRef} className="loader__bar" id="loader-bar" />
    </>
  );
}
