// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PublicFormShell from "@/app/components/PublicFormShell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string; debug?: string };
}) {
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });
  if (!form) return notFound();

  const serverLang: "fr" | "en" = searchParams?.lang === "en" ? "en" : "fr";

  if (searchParams?.debug === "1") {
    return (
      <pre style={{ padding: 16 }}>
        {JSON.stringify(
          {
            slug: params.slug,
            serverLang,
            title: form.title,
            trainerName: form.trainerName,
            sessionDate: form.sessionDate,
            location: form.location,
            isOpen: form.isOpen,
          },
          null,
          2
        )}
      </pre>
    );
  }

  // 🚫 Pas de setState ici, pas de modif d’URL → pas de remount côté saisie
  return <PublicFormShell form={form} serverLang={serverLang} />;
}
