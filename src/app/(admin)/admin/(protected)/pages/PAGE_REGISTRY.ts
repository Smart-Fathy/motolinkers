// Single source of truth for what pages exist on the public site. Drives
// the /admin/pages list and the slug whitelist on every server action
// that touches page_heroes / page_sections. Keep in sync with
// src/lib/repositories/pages.ts → PageSlug.
import type { PageSlug } from "@/lib/repositories/pages";

export type PageRegistryEntry = {
  slug: PageSlug;
  label: string;
  publicPath: string;
};

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  { slug: "home", label: "Home", publicPath: "/" },
  { slug: "about", label: "About", publicPath: "/about" },
  { slug: "how-it-works", label: "How it works", publicPath: "/how-it-works" },
  { slug: "vehicles", label: "Vehicles", publicPath: "/vehicles" },
  { slug: "news", label: "News & Insights", publicPath: "/news" },
  { slug: "contact", label: "Contact", publicPath: "/contact" },
  { slug: "calculator", label: "Calculator", publicPath: "/calculator" },
  { slug: "faq", label: "FAQ", publicPath: "/faq" },
  { slug: "terms", label: "Terms", publicPath: "/terms" },
  { slug: "privacy", label: "Privacy", publicPath: "/privacy" },
];

export function isValidPageSlug(value: unknown): value is PageSlug {
  if (typeof value !== "string") return false;
  return PAGE_REGISTRY.some((p) => p.slug === value);
}
