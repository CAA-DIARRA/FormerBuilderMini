// app/dashboard/forms/[formId]/report/page.tsx
import { PrismaClient } from "@prisma/client";
import ReportClient from "./report/ReportClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

type Params = { params: { formId: string }; searchParams?: { lang?: string } };

export default async function ReportPage({ params, searchParams }: Params) {
  const { formId } = params;
  const lang = (searchParams?.lang === "en" ? "en" : "fr") as "fr" | "en";

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      title: true,
      slug: true,
      trainerName: true,
      location: true,
      sessionDate: true,
      createdAt: true,
      isOpen: true,
    },
  });

  if (!form) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-bold">404</h1>
        <p className="text-sm opacity-70">
          {lang === "fr" ? "Formulaire introuvable." : "Form not found."}
        </p>
      </div>
    );
  }

  // On sélectionne seulement les colonnes utilisées par le rapport
  const responses = await prisma.response.findMany({
    where: { formId },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      submittedAt: true,
      participantNom: true,
      participantPrenoms: true,
      participantFonction: true,
      participantEntreprise: true,

      envAccueil: true,
      envLieu: true,
      envMateriel: true,
      envAmeliorations: true,

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
      consentementTemoignage: true,
    },
  });

  // Sérialisation sûre pour le client (Dates -> ISO string)
  const formSerialized = {
    ...form,
    sessionDate: form.sessionDate ? form.sessionDate.toISOString() : null,
    createdAt: form.createdAt ? form.createdAt.toISOString() : null,
  };

  const responsesSerialized = responses.map((r) => ({
    ...r,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
  }));

  return (
    <ReportClient
      lang={lang}
      form={formSerialized}
      responses={responsesSerialized}
    />
  );
}
