import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { getLabels, TARGETS, COLS, CritKey } from "../../../../lib/labels";

const prisma = new PrismaClient();

/* -------------------- Helpers mise en forme -------------------- */

const grayFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFEFEF" },
};

function writeGroupTitle(
  ws: ExcelJS.Worksheet,
  title: string,
  colStart = 1,
  colEnd = 3,
  rowRef?: { value: number }
) {
  const r = rowRef ? rowRef.value : (ws as any)._currentRow || 1;
  const row = ws.getRow(r);
  row.getCell(colStart).value = title;
  ws.mergeCells(r, colStart, r, colEnd);
  row.font = { bold: true };
  row.alignment = { vertical: "middle", horizontal: "left" };
  row.fill = grayFill;
  if (rowRef) rowRef.value++;
  else (ws as any)._currentRow = r + 1;
}

function writeHeader(ws: ExcelJS.Worksheet, headers: string[], colStart = 1, rowRef?: { value: number }) {
  const r = rowRef ? rowRef.value : (ws as any)._currentRow || 1;
  const row = ws.getRow(r);
  headers.forEach((h, i) => {
    row.getCell(colStart + i).value = h;
  });
  row.font = { bold: true };
  row.fill = grayFill;
  if (rowRef) rowRef.value++;
  else (ws as any)._currentRow = r + 1;
}

function writeMeanAt(
  ws: ExcelJS.Worksheet,
  colStart: number,
  label: string,
  mean: number | null,
  target: number,
  rowRef?: { value: number }
) {
  const r = rowRef ? rowRef.value : (ws as any)._currentRow || 1;
  const row = ws.getRow(r);
  row.getCell(colStart + 0).value = label;
  row.getCell(colStart + 1).value = typeof mean === "number" ? Number(mean.toFixed(2)) : null;
  row.getCell(colStart + 2).value = target;
  if (rowRef) rowRef.value++;
  else (ws as any)._currentRow = r + 1;
}

function initialsFrom(nom?: string | null, prenoms?: string | null) {
  const n = (nom || "").trim();
  const p = (prenoms || "").trim();
  const take = (s: string) => (s ? s[0].toUpperCase() : "");
  return `${take(p)}${take(n)}` || "—";
}

/* -------------------- Agrégations -------------------- */

type Agg = Partial<Record<CritKey, number>>;

function computeAgg(responses: any[]): Agg {
  const keys: CritKey[] = [
    "envAccueil", "envLieu", "envMateriel",
    "contAttentes", "contUtiliteTravail", "contExercices", "contMethodologie", "contSupports", "contRythme", "contGlobal",
    "formMaitrise", "formCommunication", "formClarte", "formMethodo", "formGlobal",
  ];
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const r of responses) {
    for (const k of keys) {
      const v = r[k as keyof typeof r];
      if (typeof v === "number") {
        sums[k] = (sums[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      }
    }
  }
  const out: Agg = {};
  for (const k of keys) {
    if (counts[k] > 0) out[k] = sums[k] / counts[k];
  }
  return out;
}

/* -------------------- Handler -------------------- */

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const LABELS = getLabels(lang);
    const TARGET = TARGETS[lang];
    const C = COLS[lang];

    // Charge form + réponses
    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const responses = await prisma.response.findMany({
      where: { formId: params.formId },
      orderBy: { submittedAt: "asc" },
    });

    const agg = computeAgg(responses);

    // Workbook
    const wb = new ExcelJS.Workbook();
    const wsName = lang === "fr" ? "SYNTHÈSE" : "SUMMARY";
    const ws = wb.addWorksheet(wsName);

    // Largeurs de colonnes (droite D-F)
    ws.getColumn(4).width = 36; // D = Critère
    ws.getColumn(5).width = 14; // E = Moyenne
    ws.getColumn(6).width = 12; // F = Cible

    // ---- En-tête infos formation (haut de page, colonnes A..C)
    ws.getColumn(1).width = 20;
    ws.getColumn(2).width = 45;
    ws.getColumn(3).width = 20;

    let row = 1;

    const title = lang === "fr" ? "Synthèse d’évaluation de formation" : "Training evaluation summary";
    ws.mergeCells(row, 1, row, 6);
    ws.getRow(row).getCell(1).value = title;
    ws.getRow(row).font = { size: 14, bold: true };
    row += 2;

    // Détails formation
    const labelTitle = lang === "fr" ? "Intitulé de la formation" : "Course title";
    const labelTrainer = lang === "fr" ? "Formateur" : "Trainer";
    const labelDate = lang === "fr" ? "Date" : "Date";
    const labelPlace = lang === "fr" ? "Lieu" : "Place";

    ws.getRow(row).getCell(1).value = labelTitle;
    ws.getRow(row).getCell(2).value = form.title;
    row++;
    ws.getRow(row).getCell(1).value = labelTrainer;
    ws.getRow(row).getCell(2).value = (form as any).trainerName || "";
    row++;
    ws.getRow(row).getCell(1).value = labelDate;
    ws.getRow(row).getCell(2).value = form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "";
    row++;
    ws.getRow(row).getCell(1).value = labelPlace;
    ws.getRow(row).getCell(2).value = (form as any).location || "";
    row += 2;

    /* ============================
       BLOCS DE DROITE (D–F)
       Empilés verticalement : Environnement, Contenu, Formateur(s)
    ============================ */
    const right = { value: 2 }; // ligne de départ pour les blocs de droite

    // 1) Environnement
    writeGroupTitle(ws, LABELS.envTitle, 4, 6, right);
    writeHeader(ws, [C.critere, C.moyenne, C.cible], 4, right);
    LABELS.env.forEach(r => {
      const mean = agg[r.key as keyof Agg] ?? null;
      writeMeanAt(ws, 4, r.label, mean as number | null, TARGET.env, right);
    });
    right.value++; // espace

    // 2) Contenu
    writeGroupTitle(ws, LABELS.contTitle, 4, 6, right);
    writeHeader(ws, [C.critere, C.moyenne, C.cible], 4, right);
    LABELS.cont.forEach(r => {
      const mean = agg[r.key as keyof Agg] ?? null;
      writeMeanAt(ws, 4, r.label, mean as number | null, TARGET.cont, right);
    });
    right.value++;

    // 3) Formateur(s)
    writeGroupTitle(ws, LABELS.formTitle, 4, 6, right);
    writeHeader(ws, [C.critere, C.moyenne, C.cible], 4, right);
    LABELS.form.forEach(r => {
      const mean = agg[r.key as keyof Agg] ?? null;
      writeMeanAt(ws, 4, r.label, mean as number | null, TARGET.form, right);
    });
    right.value++;

    /* ============================
       RÉPONSES PAR PARTICIPANT (INITIALS)
       — Table dynamique en bas, colonnes A..(selon nb de critères)
    ============================ */
    row = Math.max(row, right.value + 1);

    const partTitle = lang === "fr"
      ? "Réponses par participant (initiales)"
      : "Responses per participant (initials)";
    writeGroupTitle(ws, partTitle, 1, 6, { value: row });
    row++;

    const crits = [
      ...getLabels(lang).env,
      ...getLabels(lang).cont,
      ...getLabels(lang).form,
    ];
    const headers = [COLS[lang].participant, ...crits.map(c => c.label)];

    // Colonnes autos (un peu larges pour lisibilité)
    ws.getColumn(1).width = 16;
    for (let i = 0; i < crits.length; i++) {
      ws.getColumn(2 + i).width = 14;
    }

    const tableRef = `A${row}`;
    const rows = responses.map((r: any) => {
      const sigle = initialsFrom(r.participantNom, r.participantPrenoms);
      const notes = crits.map(c => {
        const v = r[c.key as keyof typeof r];
        return typeof v === "number" ? v : null;
      });
      return [sigle, ...notes];
    });

    ws.addTable({
      name: `T_PARTICIPANTS_${Date.now()}`,
      ref: tableRef,
      headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: headers.map(h => ({ name: h })),
      rows,
    });

    // Fichier
    const filename = `${(form.slug || "form")}_${lang.toUpperCase()}.xlsx`;
    const arrayBuffer = await wb.xlsx.writeBuffer();
    const buff = Buffer.from(arrayBuffer as ArrayBuffer);

    return new NextResponse(buff, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("EXPORT ERROR", e);
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
