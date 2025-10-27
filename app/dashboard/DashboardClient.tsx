"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageToggle, { type Lang } from "../components/LanguageToggle";
import { Eye, Share2, QrCode, BarChart2, Trash2, Plus } from "lucide-react";

type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

export type FormRow = {
  id: string;
  title: string;
  createdAt: string | Date | null;
  isOpen: boolean;
  slug: string;
};

type Props = {
  forms: FormRow[];
  stats: Stats;
};

export default function DashboardClient({ forms, stats }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialLang = (sp.get("lang") === "en" ? "en" : "fr") as Lang;
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    const current = sp.get("lang") === "en" ? "en" : "fr";
    if (current !== lang) {
      const next = new URLSearchParams(sp);
      next.set("lang", lang);
      router.replace(`${pathname}?${next.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const current = (sp.get("lang") === "en" ? "en" : "fr") as Lang;
    if (current !== lang) setLang(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const T = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Dashboard",
        stat1: "Total forms",
        stat2: "Total responses",
        stat3: "Active forms",
        colIdx: "#",
        colTitle: "Dashboard",
        colCreated: "Created",
        colActions: "Actions",
        badgeActive: "Active",
        badgeDraft: "Draft",
        open: "Open",
        share: "Share",
        qr: "QR",
        report: "Report",
        del: "Delete",
        newForm: "New form",
        exportFr: "Export FR",
        exportEn: "Export EN",
      };
    }
    return {
      title: "Tableau de bord",
      stat1: "Total formulaires",
      stat2: "Total réponses",
      stat3: "Formulaires actifs",
      colIdx: "#",
      colTitle: "Tableau de bord",
      colCreated: "Créé le",
      colActions: "Actions",
      badgeActive: "Actif",
      badgeDraft: "Brouillon",
      open: "Ouvrir",
      share: "Partager",
      qr: "QR",
      report: "Rapport",
      del: "Supprimer",
      newForm: "Nouveau formulaire",
      exportFr: "Export FR",
      exportEn: "Export EN",
    };
  }, [lang]);

  const delForm = async (id: string) => {
    const ok =
      lang === "en"
        ? window.confirm("Delete this form and its responses?")
        : window.confirm("Supprimer ce formulaire et ses réponses ?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      router.refresh();
    } catch {
      alert(lang === "en" ? "Deletion failed" : "La suppression a échoué");
    }
  };

  const fmtDate = (d: string | Date | null) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    try {
      return date.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{T.title}</h1>
        <div className="flex items-center gap-3">
          {/* ✅ Correction: on passe bien les props nécessaires */}
          <LanguageToggle value={lang} onChange={setLang} />
          <Link
            href={`/forms/new${lang ? `?lang=${lang}` : ""}`}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {T.newForm}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.stat1}</div>
          <div className="text-3xl font-semibold mt-1">{stats.totalForms}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.stat2}</div>
          <div className="text-3xl font-semibold mt-1">{stats.totalResponses}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.stat3}</div>
          <div className="text-3xl font-semibold mt-1">{stats.activeForms}</div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left px-4 py-3 w-10">{T.colIdx}</th>
              <th className="text-left px-4 py-3">{T.colTitle}</th>
              <th className="text-left px-4 py-3">{T.colCreated}</th>
              <th className="text-left px-4 py-3">{T.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f, i) => (
              <tr key={f.id} className="border-t">
                <td className="px-4 py-4 align-top">{i + 1}</td>
                <td className="px-4 py-4 align-top">
                  <div className="font-medium">{f.title}</div>
                  <div className="mt-2 h-3 rounded-full bg-neutral-200 overflow-hidden max-w-[560px]">
                    <div
                      className={`h-full ${f.isOpen ? "bg-black" : "bg-neutral-300"}`}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                        f.isOpen
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {f.isOpen ? T.badgeActive : T.badgeDraft}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">{fmtDate(f.createdAt)}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-neutral-50"
                      href={`/forms/${f.id}${lang ? `?lang=${lang}` : ""}`}
                      title={T.open}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <Link
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-neutral-50"
                      href={`/f/${f.slug}${lang ? `?lang=${lang}` : ""}`}
                      title={T.share}
                    >
                      <Share2 className="w-4 h-4" />
                    </Link>

                    <Link
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-neutral-50"
                      href={`/f/${f.slug}${lang ? `?lang=${lang}` : ""}`}
                      title={T.qr}
                    >
                      <QrCode className="w-4 h-4" />
                    </Link>

                    <Link
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-neutral-50"
                      href={`/dashboard/forms/${f.id}/report${lang ? `?lang=${lang}` : ""}`}
                      title={T.report}
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => delForm(f.id)}
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-red-50 text-red-600 border-red-200"
                      title={T.del}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <a
                      className="text-xs underline text-neutral-600 hover:text-black"
                      href={`/api/forms/${f.id}/export?lang=fr`}
                    >
                      {T.exportFr}
                    </a>
                    <a
                      className="text-xs underline text-neutral-600 hover:text-black"
                      href={`/api/forms/${f.id}/export?lang=en`}
                    >
                      {T.exportEn}
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                  {lang === "en" ? "No forms yet." : "Aucun formulaire pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
