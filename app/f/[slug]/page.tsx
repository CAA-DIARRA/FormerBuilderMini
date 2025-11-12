// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const ClientPublicForm = dynamic(() => import("./page.client"), {
  ssr: false, // ✅ crucial : on ne réexécute pas côté serveur à chaque frappe
});

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

  // figer les données du form
  const frozenForm = JSON.parse(JSON.stringify(form));

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

  // ✅ le client est monté une seule fois, ne re-render plus à chaque frappe
  return <ClientPublicForm form={frozenForm} serverLang={serverLang} />;
}
