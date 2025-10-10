import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") === "en" ? "en" : "fr"; // défaut: fr

    // Récupère la base URL (Render/Prod) — fallback sur l'origine de la requête
    const baseEnv = process.env.NEXT_PUBLIC_BASE_URL;
    const origin = baseEnv ?? new URL(req.url).origin;

    // Va chercher le formulaire (pour le slug)
    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) {
      return new Response("Form not found", { status: 404 });
    }

    // URL publique target : /f/[slug]?lang=xx
    const publicUrl = `${origin}/f/${form.slug}?lang=${lang}`;

    // Génération PNG (Buffer)
    const pngBuffer: Buffer = await QRCode.toBuffer(publicUrl, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
    });

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("QR generation error", { status: 500 });
  }
}
