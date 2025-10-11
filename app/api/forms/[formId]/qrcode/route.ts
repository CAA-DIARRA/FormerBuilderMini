// app/api/forms/[formId]/qrcode/route.ts
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { formId: string } }
) {
  const urlObj = new URL(_req.url);
  const langParam = (urlObj.searchParams.get("lang") || "fr").toLowerCase();
  const lang = langParam === "en" ? "en" : "fr";

  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = process.env.NEXT_PUBLIC_BASE_URL || urlObj.origin;
  const target = `${base}/f/${form.slug}?lang=${lang}`;

  const png = await QRCode.toBuffer(target, { width: 600, margin: 1 });
  return new NextResponse(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
    },
  });
}
