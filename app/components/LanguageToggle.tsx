"use client";

import { Globe } from "lucide-react";
import { useCallback } from "react";

export type Lang = "fr" | "en";

type Props = {
  value: Lang;
  onChange: (next: Lang) => void;
  className?: string;
};

export default function LanguageToggle({ value, onChange, className }: Props) {
  const next = useCallback(() => onChange(value === "en" ? "fr" : "en"), [value, onChange]);
  const label = value === "en" ? "English" : "Français";

  return (
    <button
      type="button"
      onClick={next}
      className={
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 " +
        (className ?? "")
      }
      aria-label="Toggle language"
      title="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
