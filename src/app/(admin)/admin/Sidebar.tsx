"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/motoagent", label: "MotoAgent" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/calculator", label: "Calculator" },
];

export default function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button
        type="button"
        className="adm__hamburger"
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <aside className={`adm__sidebar${open ? " is-open" : ""}`}>
        <h1 className="adm__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.motolinkers.com/avatar-11-max-reev/05_logo_copy-1__1_-removebg-preview2.png"
            alt="MotoLinkers"
            style={{ height: 32, width: "auto", display: "block" }}
          />
        </h1>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`adm__nav-link${isActive(n.href, n.exact) ? " is-active" : ""}`}
            onClick={() => setOpen(false)}
          >
            {n.label}
          </Link>
        ))}
        <div className="adm__nav-divider" />
        <Link href="/" className="adm__nav-link">
          ← Back to site
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="adm__nav-link"
            style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none" }}
          >
            Sign out
          </button>
        </form>
        <div className="adm__user">{email ?? "Signed in"}</div>
      </aside>
    </>
  );
}
