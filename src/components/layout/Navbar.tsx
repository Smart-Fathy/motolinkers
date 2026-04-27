"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#fleet", label: "Fleet" },
  { href: "#calculator", label: "Calculator" },
  { href: "#routes", label: "Routes" },
  { href: "#process", label: "Process" },
  { href: "#words", label: "Voices" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`nav${scrolled ? " is-scrolled" : ""}`}
        id="nav"
        aria-label="Primary"
      >
        <a href="#" className="nav__logo" data-hover>
          <span className="nav__logo-mark" aria-hidden="true" />
          Moto<em>Linkers</em>
        </a>
        <div className="nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav__link" data-hover>
              {l.label}
            </a>
          ))}
        </div>
        <a href="#calculator" className="nav__cta" data-hover>
          Import a vehicle
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <button
          className="nav__menu"
          id="menuBtn"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div
        className={`menu-panel${open ? " is-open" : ""}`}
        id="menuPanel"
      >
        <button
          className="menu-panel__close"
          id="menuClose"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
        <ul className="menu-panel__list">
          <li>
            <a href="#fleet" onClick={() => setOpen(false)}>
              The <em>Fleet</em>
            </a>
          </li>
          <li>
            <a href="#calculator" onClick={() => setOpen(false)}>
              True <em>cost</em>
            </a>
          </li>
          <li>
            <a href="#routes" onClick={() => setOpen(false)}>
              Trade <em>lanes</em>
            </a>
          </li>
          <li>
            <a href="#process" onClick={() => setOpen(false)}>
              How it <em>works</em>
            </a>
          </li>
          <li>
            <a href="#words" onClick={() => setOpen(false)}>
              <em>Voices</em>
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
