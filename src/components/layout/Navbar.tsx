"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/how-it-works", label: "How it Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/news", label: "News" },
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
        <Link href="/" className="nav__logo" data-hover>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.motolinkers.com/avatar-11-max-reev/05_logo_copy-1__1_-removebg-preview2.png"
            alt="MotoLinkers"
            style={{ height: 36, width: "auto", display: "block" }}
          />
        </Link>
        <div className="nav__links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav__link" data-hover>
              {l.label}
            </Link>
          ))}
        </div>
        <Link href="/calculator" className="nav__cta" data-hover>
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
        </Link>
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
            <Link href="/vehicles" onClick={() => setOpen(false)}>
              The <em>Fleet</em>
            </Link>
          </li>
          <li>
            <Link href="/how-it-works" onClick={() => setOpen(false)}>
              How it <em>works</em>
            </Link>
          </li>
          <li>
            <Link href="/about" onClick={() => setOpen(false)}>
              <em>About</em>
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={() => setOpen(false)}>
              Get in <em>touch</em>
            </Link>
          </li>
          <li>
            <Link href="/news" onClick={() => setOpen(false)}>
              <em>News</em>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
