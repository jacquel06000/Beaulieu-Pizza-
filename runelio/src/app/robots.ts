import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://runelio.fr";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/espace", "/admin", "/api", "/abonnement"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
