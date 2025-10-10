
import { PrismaClient } from "@prisma/client";
import FormClient from "@/components/FormClient";

export default async function PublicFormPage({
  params,
  searchParams,
}: { params: { slug: string }, searchParams: { lang?: string } }) {
  const prisma = new PrismaClient();
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });
  if (!form) return <div>Not found</div>;

  const lang = (searchParams.lang === "en" ? "en" : "fr"); // défaut = fr
  return <FormClient form={form} lang={lang} />;
}
