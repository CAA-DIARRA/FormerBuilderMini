"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type Props = {
  formId: string;
  // Optional: if you also want a public link export somewhere else later
  slug?: string;
  size?: "sm" | "md";
};

export default function ExportButtons({ formId, size = "md" }: Props) {
  const [lang, setLang] = useState<"fr" | "en">("fr");

  // keep in sync with the UI toggle (localStorage 'ui-lang')
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("ui-lang") as "fr" | "en") || "fr";
      setLang(saved);
    } catch {
      setLang("fr");
    }
  }, []);

  const label = lang === "en" ? "Export" : "Exporter";
  const title = lang === "en" ? "Export the Excel report" : "Exporter le rapport Excel";

  const href = `/api/forms/${formId}/export?lang=${lang}`;

  const clsBase =
    "inline-flex items-center justify-center rounded-xl border bg-white hover:bg-neutral-100 transition";
  const cls =
    size === "sm"
      ? `${clsBase} h-9 w-9`
      : `${clsBase} px-3 py-2 gap-2 text-sm`;

  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
    >
      <Download className="h-4 w-4" />
      {size === "md" ? <span>{label}</span> : null}
    </a>
  );
}
