// app/api/forms/[formId]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { getLabels } from "@/app/lib/labels";

const prisma = new PrismaClient();

// Cible par défaut (modifiable)
const CIBLE = 2.5;

// Les champs numériques du questionnaire (ordre = affichage)
const ENV_KEYS = [
  { key: "envAccueil", labelKey: "envAccueil" },
  { key: "envLieu", labelKey: "envLieu" },
  { key: "envMateriel", labelKey: "envMateriel" },
] as const;

const CONT_KEYS = [
  { key: "contAttentes", labelKey: "contAttentes" },
  { key: "contUtiliteTravail", labelKey: "contUtiliteTravail" },
  { key: "contExercices", labelKey: "contExercices" },
  { key: "contMethodologie", labelKey: "contMethodologie" },
  { key: "contSupports", labelKey: "contSupports" },
  { key: "contRythme", labelKey: "contRythme" },
  { key: "contGlobal", labelKey: "contGlobal" },
] as const;

const FORM_KEYS = [
  { key: "formMaitrise", labelKey: "formMaitrise" },
  { key: "formCommunication", labelKey: "formCommunication" },
  { key: "formClarte", labelKey: "formClarte" },
  { key: "formMethodo", labelKey: "formMethodo" },
  { key: "formGlobal", labelKey: "formGlobal" },
] as const;

type NumKey =
  | (typeof ENV_KEYS)[number]["key"]
  | (typeof CONT_KEYS)[number]["key"]
  | (typeof FORM_KEYS)[number]["key"];

function avg(nums: number[]) {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 10) / 10;
}

// Convertit arrayBuffer → Node Buffer (ExcelJS attend un Buffer)
function bufFrom(ab: ArrayBuffer): Buffer {
  return Buffer.from(new Uint8Array(ab));
}

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
  const L = getLabels(lang);

  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const reps = await prisma.response.findMany({
    where: { formId: form.id },
    orderBy: { submittedAt: "asc" },
  });

  // --- Prépare les données numériques (par clé) ---
  const byKey: Record<NumKey, number[]> = Object.create(null);
  [...ENV_KEYS, ...CONT_KEYS, ...FORM_KEYS].forEach(({ key }) => (byKey[key as NumKey] = []));

  // Attentes (Oui / Partiellement / Non)
  let countYes = 0;
  let countPart = 0;
  let countNo = 0;

  // Textes libres
  const listComplementaires: string[] = [];
  const listTemoignages: string[] = [];

  // Initiales participants (pour les colonnes)
  const initials: string[] = [];

  for (const r of reps) {
    // valeurs numériques (si notées)
    [...ENV_KEYS, ...CONT_KEYS, ...FORM_KEYS].forEach(({ key }) => {
      const v = (r as any)[key];
      if (typeof v === "number") byKey[key as NumKey].push(v);
      else byKey[key as NumKey].push(null as any); // on laisse des trous pour affichage
    });

    // initiales
    const nom = (r as any).participantNom || "";
    const pren = (r as any).participantPrenoms || "";
    const ini =
      (pren?.trim()?.[0]?.toUpperCase() ?? "") +
      (nom?.trim()?.[0]?.toUpperCase() ?? "");
    initials.push(ini || `P${initials.length + 1}`);

    // attentes
    const att = (r as any).reponduAttentes;
    if (att === "OUI" || att === "YES") countYes++;
    else if (att === "PARTIELLEMENT" || att === "PARTIALLY") countPart++;
    else if (att === "NON" || att === "NO") countNo++;

    // listes libres
    const comp = (r as any).formationsComplementaires;
    if (comp && String(comp).trim()) listComplementaires.push(String(comp).trim());
    const tem = (r as any).temoignage;
    if (tem && String(tem).trim()) listTemoignages.push(String(tem).trim());
  }

  // Moyennes par groupe
  const envAvg = ENV_KEYS.map(({ key }) => avg(byKey[key as NumKey].filter(n => typeof n === "number") as number[]));
  const contAvg = CONT_KEYS.map(({ key }) => avg(byKey[key as NumKey].filter(n => typeof n === "number") as number[]));
  const formAvg = FORM_KEYS.map(({ key }) => avg(byKey[key as NumKey].filter(n => typeof n === "number") as number[]));

  // === Création du classeur ===
  const wb = new ExcelJS.Workbook();
  wb.creator = "FormBuilder";
  wb.created = new Date();

  const grayFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };

  // Helper cellule group title
  const writeGroupTitle = (ws: ExcelJS.Worksheet, label: string) => {
    const r = ws.addRow([label]);
    ws.mergeCells(r.number, 1, r.number, ws.columnCount);
    r.font = { bold: true };
    r.fill = grayFill;
    r.alignment = { vertical: "middle", horizontal: "left" };
  };

  // === FEUILLE 1 : FORMATION ===
  const ws1 = wb.addWorksheet(L.sheet1Title);

  // colonnes : Critère | P1..Pn | Moyenne | Cible
  ws1.columns = [
    { header: L.colCritere, key: "crit", width: 60 },
    ...initials.map((ini, i) => ({ header: ini || `P${i + 1}`, key: `p${i + 1}`, width: 8 })),
    { header: L.colMoyenne, key: "avg", width: 10 },
    { header: L.colCible, key: "target", width: 8 },
  ];

  // Titre / méta
  const titleRow = ws1.addRow([`${form.title ?? "Formation"} — ${L.formSheetSubtitle}`]);
  ws1.mergeCells(titleRow.number, 1, titleRow.number, ws1.columnCount);
  titleRow.font = { bold: true, size: 14 };
  ws1.addRow([`${L.metaTrainer}: ${form.trainerName ?? "-"}`]);
  ws1.addRow([`${L.metaDate}: ${form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "-"}`]);
  ws1.addRow([`${L.metaPlace}: ${form.location ?? "-"}`]);
  ws1.addRow([]); // espace

  // Section ENVIRONNEMENT
  writeGroupTitle(ws1, L.envTitle);
  for (let i = 0; i < ENV_KEYS.length; i++) {
    const def = ENV_KEYS[i];
    const vals = byKey[def.key as NumKey];
    const row = [
      L.labels[def.labelKey],
      ...vals.map(v => (v == null ? "" : v)),
      envAvg[i] ?? "",
      CIBLE,
    ];
    ws1.addRow(row);
  }
  ws1.addRow([]);

  // Section CONTENU
  writeGroupTitle(ws1, L.contTitle);
  for (let i = 0; i < CONT_KEYS.length; i++) {
    const def = CONT_KEYS[i];
    const vals = byKey[def.key as NumKey];
    const row = [
      L.labels[def.labelKey],
      ...vals.map(v => (v == null ? "" : v)),
      contAvg[i] ?? "",
      CIBLE,
    ];
    ws1.addRow(row);
  }
  ws1.addRow([]);

  // Section FORMATEUR(S)
  writeGroupTitle(ws1, L.formTitle);
  for (let i = 0; i < FORM_KEYS.length; i++) {
    const def = FORM_KEYS[i];
    const vals = byKey[def.key as NumKey];
    const row = [
      L.labels[def.labelKey],
      ...vals.map(v => (v == null ? "" : v)),
      formAvg[i] ?? "",
      CIBLE,
    ];
    ws1.addRow(row);
  }
  ws1.addRow([]);

  // ATTENTES (tableau comptage + %)
  writeGroupTitle(ws1, L.expectationsTitle);
  const totalAtt = countYes + countPart + countNo || 1;
  const pct = (n: number) => Math.round((n / totalAtt) * 1000) / 10; // 1 décimale
  ws1.addRow([L.expHeader, "", "", "", "", ""]);
  ws1.addRow([L.yes, countYes, "", "", "", `${pct(countYes)}%`]);
  // On regroupe Partiellement dans NON pour rester fidèle à la maquette
  ws1.addRow([L.no, countNo + countPart, "", "", "", `${pct(countNo + countPart)}%`]);
  ws1.addRow([]);

  // Formations complémentaires (liste)
  writeGroupTitle(ws1, L.complementaryTitle);
  if (listComplementaires.length === 0) ws1.addRow([L.none]);
  else listComplementaires.forEach((t, i) => ws1.addRow([`${i + 1}. ${t}`]));
  ws1.addRow([]);

  // Témoignages (liste)
  writeGroupTitle(ws1, L.testimonialTitle);
  if (listTemoignages.length === 0) ws1.addRow([L.none]);
  else listTemoignages.forEach((t, i) => ws1.addRow([`${i + 1}. ${t}`]));

  // === FEUILLE 2 : GRAPHIQUE CONTENU ===
  const ws2 = wb.addWorksheet(L.sheet2Title);
  ws2.columns = Array.from({ length: 12 }, (_, i) => ({ header: "", key: `c${i + 1}`, width: 14 }));

  const r2 = ws2.addRow([L.chartContentTitle]);
  ws2.mergeCells(r2.number, 1, r2.number, 12);
  r2.font = { bold: true, size: 13 };

  // Prépare dataset QuickChart
  const labelsCont = CONT_KEYS.map(k => L.labels[k.labelKey]);
  const dataCont = contAvg.map(x => (x ?? 0));
  const qcConf2 = {
    type: "bar",
    data: {
      labels: labelsCont,
      datasets: [
        { label: L.avgLegend, data: dataCont, backgroundColor: "#4f82c0" },
        {
          type: "line",
          label: L.targetLegend,
          data: labelsCont.map(() => CIBLE),
          borderColor: "#2ca02c",
          fill: false,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: { y: { min: 0, max: 4, title: { display: true, text: L.colMoyenne } } },
    },
  };

  const img2Resp = await fetch("https://quickchart.io/chart?width=1400&height=650", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ backgroundColor: "white", format: "png", chart: qcConf2 }),
  });
  if (img2Resp.ok) {
    const ab = await img2Resp.arrayBuffer();
    const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
    ws2.addImage(imgId, { tl: { col: 0, row: 2 }, ext: { width: 1300, height: 520 } });
  } else {
    ws2.addRow([L.chartError]);
  }

  // === FEUILLE 3 : GRAPHIQUE FORMATEUR(S) ===
  const ws3 = wb.addWorksheet(L.sheet3Title);
  ws3.columns = Array.from({ length: 12 }, (_, i) => ({ header: "", key: `c${i + 1}`, width: 14 }));
  const r3 = ws3.addRow([L.chartTrainerTitle]);
  ws3.mergeCells(r3.number, 1, r3.number, 12);
  r3.font = { bold: true, size: 13 };

  const labelsForm = FORM_KEYS.map(k => L.labels[k.labelKey]);
  const dataForm = formAvg.map(x => (x ?? 0));
  const qcConf3 = {
    type: "bar",
    data: {
      labels: labelsForm,
      datasets: [
        { label: L.avgLegend, data: dataForm, backgroundColor: "#f28e2b" },
        {
          type: "line",
          label: L.targetLegend,
          data: labelsForm.map(() => CIBLE),
          borderColor: "#3b6fb6",
          fill: false,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: { y: { min: 0, max: 4, title: { display: true, text: L.colMoyenne } } },
    },
  };

  const img3Resp = await fetch("https://quickchart.io/chart?width=1400&height=650", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ backgroundColor: "white", format: "png", chart: qcConf3 }),
  });
  if (img3Resp.ok) {
    const ab = await img3Resp.arrayBuffer();
    const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
    ws3.addImage(imgId, { tl: { col: 0, row: 2 }, ext: { width: 1300, height: 520 } });
  } else {
    ws3.addRow([L.chartError]);
  }

  // === FEUILLE 4 : CAMEMBERT ATTENTES ===
  const ws4 = wb.addWorksheet(L.sheet4Title);
  ws4.columns = Array.from({ length: 10 }, (_, i) => ({ header: "", key: `c${i + 1}`, width: 16 }));
  const r4 = ws4.addRow([L.chartExpectationsTitle]);
  ws4.mergeCells(r4.number, 1, r4.number, 10);
  r4.font = { bold: true, size: 14 };

  const total = Math.max(1, countYes + countPart + countNo);
  const pieConf = {
    type: "pie",
    data: {
      labels: [L.no, L.yes],
      datasets: [
        {
          data: [countNo + countPart, countYes],
          backgroundColor: ["#ff2530", "#00ff2a"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        datalabels: { display: false },
      },
    },
  };

  const img4Resp = await fetch("https://quickchart.io/chart?width=1100&height=600", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ backgroundColor: "white", format: "png", chart: pieConf }),
  });
  if (img4Resp.ok) {
    const ab = await img4Resp.arrayBuffer();
    const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
    ws4.addImage(imgId, { tl: { col: 0, row: 2 }, ext: { width: 1000, height: 500 } });
  } else {
    ws4.addRow([L.chartError]);
  }

  // === Envoi ===
  const fileName = `${(form.title || "rapport")
    .replace(/[^\p{L}\p{N}\-_. ]+/gu, "")
    .replace(/\s+/g, "_")}_${lang.toUpperCase()}.xlsx`;

  const out = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return new NextResponse(bufFrom(out), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${fileName}"`,
    },
  });
}
