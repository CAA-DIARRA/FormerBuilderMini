// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic"; // ✅ on renomme l'import ici

// ✅ Client uniquement (pas SSR)
const ClientPublicForm = nextDynamic(() => import("./page.client"), {
  ssr: false,
});

export const dynamic = "force-dynamic"; // ✅ Next.js l'accepte
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
  const frozenForm = JSON.parse(JSON.stringify(form)); // ✅ éviter les références Prisma

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

  // ✅ composant client stable, aucun remount pendant la saisie
  return <ClientPublicForm form={frozenForm} serverLang={serverLang} />;
}
