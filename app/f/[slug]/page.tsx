import { PrismaClient } from "@prisma/client";
import FormClient from "./FormClient";
const prisma = new PrismaClient();

export default async function Page({ params }: { params: { slug: string } }) {
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });
  if (!form || !form.isOpen) return <div className="p-6">Formulaire indisponible.</div>;
  return <FormClient form={form as any} />;
}
