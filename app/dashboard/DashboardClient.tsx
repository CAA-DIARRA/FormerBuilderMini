"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt?: string | Date | null;
};

type Stats = {
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
  const [rows, setRows] = useState(forms ?? []);

  // petit helper pour supprimer localement après succès API
  const onDeleted = (id: string) => {
    setRows((s) => s.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Bandeau stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Formulaires" value={stats.totalForms} />
        <StatCard label="Réponses" value={stats.totalResponses} />
        <StatCard label="Ouverts" value={stats.activeForms} />
      </div>

      {/* Barre d’actions globale */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Link
          href="/forms/new"
          className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
        >
          + Nouveau formulaire
        </Link>
      </div>

      {/* Tableau des formulaires */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <Th>Intitulé</Th>
              <Th>Slug</Th>
              <Th>Statut</Th>
              <Th>Créé le</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-t">
                <Td className="font-medium">{f.title}</Td>
                <Td>
                  <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                    {f.slug}
                  </code>
                </Td>
                <Td>
                  <span
                    className={
                      "inline-flex items-center gap-2 px-2 py-1 rounded-xl text-xs " +
                      (f.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-700")
                    }
                  >
                    {f.isOpen ? "Ouvert" : "Fermé"}
                  </span>
                </Td>
                <Td>{formatDate(f.createdAt)}</Td>
                <Td>
                  <ActionsCell form={f} onDeleted={onDeleted} />
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center py-10 text-neutral-500">
                  Aucun formulaire
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/*  Petits composants UI                                                                */
/* ------------------------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase">{children}</th>;
}
function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className ?? ""}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------------------------ */
/*  Cellule Actions : QR (FR/EN), Liens (FR/EN), Export (FR/EN), Supprimer              */
/*  (aucun nouveau fichier, tout est ici)                                              */
/* ------------------------------------------------------------------------------------ */

type Lang = "fr" | "en";

function ActionsCell({
  form,
  onDeleted,
}: {
  form: FormRow;
  onDeleted: (id: string) => void;
}) {
  const origin = useOrigin();

  const publicUrl = (lang: Lang) =>
    `${origin}/f/${encodeURIComponent(form.slug)}?lang=${lang}`;
  const exportUrl = (lang: Lang) =>
    `${origin}/api/forms/${encodeURIComponent(form.id)}/export?lang=${lang}`;

  const [qrLang, setQrLang] = useState<Lang | null>(null);

  const doDelete = async () => {
    if (
      !confirm(
        `Supprimer la formation « ${form.title} » ? Cette action est irréversible.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Échec de la suppression");
      }
      onDeleted(form.id);
    } catch (e: any) {
      alert(e?.message || "Suppression impossible");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* QR */}
      <Menu
        label="QR"
        title="QR code"
        items={[
          {
            label: "QR FR",
            onClick: () => setQrLang("fr"),
          },
          {
            label: "QR EN",
            onClick: () => setQrLang("en"),
          },
        ]}
      />

      {/* Liens */}
      <Menu
        label="Lien"
        title="Liens publics"
        items={[
          {
            label: "Ouvrir lien FR",
            href: publicUrl("fr"),
            target: "_blank",
          },
          {
            label: "Ouvrir lien EN",
            href: publicUrl("en"),
            target: "_blank",
          },
          { divider: true },
          {
            label: "Copier lien FR",
            onClick: () => copyToClipboard(publicUrl("fr")),
          },
          {
            label: "Copier lien EN",
            onClick: () => copyToClipboard(publicUrl("en")),
          },
        ]}
      />

      {/* Export */}
      <Menu
        label="Export"
        title="Exporter en Excel"
        items={[
          { label: "Export FR (.xlsx)", href: exportUrl("fr") },
          { label: "Export EN (.xlsx)", href: exportUrl("en") },
        ]}
      />

      {/* Supprimer */}
      <button
        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition"
        onClick={doDelete}
      >
        Supprimer
      </button>

      {/* Modal QR si demandé */}
      {qrLang && (
        <QRModal
          title={`QR code (${qrLang.toUpperCase()})`}
          url={publicUrl(qrLang)}
          onClose={() => setQrLang(null)}
        />
      )}
    </div>
  );
}

/* ---------- helpers UI simples (Menu / Modal / QR) ----------- */

function Menu({
  label,
  title,
  items,
}: {
  label: string;
  title: string;
  items: (
    | { label?: string; href?: string; target?: string; onClick?: () => void }
    | { divider: true }
  )[];
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onDoc = () => setOpen(false);
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <div className="relative">
      <button
        className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50 transition"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute z-20 mt-2 w-56 rounded-xl border bg-white shadow"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, i) =>
            "divider" in it ? (
              <div key={`d-${i}`} className="my-1 border-t" />
            ) : it.href ? (
              <a
                key={it.label}
                href={it.href}
                target={it.target}
                className="block px-3 py-2 hover:bg-neutral-50"
                role="menuitem"
              >
                {it.label}
              </a>
            ) : (
              <button
                key={it.label}
                className="w-full text-left px-3 py-2 hover:bg-neutral-50"
                onClick={it.onClick}
                role="menuitem"
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function QRModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    url
  )}&size=220x220&margin=0`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="px-2 py-1 rounded-lg border hover:bg-neutral-50"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex flex-col items-center gap-3">
          <img src={qrSrc} alt="QR code" className="rounded-md border" />
          <code className="text-xs bg-neutral-100 px-2 py-1 rounded break-all">
            {url}
          </code>
          <div className="flex gap-2">
            <a
              href={url}
              target="_blank"
              className="px-3 py-1.5 rounded-lg border bg-black text-white hover:bg-neutral-800 transition"
            >
              Ouvrir
            </a>
            <button
              className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
              onClick={() => copyToClipboard(url)}
            >
              Copier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- utilitaires ---------- */

function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin.replace(/\/$/, ""));
    }
  }, []);
  return origin || "";
}

function copyToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    alert("Lien copié dans le presse-papiers");
  } else {
    // fallback simple
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("Lien copié");
  }
}

function formatDate(d?: string | Date | null) {
  if (!d) return "";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString();
  } catch {
    return String(d);
  }
}
