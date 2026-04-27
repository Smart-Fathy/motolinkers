"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomeAnimations() {
  useEffect(() => {
    const run = () => {
      // Hero title line reveal
      gsap.to(".hero__title .line > span", {
        y: 0,
        stagger: 0.12,
        duration: 1.1,
        ease: "expo.out",
        delay: 0.1,
      });

      // Hero meta + lede + ctas + scroll
      gsap.from(".hero__meta, .hero__lede, .hero__ctas, .hero__scroll", {
        opacity: 0,
        y: 20,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        delay: 1.0,
      });

      // Process line scrub
      ScrollTrigger.create({
        trigger: "#processRail",
        start: "top 70%",
        end: "bottom 60%",
        scrub: 1,
        onUpdate: (self) => {
          const fill = document.getElementById("processFill");
          if (fill) fill.style.width = `${self.progress * 100}%`;
        },
      });

      // Step-card progressive activation
      document
        .querySelectorAll<HTMLElement>("#processRail .step-card")
        .forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top 75%",
            onEnter: () => card.classList.add("is-active"),
          });
        });

      // Route path reveal
      document
        .querySelectorAll<SVGPathElement>(".route-path")
        .forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, {
            strokeDasharray: `${len} ${len}`,
            strokeDashoffset: len,
          });
          ScrollTrigger.create({
            trigger: p,
            start: "top 80%",
            once: true,
            onEnter: () =>
              gsap.to(p, {
                strokeDashoffset: 0,
                duration: 2,
                ease: "power2.inOut",
              }),
          });
        });

      // Hero parallax
      gsap.to(".hero__grid", {
        y: 200,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".hero__mesh", {
        scale: 1.15,
        opacity: 0.3,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    };

    const loader = document.getElementById("loader");
    let cleanup: (() => void) | null = null;

    if (loader && loader.style.display !== "none") {
      const onDone = () => run();
      window.addEventListener("motolinkers:loader-done", onDone, { once: true });
      const fallback = window.setTimeout(run, 2000);
      cleanup = () => {
        window.removeEventListener("motolinkers:loader-done", onDone);
        window.clearTimeout(fallback);
      };
    } else {
      run();
    }

    return () => {
      cleanup?.();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
