import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

const prisma = new PrismaClient();

// Helper : ArrayBuffer → Buffer
const bufFrom = (ab: ArrayBuffer) => Buffer.from(new Uint8Array(ab));

type RespRow = {
  participantNom?: string | null;
  participantPrenoms?: string | null;
  participantEntreprise?: string | null;

  envAccueil?: number | null;
  envLieu?: number | null;
  envMateriel?: number | null;

  contAttentes?: number | null;
  contUtiliteTravail?: number | null;
  contExercices?: number | null;
  contMethodologie?: number | null;
  contSupports?: number | null;
  contRythme?: number | null;
  contGlobal?: number | null;

  formMaitrise?: number | null;
  formCommunication?: number | null;
  formClarte?: number | null;
  formMethodo?: number | null;
  formGlobal?: number | null;

  reponduAttentes?: "OUI" | "PARTIELLEMENT" | "NON" | null;
  formationsComplementaires?: string | null;
  temoignage?: string | null;
};

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    // --- Langue ---
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];

    // --- Récupération du formulaire ---
    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // --- Récupération des réponses ---
    const raw = await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: { id: "asc" },
    });

    const participants: RespRow[] = raw.map((r: any) => ({
      participantNom: r.participantNom ?? null,
      participantPrenoms: r.participantPrenoms ?? null,
      participantEntreprise: r.participantEntreprise ?? null,

      envAccueil: r.envAccueil ?? null,
      envLieu: r.envLieu ?? null,
      envMateriel: r.envMateriel ?? null,

      contAttentes: r.contAttentes ?? null,
      contUtiliteTravail: r.contUtiliteTravail ?? null,
      contExercices: r.contExercices ?? null,
      contMethodologie: r.contMethodologie ?? null,
      contSupports: r.contSupports ?? null,
      contRythme: r.contRythme ?? null,
      contGlobal: r.contGlobal ?? null,

      formMaitrise: r.formMaitrise ?? null,
      formCommunication: r.formCommunication ?? null,
      formClarte: r.formClarte ?? null,
      formMethodo: r.formMethodo ?? null,
      formGlobal: r.formGlobal ?? null,

      reponduAttentes: r.reponduAttentes ?? null,
      formationsComplementaires: r.formationsComplementaires ?? null,
      temoignage: r.temoignage ?? null,
    }));

    // --- Excel Workbook ---
    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    const grayFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFEFEFEF" } };
    const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1A73E8" } };
    const white = { argb: "FFFFFFFF" };
    const cible = 2.5;

    // ===============================
    // FEUILLE 1 — SYNTHÈSE
    // ===============================
    const ws1 = wb.addWorksheet(L.sheet1Title);
    ws1.properties.defaultRowHeight = 18;

    ws1.addRow([L.formTitle]);
    ws1.mergeCells("A1:E1");
    ws1.getCell("A1").font = { bold: true, size: 14 };

    const meta = [
      [L.sessionDate, form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""],
      [L.trainerName, form.trainerName ?? ""],
      [L.location, form.location ?? ""],
      [L.formPublicUrl, `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/f/${form.slug}`],
    ];
    meta.forEach((r) => ws1.addRow(r));
    ws1.addRow([]);

    const initials = participants.map((p, i) => {
      const prenom = (p.participantPrenoms || "").trim();
      const nom = (p.participantNom || "").trim();
      if (!prenom && !nom) return `P${i + 1}`;
      return `${(prenom[0] || "").toUpperCase()}${(nom[0] || "").toUpperCase()}`;
    });

    const makeHeader = (title: string) => {
      const colsCount = 1 + participants.length + 2;
      const r = ws1.addRow([title]);
      ws1.mergeCells(r.number, 1, r.number, colsCount);
      r.font = { bold: true };
      r.fill = grayFill;

      const head = ws1.addRow([
        L.criteriaHeader,
        ...initials,
        L.avgHeader,
        L.targetHeader,
      ]);
      head.font = { bold: true, color: white };
      head.fill = headerFill;
      const widths = [40, ...Array(initials.length).fill(8), 10, 10];
      widths.forEach((w, i) => (ws1.getColumn(i + 1).width = w));
    };

    function writeCriteriaBlock(rows: ReadonlyArray<{ key: string; label: string }>) {
      rows.forEach((r) => {
        const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? null) as number | null);
        const avg = vals.length ? vals.reduce((s, v) => s + (Number(v) || 0), 0) / vals.length : null;
        ws1.addRow([r.label, ...vals, avg, cible]);
      });
      ws1.addRow([]);
    }

    makeHeader(L.envTitle);
    writeCriteriaBlock(L.envRows);
    makeHeader(L.contTitle);
    writeCriteriaBlock(L.contRows);
    makeHeader(L.formTitleBlock);
    writeCriteriaBlock(L.formRows);

    // --- Bloc attentes ---
    const resAtt = participants.map((p) => p.reponduAttentes || "");
    const total = resAtt.filter(Boolean).length || 1;
    const count = {
      oui: resAtt.filter((x) => x === "OUI").length,
      partiel: resAtt.filter((x) => x === "PARTIELLEMENT").length,
      non: resAtt.filter((x) => x === "NON").length,
    };
    const pct = {
      oui: Math.round((count.oui * 10000) / total) / 100,
      partiel: Math.round((count.partiel * 10000) / total) / 100,
      non: Math.round((count.non * 10000) / total) / 100,
    };

    ws1.addRow([L.expectQuestion]);
    ws1.addRow(["OUI", `${pct.oui}%`]);
    ws1.addRow(["PARTIELLEMENT", `${pct.partiel}%`]);
    ws1.addRow(["NON", `${pct.non}%`]);
    ws1.addRow([]);

    // ===============================
    // FEUILLES 2 à 4 (graphes)
    // ===============================
    // (identiques à ta version précédente)
    // ... (même logique QuickChart)
    // Pas besoin de retoucher : L.sheet2Title etc. fonctionnent maintenant.

    const xbuf = await wb.xlsx.writeBuffer();
    const filename = `${(form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60)}_${lang.toUpperCase()}.xlsx`;

    return new NextResponse(xbuf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
