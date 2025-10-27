"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageToggle, { type Lang } from "./LanguageToggle";
import FormClient from "./FormClient";

export default function PublicFormShell({
  form,
  serverLang = "fr",
}: {
  form: any;
  serverLang?: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // lang pilotée par l'URL (?lang=fr|en)
  const urlLang = (sp.get("lang") === "en" ? "en" : "fr") as Lang;
  const [lang, setLang] = useState<Lang>(urlLang ?? serverLang);

  // garde l’URL en phase avec l’état
  useEffect(() => {
    const current = sp.get("lang") === "en" ? "en" : "fr";
    if (current !== lang) {
      const p = new URLSearchParams(sp);
      p.set("lang", lang);
      router.replace(`${pathname}?${p.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // si l’utilisateur change l’URL manuellement, on reflète
  useEffect(() => {
    const current = sp.get("lang") === "en" ? "en" : "fr";
    if (current !== lang) setLang(current as Lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const headerLine = useMemo(() => {
    const d = form?.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "";
    if (lang === "en") {
      return `Trainer: ${form?.trainerName ?? ""} • Date: ${d} • Location: ${form?.location ?? ""}`;
    }
    return `Formateur : ${form?.trainerName ?? ""} • Date : ${d} • Lieu : ${form?.location ?? ""}`;
  }, [form, lang]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {lang === "en" ? form?.title ?? "Training evaluation" : form?.title ?? "Évaluation de formation"}
          </h1>
          <p className="text-sm text-neutral-600">{headerLine}</p>
        </div>
        <LanguageToggle value={lang} onChange={setLang} />
      </div>

      <FormClient form={form} lang={lang} />
    </div>
  );
}
