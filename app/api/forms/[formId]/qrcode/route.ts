import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  _: Request,
  { params }: { params: { formId: string } }
) {
  // On récupère le formulaire
  const form = await prisma.form.findUnique({
    where: { id: params.formId },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  // 🔑 L’URL publique (Render)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/f/${form.slug}`;

  // Génération du QR code
  const qr = await QRCode.toBuffer(url);

  return new NextResponse(qr, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline; filename=qr.png",
    },
  });
}
