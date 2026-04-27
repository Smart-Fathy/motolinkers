import type { MetadataRoute } from "next";
import { getAllVehicles } from "@/lib/repositories/vehicles";
import { getAllNews } from "@/lib/repositories/news";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motolinkers.com";

export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/vehicles",
  "/about",
  "/calculator",
  "/contact",
  "/how-it-works",
  "/faq",
  "/news",
  "/terms",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, news] = await Promise.all([getAllVehicles(), getAllNews()]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  const vehicleEntries: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${SITE}/vehicles/${v.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${SITE}/news/${n.slug}`,
    lastModified: n.published_at ? new Date(n.published_at) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...vehicleEntries, ...newsEntries];
}
