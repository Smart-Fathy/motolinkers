"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpinViewerProps {
  frames: string[];
  alt?: string;
}

const PIXELS_PER_FRAME = 10;
const AUTO_SPIN_INTERVAL_MS = 35;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export default function SpinViewer({ frames, alt = "" }: SpinViewerProps) {
  const count = frames.length;
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [hintVisible, setHintVisible] = useState(!reducedMotion);

  const dragStartX = useRef(0);
  const dragStartFrame = useRef(0);
  const userInteracted = useRef(false);

  useEffect(() => {
    if (count < 2) return;
    if (reducedMotion) return;

    let i = 0;
    const id = window.setInterval(() => {
      if (userInteracted.current) {
        window.clearInterval(id);
        return;
      }
      i += 1;
      setCurrent(mod(i, count));
      if (i >= count) {
        window.clearInterval(id);
        window.setTimeout(() => setHintVisible(false), 1200);
      }
    }, AUTO_SPIN_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [count, reducedMotion]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (count < 2) return;
      userInteracted.current = true;
      setHintVisible(false);
      setDragging(true);
      dragStartX.current = e.clientX;
      dragStartFrame.current = current;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [count, current],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const delta = Math.round((e.clientX - dragStartX.current) / PIXELS_PER_FRAME);
      setCurrent(mod(dragStartFrame.current - delta, count));
    },
    [dragging, count],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [dragging],
  );

  const step = useCallback(
    (delta: number) => {
      userInteracted.current = true;
      setHintVisible(false);
      setCurrent((c) => mod(c + delta, count));
    },
    [count],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    },
    [step],
  );

  if (count === 0) return null;

  return (
    <div
      className="spin"
      data-dragging={dragging ? "true" : undefined}
      role="img"
      aria-label={alt || "360 degree spin viewer"}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {frames.map((src, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className="spin__frame"
          data-active={i === current ? "true" : undefined}
          loading={i < 3 ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      ))}

      <button
        type="button"
        className="spin__arrow spin__arrow--left"
        aria-label="Previous frame"
        onClick={() => step(-1)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>
      <button
        type="button"
        className="spin__arrow spin__arrow--right"
        aria-label="Next frame"
        onClick={() => step(1)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      <span className="spin__badge" aria-hidden="true">
        360°
      </span>
      <span className="spin__hint" data-visible={hintVisible ? "true" : undefined} aria-hidden="true">
        ← drag to rotate →
      </span>
    </div>
  );
}
