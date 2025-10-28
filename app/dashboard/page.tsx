import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FormRow = {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  createdAt: string | Date;
};

type Stats = {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
};

async function getData(): Promise<{ forms: FormRow[]; stats: Stats }> {
  // On encapsule TOUT dans un try/catch pour éviter un crash 502
  try {
    const [totalForms, totalResponses, activeForms] = await Promise.all([
      prisma.form.count(),
      prisma.response.count(),
      prisma.form.count({ where: { isOpen: true } }),
    ]);

    const formsDb = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true, isOpen: true, slug: true },
    });

    const forms: FormRow[] = formsDb.map((f) => ({
      id: f.id,
      title: f.title,
      slug: f.slug,
      isOpen: f.isOpen,
      createdAt: f.createdAt ? f.createdAt.toISOString() : "",
    }));

    return {
      forms,
      stats: { totalForms, totalResponses, activeForms },
    };
  } catch (err: any) {
    // On log côté serveur, et on renvoie des valeurs neutres pour ne pas planter
    console.error("[/dashboard] DB error:", err?.message || err);
    return {
      forms: [],
      stats: { totalForms: 0, totalResponses: 0, activeForms: 0 },
    };
  }
}

export default async function DashboardPage() {
  const { forms, stats } = await getData();

  // ✅ On importe en lazy le client (évite d’échouer avant le rendu d’un message)
  const DashboardClient = (await import("./DashboardClient")).default;

  return <DashboardClient forms={forms} stats={stats} />;
}
