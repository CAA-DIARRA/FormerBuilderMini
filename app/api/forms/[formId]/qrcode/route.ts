import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const prisma = new PrismaClient();

// Construit une URL absolue, même si NEXT_PUBLIC_BASE_URL n'est pas défini.
function buildAbsoluteUrl(req: Request, slug: string) {
  // 1) priorité à l'env si présent (ex: prod)
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base && /^https?:\/\//i.test(base)) {
    return `${base.replace(/\/+$/,"")}/f/${slug}`;
  }
  // 2) sinon, reconstruire depuis la requête (localhost/dev)
  const u = new URL(req.url);
  // u = .../api/forms/:id/qrcode, on remonte à l'origine
  const origin = `${u.protocol}//${u.host}`;
  return `${origin}/f/${slug}`;
}

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({ where: { id: params.formId } });
  if (!form) return new Response("Not found", { status: 404 });

  const url = buildAbsoluteUrl(req, form.slug);
  const png = await QRCode.toBuffer(url, { width: 512, margin: 1 });

  return new Response(png, {
    headers: {
      "content-type": "image/png",
      // permet le téléchargement avec un nom clair
      "content-disposition": `inline; filename="qr_${form.slug}.png"`,
      // cache léger (tu peux ajuster ou retirer en dev)
      "cache-control": "public, max-age=300",
    },
  });
}