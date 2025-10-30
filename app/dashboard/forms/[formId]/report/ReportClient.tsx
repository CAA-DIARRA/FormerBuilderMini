// app/dashboard/forms/[formId]/report/ReportClient.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

type Lang = "fr" | "en";

type Resp = {
  // champs “participant*” facultatifs
  participantNom?: string | null;
  participantPrenoms?: string | null;
  participantFonction?: string | null;
  participantEntreprise?: string | null;

  // ENV
  envAccueil?: number | null;
  envLieu?: number | null;
  envMateriel?: number | null;
  envAmeliorations?: string | null;

  // CONTENU (Likert 1..4)
  contAttentes?: number | null;
  contUtiliteTravail?: number | null;
  contExercices?: number | null;
  contMethodologie?: number | null;
  contSupports?: number | null;
  contRythme?: number | null;
  contGlobal?: number | null;

  // FORMATEUR (Likert 1..4)
  formMaitrise?: number | null;
  formCommunication?: number | null;
  formClarte?: number | null;
  formMethodo?: number | null;
  formGlobal?: number | null;

  // Synthèse
  reponduAttentes?: "OUI" | "PARTIELLEMENT" | "NON" | null;
  formationsComplementaires?: string | null;
  temoignage?: string | null;
  consentementTemoignage?: boolean | null;
};

type Props = {
  lang: Lang;
  form: {
    id: string;
    title: string | null;
    trainerName: string | null;
    sessionDate: string | Date | null;
    location: string | null;
  };
  responses: Resp[]; // liste brute sortie de Prisma
};

const PALETTE = ["#2563eb", "#059669", "#f59e0b", "#ef4444", "#7c3aed"];

function mean(nums: Array<number | null | undefined>): number | null {
  const vals = nums.map((n) => (typeof n === "number" ? n : null)).filter((n): n is number => n !== null);
  if (!vals.length) return null;
  const s = vals.reduce((a, b) => a + b, 0);
  return +(s / vals.length).toFixed(2);
}

export default function ReportClient({ lang, form, responses }: Props) {
  const L = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Report",
        meta: {
          trainer: "Trainer",
          date: "Date",
          location: "Location",
          participants: "Participants",
        },
        contentTitle: "CONTENT CHART",
        trainerTitle: "TRAINER CHART",
        expectationsTitle: "EXPECTATIONS (YES / PARTLY / NO)",
        desiredTrainings: "Desired complementary trainings",
        tableCol: { training: "Training idea" },
        xAxis: "Criteria",
        yAxis: "Score (1–4)",
        threshold: "Target (≥ 3)",
        content: {
          attentes: "Meets expectations",
          utile: "Useful for work",
          exos: "Exercises/examples/videos",
          methodo: "Methodology",
          supports: "Training materials",
          rythme: "Pace",
          global: "Overall (content)",
        },
        trainerSec: {
          maitrise: "Subject mastery",
          com: "Communication",
          clarte: "Clarity of answers",
          methodo: "Methodology mastery",
          global: "Overall (trainer)",
        },
        expectations: { yes: "YES", partly: "PARTLY", no: "NO" },
      };
    }
    return {
      title: "Rapport",
      meta: {
        trainer: "Formateur",
        date: "Date",
        location: "Lieu",
        participants: "Participants",
      },
      contentTitle: "GRAPHIQUE CONTENU",
      trainerTitle: "GRAPHIQUE FORMATEUR",
      expectationsTitle: "ATTENTES (OUI / PARTIELLEMENT / NON)",
      desiredTrainings: "Formations complémentaires souhaitées",
      tableCol: { training: "Intitulé de formation" },
      xAxis: "Critères",
      yAxis: "Note (1–4)",
      threshold: "Seuil (≥ 3)",
      content: {
        attentes: "Couvre vos attentes",
        utile: "Utile pour le travail",
        exos: "Exercices / exemples / vidéos",
        methodo: "Méthodologie",
        supports: "Supports de formation",
        rythme: "Rythme",
        global: "Évaluation globale (contenu)",
      },
      trainerSec: {
        maitrise: "Maîtrise du sujet",
        com: "Communication",
        clarte: "Clarté des réponses",
        methodo: "Maîtrise méthodologie",
        global: "Évaluation globale (formateur)",
      },
      expectations: { yes: "OUI", partly: "PARTIELLEMENT", no: "NON" },
    };
  }, [lang]);

  // ---- Données pour CONTENU (moyennes)
  const contentData = useMemo(() => {
    return [
      { key: "contAttentes", label: L.content.attentes, avg: mean(responses.map((r) => r.contAttentes)) },
      { key: "contUtiliteTravail", label: L.content.utile, avg: mean(responses.map((r) => r.contUtiliteTravail)) },
      { key: "contExercices", label: L.content.exos, avg: mean(responses.map((r) => r.contExercices)) },
      { key: "contMethodologie", label: L.content.methodo, avg: mean(responses.map((r) => r.contMethodologie)) },
      { key: "contSupports", label: L.content.supports, avg: mean(responses.map((r) => r.contSupports)) },
      { key: "contRythme", label: L.content.rythme, avg: mean(responses.map((r) => r.contRythme)) },
      { key: "contGlobal", label: L.content.global, avg: mean(responses.map((r) => r.contGlobal)) },
    ];
  }, [responses, L]);

  // ---- Données pour FORMATEUR (moyennes)
  const trainerData = useMemo(() => {
    return [
      { key: "formMaitrise", label: L.trainerSec.maitrise, avg: mean(responses.map((r) => r.formMaitrise)) },
      { key: "formCommunication", label: L.trainerSec.com, avg: mean(responses.map((r) => r.formCommunication)) },
      { key: "formClarte", label: L.trainerSec.clarte, avg: mean(responses.map((r) => r.formClarte)) },
      { key: "formMethodo", label: L.trainerSec.methodo, avg: mean(responses.map((r) => r.formMethodo)) },
      { key: "formGlobal", label: L.trainerSec.global, avg: mean(responses.map((r) => r.formGlobal)) },
    ];
  }, [responses, L]);

  // ---- Répartition OUI / PARTIELLEMENT / NON (camembert)
  const expectCounts = useMemo(() => {
    let yes = 0,
      partly = 0,
      no = 0;
    responses.forEach((r) => {
      if (r.reponduAttentes === "OUI") yes++;
      else if (r.reponduAttentes === "PARTIELLEMENT") partly++;
      else if (r.reponduAttentes === "NON") no++;
    });
    return [
      { name: L.expectations.yes, value: yes },
      { name: L.expectations.partly, value: partly },
      { name: L.expectations.no, value: no },
    ];
  }, [responses, L]);

  // ---- Formations complémentaires (table)
  const desiredTrainings = useMemo(() => {
    const rows =
      responses
        .map((r) => (r.formationsComplementaires || "").trim())
        .filter((s) => s.length > 0) || [];
    return rows;
  }, [responses]);

  const dateStr = form.sessionDate
    ? new Date(form.sessionDate).toLocaleDateString()
    : "";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* En-tête */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <p className="text-sm text-neutral-600">
          <span className="mr-4">{L.meta.trainer}: <strong>{form.trainerName ?? "-"}</strong></span>
          <span className="mr-4">{L.meta.date}: <strong>{dateStr || "-"}</strong></span>
          <span className="mr-4">{L.meta.location}: <strong>{form.location ?? "-"}</strong></span>
          <span className="mr-4">{L.meta.participants}: <strong>{responses.length}</strong></span>
        </p>
      </header>

      {/* GRAPHIQUE CONTENU */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.contentTitle}</h2>
        <div className="w-full h-80 bg-white rounded-2xl border">
          <ResponsiveContainer>
            <BarChart
              data={contentData}
              margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} label={{ value: L.yAxis, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="5 5" label={L.threshold} />
              <Bar dataKey="avg" name="Moyenne" fill={PALETTE[0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* GRAPHIQUE FORMATEUR */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.trainerTitle}</h2>
        <div className="w-full h-72 bg-white rounded-2xl border">
          <ResponsiveContainer>
            <BarChart
              data={trainerData}
              margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} label={{ value: L.yAxis, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="5 5" label={L.threshold} />
              <Bar dataKey="avg" name="Moyenne" fill={PALETTE[1]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ATTENTES (camembert) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.expectationsTitle}</h2>
        <div className="w-full h-64 bg-white rounded-2xl border">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={expectCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {expectCounts.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tableau des formations complémentaires souhaitées */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.desiredTrainings}</h2>
        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-4 py-2">{L.tableCol.training}</th>
              </tr>
            </thead>
            <tbody>
              {desiredTrainings.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-neutral-500">—</td>
                </tr>
              ) : (
                desiredTrainings.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 whitespace-pre-wrap">{t}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
