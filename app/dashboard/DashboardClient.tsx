// app/dashboard/DashboardClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageToggle, { type Lang } from "../components/LanguageToggle";
import ExportButtons from "../components/ExportButtons";
import { Plus, Eye, Share2, QrCode, BarChart3, Trash2 } from "lucide-react";

type FormRow = {
  id: string;
  title: string | null;
  createdAt: string | Date;
  isOpen: boolean;
  slug: string | null;
};

export default function DashboardClient({
  forms,
  stats,
}: {
  forms: FormRow[];
  stats: { totalForms: number; totalResponses: number; activeForms: number };
}) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem("ui-lang") as Lang) || "fr";
    setLang(saved);
  }, []);

  const T = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Dashboard",
        kpis: {
          totalForms: "Total forms",
          totalResponses: "Total responses",
          activeForms: "Active forms",
        },
        newForm: "New form",
        table: {
          num: "#",
          formTitle: "Form title",
          createdOn: "Created on",
          actions: "Actions",
          status: {
            active: "Active",
            draft: "Draft",
          },
        },
        actions: {
          view: "View",
          share: "Share",
          qr: "QR code",
          analytics: "Analytics",
          delete: "Delete",
        },
      };
    }
    return {
      title: "Tableau de bord",
      kpis: {
        totalForms: "Total formulaires",
        totalResponses: "Total réponses",
        activeForms: "Formulaires actifs",
      },
      newForm: "Nouveau formulaire",
      table: {
        num: "#",
        formTitle: "Titre du formulaire",
        createdOn: "Créé le",
        actions: "Actions",
        status: {
          active: "Actif",
          draft: "Brouillon",
        },
      },
      actions: {
        view: "Voir",
        share: "Partager",
        qr: "QR code",
        analytics: "Statistiques",
        delete: "Supprimer",
      },
    };
  }, [lang]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{T.title}</h1>
        <div className="flex items-center gap-2">
          <LanguageToggle
            value={lang}
            onChange={(next) => {
              setLang(next);
              try {
                localStorage.setItem("ui-lang", next);
              } catch {}
            }}
          />
          <a
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white"
          >
            <Plus className="w-4 h-4" />
            {T.newForm}
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-600">{T.kpis.totalForms}</div>
          <div className="text-3xl font-semibold mt-2">{stats.totalForms}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-600">
            {T.kpis.totalResponses}
          </div>
          <div className="text-3xl font-semibold mt-2">
            {stats.totalResponses}
          </div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-600">{T.kpis.activeForms}</div>
          <div className="text-3xl font-semibold mt-2">{stats.activeForms}</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 w-12">{T.table.num}</th>
              <th className="px-4 py-3">{T.table.formTitle}</th>
              <th className="px-4 py-3">{T.table.createdOn}</th>
              <th className="px-4 py-3">{T.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f, idx) => (
              <tr key={f.id} className="border-t">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{f.title ?? "—"}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        f.isOpen
                          ? "bg-black text-white"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {f.isOpen ? T.table.status.active : T.table.status.draft}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {new Date(f.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/dashboard/forms/${f.id}`}
                      title={T.actions.view}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border hover:bg-neutral-100"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      title={T.actions.share}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border bg-white hover:bg-neutral-100"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <a
                      href={`/dashboard/forms/${f.id}/qrcode`}
                      title={T.actions.qr}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border hover:bg-neutral-100"
                    >
                      <QrCode className="w-4 h-4" />
                    </a>
                    <a
                      href={`/dashboard/forms/${f.id}/analytics`}
                      title={T.actions.analytics}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border hover:bg-neutral-100"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </a>

                    {/* --- Export Excel (langue auto) --- */}
                    <ExportButtons formId={f.id} size="sm" />

                    <button
                      title={T.actions.delete}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border hover:bg-neutral-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {forms.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                  {lang === "en" ? "No form yet" : "Aucun formulaire pour le moment"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
