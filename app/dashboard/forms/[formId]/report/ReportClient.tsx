"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type Lang = "fr" | "en";

type FormMeta = {
  id: string;
  title: string | null;
  trainerName: string | null;
  sessionDate: string | null; // ISO
  location: string | null;
  slug: string | null;
  createdAt?: string | null;
  isOpen?: boolean;
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

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

const CONTENT_ROWS = [
  ["contAttentes", "Le contenu couvre-t-il vos attentes ?"],
  ["contUtiliteTravail", "Le contenu est-il utile pour votre travail ?"],
  ["contExercices", "Exercices / exemples / vidéos"],
  ["contMethodologie", "Méthodologie utilisée"],
  ["contSupports", "Supports de formation"],
  ["contRythme", "Rythme de la formation"],
  ["contGlobal", "Évaluation globale de la formation"],
] as const;

const TRAINER_ROWS = [
  ["formMaitrise", "Maîtrise du sujet"],
  ["formCommunication", "Qualité de communication"],
  ["formClarte", "Clarté des réponses aux questions"],
  ["formMethodo", "Maîtrise de la méthodologie"],
  ["formGlobal", "Évaluation globale du formateur"],
] as const;

// Palette simple (tu peux ajuster si tu veux)
const COLORS = ["#111827", "#6B7280", "#A3A3A3", "#D4D4D4"]; // noir → gris clair
const COLORS_YPN = ["#16A34A", "#F59E0B", "#DC2626"]; // OUI (vert), PARTIEL (orange), NON (rouge)

export default function ReportClient({
  form,
  responses,
  lang = "fr",
}: {
  form: FormMeta;
  responses: Resp[];
  lang?: Lang;
}) {
  const T = useMemo(() => {
    if (lang === "en") {
      return {
        back: "Back to dashboard",
        title: "Training report",
        metaTrainer: "Trainer",
        metaDate: "Date",
        metaLocation: "Location",
        kpis: {
          total: "Total responses",
          avgContent: "Avg. — training content",
          avgTrainer: "Avg. — trainer",
          meet: "Did it meet expectations?",
          yes: "YES",
          partly: "PARTLY",
          no: "NO",
        },
        sections: {
          content: "Charts — Training content",
          trainer: "Charts — Trainer",
          pies: "Pie charts — Distributions",
          wishes: "Desired complementary trainings",
          testimonials: "Testimonials (consented)",
        },
        scale: "Scale 1–4",
        average: "Average",
        distribution: "Distribution (1→4)",
        none: "No data",
      };
    }
    return {
      back: "Retour au tableau de bord",
      title: "Rapport de formation",
      metaTrainer: "Formateur",
      metaDate: "Date",
      metaLocation: "Lieu",
      kpis: {
        total: "Total réponses",
        avgContent: "Moy. — contenu",
        avgTrainer: "Moy. — formateur",
        meet: "Répondu aux attentes ?",
        yes: "OUI",
        partly: "PARTIELLEMENT",
        no: "NON",
      },
      sections: {
        content: "Graphiques — Contenu",
        trainer: "Graphiques — Formateur",
        pies: "Camemberts — Répartitions",
        wishes: "Formations complémentaires souhaitées",
        testimonials: "Témoignages (avec consentement)",
      },
      scale: "Échelle 1–4",
      average: "Moyenne",
      distribution: "Répartition (1→4)",
      none: "Aucune donnée",
    };
  }, [lang]);

  /* --------------------- calculs ---------------------- */
  const scale = [1, 2, 3, 4];
  const threshold = 3; // Seuil de satisfaction

  const avg = (arr: Array<number | null | undefined>) => {
    const nums = arr.filter((v): v is number => typeof v === "number" && v >= 1 && v <= 4);
    if (!nums.length) return null;
    const s = nums.reduce((a, b) => a + b, 0);
    return +(s / nums.length).toFixed(2);
  };

  const dist = (arr: Array<number | null | undefined>) => {
    const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    arr.forEach((v) => {
      if (typeof v === "number" && v >= 1 && v <= 4) d[v]++;
    });
    return d;
  };

  const pick = (key: keyof Resp) => responses.map((r) => r[key]) as Array<number | null | undefined>;

  // KPIs (moyenne des moyennes par section)
  const kpiAvgContent = avg(CONTENT_ROWS.map(([k]) => avg(pick(k as keyof Resp)) ?? 0));
  const kpiAvgTrainer = avg(TRAINER_ROWS.map(([k]) => avg(pick(k as keyof Resp)) ?? 0));

  // Expectations (Y/P/N)
  const meetYes = responses.filter((r) => r.reponduAttentes === "OUI").length;
  const meetPart = responses.filter((r) => r.reponduAttentes === "PARTIELLEMENT").length;
  const meetNo = responses.filter((r) => r.reponduAttentes === "NON").length;
  const meetTotal = Math.max(1, meetYes + meetPart + meetNo);

  // Distributions agrégées pour camemberts
  const allContentValues = CONTENT_ROWS.flatMap(([k]) => pick(k as keyof Resp));
  const allTrainerValues = TRAINER_ROWS.flatMap(([k]) => pick(k as keyof Resp));

  const distContent = dist(allContentValues);
  const distTrainer = dist(allTrainerValues);

  const pieDataContent = scale.map((n) => ({ name: String(n), value: distContent[n] || 0 }));
  const pieDataTrainer = scale.map((n) => ({ name: String(n), value: distTrainer[n] || 0 }));
  const pieDataYPN = [
    { name: T.kpis.yes, value: meetYes },
    { name: T.kpis.partly, value: meetPart },
    { name: T.kpis.no, value: meetNo },
  ];

  const wishes = responses
    .map((r) => (r.formationsComplementaires || "").trim())
    .filter((s) => !!s.length);

  const testimonials = responses
    .filter((r) => r.consentementTemoignage && (r.temoignage || "").trim().length)
    .map((r) => ({
      nom: [r.participantPrenoms, r.participantNom].filter(Boolean).join(" "),
      texte: (r.temoignage || "").trim(),
    }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {T.title} — {form.title ?? ""}
          </h1>
          <p className="text-sm text-neutral-600">
            {T.metaTrainer}: {form.trainerName ?? "-"} • {T.metaDate}: {fmtDate(form.sessionDate)} • {T.metaLocation}: {form.location ?? "-"}
          </p>
        </div>
        <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50">
          ← {T.back}
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI label={T.kpis.total} value={responses.length.toString()} />
        <KPI
          label={T.kpis.avgContent}
          value={kpiAvgContent?.toString() ?? "—"}
          good={!!kpiAvgContent && kpiAvgContent >= threshold}
        />
        <KPI
          label={T.kpis.avgTrainer}
          value={kpiAvgTrainer?.toString() ?? "—"}
          good={!!kpiAvgTrainer && kpiAvgTrainer >= threshold}
        />
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-neutral-600">{T.kpis.meet}</div>
          <div className="mt-2 space-y-1 text-sm">
            <Bar label={T.kpis.yes} value={Math.round((meetYes / meetTotal) * 100)} />
            <Bar label={T.kpis.partly} value={Math.round((meetPart / meetTotal) * 100)} />
            <Bar label={T.kpis.no} value={Math.round((meetNo / meetTotal) * 100)} />
          </div>
        </div>
      </div>

      {/* Camemberts */}
      <Section title={T.sections.pies}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PieCard title={`${T.kpis.meet}`}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieDataYPN} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {pieDataYPN.map((_, i) => (
                    <Cell key={i} fill={COLORS_YPN[i % COLORS_YPN.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </PieCard>

          <PieCard title="Contenu 1→4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieDataContent} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {pieDataContent.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </PieCard>

          <PieCard title="Formateur 1→4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieDataTrainer} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {pieDataTrainer.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </PieCard>
        </div>
      </Section>

      {/* Contenu */}
      <Section title={T.sections.content}>
        <Table rows={CONTENT_ROWS} pick={pick} avg={avg} dist={dist} scale={scale} total={responses.length} />
      </Section>

      {/* Formateur */}
      <Section title={T.sections.trainer}>
        <Table rows={TRAINER_ROWS} pick={pick} avg={avg} dist={dist} scale={scale} total={responses.length} />
      </Section>

      {/* Formations complémentaires */}
      <Section title={T.sections.wishes}>
        {wishes.length === 0 ? (
          <div className="text-sm text-neutral-600">{T.none}</div>
        ) : (
          <ul className="list-disc pl-6 space-y-1 text-sm">
            {wishes.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Témoignages */}
      <Section title={T.sections.testimonials}>
        {testimonials.length === 0 ? (
          <div className="text-sm text-neutral-600">{T.none}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border p-4 bg-white">
                <p className="text-sm leading-relaxed">“{t.texte}”</p>
                <div className="mt-2 text-xs text-neutral-600">— {t.nom || "Anonyme"}</div>
              </blockquote>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ------------------- Composants UI ------------------- */

function KPI({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        good === undefined ? "" : good ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
      }`}
    >
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-4 bg-white">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-28">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
        <div className="h-2 rounded-full bg-black" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="w-10 text-right">{value}%</div>
    </div>
  );
}

function Table({
  rows,
  pick,
  avg,
  dist,
  scale,
  total,
}: {
  rows: readonly (readonly [string, string])[];
  pick: (k: any) => (number | null | undefined)[];
  avg: (arr: Array<number | null | undefined>) => number | null;
  dist: (arr: Array<number | null | undefined>) => Record<number, number>;
  scale: number[];
  total: number;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-neutral-600">
          <th className="py-2">Question</th>
          <th className="py-2 w-24">Moyenne</th>
          <th className="py-2">Répartition (1→4)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([key, label]) => {
          const values = pick(key);
          const a = avg(values);
          const d = dist(values);
          return (
            <tr key={key} className="border-t">
              <td className="py-2 pr-4">{label}</td>
              <td className={`py-2 font-medium ${a && a >= 3 ? "text-green-700" : "text-red-600"}`}>{a ?? "—"}</td>
              <td className="py-2">
                <Distrib scale={scale} dist={d} total={total} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Distrib({
  scale,
  dist,
  total,
}: {
  scale: number[];
  dist: Record<number, number>;
  total: number;
}) {
  const t = Math.max(1, total);
  return (
    <div className="flex items-center gap-2">
      {scale.map((s) => {
        const pct = Math.round(((dist[s] || 0) / t) * 100);
        return (
          <div key={s} className="flex items-center gap-1">
            <span className="inline-block w-4 text-xs text-neutral-600 text-right">{s}</span>
            <div className="h-2 w-12 rounded bg-neutral-200 overflow-hidden">
              <div className="h-2 bg-black" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}
