import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PublicFormShell from "../../components/PublicFormShell";

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

  const serverLang = (searchParams?.lang === "en" ? "en" : "fr") as "fr" | "en";

  if (searchParams?.debug === "1") {
    return (
      <pre style={{ padding: 16 }}>
        {"DEBUG VIEW\n\n"}
        {JSON.stringify(
          {
            slug: params.slug,
            lang: serverLang,
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

  return <PublicFormShell form={form} serverLang={serverLang} />;
}
