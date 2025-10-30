// app/components/PublicFormShell.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import FormClient from "./FormClient";

type Props = {
  form: any;
  serverLang: "fr" | "en";
};

export default function PublicFormShell({ form, serverLang }: Props) {
  // on fige la langue initiale : pas d’impact sur l’URL pendant la saisie
  const initialLang = useRef<"fr" | "en">(serverLang);
  const [lang, setLang] = useState<"fr" | "en">(initialLang.current);

  const Header = useMemo(
    () => (
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 flex items-center justify-end">
        <button
          type="button"
          className="text-sm px-3 py-1.5 border rounded-xl hover:bg-neutral-100"
          onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
        >
          {lang === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
        </button>
      </div>
    ),
    [lang]
  );

  return (
    <div>
      {Header}
      {/* ❗ Aucune prop "key" dynamique ici */}
      <FormClient form={form} lang={lang} />
    </div>
  );
}
