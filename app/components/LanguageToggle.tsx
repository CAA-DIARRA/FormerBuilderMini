"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export type Lang = "fr" | "en";

export default function LanguageToggle({
  value,
  onChange,
  className = "",
  labelFr = "Français",
  labelEn = "English",
}: {
  value?: Lang;
  onChange?: (lang: Lang) => void;
  className?: string;
  labelFr?: string;
  labelEn?: string;
}) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    if (value) { setLang(value); return; }
    const saved = (localStorage.getItem("ui-lang") as Lang) || "fr";
    setLang(saved);
  }, [value]);

  const setBoth = (next: Lang) => {
    setLang(next);
    try { localStorage.setItem("ui-lang", next); } catch {}
    onChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={() => setBoth(lang === "fr" ? "en" : "fr")}
      className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white hover:bg-neutral-100 ${className}`}
      title={lang === "fr" ? labelEn : labelFr}
    >
      <Globe className="w-4 h-4" />
      <span>{lang === "fr" ? labelEn : labelFr}</span>
    </button>
  );
}
