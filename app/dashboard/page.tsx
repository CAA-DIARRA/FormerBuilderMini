"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Share2,
  QrCode,
  Trash2,
  BarChart3,
  UserRound,
  FileSpreadsheet,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Lang = "fr" | "en";
type FormItem = {
  id: string;
  title: string;
  createdAt: string;
  slug: string;
  isOpen: boolean;
  responses: number;
};

function StatusBadge({ open, lang }: { open: boolean; lang: Lang }) {
  const cls = open ? "bg-black text-white" : "bg-neutral-200 text-neutral-700";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {open ? (lang === "fr" ? "Actif" : "Active") : lang === "fr" ? "Brouillon" : "Draft"}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [items, setItems] = useState<FormItem[]>([]);

  const T = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Dashboard",
        newForm: "New form",
        totalForms: "Total forms",
        totalResponses: "Total responses",
        activeForms: "Active forms",
        actions: "Actions",
        view: "Open",
        share: "Share",
        qrcode: "QR Code",
        toggle: "Activate / Deactivate",
        delete: "Delete",
        created: "Created on",
        noForm: "No forms yet. Create your first one!",
      };
    }
    return {
      title: "Tableau de bord",
      newForm: "Nouveau formulaire",
      totalForms: "Total formulaires",
      totalResponses: "Total réponses",
      activeForms: "Formulaires actifs",
      actions: "Actions",
      view: "Ouvrir",
      share: "Partager",
      qrcode: "QR Code",
      toggle: "Activer / Désactiver",
      delete: "Supprimer",
      created: "Créé le",
      noForm: "Aucun formulaire pour le moment. Créez-en un !",
    };
  }, [lang]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/forms?mine=1", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.forms || []);
    })();
  }, []);

  const stats = useMemo(
    () => ({
      totalForms: items.length,
      totalResponses: items.reduce((s, x) => s + (x.responses || 0), 0),
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
      alert(lang === "fr" ? "Lien copié !" : "Link copied!");
    }
  };
  const onQr = (id: string) =>
    window.open(`/api/forms/${id}/qrcode?lang=${lang}`, "_blank");
  const onDelete = async (id: string) => {
    if (!confirm(lang === "fr" ? "Supprimer ce formulaire ?" : "Delete this form?")) return;
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
          x.id === id ? { ...x, isOpen: !x.isOpen } : x
        )
      );
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header avec bouton langue */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-white hover:bg-neutral-100"
            >
              <Globe className="w-4 h-4" />
              {lang === "fr" ? "English" : "Français"}
            </button>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800"
            >
              <Plus className="w-4 h-4" />
              {T.newForm}
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <FileSpreadsheet className="w-6 h-6 text-neutral-600" />
            <div>
              <div className="text-sm text-neutral-600">{T.totalForms}</div>
              <div className="text-2xl font-semibold">{stats.totalForms}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <UserRound className="w-6 h-6 text-neutral-600" />
            <div>
              <div className="text-sm text-neutral-600">{T.totalResponses}</div>
              <div className="text-2xl font-semibold">{stats.totalResponses}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded-2xl p-4 bg-white shadow-sm">
            <BarChart3 className="w-6 h-6 text-neutral-600" />
            <div>
              <div className="text-sm text-neutral-600">{T.activeForms}</div>
              <div className="text-2xl font-semibold">{stats.active}</div>
            </div>
          </div>
        </div>

        {/* Liste des formulaires */}
        <div className="border rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">{T.title}</th>
                <th className="text-left p-3">{T.created}</th>
                <th className="text-left p-3">{T.actions}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-500">
                    {T.noForm}
                  </td>
                </tr>
              )}
              {items.map((f, i) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{f.title}</span>
                      <StatusBadge open={f.isOpen} lang={lang} />
                    </div>
                  </td>
                  <td className="p-3">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(f.id)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                        title={T.view}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onShare(f.id)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                        title={T.share}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onQr(f.id)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                        title={T.qrcode}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggle(f.id)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                        title={T.toggle}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(f.id)}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
                        title={T.delete}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
