// app/api/forms/by-slug/[slug]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const form = await prisma.form.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, title: true, trainerName: true, location: true,
      sessionDate: true, slug: true, isOpen: true,
    },
  });
  if (!form) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ form });
}
