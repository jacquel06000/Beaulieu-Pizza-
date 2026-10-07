"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "../ui";

const items = [
  { href: "/espace", label: "Accueil" },
  { href: "/espace/programme", label: "Programme" },
  { href: "/espace/questionnaire", label: "Questionnaire" },
  { href: "/espace/cadeaux", label: "Cadeaux du mois" },
  { href: "/espace/facturation", label: "Facturation" },
  { href: "/espace/compte", label: "Compte" },
];

/** `showGiveaways` : la page « Cadeaux du mois » n'est visible que si les tirages sont activés (GIVEAWAYS_ENABLED). */
export function SpaceNav({ isAdmin, showGiveaways }: { isAdmin: boolean; showGiveaways: boolean }) {
  const path = usePathname();
  const visible = showGiveaways ? items : items.filter((i) => i.href !== "/espace/cadeaux");
  const all = isAdmin ? [...visible, { href: "/admin", label: "Admin" }] : visible;
  return (
    <nav aria-label="Mon espace" className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
      <ul className="flex gap-2 min-w-max">
        {all.map((i) => {
          const active = i.href === "/espace" ? path === "/espace" : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? "page" : undefined} className={cx("block rounded-full px-4 py-2 text-sm font-semibold ring-1 transition", active ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30")}>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
