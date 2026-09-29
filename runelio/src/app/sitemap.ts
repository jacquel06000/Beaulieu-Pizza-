import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://runelio.fr";
  return ["", "/tarifs", "/inscription", "/connexion", "/legal/mentions-legales", "/legal/confidentialite", "/legal/cgu-cgv", "/legal/cookies"].map((p) => ({
    url: `${base}${p}`,
  }));
}
