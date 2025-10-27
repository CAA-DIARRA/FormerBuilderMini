"use client";

import Link from "next/link";
import { useMemo } from "react";

type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string;
};

type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

export default function DashboardClient({
  forms,
  stats,
}: {
  forms: FormRow[];
  stats: Stats;
}) {
  const pretty = useMemo(
    () => ({
      total: stats?.totalForms ?? 0,
      responses: stats?.totalResponses ?? 0,
      active: stats?.activeForms ?? 0,
    }),
    [stats]
  );

  const onShare = async (f: FormRow) => {
    const url = `${window.location.origin}/f/${f.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copié dans le presse-papiers !");
    } catch {
      alert("Impossible de copier le lien.");
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR");
    } catch {
      return "—";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tableau de bord</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {pretty.total} formulaires • {pretty.responses} réponses •{" "}
            {pretty.active} actifs
          </p>
        </div>

        <Link
          href="/forms/new"
          className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition"
        >
          + Nouveau formulaire
        </Link>
      </header>

      {/* TABLE */}
      <div className="overflow-hidden border border-neutral-200 rounded-2xl shadow-sm bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3 text-left font-semibold text-neutral-700">Titre</th>
              <th className="p-3 text-left font-semibold text-neutral-700">Slug</th>
              <th className="p-3 text-left font-semibold text-neutral-700">Créé le</th>
              <th className="p-3 text-left font-semibold text-neutral-700">Statut</th>
              <th className="p-3 text-left font-semibold text-neutral-700 w-[270px]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {forms.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  Aucun formulaire pour le moment.
                </td>
              </tr>
            )}

            {forms.map((f) => (
              <tr
                key={f.id}
                className="hover:bg-neutral-50 transition-colors duration-150"
              >
                <td className="p-3 font-medium text-neutral-800">{f.title}</td>
                <td className="p-3 text-neutral-600">{f.slug}</td>
                <td className="p-3 text-neutral-600">{fmtDate(f.createdAt)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {f.isOpen ? "Actif" : "Brouillon"}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/f/${f.slug}`}
                      target="_blank"
                      className="px-2.5 py-1.5 border rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      Ouvrir
                    </Link>

                    <button
                      onClick={() => onShare(f)}
                      className="px-2.5 py-1.5 border rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      Partager
                    </button>

                    <Link
                      href={`/forms/${f.id}/report?lang=fr`}
                      className="px-2.5 py-1.5 border rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      Rapport
                    </Link>

                    <a
                      href={`/api/forms/${f.id}/export?lang=fr`}
                      className="px-2.5 py-1.5 border rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      Export FR
                    </a>

                    <a
                      href={`/api/forms/${f.id}/export?lang=en`}
                      className="px-2.5 py-1.5 border rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      Export EN
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
