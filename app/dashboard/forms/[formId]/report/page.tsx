// app/dashboard/forms/[formId]/report/page.tsx
import { PrismaClient } from "@prisma/client";
import ReportClient from "./ReportClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

type PageProps = {
  params: { formId: string };
  searchParams?: { lang?: string };
};

export default async function ReportPage({ params, searchParams }: PageProps) {
  const lang = (searchParams?.lang === "en" ? "en" : "fr") as "fr" | "en";

  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    select: {
      id: true,
      title: true,
      trainerName: true,
      sessionDate: true,
      location: true,
      slug: true,
      createdAt: true,
      isOpen: true,
    },
  });

  if (!form) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-bold">404</h1>
        <p className="text-neutral-600 mt-2">Formulaire introuvable.</p>
      </div>
    );
  }

  const responses = await prisma.response.findMany({
    where: { formId: form.id },
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

  const safeForm = {
    ...form,
    createdAt: form.createdAt?.toISOString() ?? null,
    sessionDate: form.sessionDate ? new Date(form.sessionDate).toISOString() : null,
  };
  const safeResponses = responses.map((r) => ({
    ...r,
    submittedAt: r.submittedAt?.toISOString() ?? null,
  }));

  return <ReportClient form={safeForm} responses={safeResponses} lang={lang} />;
}
