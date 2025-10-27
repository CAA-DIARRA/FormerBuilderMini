"use client";

import Link from "next/link";
import { useMemo } from "react";

/** Le shape attendu par la page serveur */
export type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string | Date; // on accepte ISO string ou Date
};

export type Stats = {
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
  /** Normalisation simple */
  const list = useMemo<FormRow[]>(
    () =>
      (forms ?? []).map((f) => ({
        ...f,
        createdAt:
          typeof f.createdAt === "string"
            ? f.createdAt
            : (f.createdAt as Date)?.toString(),
      })),
    [forms]
  );

  const fmtDate = (d: string | Date) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR");
    } catch {
      return "—";
    }
  };

  const copyShare = async (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copié !");
    } catch {
      alert(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Titre */}
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>

      {/* Cartes de stats (comme avant) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total formulaires"
          value={stats.totalForms}
          icon="🗂️"
        />
        <StatCard title="Total réponses" value={stats.totalResponses} icon="👤" />
        <StatCard title="Formulaires actifs" value={stats.activeForms} icon="📈" />
      </div>

      {/* Tableau principal (design “avant”) */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left text-neutral-700">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Tableau de bord</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 w-[420px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {list.map((f, idx) => (
              <tr key={f.id} className="align-top hover:bg-neutral-50/60">
                {/* # */}
                <td className="px-4 py-4 text-neutral-500">{idx + 1}</td>

                {/* Titre + petit sous-badge “Actif/Brouillon” style ancien */}
                <td className="px-4 py-4">
                  <div className="font-semibold">{f.title}</div>
                  <div className="mt-2 h-3 w-full max-w-xl rounded-full bg-neutral-200">
                    {/* simple barre “remplie” noire comme sur la capture */}
                    <div className="h-3 rounded-full bg-black w-[85%]" />
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-4 text-neutral-600">{fmtDate(f.createdAt)}</td>

                {/* Statut (badge) */}
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      f.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {f.isOpen ? "Actif" : "Brouillon"}
                  </span>
                </td>

                {/* Actions (rangée + rangée export en dessous) */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/f/${f.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-neutral-700 hover:text-black"
                        title="Ouvrir"
                      >
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-black" />
                        Ouvrir
                      </Link>

                      <button
                        onClick={() => copyShare(f.slug)}
                        className="inline-flex items-center gap-2 text-neutral-700 hover:text-black"
                        title="Partager"
                      >
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-400" />
                        Partager
                      </button>

                      <Link
                        href={`/forms/${f.id}/report?lang=fr`}
                        className="inline-flex items-center gap-2 text-neutral-700 hover:text-black"
                        title="Rapport"
                      >
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-400" />
                        Rapport
                      </Link>
                    </div>
                  </div>

                  {/* Ligne export comme avant (petits boutons) */}
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={`/api/forms/${f.id}/export?lang=fr`}
                      className="px-3 py-1 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    >
                      Export FR
                    </a>
                    <a
                      href={`/api/forms/${f.id}/export?lang=en`}
                      className="px-3 py-1 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    >
                      Export EN
                    </a>
                  </div>
                </td>
              </tr>
            ))}

            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  Aucun formulaire pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- UI bits ------------------------------- */

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="text-sm text-neutral-600">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
