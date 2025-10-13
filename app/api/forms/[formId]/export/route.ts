import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { getLabels, TARGETS, COLS, CritKey } from "../../../../lib/labels"; // { fr: {...}, en: {...} }

const prisma = new PrismaClient();

// --- configuration des sections/clefs utilisées dans les réponses --- //
const CONTENT_KEYS = [
  { key: "contAttentes",      id: "content_expectations" },
  { key: "contUtiliteTravail",id: "content_useful" },
  { key: "contExercices",     id: "content_exercises" },
  { key: "contMethodologie",  id: "content_method" },
  { key: "contSupports",      id: "content_materials" },
  { key: "contRythme",        id: "content_rhythm" },
  { key: "contGlobal",        id: "content_overall" },
] as const;

const TRAINER_KEYS = [
  { key: "formMaitrise",      id: "trainer_mastery" },
  { key: "formCommunication", id: "trainer_comm" },
  { key: "formClarte",        id: "trainer_clarity" },
  { key: "formMethodo",       id: "trainer_method" },
  { key: "formGlobal",        id: "trainer_overall" },
] as const;

type Resp = {
  data: Record<string, any>;
  createdAt: Date;
};

function avg(nums: number[]) {
  const arr = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!arr.length) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function yesNoCounts(values: (string | null | undefined)[]) {
  const total = values.length || 1;
  const yes = values.filter((v) => (v ?? "").toString().toUpperCase() === "OUI").length;
  const no = values.filter((v) => (v ?? "").toString().toUpperCase() === "NON").length;
  return {
    yes,
    no,
    yesPct: Math.round((yes / total) * 100),
    noPct: Math.round((no / total) * 100),
  };
}

function buildQCBarConfig(labels: string[], values: number[], target = 2.5, title = "") {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "MOYENNE",
          data: values,
          backgroundColor: "#5B9BD5",
        },
      ],
    },
    options: {
      plugins: {
        title: { display: !!title, text: title, font: { size: 18, weight: "bold" } },
        legend: { display: true, position: "bottom" },
        annotation: {
          annotations: {
            target: {
              type: "line",
              yMin: target,
              yMax: target,
              borderColor: "#69B34C",
              borderWidth: 2,
              label: {
                display: true,
                content: "CIBLE",
                position: "end",
                backgroundColor: "rgba(0,0,0,0)",
                color: "#69B34C",
              },
            },
          },
        },
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "start",
          formatter: (v: any) => (typeof v === "number" ? v.toFixed(1) : ""),
          font: { weight: "bold", size: 14 },
        },
      },
      responsive: true,
      scales: {
        y: { suggestedMin: 0, suggestedMax: 3.5, title: { display: true, text: "Note" } },
        x: { ticks: { maxRotation: 0, minRotation: 0 } },
      },
    },
    plugins: ["chartjs-plugin-annotation", "chartjs-plugin-datalabels"],
  };
}

function buildQCPie(title: string, yesPct: number, noPct: number) {
  return {
    type: "pie",
    data: {
      labels: ["NON", "OUI"],
      datasets: [
        {
          data: [noPct, yesPct],
          backgroundColor: ["#FF0000", "#00FF00"],
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: title, font: { size: 22, weight: "bold" } },
        legend: { display: true, position: "bottom" },
        datalabels: {
          color: (ctx: any) => (ctx.dataIndex === 0 ? "#d00" : "#030"),
          formatter: (value: number) => `${value}%`,
          font: { weight: "bold", size: 16 },
        },
      },
    },
    plugins: ["chartjs-plugin-datalabels"],
  };
}

function quickChartUrl(cfg: object, w = 1200, h = 500) {
  const enc = encodeURIComponent(JSON.stringify(cfg));
  return `https://quickchart.io/chart?width=${w}&height=${h}&format=png&c=${enc}`;
}

export async function GET(
  req: Request,
  { params }: { params: { formId: string } }
) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];

    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const records = (await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: { createdAt: "asc" },
      select: { data: true, createdAt: true },
    })) as Resp[];

    // --- Préparation des valeurs numériques --- //
    const contentCols = CONTENT_KEYS.map(k =>
      records.map(r => toNum(r.data?.[k.key]))
    );
    const trainerCols = TRAINER_KEYS.map(k =>
      records.map(r => toNum(r.data?.[k.key]))
    );
    const contentAvg = contentCols.map(col => avg(col as number[]));
    const trainerAvg = trainerCols.map(col => avg(col as number[]));
    const cible = 2.5;

    // --- Excel --- //
    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    // ---------- FEUILLE 1 : SYNTHÈSE ---------- //
    const ws1 = wb.addWorksheet(L.sheet1Title);

    // entête
    ws1.columns = [
      { header: "", key: "c1", width: 36 },
      // colonnes pour chaque participant
      ...records.map((_, i) => ({ header: `${L.participant} ${i + 1}`, key: `p${i + 1}`, width: 14 })),
      { header: L.avg, key: "avg", width: 14 },
      { header: L.target, key: "tgt", width: 10 },
    ];

    // Titre
    ws1.mergeCells(1, 1, 1, ws1.columnCount);
    ws1.getRow(1).values = [`${form.title} — ${L.sheet1Title}`];
    ws1.getRow(1).font = { size: 14, bold: true };
    ws1.addRow([]);

    // A. Infos formation (optionnel – si des champs existent)
    const meta = [
      [L.sessionDate, form["sessionDate"] ? new Date(form["sessionDate"]).toLocaleDateString() : ""],
      [L.location, form["location"] ?? ""],
      [L.trainerName, form["trainerName"] ?? ""],
    ];
    meta.forEach(([k, v]) => ws1.addRow([k as string, v as string]));

    ws1.addRow([]);
    // B. Environnement (si tu veux ajouter, garder structure)
    ws1.addRow([L.envTitle]).font = { bold: true };
    ws1.addRow([]);
    // C. Contenu – tableau dynamique avec valeurs par participant + moyenne + cible
    ws1.addRow([L.contTitle]).font = { bold: true };
    ws1.addRow([L.scaleLegend]);
    // entête “Critère | P1 … Pn | Moyenne | Cible”
    ws1.addRow([L.criteria, ...records.map((_, i) => `${L.participantShort} ${i + 1}`), L.avg, L.target]).font = { bold: true };

    CONTENT_KEYS.forEach((k, idx) => {
      const label = L.content[k.id];
      const row = [
        label,
        ...contentCols[idx].map(v => (v ?? "")),
        contentAvg[idx] ?? "",
        cible,
      ];
      ws1.addRow(row);
    });

    ws1.addRow([]);

    // D. Formateur – tableau dynamique
    ws1.addRow([L.formTitle]).font = { bold: true };
    ws1.addRow([L.scaleLegend]);
    ws1.addRow([L.criteria, ...records.map((_, i) => `${L.participantShort} ${i + 1}`), L.avg, L.target]).font = { bold: true };

    TRAINER_KEYS.forEach((k, idx) => {
      const label = L.trainer[k.id];
      const row = [
        label,
        ...trainerCols[idx].map(v => (v ?? "")),
        trainerAvg[idx] ?? "",
        cible,
      ];
      ws1.addRow(row);
    });

    ws1.addRow([]);

    // E. Attentes des participants (tableau)
    const attentes = records.map(r => (r.data?.reponduAttentes ?? "").toString().toUpperCase());
    const att = yesNoCounts(attentes);
    ws1.addRow([L.attentesTitle]).font = { bold: true };
    ws1.addRow([L.attentesQuestion]).font = { italic: true };
    const headAtt = [L.oui, ...records.map((_, i) => `${L.participantShort} ${i + 1}`), "%"];
    ws1.addRow(headAtt).font = { bold: true };
    ws1.addRow([
      L.oui,
      ...attentes.map(v => (v === "OUI" ? 1 : "")),
      `${att.yesPct}%`,
    ]);
    ws1.addRow([
      L.non,
      ...attentes.map(v => (v === "NON" ? 1 : "")),
      `${att.noPct}%`,
    ]);
    ws1.addRow([]);

    // F. Formations complémentaires (liste)
    ws1.addRow([L.complementTitle]).font = { bold: true };
    const list1 = records
      .map((r, i) => [ `${L.participantShort} ${i + 1}`, (r.data?.formationsComplementaires ?? "").toString().trim() ])
      .filter(([, txt]) => txt.length > 0);
    if (list1.length) {
      ws1.addRow([L.participant, L.response]).font = { bold: true };
      list1.forEach(row => ws1.addRow(row));
    } else {
      ws1.addRow([L.none]);
    }
    ws1.addRow([]);

    // G. Témoignages (liste)
    ws1.addRow([L.testimonyTitle]).font = { bold: true };
    const list2 = records
      .map((r, i) => [ `${L.participantShort} ${i + 1}`, (r.data?.temoignage ?? "").toString().trim() ])
      .filter(([, txt]) => txt.length > 0);
    if (list2.length) {
      ws1.addRow([L.participant, L.response]).font = { bold: true };
      list2.forEach(row => ws1.addRow(row));
    } else {
      ws1.addRow([L.none]);
    }

    // ---------- FEUILLE 2 : GRAPHIQUE CONTENU ---------- //
    const ws2 = wb.addWorksheet(L.sheet2Title);
    ws2.columns = Array.from({ length: 12 }).map((_, i) => ({ header: "", key: `c${i+1}`, width: 14 }));
    const contentLabels = CONTENT_KEYS.map(k => L.content[k.id]);
    const contentVals = contentAvg.map(v => v ?? 0);
    const cfg2 = buildQCBarConfig(contentLabels, contentVals, cible, L.sheet2Title);
    const img2 = await fetch(quickChartUrl(cfg2, 1300, 520));
    if (img2.ok) {
      const ab2 = await img2.arrayBuffer();
      const b64_2 = Buffer.from(new Uint8Array(ab2)).toString("base64");
      const id2 = wb.addImage({ base64: b64_2, extension: "png" });
      ws2.addImage(id2, { tl: { col: 0, row: 2 }, ext: { width: 1300, height: 520 } });
    } else {
      ws2.addRow([L.chartError]);
    }

    // ---------- FEUILLE 3 : GRAPHIQUE FORMATEUR ---------- //
    const ws3 = wb.addWorksheet(L.sheet3Title);
    ws3.columns = Array.from({ length: 12 }).map((_, i) => ({ header: "", key: `c${i+1}`, width: 14 }));
    const trainerLabels = TRAINER_KEYS.map(k => L.trainer[k.id]);
    const trainerVals = trainerAvg.map(v => v ?? 0);
    const cfg3 = buildQCBarConfig(trainerLabels, trainerVals, cible, L.sheet3Title);
    const img3 = await fetch(quickChartUrl(cfg3, 1300, 520));
    if (img3.ok) {
      const ab3 = await img3.arrayBuffer();
      const b64_3 = Buffer.from(new Uint8Array(ab3)).toString("base64");
      const id3 = wb.addImage({ base64: b64_3, extension: "png" });
      ws3.addImage(id3, { tl: { col: 0, row: 2 }, ext: { width: 1300, height: 520 } });
    } else {
      ws3.addRow([L.chartError]);
    }

    // ---------- FEUILLE 4 : CAMEMBERT ATTENTES ---------- //
    const ws4 = wb.addWorksheet(L.sheet4Title);
    ws4.columns = Array.from({ length: 12 }).map((_, i) => ({ header: "", key: `c${i+1}`, width: 14 }));
    const cfg4 = buildQCPie(L.attentesQuestion, att.yesPct, att.noPct);
    const img4 = await fetch(quickChartUrl(cfg4, 1000, 500));
    if (img4.ok) {
      const ab4 = await img4.arrayBuffer();
      const b64_4 = Buffer.from(new Uint8Array(ab4)).toString("base64");
      const id4 = wb.addImage({ base64: b64_4, extension: "png" });
      ws4.addImage(id4, { tl: { col: 0, row: 2 }, ext: { width: 1000, height: 500 } });
    } else {
      ws4.addRow([L.chartError]);
    }

    // ---------- sortie ---------- //
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    const fileName = `${form.slug ?? "form"}_${L.fileSuffix}.xlsx`;

    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${fileName}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Export failed" }, { status: 500 });
    }
}
