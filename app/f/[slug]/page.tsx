// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

// Le composant client doit accepter EXACTEMENT { form, serverLang }
const ClientPublicForm = nextDynamic<{ form: any; serverLang: "fr" | "en" }>(
  () => import("./page.client").then((mod) => mod.default),
  { ssr: false } // ⚠️ très important : empêche le remount côté serveur
);

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

  const frozenForm = JSON.parse(JSON.stringify(form));

  // Mode debug (facultatif)
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

  // Le composant client n’est jamais réinitialisé → saisie stable
  return <ClientPublicForm form={frozenForm} serverLang={serverLang} />;
}
