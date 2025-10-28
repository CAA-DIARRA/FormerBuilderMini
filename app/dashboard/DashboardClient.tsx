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
    cards: {
      forms: "Formulaires",
      responses: "Réponses",
      active: "Actifs",
    },
    table: {
      title: "Formations",
      th: {
        name: "Intitulé",
        slug: "Slug",
        created: "Créé le",
        status: "Statut",
        actions: "Actions",
      },
      open: "Ouvert",
      closed: "Fermé",
    },
    actions: {
      view: "Ouvrir",
      qr: "QR",
      link: "Lien",
      export: "Exporter",
      delete: "Supprimer",
      report: "Rapport",
    },
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
    },
  },
  en: {
    title: "Dashboard",
    cards: {
      forms: "Forms",
      responses: "Responses",
      active: "Active",
    },
    table: {
      title: "Trainings",
      th: {
        name: "Title",
        slug: "Slug",
        created: "Created at",
        status: "Status",
        actions: "Actions",
      },
      open: "Open",
      closed: "Closed",
    },
    actions: {
      view: "Open",
      qr: "QR",
      link: "Link",
      export: "Export",
      delete: "Delete",
      report: "Report",
    },
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
  // On s'appuie sur NEXT_PUBLIC_BASE_URL si présent, sinon URL relative (Render gère).
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  return `${base}/f/${slug}?lang=${lang}`;
}

function urlExport(formId: string, lang: "fr" | "en") {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  return `${base}/api/forms/${formId}/export?lang=${lang}`;
}

function qrSrc(link: string, size = 220) {
  // Pas de nouvelle dépendance : on utilise un service d'image QR public
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

  // états des menus / modals par formulaire
  const [openMenu, setOpenMenu] = useState<string | null>(null); // pour menus (Lien/Exporter)
  const [qrFor, setQrFor] = useState<string | null>(null); // id du form pour le modal QR
  const [qrTab, setQrTab] = useState<"fr" | "en">("fr"); // onglet courant du modal QR

  // suppression (optimiste)
  const [busyId, setBusyId] = useState<string | null>(null);

  const onDelete = async (form: FormRow) => {
    if (!confirm(T.menus.confirmDelete)) return;
    try {
      setBusyId(form.id);
      const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      alert(T.menus.deleted);
      // rafraîchit la page après suppression
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
                const isMenuOpen = openMenu === f.id;

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
                        {/* Ouvrir (vue publique, par défaut dans la langue du toggle UI) */}
                        <Link
                          href={urlPublic(f.slug, uiLang)}
                          target="_blank"
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          title={T.actions.view}
                        >
                          {T.actions.view}
                        </Link>

                        {/* Rapport (page interne si tu l'as déjà) */}
                        <Link
                          href={`/forms/${f.id}/report`}
                          className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                          title={T.actions.report}
                        >
                          {T.actions.report}
                        </Link>

                        {/* QR (modal FR/EN) */}
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

                        {/* Lien (menu FR/EN copier / ouvrir) */}
                        <div className="relative">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                            onClick={() => setOpenMenu(isMenuOpen ? null : f.id)}
                            title={T.actions.link}
                          >
                            {T.actions.link}
                          </button>
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow z-10"
                              onMouseLeave={() => setOpenMenu(null)}
                            >
                              {/* FR */}
                              <div className="px-3 py-2 border-b">
                                <div className="text-xs text-neutral-500 mb-2">{T.menus.fr}</div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                    onClick={async () => {
                                      const ok = await copy(frLink);
                                      alert(ok ? T.menus.copied : "Error");
                                      setOpenMenu(null);
                                    }}
                                  >
                                    {T.menus.copy}
                                  </button>
                                  <Link
                                    href={frLink}
                                    target="_blank"
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                  >
                                    {T.menus.open}
                                  </Link>
                                </div>
                              </div>
                              {/* EN */}
                              <div className="px-3 py-2">
                                <div className="text-xs text-neutral-500 mb-2">{T.menus.en}</div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                    onClick={async () => {
                                      const ok = await copy(enLink);
                                      alert(ok ? T.menus.copied : "Error");
                                      setOpenMenu(null);
                                    }}
                                  >
                                    {T.menus.copy}
                                  </button>
                                  <Link
                                    href={enLink}
                                    target="_blank"
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                  >
                                    {T.menus.open}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Export (menu FR/EN téléchargement) */}
                        <div className="relative">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
                            onClick={() => setOpenMenu(isMenuOpen ? null : f.id)}
                            title={T.actions.export}
                          >
                            {T.actions.export}
                          </button>
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow z-10"
                              onMouseLeave={() => setOpenMenu(null)}
                            >
                              {/* FR */}
                              <div className="px-3 py-2 border-b">
                                <div className="text-xs text-neutral-500 mb-2">{T.menus.fr}</div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={frXls}
                                    target="_blank"
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                    onClick={() => setOpenMenu(null)}
                                  >
                                    {T.menus.download}
                                  </Link>
                                </div>
                              </div>
                              {/* EN */}
                              <div className="px-3 py-2">
                                <div className="text-xs text-neutral-500 mb-2">{T.menus.en}</div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={enXls}
                                    target="_blank"
                                    className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                    onClick={() => setOpenMenu(null)}
                                  >
                                    {T.menus.download}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

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
        <div className="fixed inset-0 z-20 bg-black/30 flex items-center justify-center p-4">
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
              {/* On retrouve le form en question */}
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
    </div>
  );
}
