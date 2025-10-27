// app/dashboard/DashboardClient.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

type FormRow = {
  id: string;
  title: string | null;
  slug: string;
  isOpen: boolean;
  createdAt: string | null; // ISO string (vient du Server Component)
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
    if (navigator.share) {
      try {
        await navigator.share({ title: f.title ?? "Formulaire", url });
        return;
      } catch {
        /* noop */
      }
    }
    await navigator.clipboard.writeText(url);
    alert("Lien copié dans le presse-papiers");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-neutral-600">
          {pretty.total} formulaires • {pretty.responses} réponses • {pretty.active} actifs
        </p>
      </header>

      <div className="overflow-x-auto border rounded-2xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-3">Titre</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Créé le</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  Aucun formulaire
                </td>
              </tr>
            )}

            {forms.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.title ?? "Sans titre"}</td>
                <td className="p-3">{f.slug}</td>
                <td className="p-3">
                  {f.createdAt
                    ? new Date(f.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">
                  <span className={f.isOpen ? "text-green-700" : "text-neutral-500"}>
                    {f.isOpen ? "Actif" : "Brouillon"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/f/${f.slug}`}
                      className="px-2 py-1 rounded border hover:bg-neutral-50"
                      target="_blank"
                    >
                      Ouvrir
                    </Link>

                    <button
                      onClick={() => onShare(f)}
                      className="px-2 py-1 rounded border hover:bg-neutral-50"
                    >
                      Partager
                    </button>

                    {/* Bouton Rapport (page analytics) */}
                    <Link
                      href={`/forms/${f.id}/report?lang=fr`}
                      className="px-2 py-1 rounded border hover:bg-neutral-50"
                      title="Voir statistiques, réponses agrégées et graphiques"
                    >
                      Rapport
                    </Link>

                    {/* (Optionnel) Exports Excel FR/EN */}
                    <a
                      href={`/api/forms/${f.id}/export?lang=fr`}
                      className="px-2 py-1 rounded border hover:bg-neutral-50"
                      title="Exporter en Excel (FR)"
                    >
                      Export FR
                    </a>
                    <a
                      href={`/api/forms/${f.id}/export?lang=en`}
                      className="px-2 py-1 rounded border hover:bg-neutral-50"
                      title="Exporter en Excel (EN)"
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
