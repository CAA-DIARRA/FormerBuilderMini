import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
const prisma = new PrismaClient();

const Likert = z.number().int().min(1).max(4);
const Body = z.object({
  participantNom: z.string().max(120).optional(),
  participantPrenoms: z.string().max(120).optional(),
  participantFonction: z.string().max(120).optional(),
  participantEntreprise: z.string().max(240).optional(),
  envAccueil: Likert.optional(), envLieu: Likert.optional(), envMateriel: Likert.optional(),
  envAmeliorations: z.string().max(5000).optional(),
  contAttentes: Likert.optional(), contUtiliteTravail: Likert.optional(), contExercices: Likert.optional(),
  contMethodologie: Likert.optional(), contSupports: Likert.optional(), contRythme: Likert.optional(), contGlobal: Likert.optional(),
  formMaitrise: Likert.optional(), formCommunication: Likert.optional(), formClarte: Likert.optional(), formMethodo: Likert.optional(), formGlobal: Likert.optional(),
  reponduAttentes: z.enum(["OUI","PARTIELLEMENT","NON"]).optional(),
  formationsComplementaires: z.string().max(5000).optional(),
  temoignage: z.string().max(5000).optional(),
  consentementTemoignage: z.boolean().optional()
});

export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  const data = Body.parse(await req.json());
  const ua = req.headers.get("user-agent") ?? undefined;
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : undefined;
  const created = await prisma.response.create({ data: { ...data, formId: params.formId, userAgent: ua, ipHash } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
