"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCode, Trash2, Link as LinkIcon, FileDown, BarChart3, Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal"; // ton composant modal
import QRCodeCanvas from "qrcode.react";

type Lang = "fr" | "en";

export type FormRow = {
  id: string;
  slug: string;
  title: string;
  createdAt: string | Date;
  isOpen: boolean;
};

type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

type Props = {
  forms: FormRow[];
  stats: Stats;
  lang?: Lang;
};

export default function DashboardClient({ forms, stats, lang = "fr" }: Props) {
  const [selectedQR, setSelectedQR] = useState<FormRow | null>(null);
  const [selectedLink, setSelectedLink] = useState<FormRow | null>(null);
  const [selectedExport, setSelectedExport] = useState<FormRow | null>(null);

  const T = {
    title: lang === "en" ? "Dashboard" : "Tableau de bord",
    colForm: lang === "en" ? "Form" : "Formulaire",
    colDate: lang === "en" ? "Date" : "Date",
    colStatus: lang === "en" ? "Status" : "Statut",
    colActions: lang === "en" ? "Actions" : "Actions",
    openForm: lang === "en" ? "Open form" : "Ouvrir le formulaire",
    delete: lang === "en" ? "Delete" : "Supprimer",
    qr: "QR",
    link: lang === "en" ? "Link" : "Lien",
    report: lang === "en" ? "Report" : "Rapport",
    export: lang === "en" ? "Export" : "Exporter",
  };

  const getBaseUrl = () => {
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.NEXT_PUBLIC_BASE_URL || "https://formerbuildermini.onrender.com";
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === "en" ? "Confirm deletion?" : "Confirmer la suppression ?")) return;
    await fetch(`/api/forms/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">{T.title}</h1>

      <table className="min-w-full border rounded-xl overflow-hidden bg-white">
        <thead className="bg-neutral-100 text-left text-sm font-semibold">
          <tr>
            <th className="p-3">{T.colForm}</th>
            <th className="p-3">{T.colDate}</th>
            <th className="p-3">{T.colStatus}</th>
            <th className="p-3">{T.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((f) => (
            <tr key={f.id} className="border-t text-sm">
              <td className="p-3 font-medium">{f.title}</td>
              <td className="p-3">{new Date(f.createdAt).toLocaleDateString()}</td>
              <td className="p-3">{f.isOpen ? "✅ Ouvert" : "❌ Fermé"}</td>
              <td className="p-3 flex items-center gap-2">
                {/* QR CODE */}
                <button
                  onClick={() => setSelectedQR(f)}
                  title="QR Code"
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-neutral-50 transition"
                >
                  <QRCode className="h-4 w-4" />
                </button>

                {/* LIEN */}
                <button
                  onClick={() => setSelectedLink(f)}
                  title={T.link}
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-neutral-50 transition"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>

                {/* EXPORT */}
                <button
                  onClick={() => setSelectedExport(f)}
                  title={T.export}
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-neutral-50 transition"
                >
                  <FileDown className="h-4 w-4" />
                </button>

                {/* RAPPORT */}
                <Link
                  href={`/dashboard/forms/${f.id}/report`}
                  title={T.report}
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-neutral-50 transition"
                >
                  <BarChart3 className="h-4 w-4" />
                </Link>

                {/* NOUVEAU : OUVRIR LE FORMULAIRE */}
                <Link
                  href={`/f/${f.slug}?lang=${lang}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={T.openForm}
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-neutral-50 transition"
                >
                  <Eye className="h-4 w-4" />
                </Link>

                {/* SUPPRIMER */}
                <button
                  onClick={() => handleDelete(f.id)}
                  title={T.delete}
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 hover:bg-red-50 transition text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL QR */}
      {selectedQR && (
        <Modal open={!!selectedQR} onClose={() => setSelectedQR(null)} title="QR Code">
          <div className="flex flex-col items-center gap-4 py-4">
            <QRCodeCanvas
              value={`${getBaseUrl()}/f/${selectedQR.slug}?lang=${lang}`}
              size={180}
            />
            <div className="flex gap-3">
              <a
                href={`${getBaseUrl()}/f/${selectedQR.slug}?lang=fr`}
                target="_blank"
                className="px-3 py-1 border rounded-md hover:bg-neutral-100"
              >
                🇫🇷 Français
              </a>
              <a
                href={`${getBaseUrl()}/f/${selectedQR.slug}?lang=en`}
                target="_blank"
                className="px-3 py-1 border rounded-md hover:bg-neutral-100"
              >
                🇬🇧 English
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL LIEN */}
      {selectedLink && (
        <Modal open={!!selectedLink} onClose={() => setSelectedLink(null)} title={T.link}>
          <div className="flex flex-col gap-3 py-3">
            <div className="text-sm">
              <strong>🇫🇷 Français :</strong>{" "}
              <a
                href={`${getBaseUrl()}/f/${selectedLink.slug}?lang=fr`}
                target="_blank"
                className="text-blue-600 underline break-all"
              >
                {`${getBaseUrl()}/f/${selectedLink.slug}?lang=fr`}
              </a>
            </div>
            <div className="text-sm">
              <strong>🇬🇧 English :</strong>{" "}
              <a
                href={`${getBaseUrl()}/f/${selectedLink.slug}?lang=en`}
                target="_blank"
                className="text-blue-600 underline break-all"
              >
                {`${getBaseUrl()}/f/${selectedLink.slug}?lang=en`}
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL EXPORT */}
      {selectedExport && (
        <Modal open={!!selectedExport} onClose={() => setSelectedExport(null)} title={T.export}>
          <div className="flex flex-col gap-3 py-3">
            <a
              href={`${getBaseUrl()}/api/forms/${selectedExport.id}/export?lang=fr`}
              className="px-4 py-2 border rounded-md hover:bg-neutral-100"
            >
              🇫🇷 Exporter en Français
            </a>
            <a
              href={`${getBaseUrl()}/api/forms/${selectedExport.id}/export?lang=en`}
              className="px-4 py-2 border rounded-md hover:bg-neutral-100"
            >
              🇬🇧 Export in English
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
