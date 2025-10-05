import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ⚠️ Ici l’URL doit pointer vers ton site en ligne
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/f/${form.slug}`;

  const qr = await QRCode.toBuffer(url);
  return new NextResponse(qr, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline; filename=qr.png",
    },
  });
}
