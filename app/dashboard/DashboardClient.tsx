"use client";

import { useState } from "react";
import Link from "next/link";

export type FormRow = {
  id: string;
  title: string;
  slug: string;
  // 👇 IMPORTANT : string | null (sérialisation Next des Date)
  createdAt: string | null;
  isOpen: boolean;
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
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showLink, setShowLink] = useState<string | null>(null);
  const [showExport, setShowExport] = useState<string | null>(null);

  // ✅ Détection correcte du domaine (évite les URLs doublées)
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_BASE_URL!
      : process.env.NEXT_PUBLIC_BASE_URL
      ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
      : "";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {lang === "fr" ? "Tableau de bord" : "Dashboard"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="px-3 py-2 border rounded-xl"
          >
            {lang === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
          </button>
          <Link
            href={`/forms/new?lang=${lang}`}
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition"
          >
            {lang === "fr" ? "Nouveau formulaire" : "New form"}
          </Link>
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-2xl bg-white shadow">
          <h2 className="text-sm text-neutral-500">
            {lang === "fr" ? "Formulaires" : "Forms"}
          </h2>
          <p className="text-2xl font-bold">{stats.totalForms}</p>
        </div>
        <div className="p-4 border rounded-2xl bg-white shadow">
          <h2 className="text-sm text-neutral-500">
            {lang === "fr" ? "Réponses" : "Responses"}
          </h2>
          <p className="text-2xl font-bold">{stats.totalResponses}</p>
        </div>
        <div className="p-4 border rounded-2xl bg-white shadow">
          <h2 className="text-sm text-neutral-500">
            {lang === "fr" ? "Actifs" : "Active"}
          </h2>
          <p className="text-2xl font-bold">{stats.activeForms}</p>
        </div>
      </section>

      {/* LISTE DES FORMULAIRES */}
      <section className="space-y-3">
        {forms.length === 0 && (
          <p className="opacity-70 text-sm">
            {lang === "fr" ? "Aucun formulaire disponible." : "No form found."}
          </p>
        )}

        {forms.map((f) => (
          <div
            key={f.id}
            className="p-4 border rounded-2xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow"
          >
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-xs text-neutral-500">Slug: {f.slug}</p>
              <p className="text-xs text-neutral-500">
                {lang === "fr" ? "Créé le" : "Created"}{" "}
                {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* 📊 Rapport */}
              <Link
                href={`/dashboard/forms/${f.id}/report?lang=${lang}`}
                className="px-3 py-1.5 border rounded-xl text-sm hover:bg-neutral-100"
              >
                📊 {lang === "fr" ? "Rapport" : "Report"}
              </Link>

              {/* 📱 QR */}
              <button
                onClick={() => setShowQR(f.id)}
                className="px-3 py-1.5 border rounded-xl text-sm hover:bg-neutral-100"
              >
                📱 QR
              </button>

              {/* 🔗 Liens */}
              <button
                onClick={() => setShowLink(f.id)}
                className="px-3 py-1.5 border rounded-xl text-sm hover:bg-neutral-100"
              >
                🔗 {lang === "fr" ? "Lien" : "Link"}
              </button>

              {/* 📤 Export */}
              <button
                onClick={() => setShowExport(f.id)}
                className="px-3 py-1.5 border rounded-xl text-sm hover:bg-neutral-100"
              >
                📤 {lang === "fr" ? "Exporter" : "Export"}
              </button>

              {/* 🗑 Supprimer */}
              <button
                onClick={async () => {
                  if (
                    confirm(
                      lang === "fr"
                        ? "Supprimer définitivement ce formulaire ?"
                        : "Delete this form permanently?"
                    )
                  ) {
                    await fetch(`/api/forms/${f.id}`, { method: "DELETE" });
                    location.reload();
                  }
                }}
                className="px-3 py-1.5 border border-red-500 text-red-500 rounded-xl text-sm hover:bg-red-50"
              >
                🗑 {lang === "fr" ? "Supprimer" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Modale QR */}
      {showQR && (
        <Modal title="QR Codes" onClose={() => setShowQR(null)}>
          <ModalQR base={base} forms={forms} id={showQR} />
        </Modal>
      )}

      {/* Modale Lien */}
      {showLink && (
        <Modal title="Liens du formulaire" onClose={() => setShowLink(null)}>
          <ModalLinks base={base} forms={forms} id={showLink} />
        </Modal>
      )}

      {/* Modale Export */}
      {showExport && (
        <Modal title="Exporter en Excel" onClose={() => setShowExport(null)}>
          <ModalExport id={showExport} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------- MODALES ---------------------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-lg space-y-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            ✖
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------- QR ---------------------- */
function ModalQR({
  base,
  forms,
  id,
}: {
  base: string;
  forms: FormRow[];
  id: string;
}) {
  const form = forms.find((f) => f.id === id);
  if (!form) return null;
  const frUrl = `${base}/f/${form.slug}?lang=fr`;
  const enUrl = `${base}/f/${form.slug}?lang=en`;

  const qrFr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    frUrl
  )}`;
  const qrEn = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    enUrl
  )}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4">
        <div className="text-center">
          <img src={qrFr} alt="QR FR" className="border rounded-xl" />
          <p className="text-xs mt-2">Formulaire Français</p>
        </div>
        <div className="text-center">
          <img src={qrEn} alt="QR EN" className="border rounded-xl" />
          <p className="text-xs mt-2">Formulaire Anglais</p>
        </div>
      </div>
      <a href={frUrl} className="text-sm underline">
        {frUrl}
      </a>
      <a href={enUrl} className="text-sm underline">
        {enUrl}
      </a>
    </div>
  );
}

/* ---------------------- LIENS ---------------------- */
function ModalLinks({
  base,
  forms,
  id,
}: {
  base: string;
  forms: FormRow[];
  id: string;
}) {
  const form = forms.find((f) => f.id === id);
  if (!form) return null;
  const frUrl = `${base}/f/${form.slug}?lang=fr`;
  const enUrl = `${base}/f/${form.slug}?lang=en`;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p>🇫🇷 Lien Français</p>
        <input
          readOnly
          value={frUrl}
          className="w-full border rounded-xl p-2"
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div>
        <p>🇬🇧 Lien Anglais</p>
        <input
          readOnly
          value={enUrl}
          className="w-full border rounded-xl p-2"
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  );
}

/* ---------------------- EXPORT ---------------------- */
function ModalExport({ id }: { id: string }) {
  return (
    <div className="space-y-4">
      <a
        href={`/api/forms/${id}/export?lang=fr`}
        className="block text-center px-4 py-2 bg-black text-white rounded-xl"
      >
        🇫🇷 Télécharger (FR)
      </a>
      <a
        href={`/api/forms/${id}/export?lang=en`}
        className="block text-center px-4 py-2 border rounded-xl"
      >
        🇬🇧 Download (EN)
      </a>
    </div>
  );
}
