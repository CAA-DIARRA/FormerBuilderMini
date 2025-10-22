// app/dashboard/page.tsx
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // --- Stats
  const [totalForms, totalResponses, activeForms] = await Promise.all([
    prisma.form.count(),
    prisma.response.count(),
    prisma.form.count({ where: { isOpen: true } }),
  ]);

  // --- Liste simple des formulaires (les champs utilisés par le client)
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      isOpen: true,
      slug: true,
    },
  });

  return (
    <DashboardClient
      forms={forms}
      stats={{ totalForms, totalResponses, activeForms }}
    />
  );
}
