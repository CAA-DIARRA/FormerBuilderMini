import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

// Helpers
const avg = (arr: (number | null | undefined)[]) => {
  const nums = arr.filter((x): x is number => typeof x === "number");
  return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : null;
};
const cnt = (arr: (string | null | undefined)[], v: string) =>
  arr.filter(x => (x ?? "").toLowerCase() === v.toLowerCase()).length;

export async function GET(
  _req: Request,
  { params }: { params: { formId: string } }
) {
  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    include: { responses: true },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const R = form.responses;

  // AGRÉGATS
  const envAccueil        = avg(R.map(r => r.envAccueil));
  const envLieu           = avg(R.map(r => r.envLieu));
  const envMateriel       = avg(R.map(r => r.envMateriel));

  const contAttentes       = avg(R.map(r => r.contAttentes));
  const contUtiliteTravail = avg(R.map(r => r.contUtiliteTravail));
  const contExercices      = avg(R.map(r => r.contExercices));
  const contMethodologie   = avg(R.map(r => r.contMethodologie));
  const contSupports       = avg(R.map(r => r.contSupports));
  const contRythme         = avg(R.map(r => r.contRythme));
  const contGlobal         = avg(R.map(r => r.contGlobal));

  const formMaitrise       = avg(R.map(r => r.formMaitrise));
  const formCommunication  = avg(R.map(r => r.formCommunication));
  const formClarte         = avg(R.map(r => r.formClarte));
  const formMethodo        = avg(R.map(r => r.formMethodo));
  const formGlobal         = avg(R.map(r => r.formGlobal));

  const reponduOui = cnt(R.map(r => r.reponduAttentes), "Oui");
  const reponduNon = cnt(R.map(r => r.reponduAttentes), "Non");

  // EXCEL
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("SYNTHESE");

  // Colonnes (largeurs)
  ws.columns = [
    { header: "", key: "c1", width: 32 },
    { header: "", key: "c2", width: 28 },
    { header: "", key: "c3", width: 18 },
    { header: "", key: "c4", width: 28 },
    { header: "", key: "c5", width: 28 },
    { header: "", key: "c6", width: 18 },
    { header: "", key: "c7", width: 18 },
    { header: "", key: "c8", width: 18 },
  ];

  // Style utilitaires
  const thin = { style: "thin" as const };
  const borderThin = { top: thin, left: thin, bottom: thin, right: thin };
  const title = ws.addRow(["ÉVALUATION DE LA FORMATION — SYNTHÈSE"]);
  ws.mergeCells(title.number, 1, title.number, 8);
  title.font = { bold: true, size: 14 };
  title.alignment = { vertical: "middle", horizontal: "center" };
  ws.addRow([]);

  // Métadonnées
  ws.addRow(["Intitulé", form.title ?? "—", "", "Formateur", form.trainerName ?? "—"]);
  ws.addRow(["Date", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "—", "", "Lieu", form.location ?? "—"]);
  ws.addRow([]);
  for (let i = 1; i <= 8; i++) ws.getCell(1, i).border = borderThin;

  const section = (label: string) => {
    const r = ws.addRow([label]);
    ws.mergeCells(r.number, 1, r.number, 8);
    r.font = { bold: true };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; // gris clair
    r.alignment = { vertical: "middle", horizontal: "left" };
  };
  const rowNum = (label: string, val: number | null) => {
    const r = ws.addRow([label, typeof val === "number" ? val : "—"]);
    r.getCell(2).numFmt = "0.0";
  };

  // ENVIRONNEMENT
  section("ENVIRONNEMENT (moyennes /5)");
  rowNum("Accueil", envAccueil);
  rowNum("Lieu", envLieu);
  rowNum("Matériel", envMateriel);
  ws.addRow([]);

  // CONTENU
  section("CONTENU (moyennes /5)");
  rowNum("Adéquation aux attentes", contAttentes);
  rowNum("Utilité pour le travail", contUtiliteTravail);
  rowNum("Exercices adaptés", contExercices);
  rowNum("Méthodologie", contMethodologie);
  rowNum("Supports", contSupports);
  rowNum("Rythme", contRythme);
  rowNum("Appréciation globale", contGlobal);
  ws.addRow([]);

  // FORMATEUR
  section("FORMATEUR (moyennes /5)");
  rowNum("Maîtrise du sujet", formMaitrise);
  rowNum("Communication", formCommunication);
  rowNum("Clarté", formClarte);
  rowNum("Méthodologie", formMethodo);
  rowNum("Appréciation globale", formGlobal);
  ws.addRow([]);

  // SYNTHÈSE
  section("SYNTHÈSE");
  ws.addRow(["A-t-elle répondu à vos attentes ?", `Oui: ${reponduOui}  /  Non: ${reponduNon}`]);
  ws.addRow([]);

  // DÉTAIL RÉPONSES
  section("DÉTAIL DES RÉPONSES");
  const header = ws.addRow([
    "Nom", "Prénoms", "Fonction", "Entreprise",
    "Accueil", "Lieu", "Matériel",
    "Attentes", "Utilité", "Exercices", "Méthodo", "Supports", "Rythme", "Contenu global",
    "Maîtrise", "Communication", "Clarté", "Méthodo (formateur)", "Formateur global",
    "Compléments souhaités", "Témoignage", "Consentement", "Date"
  ]);
  header.font = { bold: true };
  header.eachCell(c => { c.border = borderThin; c.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; });

  for (const r of R) {
    const row = ws.addRow([
      r.participantNom ?? "", r.participantPrenoms ?? "", r.participantFonction ?? "", r.participantEntreprise ?? "",
      r.envAccueil ?? "", r.envLieu ?? "", r.envMateriel ?? "",
      r.contAttentes ?? "", r.contUtiliteTravail ?? "", r.contExercices ?? "", r.contMethodologie ?? "", r.contSupports ?? "", r.contRythme ?? "", r.contGlobal ?? "",
      r.formMaitrise ?? "", r.formCommunication ?? "", r.formClarte ?? "", r.formMethodo ?? "", r.formGlobal ?? "",
      r.formationsComplementaires ?? "", r.temoignage ?? "", (r.consentementTemoignage ? "Oui" : "Non"),
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""
    ]);
    row.eachCell(c => c.border = borderThin);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="synthese_${form.slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
