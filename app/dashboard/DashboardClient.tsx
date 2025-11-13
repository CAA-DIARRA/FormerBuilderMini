"use client";

import { useState } from "react";
import Link from "next/link";

export type FormRow = {
  id: string;
  title: string;
  slug: string;
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
        <Card label={lang === "fr" ? "Formulaires" : "Forms"} value={stats.totalForms} />
        <Card label={lang === "fr" ? "Réponses" : "Responses"} value={stats.totalResponses} />
        <Card label={lang === "fr" ? "Actifs" : "Active"} value={stats.activeForms} />
      </section>

      {/* LISTE */}
      <section className="space-y-3">
        {forms.length === 0 && (
          <p className="opacity-70 text-sm">
            {lang === "fr" ? "Aucun formulaire disponible." : "No form found."}
          </p>
        )}

        {forms.map((f) => {
          const disabled = !f.isOpen;

          return (
            <div
              key={f.id}
              className="p-4 border rounded-2xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow"
            >
              <div>
                <h3 className="font-semibold">
                  {f.title}{" "}
                  {!f.isOpen && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-xl">
                      Inactif
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-500">Slug: {f.slug}</p>
                <p className="text-xs text-neutral-500">
                  {lang === "fr" ? "Créé le" : "Created"}{" "}
                  {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2">

                {/* 🚀 Ouvrir */}
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) window.open(`/f/${f.slug}?lang=${lang}`, "_blank");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-sm border ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  🚀 {lang === "fr" ? "Ouvrir" : "Open"}
                </button>

                {/* 📊 Rapport */}
                <Link
                  href={`/dashboard/forms/${f.id}/report?lang=${lang}`}
                  className="px-3 py-1.5 border rounded-xl text-sm hover:bg-neutral-100"
                >
                  📊 {lang === "fr" ? "Rapport" : "Report"}
                </Link>

                {/* QR */}
                <button
                  disabled={disabled}
                  onClick={() => !disabled && setShowQR(f.id)}
                  className={`px-3 py-1.5 border rounded-xl text-sm ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  📱 QR
                </button>

                {/* Lien */}
                <button
                  disabled={disabled}
                  onClick={() => !disabled && setShowLink(f.id)}
                  className={`px-3 py-1.5 border rounded-xl text-sm ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  🔗 {lang === "fr" ? "Lien" : "Link"}
                </button>

                {/* Export */}
                <button
                  disabled={disabled}
                  onClick={() => !disabled && setShowExport(f.id)}
                  className={`px-3 py-1.5 border rounded-xl text-sm ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  📤 {lang === "fr" ? "Exporter" : "Export"}
                </button>

                {/* 🟢 / 🔴 Activer / Désactiver */}
                <button
                  onClick={async () => {
                    await fetch(`/api/forms/${f.id}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ isOpen: !f.isOpen }),
                    });

                    location.reload();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-sm border ${
                    f.isOpen
                      ? "border-red-500 text-red-500 hover:bg-red-50"
                      : "border-green-600 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {f.isOpen
                    ? lang === "fr"
                      ? "Désactiver"
                      : "Disable"
                    : lang === "fr"
                    ? "Activer"
                    : "Enable"}
                </button>

                {/* 🗑 SUPPRIMER */}
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        lang === "fr"
                          ? "Supprimer définitivement ce formulaire ?"
                          : "Delete this form?"
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
          );
        })}
      </section>

      {/* Modales */}
      {showQR && (
        <Modal title="QR Codes" onClose={() => setShowQR(null)}>
          <ModalQR base={base} forms={forms} id={showQR} />
        </Modal>
      )}

      {showLink && (
        <Modal title="Liens du formulaire" onClose={() => setShowLink(null)}>
          <ModalLinks base={base} forms={forms} id={showLink} />
        </Modal>
      )}

      {showExport && (
        <Modal title="Exporter en Excel" onClose={() => setShowExport(null)}>
          <ModalExport id={showExport} />
        </Modal>
      )}
    </div>
  );
}

/* ---- petits composants ----- */

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded-2xl bg-white shadow">
      <h2 className="text-sm text-neutral-500">{label}</h2>
      <p className="text-2xl font-bold">{value}</p>
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

  // URLs QR haute résolution
  const qrFr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    frUrl
  )}`;
  const qrEn = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    enUrl
  )}`;

  // Fonction de téléchargement PNG
  const downloadImage = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-8">

      {/* QR alignés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* QR Français */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrFr}
            alt="QR Français"
            className="w-48 h-48 md:w-60 md:h-60 border rounded-xl shadow"
          />
          <p className="text-sm font-semibold">🇫🇷 Formulaire Français</p>

          <button
            onClick={() => downloadImage(qrFr, `${form.slug}-fr.png`)}
            className="px-3 py-1.5 bg-black text-white text-sm rounded-xl hover:bg-neutral-800"
          >
            ⬇ Télécharger (PNG)
          </button>
        </div>

        {/* QR Anglais */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrEn}
            alt="QR English"
            className="w-48 h-48 md:w-60 md:h-60 border rounded-xl shadow"
          />
          <p className="text-sm font-semibold">🇬🇧 English Form</p>

          <button
            onClick={() => downloadImage(qrEn, `${form.slug}-en.png`)}
            className="px-3 py-1.5 border text-sm rounded-xl hover:bg-neutral-100"
          >
            ⬇ Download (PNG)
          </button>
        </div>

      </div>

      {/* Liens directs */}
      <div className="text-center space-y-2 text-sm">
        <p className="font-medium">Liens directs :</p>

        <a className="underline block" href={frUrl} target="_blank">
          {frUrl}
        </a>

        <a className="underline block" href={enUrl} target="_blank">
          {enUrl}
        </a>
      </div>
    </div>
  );
}
/* ------ Liens ------ */
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
      <input readOnly value={frUrl} className="w-full border rounded-xl p-2" />
      <input readOnly value={enUrl} className="w-full border rounded-xl p-2" />
    </div>
  );
}

/* ------ Export ------ */
function ModalExport({ id }: { id: string }) {
  return (
    <div className="space-y-4">
      <a href={`/api/forms/${id}/export?lang=fr`} className="block text-center px-4 py-2 bg-black text-white rounded-xl">
        🇫🇷 Télécharger (FR)
      </a>
      <a href={`/api/forms/${id}/export?lang=en`} className="block text-center px-4 py-2 border rounded-xl">
        🇬🇧 Download (EN)
      </a>
    </div>
  );
}
