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

  // === AGRÉGATS ===
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

  // === WORKBOOK ===
  const wb = new ExcelJS.Workbook();
  wb.creator = "Form Builder";
  wb.created = new Date();

  // Quelques styles utilitaires
  const thin = { style: "thin" as const };
  const borderThin = { top: thin, left: thin, bottom: thin, right: thin };
  // juste après const borderThin = ...
const grayFill: ExcelJS.FillPattern = {type: "pattern",pattern: "solid",fgColor: { argb: "FFF3F4F6" },};

  // ========== FEUILLE 1 : SYNTHÈSE ==========
  const ws1 = wb.addWorksheet("SYNTHÈSE");
  ws1.columns = [
    { header: "", key: "c1", width: 32 },
    { header: "", key: "c2", width: 28 },
    { header: "", key: "c3", width: 18 },
    { header: "", key: "c4", width: 28 },
    { header: "", key: "c5", width: 28 },
    { header: "", key: "c6", width: 18 },
  ];

  const title = ws1.addRow(["ÉVALUATION DE LA FORMATION — SYNTHÈSE"]);
  ws1.mergeCells(title.number, 1, title.number, 6);
  title.font = { bold: true, size: 14 };
  title.alignment = { vertical: "middle", horizontal: "center" };
  ws1.addRow([]);

  ws1.addRow(["Intitulé", form.title ?? "—", "", "Formateur", form.trainerName ?? "—"]);
  ws1.addRow(["Date", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "—", "", "Lieu", form.location ?? "—"]);
  ws1.addRow([]);

  const section = (ws: ExcelJS.Worksheet, label: string) => {
    const r = ws.addRow([label]);
    ws.mergeCells(r.number, 1, r.number, ws.columnCount);
    r.font = { bold: true };
    r.fill = grayFill;
    r.alignment = { vertical: "middle", horizontal: "left" };
  };
  const rowNum = (ws: ExcelJS.Worksheet, label: string, val: number | null) => {
    const r = ws.addRow([label, typeof val === "number" ? val : "—"]);
    r.getCell(2).numFmt = "0.0";
  };

  section(ws1, "ENVIRONNEMENT (moyennes /5)");
  rowNum(ws1, "Accueil", envAccueil);
  rowNum(ws1, "Lieu", envLieu);
  rowNum(ws1, "Matériel", envMateriel);
  ws1.addRow([]);

  section(ws1, "CONTENU (moyennes /5)");
  rowNum(ws1, "Adéquation aux attentes", contAttentes);
  rowNum(ws1, "Utilité pour le travail", contUtiliteTravail);
  rowNum(ws1, "Exercices adaptés", contExercices);
  rowNum(ws1, "Méthodologie", contMethodologie);
  rowNum(ws1, "Supports", contSupports);
  rowNum(ws1, "Rythme", contRythme);
  rowNum(ws1, "Appréciation globale", contGlobal);
  ws1.addRow([]);

  section(ws1, "FORMATEUR (moyennes /5)");
  rowNum(ws1, "Maîtrise du sujet", formMaitrise);
  rowNum(ws1, "Communication", formCommunication);
  rowNum(ws1, "Clarté", formClarte);
  rowNum(ws1, "Méthodologie", formMethodo);
  rowNum(ws1, "Appréciation globale", formGlobal);
  ws1.addRow([]);

  section(ws1, "SYNTHÈSE");
  ws1.addRow(["A-t-elle répondu à vos attentes ?", `Oui: ${reponduOui}  /  Non: ${reponduNon}`]);

  // ========== FEUILLE 2 : RÉCAP NOTES ==========
  const ws2 = wb.addWorksheet("RÉCAP NOTES");
  ws2.columns = [
    { header: "Rubrique", key: "rubrique", width: 28 },
    { header: "Critère",  key: "critere",  width: 32 },
    { header: "Moyenne/5", key: "moy",     width: 14 },
  ];
  const head2 = ws2.getRow(1);
  head2.font = { bold: true };
  head2.fill = grayFill;
  head2.alignment = { horizontal: "center" };
  head2.eachCell(c => c.border = borderThin);

  const addRow2 = (rub: string, crit: string, v: number | null) => {
    const r = ws2.addRow({ rubrique: rub, critere: crit, moy: (typeof v === "number" ? v : null) });
    r.getCell(3).numFmt = "0.0";
    r.eachCell(c => c.border = borderThin);
  };

  addRow2("Environnement", "Accueil", envAccueil);
  addRow2("Environnement", "Lieu", envLieu);
  addRow2("Environnement", "Matériel", envMateriel);

  addRow2("Contenu", "Adéquation aux attentes", contAttentes);
  addRow2("Contenu", "Utilité pour le travail", contUtiliteTravail);
  addRow2("Contenu", "Exercices adaptés", contExercices);
  addRow2("Contenu", "Méthodologie", contMethodologie);
  addRow2("Contenu", "Supports", contSupports);
  addRow2("Contenu", "Rythme", contRythme);
  addRow2("Contenu", "Appréciation globale", contGlobal);

  addRow2("Formateur", "Maîtrise du sujet", formMaitrise);
  addRow2("Formateur", "Communication", formCommunication);
  addRow2("Formateur", "Clarté", formClarte);
  addRow2("Formateur", "Méthodologie", formMethodo);
  addRow2("Formateur", "Appréciation globale", formGlobal);

  ws2.views = [{ state: "frozen", ySplit: 1 }];

  // ========== FEUILLE 3 : RÉPONSES ==========
  const ws3 = wb.addWorksheet("RÉPONSES");
  const headers3 = [
    "Nom", "Prénoms", "Fonction", "Entreprise",
    "Accueil", "Lieu", "Matériel",
    "Attentes", "Utilité", "Exercices", "Méthodo", "Supports", "Rythme", "Contenu global",
    "Maîtrise", "Communication", "Clarté", "Méthodo (formateur)", "Formateur global",
    "Compléments souhaités", "Témoignage", "Consentement", "Date"
  ];
  ws3.columns = headers3.map((h, i) => ({
    header: h,
    key: `c${i}`,
    width: [18,18,18,18,10,10,10,10,10,10,10,10,10,14,10,12,10,16,14,28,40,14,22][i] ?? 16
  }));
  const head3 = ws3.getRow(1);
  head3.font = { bold: true };
  head3.fill = grayFill;
  head3.eachCell(c => { c.border = borderThin; c.alignment = { wrapText: true, horizontal: "center" }; });

  for (const r of R) {
    const row = ws3.addRow([
      r.participantNom ?? "", r.participantPrenoms ?? "", r.participantFonction ?? "", r.participantEntreprise ?? "",
      r.envAccueil ?? "", r.envLieu ?? "", r.envMateriel ?? "",
      r.contAttentes ?? "", r.contUtiliteTravail ?? "", r.contExercices ?? "", r.contMethodologie ?? "", r.contSupports ?? "", r.contRythme ?? "", r.contGlobal ?? "",
      r.formMaitrise ?? "", r.formCommunication ?? "", r.formClarte ?? "", r.formMethodo ?? "", r.formGlobal ?? "",
      r.formationsComplementaires ?? "", r.temoignage ?? "", (r.consentementTemoignage ? "Oui" : "Non"),
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""
    ]);
    row.eachCell(c => c.border = borderThin);
  }
  ws3.views = [{ state: "frozen", ySplit: 1 }];
  ws3.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers3.length } };

  // ========== FEUILLE 4 : BRUT ==========
  const ws4 = wb.addWorksheet("BRUT");
  // On dump toutes les colonnes connues du modèle Response pour audit/exports avancés
  const rawHeaders = [
    "id","formId","submittedAt",
    "participantNom","participantPrenoms","participantFonction","participantEntreprise",
    "envAccueil","envLieu","envMateriel","envAmeliorations",
    "contAttentes","contUtiliteTravail","contExercices","contMethodologie","contSupports","contRythme","contGlobal",
    "formMaitrise","formCommunication","formClarte","formMethodo","formGlobal",
    "reponduAttentes","formationsComplementaires","temoignage","consentementTemoignage",
    "userAgent","ipHash"
  ];
  ws4.columns = rawHeaders.map(h => ({ header: h, key: h, width: Math.min(Math.max(h.length + 2, 14), 40) }));
  const head4 = ws4.getRow(1);
  head4.font = { bold: true };
  head4.fill = grayFill;

  for (const r of R) {
    ws4.addRow({
      id: r.id,
      formId: r.formId,
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null,
      participantNom: r.participantNom,
      participantPrenoms: r.participantPrenoms,
      participantFonction: r.participantFonction,
      participantEntreprise: r.participantEntreprise,
      envAccueil: r.envAccueil,
      envLieu: r.envLieu,
      envMateriel: r.envMateriel,
      envAmeliorations: r.envAmeliorations,
      contAttentes: r.contAttentes,
      contUtiliteTravail: r.contUtiliteTravail,
      contExercices: r.contExercices,
      contMethodologie: r.contMethodologie,
      contSupports: r.contSupports,
      contRythme: r.contRythme,
      contGlobal: r.contGlobal,
      formMaitrise: r.formMaitrise,
      formCommunication: r.formCommunication,
      formClarte: r.formClarte,
      formMethodo: r.formMethodo,
      formGlobal: r.formGlobal,
      reponduAttentes: r.reponduAttentes,
      formationsComplementaires: r.formationsComplementaires,
      temoignage: r.temoignage,
      consentementTemoignage: r.consentementTemoignage ? "Oui" : "Non",
      userAgent: r.userAgent,
      ipHash: r.ipHash,
    });
  }
  ws4.views = [{ state: "frozen", ySplit: 1 }];
  ws4.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: rawHeaders.length } };

  // Buffer & réponse
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="synthese_${form.slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
