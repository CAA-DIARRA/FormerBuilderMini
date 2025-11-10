// app/api/forms/[formId]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

const prisma = new PrismaClient();
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
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];
    const seuil = 3;

    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const raw = await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: { id: "asc" },
      select: {
        participantNom: true,
        participantPrenoms: true,
        participantEntreprise: true,
        envAccueil: true,
        envLieu: true,
        envMateriel: true,
        contAttentes: true,
        contUtiliteTravail: true,
        contExercices: true,
        contMethodologie: true,
        contSupports: true,
        contRythme: true,
        contGlobal: true,
        formMaitrise: true,
        formCommunication: true,
        formClarte: true,
        formMethodo: true,
        formGlobal: true,
        reponduAttentes: true,
        formationsComplementaires: true,
        temoignage: true,
      },
    });

    const participants: RespRow[] = raw as RespRow[];
    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    // ✅ Correction typage ExcelJS
    const grayFill: ExcelJS.FillPattern = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
    const headerFill: ExcelJS.FillPattern = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A73E8" },
    };
    const white = { argb: "FFFFFFFF" };

    // ================== FEUILLE 1 ==================
    const ws1 = wb.addWorksheet(L.sheet1Title);
    ws1.properties.defaultRowHeight = 18;
    ws1.addRow([(L as any).reportTitle || "Rapport d’évaluation"]);
    ws1.mergeCells("A1:E1");
    ws1.getCell("A1").font = { bold: true, size: 14 };

    const metaRows: Array<[string, string]> = [
      ["Date de session", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""],
      ["Formateur", form.trainerName ?? ""],
      ["Lieu", form.location ?? ""],
      ["URL formulaire", `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/f/${form.slug}`],
    ];
    metaRows.forEach((r) => ws1.addRow(r));
    ws1.addRow([]);

    const initials = participants.map((p, i) => {
      const prenom = (p.participantPrenoms || "").trim();
      const nom = (p.participantNom || "").trim();
      if (!prenom && !nom) return `P${i + 1}`;
      return `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase();
    });

    const envRows = (L as any).envRows;
    const contRows = (L as any).contRows;
    const formRows = (L as any).formRows;

    const makeHeader = (title: string) => {
      const totalCols = 1 + initials.length + 2;
      const r = ws1.addRow([title]);
      ws1.mergeCells(r.number, 1, r.number, totalCols);
      r.font = { bold: true };
      r.fill = grayFill;
      const head = ws1.addRow(["Critère", ...initials, "Moyenne", "Seuil"]);
      head.font = { bold: true, color: white };
      head.fill = headerFill;
    };

    const writeBlock = (rows: any[]) => {
      rows.forEach((r) => {
        const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? null) as number | null);
        const avg =
          vals.filter((v) => typeof v === "number").reduce((s, v) => s + (v || 0), 0) /
          (vals.filter((v) => typeof v === "number").length || 1);
        ws1.addRow([r.label, ...vals, avg, seuil]);
      });
      ws1.addRow([]);
    };

    makeHeader("Environnement");
    writeBlock(envRows);
    makeHeader("Contenu");
    writeBlock(contRows);
    makeHeader("Formateur(s)");
    writeBlock(formRows);

    // ================== FEUILLE 2 : GRAPHIQUE CONTENU ==================
    const ws2 = wb.addWorksheet(L.sheet2Title);
    ws2.getColumn(1).width = 160;

    const contLabels = contRows.map((r: any) => r.label);
    const contAvgs = contRows.map((r: any) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? 0) as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const chartCfg1 = {
      type: "bar",
      data: {
        labels: contLabels,
        datasets: [
          { label: "Moyenne", data: contAvgs, backgroundColor: "#1A73E8" },
          {
            label: `Seuil ${seuil}`,
            data: contAvgs.map(() => seuil),
            type: "line",
            borderColor: "#FF0000",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L.sheet2Title },
        },
        scales: { x: { min: 0, max: 4 } },
      },
    };

    const qcUrl1 = `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(chartCfg1)
    )}&format=png&backgroundColor=white&width=1200&height=550`;
    const img1Resp = await fetch(qcUrl1);
    if (img1Resp.ok) {
      const ab = await img1Resp.arrayBuffer();
      const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
      ws2.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    }

    // ================== FEUILLE 3 : GRAPHIQUE FORMATEUR ==================
    const ws3 = wb.addWorksheet(L.sheet3Title);
    ws3.getColumn(1).width = 160;

    const formLabels = formRows.map((r: any) => r.label);
    const formAvgs = formRows.map((r: any) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? 0) as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const chartCfg2 = {
      type: "bar",
      data: {
        labels: formLabels,
        datasets: [
          { label: "Moyenne", data: formAvgs, backgroundColor: "#1A73E8" },
          {
            label: `Seuil ${seuil}`,
            data: formAvgs.map(() => seuil),
            type: "line",
            borderColor: "#FF0000",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L.sheet3Title },
        },
        scales: { x: { min: 0, max: 4 } },
      },
    };

    const qcUrl2 = `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(chartCfg2)
    )}&format=png&backgroundColor=white&width=1200&height=550`;
    const img2Resp = await fetch(qcUrl2);
    if (img2Resp.ok) {
      const ab = await img2Resp.arrayBuffer();
      const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
      ws3.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    }

    // ================== FEUILLE 4 : CAMEMBERT ATTENTES ==================
    const ws4 = wb.addWorksheet(L.sheet4Title);
    const resAtt = participants.map((p) => p.reponduAttentes || "");
    const countOui = resAtt.filter((x) => x === "OUI").length;
    const countPartiel = resAtt.filter((x) => x === "PARTIELLEMENT").length;
    const countNon = resAtt.filter((x) => x === "NON").length;

    const pieCfg = {
      type: "pie",
      data: {
        labels: ["OUI", "PARTIELLEMENT", "NON"],
        datasets: [{ data: [countOui, countPartiel, countNon] }],
      },
    };

    const qcPie = `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(pieCfg)
    )}&format=png&backgroundColor=white&width=800&height=480`;
    const imgPieResp = await fetch(qcPie);
    if (imgPieResp.ok) {
      const ab = await imgPieResp.arrayBuffer();
      const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
      ws4.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 800, height: 480 } });
    }

    const xbuf = await wb.xlsx.writeBuffer();
    const filename = `${(form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60)}_${lang.toUpperCase()}.xlsx`;

    return new NextResponse(xbuf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
