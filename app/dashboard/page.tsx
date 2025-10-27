// app/dashboard/page.tsx
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // 1) Stats en parallèle
  const [totalForms, totalResponses, activeForms] = await Promise.all([
    prisma.form.count(),
    prisma.response.count(),
    prisma.form.count({ where: { isOpen: true } }),
  ]);

  // 2) Liste des formulaires
  const formsRaw = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isOpen: true,
      createdAt: true, // Date côté serveur
    },
  });

  // 3) Sérialisation (toujours string ISO)
  const forms = formsRaw.map((f) => ({
    id: f.id,
    title: f.title ?? "Sans titre",
    slug: f.slug,
    isOpen: f.isOpen,
    createdAt: f.createdAt.toISOString(), // <- string
  }));

  return (
    <DashboardClient
      forms={forms}
      stats={{ totalForms, totalResponses, activeForms }}
    />
  );
}
