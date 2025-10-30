"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FormClient from "./FormClient";

/**
 * Shell client SUPER STABLE :
 * - lit la langue initiale une seule fois (depuis props.serverLang)
 * - ne modifie pas l’URL automatiquement pendant que tu saisis
 * - ne remonte jamais <FormClient /> quand tu tapes
 */
type Props = {
  form: any;
  serverLang: "fr" | "en";
};

export default function PublicFormShell({ form, serverLang }: Props) {
  // On fige la langue initiale dans un useRef pour ne pas re-créer des objets
  const initialLang = useRef<"fr" | "en">(serverLang);
  const [lang, setLang] = useState<"fr" | "en">(initialLang.current);

  // OPTIONNEL : si tu veux afficher un petit switch langue en haut
  // (il NE change pas l'URL, donc pas de remount causé par le routeur)
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

  // Rien ici ne touche à l'URL pendant la saisie → pas de remount
  // On ne repassera pas un "key" différent à FormClient → focus conservé

  return (
    <div>
      {Header}
      <FormClient form={form} lang={lang} />
    </div>
  );
}
