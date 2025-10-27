"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  Share2,
  QrCode,
  BarChart3,
  Trash2,
} from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";

export type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string | Date | null;
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

const pill = (txt: string, variant: "active" | "draft" = "active") =>
  variant === "active" ? (
    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-black text-white">
      {txt}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-neutral-200 text-neutral-700">
      {txt}
    </span>
  );

export default function DashboardClient({ forms, stats }: Props) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "fr";

  /* ---------- i18n ---------- */
  const T = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Dashboard",
        cards: {
          totalForms: "Total forms",
          totalResponses: "Total responses",
          activeForms: "Active forms",
        },
        table: {
          thIndex: "#",
          thTitle: "Dashboard",
          thCreated: "Created on",
          thActions: "Actions",
        },
        statusActive: "Active",
        statusDraft: "Draft",
        btn: {
          newForm: "New form",
          open: "Open",
          share: "Share",
          qr: "QR",
          report: "Report",
          delete: "Delete",
          exportFR: "Export FR",
          exportEN: "Export EN",
        },
        confirmDelete: "Delete this form and its responses?",
        sharedCopied: "Public link copied!",
      };
    }
    return {
      title: "Tableau de bord",
      cards: {
        totalForms: "Total formulaires",
        totalResponses: "Total réponses",
        activeForms: "Formulaires actifs",
      },
      table: {
        thIndex: "#",
        thTitle: "Tableau de bord",
        thCreated: "Créé le",
        thActions: "Actions",
      },
      statusActive: "Actif",
      statusDraft: "Brouillon",
      btn: {
        newForm: "Nouveau formulaire",
        open: "Ouvrir",
        share: "Partager",
        qr: "QR",
        report: "Rapport",
        delete: "Supprimer",
        exportFR: "Export FR",
        exportEN: "Export EN",
      },
      confirmDelete: "Supprimer ce formulaire et ses réponses ?",
      sharedCopied: "Lien public copié !",
    };
  }, [lang]);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const fmtDate = (d: string | Date | null) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      // feedback simple
      alert(T.sharedCopied);
    } catch {
      // fallback
      prompt("Copy this link", txt);
    }
  };

  const openQR = (url: string) => {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      url
    )}`;
    window.open(qr, "_blank");
  };

  const onDelete = useCallback(async (id: string) => {
    if (!confirm(T.confirmDelete)) return;
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      location.reload();
    } else {
      alert("Delete failed");
    }
  }, [T.confirmDelete]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">{T.title}</h1>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href={`/forms/new${lang ? `?lang=${lang}` : ""}`}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
          >
            + {T.btn.newForm}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.totalForms}</div>
          <div className="text-3xl font-semibold mt-1">{stats.totalForms}</div>
        </div>
        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.totalResponses}</div>
          <div className="text-3xl font-semibold mt-1">{stats.totalResponses}</div>
        </div>
        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.activeForms}</div>
          <div className="text-3xl font-semibold mt-1">{stats.activeForms}</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-left">
              <th className="px-4 py-3 w-14">{T.table.thIndex}</th>
              <th className="px-4 py-3">{T.table.thTitle}</th>
              <th className="px-4 py-3 w-40">{T.table.thCreated}</th>
              <th className="px-4 py-3 w-64">{T.table.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f, i) => {
              const publicUrl = `${baseUrl}/f/${f.slug}${
                lang ? `?lang=${lang}` : ""
              }`;

              return (
                <tr key={f.id} className="border-t">
                  {/* # */}
                  <td className="px-4 py-4 align-top text-sm text-neutral-500">
                    {i + 1}
                  </td>

                  {/* Title + status + progress bar-like */}
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold">{f.title}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {f.isOpen
                        ? pill(T.statusActive, "active")
                        : pill(T.statusDraft, "draft")}
                      <div className="flex-1 h-3 bg-neutral-200 rounded-full overflow-hidden">
                        {/* simple “progress” look only */}
                        <div
                          className={`h-full rounded-full ${
                            f.isOpen ? "bg-black" : "bg-neutral-300"
                          }`}
                          style={{ width: f.isOpen ? "85%" : "40%" }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    {fmtDate(f.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                      {/* Ouvrir */}
                      <Link
                        href={`/f/${f.slug}${lang ? `?lang=${lang}` : ""}`}
                        target="_blank"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border hover:bg-neutral-50"
                        title={T.btn.open}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Partager */}
                      <button
                        onClick={() => copy(publicUrl)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border hover:bg-neutral-50"
                        title={T.btn.share}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* QR Code */}
                      <button
                        onClick={() => openQR(publicUrl)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border hover:bg-neutral-50"
                        title={T.btn.qr}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Rapport */}
                      <Link
                        href={`/dashboard/forms/${f.id}/report${lang ? `?lang=${lang}` : ""}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border hover:bg-neutral-50"
                        title={T.btn.report}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      {/* Supprimer */}
                      <button
                        onClick={() => onDelete(f.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                        title={T.btn.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exports */}
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={`/api/forms/${f.id}/export?lang=fr`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center rounded-lg border px-2.5 py-1 hover:bg-neutral-50"
                      >
                        {T.btn.exportFR}
                      </a>
                      <a
                        href={`/api/forms/${f.id}/export?lang=en`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center rounded-lg border px-2.5 py-1 hover:bg-neutral-50"
                      >
                        {T.btn.exportEN}
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}

            {forms.length === 0 && (
              <tr className="border-t">
                <td className="px-4 py-10 text-center text-neutral-500" colSpan={4}>
                  {lang === "en"
                    ? "No form yet. Create your first form!"
                    : "Aucun formulaire pour le moment. Crée ton premier formulaire !"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
