import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const { formId } = params;
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "fr";

  // 1️⃣ Récupération du formulaire et des réponses
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const responses = await prisma.response.findMany({ where: { formId } });
  if (!responses.length)
    return NextResponse.json({ error: "No responses found" }, { status: 404 });

  // 2️⃣ Prépare le classeur Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("SYNTHÈSE");

  // Style générique
  const grayFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } };

  // === OUTILS ===
  const writeGroupTitle = (ws: ExcelJS.Worksheet, title: string) => {
    const row = ws.addRow([title]);
    row.font = { bold: true, size: 13 };
    ws.mergeCells(row.number, 1, row.number, 5);
  };

  const writeRow = (ws: ExcelJS.Worksheet, label: string, vals: any[]) => {
    const row = ws.addRow([label, ...vals]);
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.alignment = { vertical: "middle", horizontal: "center" };
  };

  // === 3️⃣ CALCUL MOYENNES ===
  function avg(key: keyof any) {
    const arr = responses.map((r: any) => r[key]);
    const valid = arr.filter((x: any) => typeof x === "number");
    return valid.length ? (valid.reduce((a: number, b: number) => a + b, 0) / valid.length) : null;
  }

  const envQuestions = [
    ["1. Comment avez-vous trouvé l'Accueil ?", "envAccueil"],
    ["2. Comment avez-vous trouvé le(s) Lieu(x) de formation ?", "envLieu"],
    ["3. Comment avez-vous trouvé le Matériel mis à disposition ?", "envMateriel"]
  ];
  const contQuestions = [
    ["1. Le contenu couvre-t-il vos attentes ?", "contAttentes"],
    ["2. Le contenu est-il utile pour votre travail ?", "contUtiliteTravail"],
    ["3. Comment avez-vous trouvé les exercices / exemples / vidéos ?", "contExercices"],
    ["4. Comment avez-vous trouvé la méthodologie utilisée ?", "contMethodologie"],
    ["5. Comment avez-vous trouvé les supports de la formation ?", "contSupports"],
    ["6. Comment avez-vous trouvé le rythme de la formation ?", "contRythme"],
    ["Évaluation globale de la formation", "contGlobal"]
  ];
  const formQuestions = [
    ["1. Maîtrise du sujet", "formMaitrise"],
    ["2. Qualité de communication", "formCommunication"],
    ["3. Clarté des réponses aux questions", "formClarte"],
    ["4. Maîtrise méthodologie de la formation", "formMethodo"],
    ["5. Évaluation globale du formateur", "formGlobal"]
  ];

  const participants = responses.map((r, i) => {
    const nom = (r.participantNom ?? "").trim().toUpperCase();
    const pre = (r.participantPrenoms ?? "").trim();
    if (!nom && !pre) return `P${i + 1}`;
    return `${pre ? pre[0].toUpperCase() + pre.slice(1) : ""} ${nom}`;
  });

  // === 4️⃣ TABLEAU SYNTHÈSE ====================================================
  writeGroupTitle(ws, "I. L’environnement de la formation");
  ws.addRow(["Critère", ...participants, "Moyenne", "Cible"]);
  envQuestions.forEach(([label, key]) => {
    const vals = responses.map((r: any) => r[key] ?? "");
    const moy = avg(key as any);
    ws.addRow([label, ...vals, moy?.toFixed(2) ?? "-", 2.5]);
  });
  ws.addRow([]);

  writeGroupTitle(ws, "II. Le Contenu de la formation");
  ws.addRow(["Critère", ...participants, "Moyenne", "Cible"]);
  contQuestions.forEach(([label, key]) => {
    const vals = responses.map((r: any) => r[key] ?? "");
    const moy = avg(key as any);
    ws.addRow([label, ...vals, moy?.toFixed(2) ?? "-", 2.5]);
  });
  ws.addRow([]);

  writeGroupTitle(ws, "III. Le(s) Formateur(s)");
  ws.addRow(["Critère", ...participants, "Moyenne", "Cible"]);
  formQuestions.forEach(([label, key]) => {
    const vals = responses.map((r: any) => r[key] ?? "");
    const moy = avg(key as any);
    ws.addRow([label, ...vals, moy?.toFixed(2) ?? "-", 2.5]);
  });

  // === 5️⃣ TABLEAU ATTENTE DES PARTICIPANTS ====================================
  let row = (ws.lastRow?.number ?? 0) + 2;
  const colStart = 1;

  {
    const title = "ATTENTE DES PARTICIPANTS";
    const r = ws.getRow(row);
    r.getCell(colStart).value = title;
    r.font = { bold: true, size: 13 };
    const width = 1 + participants.length + 1;
    ws.mergeCells(row, colStart, row, colStart + width - 1);
    row += 2;

    const sub = ws.getRow(row);
    sub.getCell(colStart).value = "Cette formation a-t-elle répondu à vos attentes ?";
    sub.font = { italic: true };
    ws.mergeCells(row, colStart, row, colStart + width - 1);
    row += 1;

    const header = ws.getRow(row);
    header.getCell(colStart).value = "Réponse";
    participants.forEach((name, i) => {
      header.getCell(colStart + 1 + i).value = name;
    });
    header.getCell(colStart + 1 + participants.length).value = "%";
    header.font = { bold: true };
    header.alignment = { horizontal: "center" };
    row += 1;

    const lines = [
      { key: "OUI", label: "OUI", count: 0 },
      { key: "NON", label: "NON", count: 0 }
    ];

    lines.forEach((line) => {
      const rr = ws.getRow(row);
      rr.getCell(colStart).value = line.label;
      participants.forEach((_, i) => {
        const val = (responses[i].reponduAttentes ?? "").toUpperCase();
        const hit = val === line.key ? 1 : "";
        if (hit === 1) line.count += 1;
        rr.getCell(colStart + 1 + i).value = hit;
        rr.getCell(colStart + 1 + i).alignment = { horizontal: "center" };
      });
      const pct = Math.round((line.count / responses.length) * 100);
      rr.getCell(colStart + 1 + participants.length).value = `${pct}%`;
      rr.getCell(colStart + 1 + participants.length).alignment = { horizontal: "center" };
      row += 1;
    });

    row += 2;
  }

  // === 6️⃣ FORMATIONS COMPLÉMENTAIRES ==========================================
  {
    const title = "FORMATIONS COMPLÉMENTAIRES ENVISAGÉES";
    const r = ws.getRow(row);
    r.getCell(1).value = title;
    r.font = { bold: true, size: 13 };
    ws.mergeCells(row, 1, row, 4);
    row += 2;

    const header = ws.getRow(row);
    header.getCell(1).value = "Participant";
    header.getCell(2).value = "Réponse";
    header.font = { bold: true };
    header.alignment = { horizontal: "center" };
    row += 1;

    responses.forEach((resp: any, i: number) => {
      const rr = ws.getRow(row);
      rr.getCell(1).value = participants[i];
      rr.getCell(2).value = resp.formationsComplementaires || "-";
      rr.getCell(2).alignment = { wrapText: true };
      row += 1;
    });

    ws.getColumn(1).width = 25;
    ws.getColumn(2).width = 90;
    row += 2;
  }

  // === 7️⃣ TÉMOIGNAGES ========================================================
  {
    const title = "TÉMOIGNAGES DES PARTICIPANTS";
    const r = ws.getRow(row);
    r.getCell(1).value = title;
    r.font = { bold: true, size: 13 };
    ws.mergeCells(row, 1, row, 4);
    row += 2;

    const header = ws.getRow(row);
    header.getCell(1).value = "Participant";
    header.getCell(2).value = "Témoignage";
    header.font = { bold: true };
    header.alignment = { horizontal: "center" };
    row += 1;

    responses.forEach((resp: any, i: number) => {
      const rr = ws.getRow(row);
      rr.getCell(1).value = participants[i];
      rr.getCell(2).value = resp.temoignage || "-";
      rr.getCell(2).alignment = { wrapText: true };
      row += 1;
    });

    ws.getColumn(1).width = 25;
    ws.getColumn(2).width = 90;
  }

  // === 8️⃣ EXPORT ==============================================================
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="evaluation-${form.title}.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
