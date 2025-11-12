import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const prisma = new PrismaClient();

/* ----------------------- Helpers de normalisation ----------------------- */

// Convertit "3" -> 3, "3,0" -> 3, "" -> undefined
const toInt = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
};

// Convertit "on" / "true" / "1" en true, le reste en false (si défini)
const toBool = (v: unknown): boolean | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "on", "yes"].includes(s)) return true;
  if (["false", "0", "off", "no"].includes(s)) return false;
  if (typeof v === "boolean") return v;
  return undefined;
};

// ✅ YES/PARTIALLY/NO -> OUI/NON (PARTIELLEMENT supprimé)
const normExpectation = (v: unknown) => {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim().toUpperCase();

  if (["OUI", "O", "YES", "Y"].includes(s)) return "OUI" as const;
  if (["NON", "NO", "N"].includes(s)) return "NON" as const;

  // ❌ "PARTIELLEMENT" ou "PARTIALLY" => ignoré
  if (["PARTIELLEMENT", "PARTIEL", "PARTIALLY", "PARTIAL"].includes(s)) return undefined;

  return undefined;
};

/* ----------------------------- Schéma Zod ------------------------------ */

// Likert 1..5 (accepte string ou number)
const Likert = z.preprocess(toInt, z.number().int().min(1).max(5));

const Body = z
  .object({
    participantNom: z.string().max(120).trim().optional(),
    participantPrenoms: z.string().max(120).trim().optional(),
    participantFonction: z.string().max(120).trim().optional(),
    participantEntreprise: z.string().max(240).trim().optional(),

    envAccueil: Likert.optional(),
    envLieu: Likert.optional(),
    envMateriel: Likert.optional(),
    envAmeliorations: z.string().max(5000).trim().optional(),

    contAttentes: Likert.optional(),
    contUtiliteTravail: Likert.optional(),
    contExercices: Likert.optional(),
    contMethodologie: Likert.optional(),
    contSupports: Likert.optional(),
    contRythme: Likert.optional(),
    contGlobal: Likert.optional(),

    formMaitrise: Likert.optional(),
    formCommunication: Likert.optional(),
    formClarte: Likert.optional(),
    formMethodo: Likert.optional(),
    formGlobal: Likert.optional(),

    reponduAttentes: z.any().optional(),
    formationsComplementaires: z.string().max(5000).trim().optional(),
    temoignage: z.string().max(5000).trim().optional(),
    consentementTemoignage: z.preprocess(toBool, z.boolean().optional()),
  })
  .transform((raw) => ({
    ...raw,
    reponduAttentes: normExpectation(raw.reponduAttentes),
  }));

/* ------------------------------ Handler ------------------------------- */

export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const parsed = Body.parse(await req.json());

    // 🔐 Hash IP & User-Agent
    const ua = req.headers.get("user-agent") ?? undefined;
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : undefined;

    // ✅ Enregistrement Prisma (sans "PARTIELLEMENT")
    const created = await prisma.response.create({
      data: {
        formId: params.formId,
        userAgent: ua,
        ipHash,

        participantNom: parsed.participantNom ?? null,
        participantPrenoms: parsed.participantPrenoms ?? null,
        participantFonction: parsed.participantFonction ?? null,
        participantEntreprise: parsed.participantEntreprise ?? null,

        envAccueil: parsed.envAccueil ?? null,
        envLieu: parsed.envLieu ?? null,
        envMateriel: parsed.envMateriel ?? null,
        envAmeliorations: parsed.envAmeliorations ?? null,

        contAttentes: parsed.contAttentes ?? null,
        contUtiliteTravail: parsed.contUtiliteTravail ?? null,
        contExercices: parsed.contExercices ?? null,
        contMethodologie: parsed.contMethodologie ?? null,
        contSupports: parsed.contSupports ?? null,
        contRythme: parsed.contRythme ?? null,
        contGlobal: parsed.contGlobal ?? null,

        formMaitrise: parsed.formMaitrise ?? null,
        formCommunication: parsed.formCommunication ?? null,
        formClarte: parsed.formClarte ?? null,
        formMethodo: parsed.formMethodo ?? null,
        formGlobal: parsed.formGlobal ?? null,

        reponduAttentes: parsed.reponduAttentes ?? null, // ✅ “PARTIELLEMENT” jamais enregistré
        formationsComplementaires: parsed.formationsComplementaires ?? null,
        temoignage: parsed.temoignage ?? null,
        consentementTemoignage: parsed.consentementTemoignage ?? null,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    console.error("Error submitting form:", err);
    const message = err?.issues?.[0]?.message || err?.message || "submit_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
