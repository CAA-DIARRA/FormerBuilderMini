// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";

// ✅ On indique ici à TypeScript que le composant importé
//    accepte bien les props { form: any; serverLang: "fr" | "en"; }
const ClientPublicForm = nextDynamic<{ form: any; serverLang: "fr" | "en" }>(
  () => import("./page.client"),
  { ssr: false } // ✅ Empêche le remount côté serveur
);

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
  const frozenForm = JSON.parse(JSON.stringify(form)); // ✅ pour éviter les références Prisma

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

  // ✅ composant client stable, sans remount
  return <ClientPublicForm form={frozenForm} serverLang={serverLang} />;
}
