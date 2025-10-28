"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import LanguageToggle, { type Lang } from "../components/LanguageToggle";

/** Types exportés pour que page.tsx puisse les importer */
export type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string | Date; // on accepte Date côté serveur et string côté sérialisation
};

export type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

type Props = {
  forms: FormRow[];
  stats: Stats;
};

const FR = {
  title: "Tableau de bord",
  kpis: {
    totalForms: "Formulaires",
    totalResponses: "Réponses",
    activeForms: "Formulaires actifs",
  },
  actions: {
    newForm: "Nouveau formulaire",
  },
  table: {
    title: "Formations",
    cols: {
      title: "Titre",
      status: "Statut",
      createdAt: "Créé le",
      actions: "Actions",
    },
    open: "Ouvert",
    closed: "Fermé",
    view: "Ouvrir",
    report: "Rapport",
    export: "Exporter",
  },
};

const EN = {
  title: "Dashboard",
  kpis: {
    totalForms: "Forms",
    totalResponses: "Responses",
    activeForms: "Active forms",
  },
  actions: {
    newForm: "New form",
  },
  table: {
    title: "Trainings",
    cols: {
      title: "Title",
      status: "Status",
      createdAt: "Created at",
      actions: "Actions",
    },
    open: "Open",
    closed: "Closed",
    view: "Open",
    report: "Report",
    export: "Export",
  },
};

export default function DashboardClient({ forms, stats }: Props) {
  const [lang, setLang] = useState<Lang>("fr");
  const T = useMemo(() => (lang === "fr" ? FR : EN), [lang]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{T.title}</h1>
        <div className="flex items-center gap-3">
          {/* ⚠️ IMPORTANT : on passe bien value / onChange */}
          <LanguageToggle value={lang} onChange={setLang} />
          <Link
            href={`/forms/new${lang ? `?lang=${lang}` : ""}`}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
          >
            {T.actions.newForm}
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label={T.kpis.totalForms} value={stats.totalForms} />
        <KpiCard label={T.kpis.totalResponses} value={stats.totalResponses} />
        <KpiCard label={T.kpis.activeForms} value={stats.activeForms} />
      </div>

      {/* Table */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{T.table.title}</h2>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left">
                <Th>{T.table.cols.title}</Th>
                <Th>{T.table.cols.status}</Th>
                <Th>{T.table.cols.createdAt}</Th>
                <Th className="text-right">{T.table.cols.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id} className="border-t">
                  <Td className="font-medium">{f.title}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        f.isOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {f.isOpen ? T.table.open : T.table.closed}
                    </span>
                  </Td>
                  <Td>
                    {f.createdAt
                      ? new Date(f.createdAt).toLocaleDateString()
                      : ""}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Lien public du formulaire */}
                      <Link
                        href={`/f/${f.slug}?lang=${lang}`}
                        className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                      >
                        {T.table.view}
                      </Link>

                      {/* Bouton Rapport (page analytique) */}
                      <Link
                        href={`/dashboard/forms/${f.id}/report?lang=${lang}`}
                        className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                      >
                        {T.table.report}
                      </Link>

                      {/* Export Excel (endpoint d’export) */}
                      <a
                        href={`/api/forms/${f.id}/export?lang=${lang}`}
                        className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                      >
                        {T.table.export}
                      </a>
                    </div>
                  </Td>
                </tr>
              ))}

              {forms.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-neutral-500 py-8">
                    —
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
