// app/f/[slug]/page.client.tsx
"use client";

import { useEffect, useState } from "react";
import FormClient from "../../components/FormClient";

type FormDTO = {
  id: string;
  title: string | null;
  trainerName: string | null;
  location: string | null;
  sessionDate: string | null;
  slug: string;
  isOpen: boolean;
};

export default function ClientFormPage({ slug }: { slug: string }) {
  const [form, setForm] = useState<FormDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"fr"|"en">("fr");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/forms/by-slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not_found");
        const json = await res.json();
        if (!mounted) return;
        setForm(json.form as FormDTO);
        // détection simple de langue (tu peux forcer ?lang=… si tu veux)
        setLang(navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr");
      } catch (e: any) {
        if (mounted) setErr(e?.message || "load_failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto p-6 text-neutral-500">Chargement…</div>;
  if (err || !form) return <div className="max-w-3xl mx-auto p-6 text-red-600">Formulaire introuvable.</div>;

  // IMPORTANT : pas de key dynamique ici
  return <FormClient form={form} lang={lang} />;
}
