// app/f/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import FormClient from "../../components/FormClient";
import { useParams, useSearchParams } from "next/navigation";

type FormDto = {
  id: string;
  slug: string;
  title?: string | null;
  trainerName?: string | null;
  sessionDate?: string | null;
  location?: string | null;
  isOpen: boolean;
};

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();

  const [form, setForm] = useState<FormDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // langue stable : ?lang=en | fr sinon détection 1 seule fois
  const lang = useMemo<"fr" | "en">(() => {
    const q = sp?.get("lang");
    if (q === "en") return "en";
    if (q === "fr") return "fr";
    const nav = typeof navigator !== "undefined" ? navigator.language : "fr";
    return nav.toLowerCase().startsWith("en") ? "en" : "fr";
  }, [sp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await fetch(`/api/forms/by-slug/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not_found");
        const j = await res.json();
        if (!cancelled) setForm(j.form);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "load_failed");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (error) return <div className="p-6">Not found</div>;
  if (!form) return <div className="p-6">Loading…</div>;

  // IMPORTANT : pas de key qui change, on passe des props stables
  return <FormClient form={form} lang={lang} />;
}
