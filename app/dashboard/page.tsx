import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // --- Récupération des statistiques globales
  const [totalForms, totalResponses, activeForms] = await Promise.all([
    prisma.form.count(),
    prisma.response.count(),
    prisma.form.count({ where: { isOpen: true } }),
  ]);

  // --- Liste simple des formulaires pour affichage dans le tableau
  const formsRaw = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      isOpen: true,
      slug: true,
    },
  });

  // --- Conversion sécurisée pour éviter les erreurs de sérialisation côté client
  const forms = formsRaw.map((f) => ({
    ...f,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
  }));

  // --- Rendu côté client
  return (
    <DashboardClient
      forms={forms}
      stats={{ totalForms, totalResponses, activeForms }}
    />
  );
}
