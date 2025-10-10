// app/api/forms/[formId]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

/* ----------------------------- Helpers génériques ---------------------------- */

const avg = (arr: (number | null | undefined)[]) => {
  const xs = arr.filter((x): x is number => typeof x === "number");
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
};

function pickLang(url: string): "fr" | "en" {
  const l = new URL(url).searchParams.get("lang");
  return l === "en" ? "en" : "fr";
}

// Agrégations globales par champ (adapte si tu as renommé des clefs)
type Agg = {
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
};

/* --------------------------------- i18n export ------------------------------- */
type ExportI18n = {
  sheet1Title: string;
  sheet2Title: string;

  envTitle: string;
  envRows: { key: keyof Agg; label: string }[];

  contTitle: string;
  contRows: { key: keyof Agg; label: string }[];

  formTitle: string; // clé requise
  formRows: { key: keyof Agg; label: string }[];

  target: number;
  chartCategories: string[];
  chartTitle: (cible: number) => string;
  legendMean: string;
  legendTarget: string;
  computeMeans: (agg: Agg) => (number | null)[];
  fileSuffix: string;
};
const EXPORT_I18N: Record<"fr" | "en", ExportI18n> = {
  fr: {
    sheet1Title: "SYNTHÈSE",
    sheet2Title: "GRAPHIQUE",

    envTitle: "I. L’environnement de la formation",
    envRows: [
      { key: "envAccueil",  label: "1. Comment avez-vous trouvé l’Accueil ?" },
      { key: "envLieu",     label: "2. Comment avez-vous trouvé le(s) lieu(x) de formation ?" },
      { key: "envMateriel", label: "3. Comment avez-vous trouvé le matériel mis à disposition ?" },
    ],

    contTitle: "II. Le contenu de la formation",
    contRows: [
      { key: "contAttentes",       label: "1. Le contenu couvre-t-il vos attentes ?" },
      { key: "contUtiliteTravail", label: "2. Le contenu est-il utile pour votre travail ?" },
      { key: "contExercices",      label: "3. Comment avez-vous trouvé les exercices / exemples / vidéos ?" },
      { key: "contMethodologie",   label: "4. Comment avez-vous trouvé la méthodologie utilisée pour la formation ?" },
      { key: "contSupports",       label: "5. Comment avez-vous trouvé les supports de la formation ?" },
      { key: "contRythme",         label: "6. Comment avez-vous trouvé le rythme de la formation ?" },
      { key: "contGlobal",         label: "Évaluation globale de la formation" },
    ],

    formTitle: "III. Le(s) formateur(s)",
    formRows: [
      { key: "formMaitrise",      label: "1. Maîtrise du sujet" },
      { key: "formCommunication", label: "2. Qualité de communication" },
      { key: "formClarte",        label: "3. Clarté des réponses aux questions" },
      { key: "formMethodo",       label: "4. Maîtrise de la méthodologie de la formation" },
      { key: "formGlobal",        label: "5. Évaluation globale du formateur" },
    ],

    target: 2.5,
    chartCategories: [
      "Qualité du contenu",
      "Qualité de l’animation",
      "Qualité du support",
      "Gestion du temps",
      "Qualité de la logistique",
    ],
    chartTitle: (cible: number) => `Moyennes par critère (cible = ${cible})`,
    legendMean: "MOYENNE",
    legendTarget: "CIBLE",

    computeMeans: (agg: Agg) => {
      const mContenu = avg([
        agg.contAttentes, agg.contMethodologie, agg.contSupports,
        agg.contExercices, agg.contUtiliteTravail, agg.contRythme, agg.contGlobal,
      ]);
      const mAnimation = avg([
        agg.formMaitrise, agg.formCommunication, agg.formClarte, agg.formMethodo, agg.formGlobal,
      ]);
      const mSupport = agg.contSupports ?? null;
      const mTemps = agg.contRythme ?? null;
      const mLogistique = avg([agg.envAccueil, agg.envLieu, agg.envMateriel]);
      return [mContenu, mAnimation, mSupport, mTemps, mLogistique];
    },

    fileSuffix: "FR",
  },

  en: {
    sheet1Title: "SUMMARY",
    sheet2Title: "CHART",

    envTitle: "I. Training environment",
    envRows: [
      { key: "envAccueil",  label: "1. How did you find the welcome/reception?" },
      { key: "envLieu",     label: "2. How did you find the training venue(s)?" },
      { key: "envMateriel", label: "3. How did you find the equipment provided?" },
    ],

    contTitle: "II. Training content",
    contRows: [
      { key: "contAttentes",       label: "1. Does the content meet your expectations?" },
      { key: "contUtiliteTravail", label: "2. Is the content useful for your work?" },
      { key: "contExercices",      label: "3. How did you find the exercises / examples / videos?" },
      { key: "contMethodologie",   label: "4. How did you find the methodology used for the training?" },
      { key: "contSupports",       label: "5. How did you find the training materials?" },
      { key: "contRythme",         label: "6. How did you find the training pace?" },
      { key: "contGlobal",         label: "Overall evaluation of the training" },
    ],

    formTitle: "III. Trainer(s)",
    formRows: [
      { key: "formMaitrise",      label: "1. Subject matter expertise" },
      { key: "formCommunication", label: "2. Quality of communication" },
      { key: "formClarte",        label: "3. Clarity of answers to questions" },
      { key: "formMethodo",       label: "4. Mastery of the training methodology" },
      { key: "formGlobal",        label: "5. Overall evaluation of the trainer" },
    ],

    target: 2.5,
    chartCategories: [
      "Content quality",
      "Facilitation quality",
      "Training materials quality",
      "Time management",
      "Logistics quality",
    ],
    chartTitle: (cible: number) => `Averages by criterion (target = ${cible})`,
    legendMean: "AVERAGE",
    legendTarget: "TARGET",

    computeMeans: (agg: Agg) => {
      const mContent = avg([
        agg.contAttentes, agg.contMethodologie, agg.contSupports,
        agg.contExercices, agg.contUtiliteTravail, agg.contRythme, agg.contGlobal,
      ]);
      const mFacilitation = avg([
        agg.formMaitrise, agg.formCommunication, agg.formClarte, agg.formMethodo, agg.formGlobal,
      ]);
      const mMaterials = agg.contSupports ?? null;
      const mTime = agg.contRythme ?? null;
      const mLogistics = avg([agg.envAccueil, agg.envLieu, agg.envMateriel]);
      return [mContent, mFacilitation, mMaterials, mTime, mLogistics];
    },

    fileSuffix: "EN",
  },
} as const;

/* ------------------------------ Styles ExcelJS ------------------------------- */

const grayFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } } as const;
const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF222222" } } as const;
const headerFont: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };

/* ------------------------------ Utilitaires XLSX ----------------------------- */

function setColumns(ws: ExcelJS.Worksheet) {
  ws.columns = [
    { header: "", key: "label", width: 65 },
    { header: "Moyenne / Average", key: "avg", width: 20 },
  ];
  const h = ws.getRow(1);
  h.fill = headerFill;
  h.font = headerFont;
  h.alignment = { horizontal: "center", vertical: "middle" };
  h.height = 18;
}

function writeGroupTitle(ws: ExcelJS.Worksheet, title: string) {
  const r = ws.addRow([title]);
  ws.mergeCells(r.number, 1, r.number, ws.columnCount);
  r.font = { bold: true };
  r.fill = grayFill;
  r.alignment = { vertical: "middle", horizontal: "left" };
}

function writeRow(ws: ExcelJS.Worksheet, label: string, value: number | null) {
  const v = typeof value === "number" ? Number(value.toFixed(2)) : null;
  const r = ws.addRow([label, v]);
  r.getCell(2).alignment = { horizontal: "center" };
}

/* --------------------------------- Handler GET ------------------------------- */

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const lang = pickLang(req.url);
  const T = EXPORT_I18N[lang];

  // 1) Données
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const responses = await prisma.response.findMany({
    where: { formId: form.id },
    orderBy: { submittedAt: "asc" },
  });

  // 2) Agrégations (moyenne par champ)
  const num = (k: keyof Agg) => avg(responses.map((r: any) => r[k]));
  const agg: Agg = {
    envAccueil: num("envAccueil"),
    envLieu: num("envLieu"),
    envMateriel: num("envMateriel"),

    contAttentes: num("contAttentes"),
    contUtiliteTravail: num("contUtiliteTravail"),
    contExercices: num("contExercices"),
    contMethodologie: num("contMethodologie"),
    contSupports: num("contSupports"),
    contRythme: num("contRythme"),
    contGlobal: num("contGlobal"),

    formMaitrise: num("formMaitrise"),
    formCommunication: num("formCommunication"),
    formClarte: num("formClarte"),
    formMethodo: num("formMethodo"),
    formGlobal: num("formGlobal"),
  };

  // 3) Classeur & feuille 1
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(T.sheet1Title);
  setColumns(ws);

  writeGroupTitle(ws, T.envTitle);
  T.envRows.forEach(r => writeRow(ws, r.label, agg[r.key as keyof Agg] ?? null));

  writeGroupTitle(ws, T.contTitle);
  T.contRows.forEach(r => writeRow(ws, r.label, agg[r.key as keyof Agg] ?? null));

  writeGroupTitle(ws, T.formTitle);
  T.formRows.forEach(r => writeRow(ws, r.label, agg[r.key as keyof Agg] ?? null));

  // 4) Feuille 2 : graphique (image QuickChart, pas de dépendance NPM)
  const wsChart = wb.addWorksheet(T.sheet2Title);
  // titre feuille 2
  const titleRow = wsChart.addRow([T.chartTitle(T.target)]);
  wsChart.mergeCells(titleRow.number, 1, titleRow.number, 10);
  titleRow.font = { bold: true, size: 13 };

  // Catégories & valeurs
  const categories = T.chartCategories;
  const means = T.computeMeans(agg);
  const qcConfig = {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: T.legendMean,
          data: means.map(v => (typeof v === "number" ? Number(v.toFixed(2)) : null)),
        },
        {
          label: T.legendTarget,
          type: "line",
          data: categories.map(() => T.target),
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: false, text: "" },
        legend: { position: "top" },
      },
      scales: { y: { min: 0, max: 4, ticks: { stepSize: 1 } } },
    },
  };

  // Appel direct QuickChart (évite d’ajouter une dépendance)
  const qcResp = await fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ width: 1200, height: 550, format: "png", backgroundColor: "white", version: "4", chart: qcConfig }),
  });

  if (!qcResp.ok) {
    // on insère juste un message texte si l’image n’a pas pu être générée
    const r = wsChart.addRow([lang === "en" ? "Chart generation failed" : "Échec de génération du graphique"]);
    wsChart.mergeCells(r.number, 1, r.number, 10);
    r.font = { italic: true, color: { argb: "FFAA0000" } };
  } else {
    const chartArrayBuf = await qcResp.arrayBuffer();
    // ExcelJS attend un Buffer Node
    const chartBuffer = Buffer.from(new Uint8Array(chartArrayBuf));
    // addImage typé strict → petit cast any pour éviter les erreurs TS entre Buffer & Uint8Array
    const imageId = (wb as any).addImage({ buffer: chartBuffer, extension: "png" });

    // Réserve une zone grande pour l'image
    wsChart.addImage(imageId, {
      tl: { col: 0, row: 2 },
      ext: { width: 1200, height: 550 },
      editAs: "oneCell",
    });
    // Ajuste largeur de quelques colonnes pour éviter le rognage
    Array.from({ length: 10 }).forEach((_, i) => (wsChart.getColumn(i + 1).width = 20));
    // Espace sous l'image
    wsChart.getRow(25).height = 6;
  }

  // 5) Retourne le fichier
  const buf = await wb.xlsx.writeBuffer();
  const fileNameSafe = `${form.title || "form"}`.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim();
  const outName = `${fileNameSafe}_${T.fileSuffix}.xlsx`;

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${outName}"`,
    },
  });
}
