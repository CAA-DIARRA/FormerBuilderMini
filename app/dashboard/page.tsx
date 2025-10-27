// app/dashboard/page.tsx
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // 1) Stats
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
      createdAt: true,
    },
  });

  // ⚠️ Sérialiser les Date pour le Client Component
  const forms = formsRaw.map((f) => ({
    ...f,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
  }));

  return (
    <DashboardClient
      forms={forms}
      stats={{ totalForms, totalResponses, activeForms }}
    />
  );
}
