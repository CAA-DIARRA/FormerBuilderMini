// app/dashboard/forms/[formId]/report/report/ReportClient.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

type Lang = "fr" | "en";

type Form = {
  id: string;
  title: string | null;
  slug: string;
  trainerName: string | null;
  location: string | null;
  sessionDate: string | null; // ISO
  createdAt: string | null;   // ISO
  isOpen: boolean;
};

type Resp = {
  id: string;
  submittedAt: string | null;

  participantNom: string | null;
  participantPrenoms: string | null;
  participantFonction: string | null;
  participantEntreprise: string | null;

  envAccueil: number | null;
  envLieu: number | null;
  envMateriel: number | null;
  envAmeliorations: string | null;

  contAttentes: number | null;
  contUtiliteTravail: number | null;
  contExercices: number | null;
  contMethodologie: number | null;
  contSupports: number | null;
  contRythme: number | null;
  contGlobal: number | null;

  formMaitrise: number | null;
  formCommunication: number | null;
  formClarte: number | null;
  formMethodo: number | null;
  formGlobal: number | null;

  reponduAttentes: "OUI" | "PARTIELLEMENT" | "NON" | null;
  formationsComplementaires: string | null;
  temoignage: string | null;
  consentementTemoignage: boolean | null;
};

export default function ReportClient({
  lang,
  form,
  responses,
}: {
  lang: Lang;
  form: Form;
  responses: Resp[];
}) {
  const T = useMemo(() => {
    if (lang === "en") {
      return {
        back: "← Back to dashboard",
        title: "Report",
        meta: "Session info",
        trainer: "Trainer",
        date: "Date",
        place: "Location",
        status: "Status",
        open: "Open",
        closed: "Closed",
        stats: "Key figures",
        nbResp: "Responses",
        avgContent: "Avg. training content (global)",
        avgTrainer: "Avg. trainer (global)",
        contentChart: "CONTENT CHART (1–5)",
        trainerChart: "TRAINER CHART (1–5)",
        pieTitle: "Did the training meet expectations?",
        yes: "YES",
        partly: "PARTLY",
        no: "NO",
        wishTitle: "Suggested complementary trainings",
        none: "No data.",
        export: "Export Excel",
        fr: "French (FR)",
        en: "English (EN)",
        publicLinks: "Public form links",
        frenchForm: "French form",
        englishForm: "English form",
      };
    }
    return {
      back: "← Retour au tableau de bord",
      title: "Rapport",
      meta: "Infos de session",
      trainer: "Formateur",
      date: "Date",
      place: "Lieu",
      status: "Statut",
      open: "Ouvert",
      closed: "Fermé",
      stats: "Chiffres clés",
      nbResp: "Réponses",
      avgContent: "Moy. contenu (global)",
      avgTrainer: "Moy. formateur (global)",
      contentChart: "GRAPHIQUE CONTENU (1–5)",
      trainerChart: "GRAPHIQUE FORMATEUR (1–5)",
      pieTitle: "La formation a-t-elle répondu aux attentes ?",
      yes: "OUI",
      partly: "PARTIELLEMENT",
      no: "NON",
      wishTitle: "Formations complémentaires proposées",
      none: "Aucune donnée.",
      export: "Export Excel",
      fr: "Français (FR)",
      en: "Anglais (EN)",
      publicLinks: "Liens publics du formulaire",
      frenchForm: "Formulaire français",
      englishForm: "Formulaire anglais",
    };
  }, [lang]);

  const nb = responses.length;

  const avg = (nums: (number | null | undefined)[]) => {
    const vals = nums.filter((x): x is number => typeof x === "number");
    if (!vals.length) return 0;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
  };

  const avgContent = avg(responses.map((r) => r.contGlobal));
  const avgTrainer = avg(responses.map((r) => r.formGlobal));

  // Barres CONTENU 1..5
  const contentRows = [
    { key: "contAttentes", label: lang === "fr" ? "Attentes" : "Expectations", v: avg(responses.map(r => r.contAttentes)) },
    { key: "contUtiliteTravail", label: lang === "fr" ? "Utilité travail" : "Usefulness for work", v: avg(responses.map(r => r.contUtiliteTravail)) },
    { key: "contExercices", label: lang === "fr" ? "Exercices / ex." : "Exercises / examples", v: avg(responses.map(r => r.contExercices)) },
    { key: "contMethodologie", label: lang === "fr" ? "Méthodologie" : "Methodology", v: avg(responses.map(r => r.contMethodologie)) },
    { key: "contSupports", label: lang === "fr" ? "Supports" : "Materials", v: avg(responses.map(r => r.contSupports)) },
    { key: "contRythme", label: lang === "fr" ? "Rythme" : "Pace", v: avg(responses.map(r => r.contRythme)) },
    { key: "contGlobal", label: lang === "fr" ? "Global contenu" : "Content overall", v: avg(responses.map(r => r.contGlobal)) },
  ];

  // Barres FORMATEUR 1..5
  const trainerRows = [
    { key: "formMaitrise", label: lang === "fr" ? "Maîtrise" : "Mastery", v: avg(responses.map(r => r.formMaitrise)) },
    { key: "formCommunication", label: lang === "fr" ? "Communication" : "Communication", v: avg(responses.map(r => r.formCommunication)) },
    { key: "formClarte", label: lang === "fr" ? "Clarté" : "Clarity", v: avg(responses.map(r => r.formClarte)) },
    { key: "formMethodo", label: lang === "fr" ? "Méthodo" : "Methodology", v: avg(responses.map(r => r.formMethodo)) },
    { key: "formGlobal", label: lang === "fr" ? "Global formateur" : "Trainer overall", v: avg(responses.map(r => r.formGlobal)) },
  ];

  // Camembert attentes
  const cYes = responses.filter(r => r.reponduAttentes === "OUI").length;
  const cPart = responses.filter(r => r.reponduAttentes === "PARTIELLEMENT").length;
  const cNo = responses.filter(r => r.reponduAttentes === "NON").length;
  const totalPie = cYes + cPart + cNo || 1;
  const pYes = (cYes / totalPie) * 100;
  const pPart = (cPart / totalPie) * 100;
  const pNo = 100 - pYes - pPart;

  // Liste formations complémentaires non vides (dé-dupliquée)
  const wishes = Array.from(
    new Set(
      responses
        .map((r) => (r.formationsComplementaires || "").trim())
        .filter((s) => s.length > 0)
    )
  );

  // URLs publiques + export
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_BASE_URL!
      : process.env.NEXT_PUBLIC_BASE_URL
      ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
      : "";

  const frUrl = `${base}/f/${form.slug}?lang=fr`;
  const enUrl = `${base}/f/${form.slug}?lang=en`;
  const exportFr = `/api/forms/${form.id}/export?lang=fr`;
  const exportEn = `/api/forms/${form.id}/export?lang=en`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm underline">
            {T.back}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{T.title} — {form.title}</h1>
          <p className="text-sm text-neutral-600">{T.meta} · {T.trainer}: {form.trainerName || "—"} · {T.date}: {form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "—"} · {T.place}: {form.location || "—"} · {T.status}: {form.isOpen ? T.open : T.closed}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a href={exportFr} className="px-3 py-1.5 rounded-xl bg-black text-white text-sm">{T.export} — {T.fr}</a>
          <a href={exportEn} className="px-3 py-1.5 rounded-xl border text-sm">{T.export} — {T.en}</a>
          <div className="text-xs text-right">
            <div className="opacity-60">{T.publicLinks}:</div>
            <a className="underline block" href={frUrl} target="_blank" rel="noreferrer">• {T.frenchForm}</a>
            <a className="underline block" href={enUrl} target="_blank" rel="noreferrer">• {T.englishForm}</a>
          </div>
        </div>
      </header>

      {/* CHIFFRES CLÉS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title={T.nbResp} value={String(nb)} />
        <Card title={T.avgContent} value={avgContent ? String(avgContent) : "—"} />
        <Card title={T.avgTrainer} value={avgTrainer ? String(avgTrainer) : "—"} />
      </section>

      {/* GRAPHIQUE CONTENU */}
      <ChartBlock title={T.contentChart} rows={contentRows} />

      {/* GRAPHIQUE FORMATEUR */}
      <ChartBlock title={T.trainerChart} rows={trainerRows} />

      {/* CAMEMBERT */}
      <section className="p-4 border rounded-2xl bg-white shadow space-y-4">
        <h2 className="font-semibold">{T.pieTitle}</h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div
            className="w-40 h-40 rounded-full"
            style={{
              background: `conic-gradient(#16a34a 0 ${pYes}%, #f59e0b ${pYes}% ${pYes + pPart}%, #ef4444 ${pYes + pPart}% 100%)`,
            }}
            title={`YES/OUI ${pYes.toFixed(0)}% • PART ${pPart.toFixed(0)}% • NO/NON ${pNo.toFixed(0)}%`}
          />
          <ul className="text-sm space-y-1">
            <li><span className="inline-block w-3 h-3 bg-[#16a34a] mr-2 rounded"></span>{T.yes}: {cYes}</li>
            <li><span className="inline-block w-3 h-3 bg-[#f59e0b] mr-2 rounded"></span>{T.partly}: {cPart}</li>
            <li><span className="inline-block w-3 h-3 bg-[#ef4444] mr-2 rounded"></span>{T.no}: {cNo}</li>
          </ul>
        </div>
      </section>

      {/* FORMATIONS COMPLÉMENTAIRES */}
      <section className="p-4 border rounded-2xl bg-white shadow space-y-4">
        <h2 className="font-semibold">{T.wishTitle}</h2>
        {wishes.length === 0 ? (
          <p className="text-sm opacity-70">{T.none}</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2">Intitulé</th>
                </tr>
              </thead>
              <tbody>
                {wishes.map((w, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4">{i + 1}</td>
                    <td className="py-2">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* --------- UI petites briques --------- */
function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 border rounded-2xl bg-white shadow">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ChartBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; v: number }[];
}) {
  // Les barres sont proportionnelles à /5 (abscisse 1..5)
  return (
    <section className="p-4 border rounded-2xl bg-white shadow space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-3 text-sm text-neutral-700">{r.label}</div>
            <div className="col-span-8 bg-neutral-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-black"
                style={{ width: `${Math.max(0, Math.min(100, (r.v / 5) * 100))}%` }}
                title={String(r.v || 0)}
              />
            </div>
            <div className="col-span-1 text-right text-sm tabular-nums">
              {r.v ? r.v.toFixed(2) : "—"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
