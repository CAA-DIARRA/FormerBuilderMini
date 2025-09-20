import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";

const prisma = new PrismaClient();

const Body = z.object({
  title: z.string().min(3),
  sessionDate: z.string(),
  trainerName: z.string().min(2),
  location: z.string().min(2),
});

// crée un owner par défaut si la table est vide (pratique en test)
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

export async function POST(req: NextRequest) {
  const data = Body.parse(await req.json());
  const base = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const slug = `${base}-${nanoid(6)}`;

  const owner = await ensureDefaultOwner();

  const form = await prisma.form.create({
    data: {
      title: data.title,
      sessionDate: new Date(data.sessionDate),
      trainerName: data.trainerName,
      location: data.location,
      slug,
      ownerId: owner.id,
    },
  });
  return NextResponse.json({ form }, { status: 201 });
}

export async function GET(_: NextRequest) {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true, slug: true, isOpen: true },
  });
  const withCounts = await Promise.all(
    forms.map(async (f) => ({
      ...f,
      responses: await prisma.response.count({ where: { formId: f.id } }),
    }))
  );
  return NextResponse.json({ forms: withCounts });
}
