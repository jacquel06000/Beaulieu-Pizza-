"use client";
import { useState, type ComponentProps } from "react";
import { inputClass } from "../ui";

export function PasswordInput(props: ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputClass} pr-24`} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:text-ink" aria-pressed={show}>
        {show ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}
