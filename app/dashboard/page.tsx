// app/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Eye, Share2, QrCode, Trash2, BarChart3,
  UserRound, FileSpreadsheet, GraduationCap, Settings
} from "lucide-react";
import { useRouter } from "next/navigation";

type FormItem = {
  id: string;
  title: string;
  createdAt: string;
  slug: string;
  isOpen: boolean;
  responses: number;
  status?: "Actif" | "Brouillon";
};

function StatusBadge({ open }: { open: boolean }) {
  const cls = open ? "bg-black text-white" : "bg-neutral-200 text-neutral-700";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {open ? "Actif" : "Brouillon"}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<FormItem[]>([]);

  // QR state (unique) + choix de langue
  const [qr, setQr] = useState<{
    open: boolean;
    src?: string;
    title?: string;
    lang?: "fr" | "en";
  }>({ open: false });

  const [qrChoice, setQrChoice] = useState<{
    open: boolean;
    formId?: string;
    title?: string;
  }>({ open: false });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/forms?mine=1");
      if (!res.ok) return;
      const json = await res.json();
      const forms: FormItem[] = json.forms.map((f: any) => ({
        ...f,
        status: f.isOpen ? "Actif" : "Brouillon",
      }));
      setItems(forms);
    })();
  }, []);

  const stats = useMemo(
    () => ({
      totalForms: items.length,
      totalResponses: items.reduce((s, x) => s + x.responses, 0),
      active: items.filter((x) => x.isOpen).length,
    }),
    [items]
  );

  const onNew = () => router.push("/forms/new");
  const onView = (id: string) => {
    const f = items.find((x) => x.id === id);
    if (f) router.push(`/f/${f.slug}`);
  };
  const onShare = async (id: string) => {
    const f = items.find((x) => x.id === id);
    if (!f) return;
    const url = `${window.location.origin}/f/${f.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: f.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Lien copié");
    }
  };
  const onDelete = async (id: string) => {
    if (!confirm("Supprimer ce formulaire ?")) return;
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) setItems((arr) => arr.filter((x) => x.id !== id));
  };
  const onToggle = async (id: string) => {
    const f = items.find((x) => x.id === id);
    if (!f) return;
    const res = await fetch(`/api/forms/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isOpen: !f.isOpen }),
    });
    if (res.ok)
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? {
                ...x,
                isOpen: !x.isOpen,
                status: !x.isOpen ? "Actif" : "Brouillon",
              }
            : x
        )
      );
  };

  // Export (si backend en place)
  const onExportXlsx = (id: string) =>
    window.location.assign(`/api/forms/${id}/export`);
  const onExportCsv = (id: string) =>
    window.location.assign(`/api/forms/${id}/export.csv`);

  // Génère un QR et renvoie un ObjectURL
  const fetchQr = async (formId: string, lang: "fr" | "en") => {
    const res = await fetch(`/api/forms/${formId}/qrcode?lang=${lang}`);
    if (!res.ok) {
      alert("Impossible de générer le QR code");
      return;
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <div className="p-2 rounded-xl bg-neutral-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Formulaires</div>
              <div className="text-2xl font-semibold">{stats.totalForms}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <div className="p-2 rounded-xl bg-neutral-100">
              <UserRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Réponses</div>
              <div className="text-2xl font-semibold">
                {stats.totalResponses}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <div className="p-2 rounded-xl bg-neutral-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Formulaires Actifs</div>
              <div className="text-2xl font-semibold">{stats.active}</div>
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Mes Formulaires</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNew}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-black text-white hover:bg-neutral-900"
            >
              <Plus className="w-4 h-4" />
              Nouveau Formulaire
            </button>
            <button className="inline-flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50">
              <UserRound className="w-4 h-4" />
              Assistant IA
            </button>
            <button className="inline-flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50">
              <GraduationCap className="w-4 h-4" />
              Synthèse Formations
            </button>
            <button className="inline-flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50">
              <Settings className="w-4 h-4" />
              Administration
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((f) => (
            <div
              key={f.id}
              className="border rounded-2xl p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold leading-tight">
                    {f.title}
                  </h3>
                </div>
                <StatusBadge open={f.isOpen} />
              </div>

              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>
                  {f.responses} réponse{f.responses > 1 ? "s" : ""}
                </span>
                <span>Créé le {new Date(f.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onView(f.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </button>

                <button
                  onClick={() => onShare(f.id)}
                  title="Partager"
                  className="inline-flex items-center justify-center border rounded-xl p-2 hover:bg-neutral-50"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Ouvre le modal de choix de langue */}
                <button
                  onClick={() =>
                    setQrChoice({ open: true, formId: f.id, title: f.title })
                  }
                  title="QR Code"
                  className="inline-flex items-center justify-center border rounded-xl p-2 hover:bg-neutral-50"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onToggle(f.id)}
                  title={f.isOpen ? "Fermer" : "Activer"}
                  className="inline-flex items-center justify-center border rounded-xl px-3 py-2 hover:bg-neutral-50"
                >
                  {f.isOpen ? "Fermer" : "Activer"}
                </button>

                <button
                  onClick={() => location.assign(`/dashboard/forms/${f.id}`)}
                  title="Détails"
                  className="inline-flex items-center justify-center border rounded-xl p-2 hover:bg-neutral-50"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(f.id)}
                  title="Supprimer"
                  className="inline-flex items-center justify-center border rounded-xl p-2 hover:bg-neutral-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>

                {/* Exports */}
                <button
                  onClick={() => onExportXlsx(f.id)}
                  title="Exporter Excel (.xlsx)"
                  className="inline-flex items-center justify-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50"
                >
                  <FileSpreadsheet className="w-4 h-4" /> XLSX
                </button>
                <button
                  onClick={() => onExportCsv(f.id)}
                  title="Exporter CSV"
                  className="inline-flex items-center justify-center gap-2 border rounded-xl px-3 py-2 hover:bg-neutral-50"
                >
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1 : choix de langue */}
      {qrChoice.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6"
          onClick={() => setQrChoice({ open: false })}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">QR — {qrChoice.title}</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Choisir la langue du formulaire :
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="px-4 py-2 rounded-xl border hover:bg-neutral-50"
                onClick={async () => {
                  if (!qrChoice.formId) return;
                  const src = await fetchQr(qrChoice.formId, "fr");
                  if (src) {
                    setQrChoice({ open: false });
                    setQr({
                      open: true,
                      src,
                      title: `${qrChoice.title} — FR`,
                      lang: "fr",
                    });
                  }
                }}
              >
                🇫🇷 Français
              </button>
              <button
                className="px-4 py-2 rounded-xl border hover:bg-neutral-50"
                onClick={async () => {
                  if (!qrChoice.formId) return;
                  const src = await fetchQr(qrChoice.formId, "en");
                  if (src) {
                    setQrChoice({ open: false });
                    setQr({
                      open: true,
                      src,
                      title: `${qrChoice.title} — EN`,
                      lang: "en",
                    });
                  }
                }}
              >
                🇬🇧 English
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => setQrChoice({ open: false })}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2 : aperçu & téléchargement */}
      {qr.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6"
          onClick={() => {
            if (qr.src) URL.revokeObjectURL(qr.src);
            setQr({ open: false });
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">QR — {qr.title}</h2>
            {qr.src && (
              <img
                src={qr.src}
                alt="QR code"
                className="w-64 h-64 object-contain border rounded-xl"
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              {qr.src && (
                <a
                  href={qr.src}
                  download={`qr_${(qr.lang || "fr")}.png`}
                  className="px-4 py-2 rounded-xl border"
                >
                  Télécharger
                </a>
              )}
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => {
                  if (qr.src) URL.revokeObjectURL(qr.src);
                  setQr({ open: false });
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
