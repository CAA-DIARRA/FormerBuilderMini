import { PrismaClient } from "@prisma/client";
import DashboardClient, { type FormRow, type Stats } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // Stats haut de page
  const [totalForms, totalResponses, activeForms] = await Promise.all([
    prisma.form.count(),
    prisma.response.count(),
    prisma.form.count({ where: { isOpen: true } }),
  ]);

  // Données des formulaires
  const rows = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, isOpen: true, createdAt: true },
  });

  // Normalisation stricte pour le composant client
  const forms: FormRow[] = rows.map((f) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    isOpen: f.isOpen,
    createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
  }));

  const stats: Stats = { totalForms, totalResponses, activeForms };

  return <DashboardClient forms={forms} stats={stats} />;
}
