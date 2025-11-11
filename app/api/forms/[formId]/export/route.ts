// app/api/forms/[formId]/export/route.ts
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

const prisma = new PrismaClient();

/** --- QuickChart en POST base64 --- */
async function fetchChartBase64Post(config: object, width = 1200, height = 550): Promise<string | null> {
  try {
    const resp = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        backgroundColor: "white",
        width,
        height,
        format: "png",
        encoding: "base64",
        chart: config,
      }),
    });

    if (!resp.ok) {
      console.error("QuickChart error:", await resp.text());
      return null;
    }
    const txt = await resp.text();
    return `data:image/png;base64,${txt}`;
  } catch (err) {
    console.error("QuickChart fetch failed:", err);
    return null;
  }
}

/** --- Type de réponse --- */
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

/** === ROUTE PRINCIPALE === */
export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];
    const seuil = 3;

    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) return new Response(JSON.stringify({ error: "Form not found" }), { status: 404 });

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

    // === FEUILLE 1 — SYNTHÈSE ===
    const ws1 = wb.addWorksheet(L.sheet1Title ?? "SYNTHÈSE");
    ws1.addRow(["Rapport d’évaluation"]);
    ws1.mergeCells("A1:E1");
    ws1.getCell("A1").font = { bold: true, size: 14 };

    ws1.addRow(["Date de session", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""]);
    ws1.addRow(["Formateur", form.trainerName ?? ""]);
    ws1.addRow(["Lieu", form.location ?? ""]);
    ws1.addRow(["Seuil", `${seuil}`]);
    ws1.addRow([]);

    const initials = participants.map((p, i) => {
      const prenom = (p.participantPrenoms || "").trim();
      const nom = (p.participantNom || "").trim();
      return ((prenom ? prenom[0] : "") + (nom ? nom[0] : "")).toUpperCase() || `P${i + 1}`;
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

    /** === FONCTION CHART CONFIG COMMUNE === */
    const buildChartCfg = (title: string, labels: string[], avgs: number[]) => ({
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Moyenne", data: avgs, backgroundColor: "#1A73E8" },
          {
            label: `Seuil ${seuil}`,
            data: labels.map(() => seuil),
            type: "line",
            borderColor: "#E53935",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: title },
        },
        scales: {
          x: {
            min: 0,
            max: 5,
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
          y: { beginAtZero: true },
        },
      },
    });

    /** === FEUILLE 2 — GRAPHIQUE CONTENU === */
    const ws2 = wb.addWorksheet("GRAPHIQUE CONTENU");
    const contLabels = contRows.map((r: any) => r.label);
    const contAvgs = contRows.map((r: any) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? 0) as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const chartCfg1 = buildChartCfg("GRAPHIQUE CONTENU", contLabels, contAvgs);
    const base641 = await fetchChartBase64Post(chartCfg1);
    if (base641) {
      const imgId = wb.addImage({ base64: base641, extension: "png" });
      ws2.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1100, height: 500 } });
    } else ws2.addRow(["Erreur de génération du graphique"]);

    ws2.addRow([]);
    ws2.addRow(["Légende : Très bien : 4    Bien : 3    Passable : 2    Mauvais : 1    Cible : 3"]);
    ws2.getCell(`A${ws2.lastRow?.number}`).font = { color: { argb: "FFE53935" }, italic: true };

    /** === FEUILLE 3 — GRAPHIQUE FORMATEUR === */
    const ws3 = wb.addWorksheet("GRAPHIQUE FORMATEUR");
    const formLabels = formRows.map((r: any) => r.label);
    const formAvgs = formRows.map((r: any) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? 0) as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const chartCfg2 = buildChartCfg("GRAPHIQUE FORMATEUR", formLabels, formAvgs);
    const base642 = await fetchChartBase64Post(chartCfg2);
    if (base642) {
      const imgId = wb.addImage({ base64: base642, extension: "png" });
      ws3.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1100, height: 500 } });
    } else ws3.addRow(["Erreur de génération du graphique"]);

    ws3.addRow([]);
    ws3.addRow(["Légende : Très bien : 4    Bien : 3    Passable : 2    Mauvais : 1    Cible : 3"]);
    ws3.getCell(`A${ws3.lastRow?.number}`).font = { color: { argb: "FFE53935" }, italic: true };

    /** === FEUILLE 4 — CAMEMBERT ATTENTES === */
    const ws4 = wb.addWorksheet("ATTENTES");
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

    /** === EXPORT FINAL === */
    const buffer = await wb.xlsx.writeBuffer();
    const fnameBase = (form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60);
    const filename = `${fnameBase}_${lang.toUpperCase()}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("EXPORT ERROR", e);
    return new Response(JSON.stringify({ error: e?.message || "Export failed" }), { status: 500 });
  }
}
