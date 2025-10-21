import { PrismaClient } from "@prisma/client";
import FormClient from "../../components/FormClient";
import { notFound } from "next/navigation";

// côté serveur
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string; debug?: string };
}) {
  const prisma = new PrismaClient();
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });
  if (!form) return notFound();

  // langue initiale venue de l'URL pour le premier rendu
  const serverLang = (searchParams?.lang === "en" ? "en" : "fr") as "fr" | "en";

  if (searchParams?.debug === "1") {
    return (
      <pre style={{ padding: 16 }}>
        {"DEBUG VIEW\n\n"}
        {JSON.stringify(
          {
            slug: params.slug,
            lang: serverLang,
            title: form.title,
            trainerName: form.trainerName,
            sessionDate: form.sessionDate,
            location: form.location,
            isOpen: form.isOpen,
          },
          null,
          2
        )}
      </pre>
    );
  }

  // on délègue le sélecteur de langue au client (pour persistance & URL)
  return <ClientWrapper form={form} serverLang={serverLang} />;
}

/* ---------------- Client wrapper pour le toggle + synchro URL ---------------- */

"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageToggle, { type Lang } from "../../components/LanguageToggle";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function ClientWrapper({ form, serverLang }: { form: any; serverLang: Lang }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // source de vérité côté client :
  const [lang, setLang] = useState<Lang>(serverLang);

  // au mount : si pas de ?lang dans l’URL, on essaie localStorage
  useEffect(() => {
    const urlLang = sp.get("lang");
    if (urlLang === "fr" || urlLang === "en") {
      setLang(urlLang);
      localStorage.setItem("ui-lang", urlLang);
      return;
    }
    const saved = (localStorage.getItem("ui-lang") as Lang) || serverLang;
    setLang(saved);
    // maj URL sans recharger
    const q = new URLSearchParams(Array.from(sp.entries()));
    q.set("lang", saved);
    router.replace(`${pathname}?${q.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quand on clique sur le toggle → maj state + localStorage + URL
  const onLangChange = (next: Lang) => {
    setLang(next);
    localStorage.setItem("ui-lang", next);
    const q = new URLSearchParams(Array.from(sp.entries()));
    q.set("lang", next);
    router.replace(`${pathname}?${q.toString()}`);
  };

  // petit header flottant (toggle)
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
