import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  const rows = await prisma.response.findMany({ where: { formId: params.formId }, orderBy: { submittedAt: "asc" } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Réponses");
  ws.addRow(["Intitulé", form?.title || "", "Formateur", form?.trainerName || ""]);
  ws.addRow(["Date", form?.sessionDate?.toISOString() || "", "Lieu", form?.location || ""]);
  ws.addRow([]);
  ws.addRow(["Date de soumission","Nom","Prénoms","Fonction","Entreprise","Env - Accueil","Env - Lieu","Env - Matériel","Améliorations","Cont - Attentes","Cont - Utilité travail","Cont - Exercices","Cont - Méthodologie","Cont - Supports","Cont - Rythme","Cont - Global","Form - Maîtrise","Form - Communication","Form - Clarté","Form - Méthodo","Form - Global","Répondu aux attentes","Formations complémentaires","Témoignage","Consentement témoignage"]);
  for (const r of rows) ws.addRow([r.submittedAt,r.participantNom,r.participantPrenoms,r.participantFonction,r.participantEntreprise,r.envAccueil,r.envLieu,r.envMateriel,r.envAmeliorations,r.contAttentes,r.contUtiliteTravail,r.contExercices,r.contMethodologie,r.contSupports,r.contRythme,r.contGlobal,r.formMaitrise,r.formCommunication,r.formClarte,r.formMethodo,r.formGlobal,r.reponduAttentes,r.formationsComplementaires,r.temoignage,r.consentementTemoignage?"Oui":"Non"]);
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf,{ headers:{ "content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition":`attachment; filename=export_${form?.slug}.xlsx` } });
}
