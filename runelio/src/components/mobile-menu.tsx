"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const pathname = usePathname();
  // Ferme le menu après navigation.
  const isOpen = open && openedAt === pathname;
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="menu-mobile"
        onClick={() => {
          setOpen(!isOpen);
          setOpenedAt(pathname);
        }}
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-ink/5"
      >
        <span className="sr-only">{isOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {isOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {isOpen && (
        <nav id="menu-mobile" aria-label="Menu mobile" className="absolute inset-x-0 top-16 border-b border-line bg-paper px-4 pb-4 shadow-lg animate-rise">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-ink/5">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
