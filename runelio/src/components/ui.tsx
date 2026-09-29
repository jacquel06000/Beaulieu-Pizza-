import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "brand" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft shadow-sm",
  brand: "bg-brand text-ink hover:brightness-105 shadow-sm",
  secondary: "bg-white text-ink ring-1 ring-line hover:ring-ink/30",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-danger text-white hover:brightness-110",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 min-h-11 text-[0.95rem] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...p} />;
}

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...p} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl bg-card p-5 sm:p-6 ring-1 ring-line shadow-[0_1px_2px_rgba(20,23,43,0.04)]", className)} {...p} />;
}

type Tone = "neutral" | "brand" | "lime" | "sky" | "mint" | "violet" | "warn" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink",
  brand: "bg-brand-soft text-brand-strong",
  lime: "bg-lime-soft text-ink",
  sky: "bg-sky-soft text-[#1d4ed8]",
  mint: "bg-mint-soft text-mint",
  violet: "bg-violet-soft text-violet",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...p} />;
}

export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "warning" | "critical" | "success"; title?: string; children: ReactNode; className?: string }) {
  const styles = {
    info: "bg-sky-soft/60 ring-sky/20",
    warning: "bg-warn-soft ring-warn/20",
    critical: "bg-danger-soft ring-danger/25",
    success: "bg-mint-soft ring-mint/20",
  }[tone];
  return (
    <div role={tone === "critical" ? "alert" : "status"} className={cx("rounded-xl p-4 ring-1 text-sm leading-relaxed", styles, className)}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 animate-rise">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand-strong mb-2">{eyebrow}</p>}
      <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
      {children && <div className="mt-3 text-muted max-w-2xl leading-relaxed">{children}</div>}
    </header>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base ring-1 ring-line focus:ring-2 focus:ring-sky outline-none transition placeholder:text-muted/70 aria-[invalid=true]:ring-danger";

export function Field({ id, label, hint, error, children, optional }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted">(facultatif)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight", className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#14172b" />
        <path d="M9 22c3.5-9 9-12 14-12" stroke="#c8f25c" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <circle cx="23" cy="10" r="3.2" fill="#ff5a36" />
      </svg>
      runelio
    </span>
  );
}
