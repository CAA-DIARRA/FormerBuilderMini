// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import FormClient from "../../../components/FormClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string; debug?: string };
}) {
  const prisma = new PrismaClient();
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });

  if (!form) return notFound();

  const lang = searchParams?.lang === "en" ? "en" : "fr";

  // Mode debug simple ?debug=1 pour vérifier que tout arrive bien
  if (searchParams?.debug === "1") {
    return (
      <pre style={{ padding: 16 }}>
        {"DEBUG VIEW\n\n"}
        {JSON.stringify(
          {
            slug: params.slug,
            lang,
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

  return <FormClient form={form} lang={lang as "fr" | "en"} />;
}
