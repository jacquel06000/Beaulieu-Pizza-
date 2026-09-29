import Link from "next/link";
import { getSessionUser } from "@/server/session";
import { MobileMenu } from "./mobile-menu";
import { ButtonLink, Container, Logo } from "./ui";

export async function SiteHeader() {
  let user = null;
  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }
  const links = user
    ? [
        { href: "/espace", label: "Mon espace" },
        { href: "/espace/programme", label: "Programme" },
        { href: "/espace/cadeaux", label: "Cadeaux" },
        { href: "/espace/compte", label: "Compte" },
      ]
    : [
        { href: "/#fonctionnement", label: "Fonctionnement" },
        { href: "/tarifs", label: "Tarif" },
      ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Aller au contenu
      </a>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Runelio, accueil">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-ink/5">
              {l.label}
            </Link>
          ))}
          {user ? null : (
            <>
              <Link href="/connexion" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-ink/5">
                Connexion
              </Link>
              <ButtonLink href="/inscription" className="ml-2">
                Créer un compte
              </ButtonLink>
            </>
          )}
        </nav>
        <MobileMenu links={user ? links : [...links, { href: "/connexion", label: "Connexion" }, { href: "/inscription", label: "Créer un compte gratuit" }]} />
      </Container>
    </header>
  );
}
