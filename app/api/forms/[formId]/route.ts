import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function GET(_: NextRequest, { params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ form });
}

const PatchBody = z.object({
  isOpen: z.boolean().optional(),
  title: z.string().min(3).optional(),
  trainerName: z.string().min(2).optional(),
  sessionDate: z.string().optional(),
  location: z.string().min(2).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { formId: string } }) {
  const body = PatchBody.parse(await req.json());
  const data: any = { ...body };
  if (typeof body.sessionDate === "string") data.sessionDate = new Date(body.sessionDate);
  const updated = await prisma.form.update({ where: { id: params.formId }, data });
  return NextResponse.json({ form: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { formId: string } }) {
  await prisma.response.deleteMany({ where: { formId: params.formId } });
  await prisma.form.delete({ where: { id: params.formId } });
  return NextResponse.json({ ok: true });
}
