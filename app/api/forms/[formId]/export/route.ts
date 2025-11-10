// app/api/forms/[formId]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

const prisma = new PrismaClient();

// ✅ Nouvelle fonction : requête POST QuickChart (plus fiable que GET)
async function fetchChartBase64Post(config: object, width = 1200, height = 550): Promise<string | null> {
  const body = {
    backgroundColor: "white",
    width,
    height,
    format: "png",
    encoding: "base64",
    chart: config,
  };

  try {
    const resp = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.error("QuickChart error", await resp.text());
      return null;
    }
    const txt = await resp.text();
    return `data:image/png;base64,${txt}`;
  } catch (e) {
    console.error("QuickChart fetch failed", e);
    return null;
  }
}

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
    });
    const participants: RespRow[] = raw as RespRow[];

    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    const grayFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
    const headerFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A73E8" } };
    const white = { argb: "FFFFFFFF" };

    // === FEUILLE 1 - SYNTHÈSE ===
    const ws1 = wb.addWorksheet(L.sheet1Title ?? "SYNTHÈSE");
    ws1.addRow([(L as any).reportTitle || "Rapport d’évaluation"]);
    ws1.mergeCells("A1:E1");
    ws1.getCell("A1").font = { bold: true, size: 14 };

    const metaRows: Array<[string, string]> = [
      ["Date de session", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""],
      ["Formateur", form.trainerName ?? ""],
      ["Lieu", form.location ?? ""],
      ["Seuil", `${seuil}`],
    ];
    metaRows.forEach((r) => ws1.addRow(r));
    ws1.addRow([]);

    const initials = participants.map((p, i) => {
      const prenom = (p.participantPrenoms || "").trim();
      const nom = (p.participantNom || "").trim();
      const i1 = prenom ? prenom[0] : "";
      const i2 = nom ? nom[0] : "";
      return (i1 + i2).toUpperCase() || `P${i + 1}`;
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

    const writeCriteriaBlock = (rows: any[]) => {
      rows.forEach((r) => {
        const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? null) as number | null);
        const nums = vals.filter((v): v is number => typeof v === "number");
        const avg = nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
        ws1.addRow([r.label, ...vals, avg, seuil]);
      });
      ws1.addRow([]);
    };

    makeHeader("Environnement");
    writeCriteriaBlock(envRows);
    makeHeader("Contenu");
    writeCriteriaBlock(contRows);
    makeHeader("Formateur");
    writeCriteriaBlock(formRows);

    // === FEUILLE 2 - GRAPHIQUE CONTENU ===
    const ws2 = wb.addWorksheet(L.sheet2Title ?? "GRAPHIQUE CONTENU");
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
            data: contLabels.map(() => seuil),
            type: "line",
            borderColor: "#E53935",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { position: "bottom" }, title: { display: true, text: "GRAPHIQUE CONTENU" } },
        scales: {
          x: { min: 0, max: 5, beginAtZero: true, ticks: { stepSize: 1 } },
          y: { grid: { drawBorder: true } },
        },
      },
    };

    const base641 = await fetchChartBase64Post(chartCfg1);
    if (base641) {
      const imgId = wb.addImage({ base64: base641, extension: "png" });
      ws2.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    } else ws2.addRow(["Erreur de génération du graphique"]);

    // === FEUILLE 3 - GRAPHIQUE FORMATEUR ===
    const ws3 = wb.addWorksheet(L.sheet3Title ?? "GRAPHIQUE FORMATEUR");
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
            data: formLabels.map(() => seuil),
            type: "line",
            borderColor: "#E53935",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { position: "bottom" }, title: { display: true, text: "GRAPHIQUE FORMATEUR" } },
        scales: {
          x: { min: 0, max: 5, beginAtZero: true, ticks: { stepSize: 1 } },
          y: { grid: { drawBorder: true } },
        },
      },
    };

    const base642 = await fetchChartBase64Post(chartCfg2);
    if (base642) {
      const imgId = wb.addImage({ base64: base642, extension: "png" });
      ws3.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    } else ws3.addRow(["Erreur de génération du graphique"]);

    // === FEUILLE 4 - CAMEMBERT ATTENTES ===
    const ws4 = wb.addWorksheet(L.sheet4Title ?? "ATTENTES");
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
      options: { plugins: { legend: { position: "bottom" }, title: { display: true, text: "ATTENTES" } } },
    };

    const base64Pie = await fetchChartBase64Post(pieCfg, 800, 480);
    if (base64Pie) {
      const imgId = wb.addImage({ base64: base64Pie, extension: "png" });
      ws4.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 800, height: 480 } });
    } else ws4.addRow(["Erreur de génération du graphique"]);

    // --- Export final ---
    const xbuf = await wb.xlsx.writeBuffer();
    const fnameBase = (form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60);
    const filename = `${fnameBase}_${lang.toUpperCase()}.xlsx`;

    return new NextResponse(xbuf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("EXPORT ERROR", e);
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
