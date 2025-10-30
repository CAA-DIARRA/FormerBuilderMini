"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FormClient from "./FormClient";

export type Lang = "fr" | "en";

export default function PublicFormShell({
  form,
  serverLang = "fr",
}: {
  form: any;
  serverLang?: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // État local de langue (ne dépend QUE de serverLang au monté)
  const [lang, setLang] = useState<Lang>(serverLang);

  // Synchronisation d’URL SANS BOUCLE :
  // - dépend SEULEMENT de `lang`
  // - on ne remplace l’URL que si la valeur actuelle est différente
  useEffect(() => {
    const current = searchParams.get("lang") === "en" ? "en" : "fr";
    if (current !== lang) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("lang", lang);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]); // 👈 surtout pas `searchParams` ici

  // Mémoisation des libellés si tu en as besoin (optionnel)
  const effectiveLang = useMemo<Lang>(() => lang, [lang]);

  return (
    <div>
      {/* Si tu as un toggle de langue sur le public form, branche-le ici.
          Exemple:
          <button onClick={() => setLang(effectiveLang === "fr" ? "en" : "fr")}>
            {effectiveLang === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
          </button>
      */}
      <FormClient form={form} lang={effectiveLang} />
    </div>
  );
}
