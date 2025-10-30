import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

// On charge le wrapper côté client pour éviter tout effet serveur qui remonterait le composant.
const PublicFormShell = dynamic(() => import("../../components/PublicFormShell"), { ssr: false });

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string; debug?: string };
}) {
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });
  if (!form) return notFound();

  const serverLang = searchParams?.lang === "en" ? "en" : "fr";

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
