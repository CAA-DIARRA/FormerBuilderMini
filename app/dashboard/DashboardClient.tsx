"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types d'entrée attendus depuis page.tsx                             */
/* ------------------------------------------------------------------ */
type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string | null; // sérialisé dans page.tsx
};

type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

type Props = {
  forms: FormRow[];
  stats: Stats;
};

/* ------------------------------------------------------------------ */
/* Petit composant LanguageToggle (évite l'import externe)             */
/* ------------------------------------------------------------------ */
function LanguageToggle({
  value,
  onChange,
  size = "md",
}: {
  value: "fr" | "en";
  onChange: (v: "fr" | "en") => void;
  size?: "sm" | "md";
}) {
  const cls =
    size === "sm"
      ? "text-xs px-2 py-1"
      : "text-sm px-3 py-1.5";
  return (
    <div className="inline-flex rounded-xl border overflow-hidden">
      <button
        className={`${cls} ${value === "fr" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"}`}
        onClick={() => onChange("fr")}
        type="button"
      >
        FR
      </button>
      <button
        className={`${cls} ${value === "en" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"}`}
        onClick={() => onChange("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Libellés FR/EN                                                     */
/* ------------------------------------------------------------------ */
const TEXTS = {
  fr: {
    title: "Tableau de bord",
    cards: { forms: "Formulaires", responses: "Réponses", active: "Actifs" },
    table: {
      title: "Formations",
      th: { name: "Intitulé", slug: "Slug", created: "Créé le", status: "Statut", actions: "Actions" },
      open: "Ouvert",
      closed: "Fermé",
    },
    actions: { view: "Ouvrir", qr: "QR", link: "Lien", export: "Exporter", delete: "Supprimer", report: "Rapport" },
    menus: {
      fr: "Français",
      en: "Anglais",
      copy: "Copier",
      open: "Ouvrir",
      download: "Télécharger",
      close: "Fermer",
      confirmDelete: "Supprimer cette formation ?",
      deleted: "Formation supprimée.",
      copied: "Copié !",
      urlFr: "Lien (FR)",
      urlEn: "Lien (EN)",
      xlsxFr: "Export Excel (FR)",
      xlsxEn: "Export Excel (EN)",
    },
  },
  en: {
    title: "Dashboard",
    cards: { forms: "Forms", responses: "Responses", active: "Active" },
    table: {
      title: "Trainings",
      th: { name: "Title", slug: "Slug", created: "Created at", status: "Status", actions: "Actions" },
      open: "Open",
      closed: "Closed",
    },
    actions: { view: "Open", qr: "QR", link: "Link", export: "Export", delete: "Delete", report: "Report" },
    menus: {
      fr: "French",
      en: "English",
      copy: "Copy",
      open: "Open",
      download: "Download",
      close: "Close",
      confirmDelete: "Delete this training?",
      deleted: "Training deleted.",
      copied: "Copied!",
      urlFr: "Public link (FR)",
      urlEn: "Public link (EN)",
      xlsxFr: "Excel export (FR)",
      xlsxEn: "Excel export (EN)",
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function frDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function urlPublic(slug: string, lang: "fr" | "en") {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  return `${base}/f/${slug}?lang=${lang}`;
}

function urlExport(formId: string, lang: "fr" | "en") {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  return `${base}/api/forms/${formId}/export?lang=${lang}`;
}

function qrSrc(link: string, size = 220) {
  const safe = encodeURIComponent(link);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${safe}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */
export default function DashboardClient({ forms, stats }: Props) {
  const [uiLang, setUiLang] = useState<"fr" | "en">("fr");
  const T = useMemo(() => TEXTS[uiLang], [uiLang]);

  // États des modales par action
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [qrTab, setQrTab] = useState<"fr" | "en">("fr");

  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [linkTab, setLinkTab] = useState<"fr" | "en">("fr");

  const [exportFor, setExportFor] = useState<string | null>(null);
  const [exportTab, setExportTab] = useState<"fr" | "en">("fr");

  // suppression (optimiste)
  const [busyId, setBusyId] = useState<string | null>(null);

  const onDelete = async (form: FormRow) => {
    if (!confirm(T.menus.confirmDelete)) return;
    try {
      setBusyId(form.id);
      const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      alert(T.menus.deleted);
      location.reload();
    } catch {
      alert("Error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{T.title}</h1>
        <div className="flex items-center gap-3">
          <LanguageToggle value={uiLang} onChange={setUiLang} />
          <Link
            href={`/forms/new${uiLang ? `?lang=${uiLang}` : ""}`}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
          >
            + {uiLang === "fr" ? "Nouveau formulaire" : "New form"}
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.forms}</div>
          <div className="text-3xl font-semibold">{stats.totalForms}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.responses}</div>
          <div className="text-3xl font-semibold">{stats.totalResponses}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-neutral-500">{T.cards.active}</div>
          <div className="text-3xl font-semibold">{stats.activeForms}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-semibold">{T.table.title}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left">{T.table.th.name}</th>
                <th className="px-4 py-2 text-left">{T.table.th.slug}</th>
                <th className="px-4 py-2 text-left">{T.table.th.created}</th>
                <th className="px-4 py-2 text-left">{T.table.th.status}</th>
                <th className="px-4 py-2 text-right">{T.table.th.actions}</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => {
                const frLink = urlPublic(f.slug, "fr");
                const enLink = urlPublic(f.slug, "en");
                const frXls = urlExport(f.id, "fr");
                const enXls = urlExport(f.id, "en");

                return (
                  <tr key={f.id} className="border-t">
                    <td className="px-4 py-2">{f.title}</td>
                    <td className="px-4 py-2">{f.slug}</td>
                    <td className="px-4 py-2">{frDate(f.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          f.isOpen ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {f.isOpen ? T.table.open : T.table.closed}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ouvrir (vue publique, langue = uiLang) */}
                        <Link
                          href={urlPublic(f.slug, uiLang)}
                          target="_blank"
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          title={T.actions.view}
                        >
                          {T.actions.view}
                        </Link>

                        {/* Rapport (si page existante) */}
                        <Link
                          href={`/forms/${f.id}/report`}
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          title={T.actions.report}
                        >
                          {T.actions.report}
                        </Link>

                        {/* QR → modal avec onglets FR/EN */}
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          onClick={() => {
                            setQrTab("fr");
                            setQrFor(f.id);
                          }}
                          title={T.actions.qr}
                        >
                          {T.actions.qr}
                        </button>

                        {/* Lien → modal avec onglets FR/EN (copier/ouvrir) */}
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          onClick={() => {
                            setLinkTab("fr");
                            setLinkFor(f.id);
                          }}
                          title={T.actions.link}
                        >
                          {T.actions.link}
                        </button>

                        {/* Export → modal avec onglets FR/EN (télécharger) */}
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          onClick={() => {
                            setExportTab("fr");
                            setExportFor(f.id);
                          }}
                          title={T.actions.export}
                        >
                          {T.actions.export}
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 hover:bg-red-50 text-red-700 border-red-300 disabled:opacity-50"
                          onClick={() => onDelete(f)}
                          disabled={busyId === f.id}
                          title={T.actions.delete}
                        >
                          {T.actions.delete}
                        </button>

                        {/* Données “cachées” pour les modales (pas rendu visible) */}
                        <span className="hidden" data-fr={frLink} data-en={enLink} data-frxls={frXls} data-enxls={enXls} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {forms.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
                    {uiLang === "fr" ? "Aucun formulaire" : "No forms yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal QR */}
      {qrFor && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LanguageToggle value={qrTab} onChange={(v) => setQrTab(v)} size="sm" />
                <div className="text-sm text-neutral-500">
                  {qrTab === "fr" ? TEXTS[uiLang].menus.fr : TEXTS[uiLang].menus.en}
                </div>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-sm hover:bg-neutral-50"
                onClick={() => setQrFor(null)}
              >
                {T.menus.close}
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {(() => {
                const f = forms.find((x) => x.id === qrFor)!;
                const link = urlPublic(f.slug, qrTab);
                const src = qrSrc(link, 240);
                return (
                  <>
                    <img src={src} alt="QR" className="rounded-lg border" />
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                        onClick={async () => {
                          const ok = await copy(link);
                          alert(ok ? T.menus.copied : "Error");
                        }}
                      >
                        {T.menus.copy} URL
                      </button>
                      <a
                        href={src}
                        download={`qr_${f.slug}_${qrTab}.png`}
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                      >
                        {T.menus.download} PNG
                      </a>
                      <a
                        href={link}
                        target="_blank"
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                      >
                        {T.menus.open}
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal LIEN */}
      {linkFor && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LanguageToggle value={linkTab} onChange={(v) => setLinkTab(v)} size="sm" />
                <div className="text-sm text-neutral-500">
                  {linkTab === "fr" ? TEXTS[uiLang].menus.urlFr : TEXTS[uiLang].menus.urlEn}
                </div>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-sm hover:bg-neutral-50"
                onClick={() => setLinkFor(null)}
              >
                {T.menus.close}
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const f = forms.find((x) => x.id === linkFor)!;
                const link = urlPublic(f.slug, linkTab);
                return (
                  <>
                    <div className="text-xs text-neutral-500">{link}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                        onClick={async () => {
                          const ok = await copy(link);
                          alert(ok ? T.menus.copied : "Error");
                        }}
                      >
                        {T.menus.copy}
                      </button>
                      <a
                        href={link}
                        target="_blank"
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                      >
                        {T.menus.open}
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal EXPORT */}
      {exportFor && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LanguageToggle value={exportTab} onChange={(v) => setExportTab(v)} size="sm" />
                <div className="text-sm text-neutral-500">
                  {exportTab === "fr" ? TEXTS[uiLang].menus.xlsxFr : TEXTS[uiLang].menus.xlsxEn}
                </div>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-sm hover:bg-neutral-50"
                onClick={() => setExportFor(null)}
              >
                {T.menus.close}
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const f = forms.find((x) => x.id === exportFor)!;
                const xls = urlExport(f.id, exportTab);
                return (
                  <>
                    <div className="text-xs text-neutral-500">{xls}</div>
                    <div className="flex items-center gap-2">
                      <a
                        href={xls}
                        target="_blank"
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                      >
                        {T.menus.download}
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
