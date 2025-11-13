// app/forms/[formId]/report/page.tsx
import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

type Lang = "fr" | "en";
type RespRow = {
  participantNom?: string | null;
  participantPrenoms?: string | null;
  participantEntreprise?: string | null;

  envAccueil?: number | null;
  envLieu?: number | null;
  envMateriel?: number | null;

  contAttentes?: number | null;
  contUtiliteTravail?: number | null;
  contExercices?: number | null;
  contMethodologie?: number | null;
  contSupports?: number | null;
  contRythme?: number | null;
  contGlobal?: number | null;

  formMaitrise?: number | null;
  formCommunication?: number | null;
  formClarte?: number | null;
  formMethodo?: number | null;
  formGlobal?: number | null;

  reponduAttentes?: "OUI" | "PARTIELLEMENT" | "NON" | null;
  formationsComplementaires?: string | null;
  temoignage?: string | null;
};

const LABELS = {
  fr: {
    title: "Rapport d’évaluation",
    back: "Retour",
    meta: {
      trainer: "Formateur",
      date: "Date",
      location: "Lieu",
      publicUrl: "Lien public",
      responses: "Réponses",
    },
    envTitle: "Environnement",
    contTitle: "Contenu",
    formTitle: "Formateur(s)",
    avgs: "Moyenne",
    target: "Cible",
    charts: {
      cont: "GRAPHIQUE CONTENU",
      form: "GRAPHIQUE FORMATEUR",
      pie: "CAMEMBERT ATTENTES",
    },
    expectQ: "Cette formation a-t-elle répondu à vos attentes ?",
    yes: "OUI",
    partial: "PARTIELLEMENT",
    no: "NON",
    compTitle: "Formations complémentaires envisagées",
    none: "—",
  },
  en: {
    title: "Training evaluation report",
    back: "Back",
    meta: {
      trainer: "Trainer",
      date: "Date",
      location: "Location",
      publicUrl: "Public link",
      responses: "Responses",
    },
    envTitle: "Environment",
    contTitle: "Content",
    formTitle: "Trainer(s)",
    avgs: "Average",
    target: "Target",
    charts: {
      cont: "CONTENT CHART",
      form: "TRAINER CHART",
      pie: "EXPECTATIONS PIE",
    },
    expectQ: "Did this training meet your expectations?",
    yes: "YES",
    partial: "PARTLY",
    no: "NO",
    compTitle: "Additional courses considered",
    none: "—",
  },
} as const;

const CONT_ROWS = [
  { key: "contAttentes", label_fr: "Le contenu couvre-t-il vos attentes ?", label_en: "Does the content meet your expectations?" },
  { key: "contUtiliteTravail", label_fr: "Contenu utile pour le travail ?", label_en: "Is content useful for your work?" },
  { key: "contExercices", label_fr: "Exercices / exemples / vidéos", label_en: "Exercises / examples / videos" },
  { key: "contMethodologie", label_fr: "Méthodologie utilisée", label_en: "Methodology used" },
  { key: "contSupports", label_fr: "Supports de formation", label_en: "Training materials" },
  { key: "contRythme", label_fr: "Rythme de la formation", label_en: "Training pace" },
  { key: "contGlobal", label_fr: "Évaluation globale de la formation", label_en: "Overall evaluation of the training" },
] as const;

const FORM_ROWS = [
  { key: "formMaitrise", label_fr: "Maîtrise du sujet", label_en: "Mastery of the subject" },
  { key: "formCommunication", label_fr: "Qualité de communication", label_en: "Quality of communication" },
  { key: "formClarte", label_fr: "Clarté des réponses", label_en: "Clarity of answers" },
  { key: "formMethodo", label_fr: "Maîtrise de la méthodologie", label_en: "Mastery of methodology" },
  { key: "formGlobal", label_fr: "Évaluation globale du formateur", label_en: "Overall evaluation of the trainer" },
] as const;

function avg(nums: (number | null | undefined)[]) {
  const arr = nums.map((n) => (typeof n === "number" ? n : 0));
  if (arr.length === 0) return 0;
  const s = arr.reduce((a, b) => a + b, 0);
  return +(s / arr.length).toFixed(2);
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams?: { lang?: string };
}) {
  const lang: Lang = searchParams?.lang === "en" ? "en" : "fr";
  const L = LABELS[lang];

  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    select: {
      id: true,
      slug: true,
      title: true,
      trainerName: true,
      location: true,
      sessionDate: true,
      isOpen: true,
    },
  });

  if (!form) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p>Form not found.</p>
        <Link href="/dashboard" className="underline">{L.back}</Link>
      </div>
    );
  }

  // On lit toutes les réponses (les champs sont en colonnes dans le modèle Response)
  const raw = await prisma.response.findMany({
    where: { formId: form.id },
    orderBy: { id: "asc" },
    select: {
      participantNom: true,
      participantPrenoms: true,
      participantEntreprise: true,

      envAccueil: true,
      envLieu: true,
      envMateriel: true,

      contAttentes: true,
      contUtiliteTravail: true,
      contExercices: true,
      contMethodologie: true,
      contSupports: true,
      contRythme: true,
      contGlobal: true,

      formMaitrise: true,
      formCommunication: true,
      formClarte: true,
      formMethodo: true,
      formGlobal: true,

      reponduAttentes: true,
      formationsComplementaires: true,
      temoignage: true,
    },
  });
  const participants = raw as RespRow[];
  const total = participants.length;

  // Averages (Content & Trainer)
  const contLabels = CONT_ROWS.map(r => (lang === "en" ? r.label_en : r.label_fr));
  const contValues = CONT_ROWS.map(r =>
    avg(participants.map(p => (p as any)[r.key] as number | null))
  );

  const formLabels = FORM_ROWS.map(r => (lang === "en" ? r.label_en : r.label_fr));
  const formValues = FORM_ROWS.map(r =>
    avg(participants.map(p => (p as any)[r.key] as number | null))
  );

  // Expectations pie
  const countOui = participants.filter(p => p.reponduAttentes === "OUI").length;
  const countPar = participants.filter(p => p.reponduAttentes === "PARTIELLEMENT").length;
  const countNon = participants.filter(p => p.reponduAttentes === "NON").length;

  // QuickChart URLs (abscisse 1..5 comme demandé)
  const cible = 3; // (référence visuelle), modifie si besoin

  const contCfg = {
    type: "bar",
    data: {
      labels: contLabels,
      datasets: [
        { label: L.avgs, data: contValues },
        { label: L.target, data: contValues.map(() => cible) },
      ],
    },
    options: {
      indexAxis: "y",
      scales: { x: { min: 1, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { position: "bottom" }, title: { display: true, text: L.charts.cont } },
    },
  };
  const formCfg = {
    type: "bar",
    data: {
      labels: formLabels,
      datasets: [
        { label: L.avgs, data: formValues },
        { label: L.target, data: formValues.map(() => cible) },
      ],
    },
    options: {
      indexAxis: "y",
      scales: { x: { min: 1, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { position: "bottom" }, title: { display: true, text: L.charts.form } },
    },
  };
  const pieCfg = {
    type: "pie",
    data: {
      labels: [L.yes, L.partial, L.no],
      datasets: [{ data: [countOui, countPar, countNon] }],
    },
    options: {
      plugins: { legend: { position: "bottom" }, title: { display: true, text: L.charts.pie } },
    },
  };

  const qc = (cfg: any, w = 1200, h = 520) =>
    `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(cfg))}&format=png&backgroundColor=white&width=${w}&height=${h}`;

  // Liste “formations complémentaires”
  const compList = participants
    .map(p => (p.formationsComplementaires || "").trim())
    .filter(Boolean);

  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/f/${form.slug}`;
  const dStr = form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <div className="flex gap-3">
          <Link href="/dashboard" className="px-3 py-1 rounded border hover:bg-neutral-50">{L.back}</Link>
          {/* Lien direct vers l'export XLSX (lang synchronisée) */}
          <Link
            href={`/api/forms/${form.id}/export?lang=${lang}`}
            className="px-3 py-1 rounded border hover:bg-neutral-50"
          >
            Export XLSX
          </Link>
        </div>
      </div>

      {/* META */}
      <section className="grid gap-2 text-sm">
        <div><span className="font-medium">{L.meta.trainer} :</span> {form.trainerName ?? ""}</div>
        <div><span className="font-medium">{L.meta.date} :</span> {dStr}</div>
        <div><span className="font-medium">{L.meta.location} :</span> {form.location ?? ""}</div>
        <div><span className="font-medium">{L.meta.publicUrl} :</span>{" "}
          <Link className="underline" href={publicUrl} target="_blank">{publicUrl}</Link>
        </div>
        <div><span className="font-medium">{L.meta.responses} :</span> {total}</div>
      </section>

      {/* TABLEAU DES MOYENNES */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-4 bg-white">
          <h2 className="font-semibold mb-3">{L.contTitle}</h2>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left p-2">Critère</th>
                <th className="text-right p-2">{L.avgs}</th>
                <th className="text-right p-2">{L.target}</th>
              </tr>
            </thead>
            <tbody>
              {contLabels.map((label, i) => (
                <tr key={label} className="border-t">
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-right">{contValues[i].toFixed(2)}</td>
                  <td className="p-2 text-right">{cible.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border rounded-2xl p-4 bg-white">
          <h2 className="font-semibold mb-3">{L.formTitle}</h2>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left p-2">Critère</th>
                <th className="text-right p-2">{L.avgs}</th>
                <th className="text-right p-2">{L.target}</th>
              </tr>
            </thead>
            <tbody>
              {formLabels.map((label, i) => (
                <tr key={label} className="border-t">
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-right">{formValues[i].toFixed(2)}</td>
                  <td className="p-2 text-right">{cible.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRAPHIQUES */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-4 bg-white">
          <Image
            src={qc(contCfg)}
            alt={L.charts.cont}
            width={1200}
            height={520}
            className="w-full h-auto rounded-lg"
            unoptimized
          />
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <Image
            src={qc(formCfg)}
            alt={L.charts.form}
            width={1200}
            height={520}
            className="w-full h-auto rounded-lg"
            unoptimized
          />
        </div>
      </section>

      <section className="border rounded-2xl p-4 bg-white">
        <Image
          src={qc(pieCfg, 800, 480)}
          alt="Pie"
          width={800}
          height={480}
          className="w-full h-auto rounded-lg"
          unoptimized
        />
      </section>

      {/* FORMATIONS COMPLÉMENTAIRES */}
      <section className="border rounded-2xl p-4 bg-white">
        <h2 className="font-semibold mb-3">{L.compTitle}</h2>
        {compList.length === 0 ? (
          <div className="text-sm text-neutral-500">{L.none}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left p-2 w-16">#</th>
                <th className="text-left p-2">Intitulé</th>
              </tr>
            </thead>
            <tbody>
              {compList.map((txt, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{txt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
