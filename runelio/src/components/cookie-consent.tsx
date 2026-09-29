"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, CONSENT_VERSION, OPTIONAL_CATEGORIES, parseConsent, type ConsentState } from "@/lib/consent";
import { Button } from "./ui";

type Ctx = { consent: ConsentState | null; openPreferences: () => void };
const ConsentContext = createContext<Ctx>({ consent: null, openPreferences: () => {} });

function readCookie(): ConsentState | null {
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(m?.split("=").slice(1).join("="));
}

function writeCookie(choices: Record<string, boolean>): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, date: new Date().toISOString(), choices };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  return state;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Lecture unique du cookie au montage (côté client uniquement).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readCookie());
    setReady(true);
  }, []);

  const save = useCallback((choices: Record<string, boolean>) => {
    setConsent(writeCookie(choices));
    setOpen(false);
  }, []);

  const needBanner = ready && OPTIONAL_CATEGORIES.length > 0 && !consent;
  const all = (v: boolean) => Object.fromEntries(OPTIONAL_CATEGORIES.map((c) => [c.id, v]));

  return (
    <ConsentContext.Provider value={{ consent, openPreferences: () => setOpen(true) }}>
      {children}
      {needBanner && !open && (
        <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-line">
          <p className="text-sm leading-relaxed">
            Nous souhaitons utiliser des traceurs facultatifs. Ils ne sont déposés qu&apos;avec votre accord, modifiable à tout moment.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => save(all(false))}>Tout refuser</Button>
            <Button variant="secondary" onClick={() => setOpen(true)}>Personnaliser</Button>
            <Button onClick={() => save(all(true))}>Tout accepter</Button>
          </div>
        </div>
      )}
      {open && <Preferences initial={consent?.choices ?? all(false)} onSave={save} onClose={() => setOpen(false)} />}
    </ConsentContext.Provider>
  );
}

function Preferences({ initial, onSave, onClose }: { initial: Record<string, boolean>; onSave: (c: Record<string, boolean>) => void; onClose: () => void }) {
  const [choices, setChoices] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="cookie-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="cookie-title" className="text-xl font-bold">Gestion des cookies</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-xl bg-paper p-4">
            <p className="font-semibold">Strictement nécessaires — toujours actifs</p>
            <p className="text-muted mt-1">Session de connexion, sécurité et mémorisation de ce choix. Ils ne nécessitent pas de consentement.</p>
          </div>
          {OPTIONAL_CATEGORIES.length === 0 ? (
            <p className="text-muted">Runelio n&apos;utilise actuellement aucun cookie ou traceur facultatif (ni mesure d&apos;audience, ni publicité).</p>
          ) : (
            OPTIONAL_CATEGORIES.map((c) => (
              <label key={c.id} className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-line">
                <input type="checkbox" className="mt-1 size-5 accent-ink" checked={Boolean(choices[c.id])} onChange={(e) => setChoices({ ...choices, [c.id]: e.target.checked })} />
                <span>
                  <span className="font-semibold">{c.label}</span> <span className="text-muted">({c.provider})</span>
                  <span className="block text-muted mt-1">{c.description}</span>
                </span>
              </label>
            ))
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          {OPTIONAL_CATEGORIES.length > 0 && <Button onClick={() => onSave(choices)}>Enregistrer mes choix</Button>}
        </div>
      </div>
    </div>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}

export function CookieSettingsButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Gérer les cookies
    </button>
  );
}

/** N'affiche (et donc ne charge) son contenu qu'après consentement explicite. */
export function ConsentGate({ category, children }: { category: string; children: ReactNode }) {
  const { consent } = useConsent();
  return consent?.choices[category] ? <>{children}</> : null;
}
