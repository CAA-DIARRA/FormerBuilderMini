// app/api/forms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";

const prisma = new PrismaClient();

/* ---------------------- SCHEMA DE VALIDATION ---------------------- */
const Body = z.object({
  title: z.string().min(3),
  sessionDate: z.string(),
  trainerName: z.string().min(2),
  location: z.string().min(2),

  // 🆕 durée de la formation
  durationStart: z.string().optional(),
  durationEnd: z.string().optional(),
});

/* ---------------------- OWNER PAR DÉFAUT -------------------------- */
async function ensureDefaultOwner() {
  const DEFAULT_EMAIL = process.env.SEED_EMAIL || "admin@example.com";

  let owner = await prisma.user.findFirst();
  if (!owner) {
    owner = await prisma.user.create({
      data: { email: DEFAULT_EMAIL, name: "Owner (dev)" },
    });
  }
  return owner;
}

/* ----------------------------- POST -------------------------------- */
export async function POST(req: NextRequest) {
  const data = Body.parse(await req.json());

  // slug normalisé
  const base = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const slug = `${base}-${nanoid(6)}`;

  const owner = await ensureDefaultOwner();

  // conversion des dates
  const sessionDate = new Date(data.sessionDate);

  const durationStart =
    data.durationStart && data.durationStart.trim()
      ? new Date(data.durationStart)
      : null;

  const durationEnd =
    data.durationEnd && data.durationEnd.trim()
      ? new Date(data.durationEnd)
      : null;

  const form = await prisma.form.create({
    data: {
      title: data.title,
      sessionDate,
      trainerName: data.trainerName,
      location: data.location,
      slug,
      ownerId: owner.id,

      // 🆕 durée
      durationStart,
      durationEnd,
    },
  });

  return NextResponse.json({ form }, { status: 201 });
}

/* ------------------------------ GET -------------------------------- */
export async function GET(_: NextRequest) {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      slug: true,
      isOpen: true,

      // 🆕 durée
      durationStart: true,
      durationEnd: true,
    },
  });

  const withCounts = await Promise.all(
    forms.map(async (f) => ({
      ...f,
      responses: await prisma.response.count({ where: { formId: f.id } }),
    }))
  );

  return NextResponse.json({ forms: withCounts });
}
