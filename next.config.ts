import type { NextConfig } from "next";
import path from "node:path";

// Enable Cloudflare bindings (R2, IMAGES) during `next dev` when present.
// No-op outside Cloudflare environments.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "motolinkers.com" },
      { protocol: "https", hostname: "images.motolinkers.com" },
    ],
  },
  async redirects() {
    return [
      // Old WordPress paths → Next.js routes
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/about-us/", destination: "/about", permanent: true },
      { source: "/our-cars", destination: "/vehicles", permanent: true },
      { source: "/our-cars/", destination: "/vehicles", permanent: true },
      { source: "/cars", destination: "/vehicles", permanent: true },
      { source: "/cars/", destination: "/vehicles", permanent: true },
      { source: "/cars/:slug", destination: "/vehicles/:slug", permanent: true },
      { source: "/cars/:slug/", destination: "/vehicles/:slug", permanent: true },
      { source: "/services", destination: "/how-it-works", permanent: true },
      { source: "/services/", destination: "/how-it-works", permanent: true },
      { source: "/blog", destination: "/news", permanent: true },
      { source: "/blog/", destination: "/news", permanent: true },
      { source: "/blog/:slug", destination: "/news/:slug", permanent: true },
      { source: "/blog/:slug/", destination: "/news/:slug", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/contact-us/", destination: "/contact", permanent: true },

      // WP-internal artefacts that should never appear publicly
      { source: "/wp-admin/:path*", destination: "/", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: true },
      { source: "/feed", destination: "/news", permanent: true },
      { source: "/feed/", destination: "/news", permanent: true },
    ];
  },
};

export default nextConfig;
