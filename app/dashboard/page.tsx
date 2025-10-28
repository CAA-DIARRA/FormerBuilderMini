import { PrismaClient } from "@prisma/client";
import DashboardClient, { type FormRow, type Stats } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // KPIs
  const [totalForms, totalResponses, activeForms] = await Promise.all([
    prisma.form.count(),
    prisma.response.count(),
    prisma.form.count({ where: { isOpen: true } }),
  ]);

  const stats: Stats = {
    totalForms,
    totalResponses,
    activeForms,
  };

  // Liste des formulaires
  const formsDb = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      isOpen: true,
      slug: true,
    },
  });

  // On force createdAt en string pour éviter les soucis de sérialisation
  const forms: FormRow[] = formsDb.map((f) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    isOpen: f.isOpen,
    createdAt: f.createdAt ? f.createdAt.toISOString() : "",
  }));

  return <DashboardClient forms={forms} stats={stats} />;
}
