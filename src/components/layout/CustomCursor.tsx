"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (max-width: 900px)").matches) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let mx = 0,
      my = 0,
      cx = 0,
      cy = 0,
      dx = 0,
      dy = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      dx += (mx - dx) * 0.45;
      dy += (my - dy) * 0.45;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const hoverSelector =
      "[data-hover], a, button, .car, .pillar, .route, .quote, .chip, .choice, .step-pill";

    const enter = () => cursor.classList.add("is-hovering");
    const leave = () => cursor.classList.remove("is-hovering");

    const bind = () => {
      document.querySelectorAll<HTMLElement>(hoverSelector).forEach((el) => {
        if ((el as HTMLElement & { __hoverBound?: boolean }).__hoverBound) return;
        (el as HTMLElement & { __hoverBound?: boolean }).__hoverBound = true;
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    bind();

    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" id="cursor" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" id="cursor-dot" aria-hidden="true" />
    </>
  );
}
