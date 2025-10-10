import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") === "en" ? "en" : "fr");

  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/f/${form.slug}?lang=${lang}`;

  const png = await QRCode.toBuffer(url, { margin: 1, width: 512 });
  return new NextResponse(png, { headers: { "content-type": "image/png" } });
}
