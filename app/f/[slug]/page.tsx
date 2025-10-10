// app/f/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
// ⬇️ chemin RELATIF correct (2 niveaux)
import FormClient from "../../components/FormClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string };
}) {
  const prisma = new PrismaClient();
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });

  if (!form) return notFound();

  const lang = searchParams?.lang === "en" ? "en" : "fr";
  return <FormClient form={form} lang={lang} />;
}
