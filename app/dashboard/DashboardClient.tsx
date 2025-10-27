"use client";

import Link from "next/link";
import { Eye, Share2, QrCode, BarChart3, Trash2 } from "lucide-react";
import { useCallback } from "react";

export type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string; // ISO string
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
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

  const copyShare = useCallback(async (slug: string) => {
    const url = `${location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copié dans le presse-papiers");
    } catch {
      prompt("Copiez l’URL :", url);
    }
  }, []);

  const onDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce formulaire ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) location.reload();
    else alert("Suppression impossible.");
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Titre */}
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

      {/* Cartes de stats (même look que ta capture) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total formulaires" value={stats.totalForms} icon={<DocumentIcon />} />
        <StatCard title="Total réponses" value={stats.totalResponses} icon={<UserIcon />} />
        <StatCard title="Formulaires actifs" value={stats.activeForms} icon={<ChartIcon />} />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left text-neutral-700">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Tableau de bord</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {forms.map((f, i) => (
              <tr key={f.id} className="align-middle">
                <td className="px-4 py-4 text-neutral-500">{i + 1}</td>

                <td className="px-4 py-4">
                  <div className="font-semibold">{f.title}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        f.isOpen
                          ? "bg-black text-white"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {f.isOpen ? "Actif" : "Brouillon"}
                    </span>

                    {/* Barre de progression noire/grise comme sur la capture */}
                    <div className="h-4 w-full max-w-xl rounded-full bg-neutral-200">
                      <div
                        className={`h-4 rounded-full ${
                          f.isOpen ? "bg-black w-[85%]" : "bg-neutral-300 w-[70%]"
                        }`}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-neutral-600">{fmtDate(f.createdAt)}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <IconButton title="Ouvrir" asLink href={`/f/${f.slug}`}>
                      <Eye className="h-4 w-4" />
                    </IconButton>

                    <IconButton title="Partager" onClick={() => copyShare(f.slug)}>
                      <Share2 className="h-4 w-4" />
                    </IconButton>

                    <IconButton
                      title="QR code"
                      asLink
                      href={`/forms/${f.id}/share`}
                    >
                      <QrCode className="h-4 w-4" />
                    </IconButton>

                    <IconButton
                      title="Rapport / Statistiques"
                      asLink
                      href={`/forms/${f.id}/report?lang=fr`}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </IconButton>

                    <IconButton
                      title="Supprimer"
                      danger
                      onClick={() => onDelete(f.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}

            {forms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                  Aucun formulaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------- Petits composants UI -------------------------- */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
          {icon}
        </div>
        <div>
          <div className="text-neutral-600 text-sm">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function IconButton(props: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  href?: string;
  asLink?: boolean;
  danger?: boolean;
}) {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition";
  const normal = "border-neutral-200 bg-white hover:bg-neutral-50";
  const red = "border-red-200 bg-red-50 text-red-600 hover:bg-red-100";

  if (props.asLink && props.href) {
    return (
      <Link
        href={props.href}
        title={props.title}
        className={`${base} ${props.danger ? red : normal}`}
      >
        {props.children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      title={props.title}
      onClick={props.onClick}
      className={`${base} ${props.danger ? red : normal}`}
    >
      {props.children}
    </button>
  );
}

/* Petites icônes emoji-like pour les cartes de stats */
function DocumentIcon() {
  return <span className="text-lg">🧾</span>;
}
function UserIcon() {
  return <span className="text-lg">👤</span>;
}
function ChartIcon() {
  return <span className="text-lg">📊</span>;
}
