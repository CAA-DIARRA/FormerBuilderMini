import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { z } from "zod";
const prisma = new PrismaClient();

export async function GET(_: NextRequest, { params }: { params: { formId: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email! } });
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form || form.ownerId !== me!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email! } });
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form || form.ownerId !== me!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = PatchBody.parse(await req.json());
  const update: any = { ...body };
  if (typeof body.sessionDate === "string") update.sessionDate = new Date(body.sessionDate);

  const updated = await prisma.form.update({ where: { id: params.formId }, data: update });
  return NextResponse.json({ form: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { formId: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email! } });
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form || form.ownerId !== me!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.response.deleteMany({ where: { formId: params.formId } });
  await prisma.form.delete({ where: { id: params.formId } });
  return NextResponse.json({ ok: true });
}
