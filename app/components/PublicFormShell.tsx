"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageToggle, { type Lang } from "./LanguageToggle";
import FormClient from "./FormClient";

export default function PublicFormShell({
  form,
  serverLang,
}: {
  form: any;
  serverLang: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [lang, setLang] = useState<Lang>(serverLang);

  // Au mount : si pas de ?lang, on utilise localStorage puis on pousse dans l’URL
  useEffect(() => {
    const urlLang = sp.get("lang");
    if (urlLang === "fr" || urlLang === "en") {
      setLang(urlLang);
      try { localStorage.setItem("ui-lang", urlLang); } catch {}
      return;
    }
    let saved: Lang = serverLang;
    try {
      saved = (localStorage.getItem("ui-lang") as Lang) || serverLang;
    } catch {}
    setLang(saved);
    const q = new URLSearchParams(Array.from(sp.entries()));
    q.set("lang", saved);
    router.replace(`${pathname}?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLangChange = (next: Lang) => {
    setLang(next);
    try { localStorage.setItem("ui-lang", next); } catch {}
    const q = new URLSearchParams(Array.from(sp.entries()));
    q.set("lang", next);
    router.replace(`${pathname}?${q.toString()}`);
  };

  const ToggleBar = useMemo(
    () => (
      <div className="w-full flex justify-end p-4">
        <LanguageToggle value={lang} onChange={onLangChange} />
      </div>
    ),
    [lang]
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {ToggleBar}
      <FormClient form={form} lang={lang} />
    </div>
  );
}
