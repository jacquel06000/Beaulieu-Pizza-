import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import type { Metadata, Viewport } from "next";
import { ConsentProvider } from "@/components/cookie-consent";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://runelio.fr"),
  title: { default: "Runelio — votre préparation course à pied, du 5 km au marathon", template: "%s · Runelio" },
  description:
    "Programme d'entraînement course à pied progressif et personnalisé selon votre objectif, votre niveau et vos disponibilités. 5 km, 10 km, semi-marathon, marathon.",
  openGraph: { siteName: "Runelio", locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#faf7f2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ConsentProvider>
          <SiteHeader />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ConsentProvider>
      </body>
    </html>
  );
}
