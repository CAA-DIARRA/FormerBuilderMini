import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { Buffer } from "buffer";
import { LABELS } from "../../../../lib/labels"; // chemin : app/api/forms/[formId]/export -> app/lib

const prisma = new PrismaClient();

type Resp = { data: Record<string, any>; createdAt: Date };

function bufFrom(ab: ArrayBuffer) {
  return Buffer.from(new Uint8Array(ab));
}

function avg(nums: number[]) {
  const vals = nums.filter((n) => Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function solidGrayFill(): any {
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } } as any;
}

function bold(ws: ExcelJS.Worksheet, row: number) {
  ws.getRow(row).font = { bold: true };
}

function autoOutline(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }
}

export async function GET(req: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];

    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // --- Chargement des réponses, robuste au schéma ---
    const raw = await (prisma.response as any).findMany({
      where: { formId: form.id },
      orderBy: { id: "asc" }, // tri sûr
      select: { data: true, submittedAt: true, createdAt: true, id: true } as any,
    });

    const responses: Resp[] = raw.map((r: any) => ({
      data: r?.data ?? {},
      createdAt: new Date(r?.submittedAt ?? r?.createdAt ?? Date.now()),
    }));

    // --- Préparation des critères ---
    const envRows = L.envRows;
    const contRows = L.contRows;
    const formRows = L.formRows;

    const wb = new ExcelJS.Workbook();

    // ========== FEUILLE 1 : Synthèse ==========
    const ws1 = wb.addWorksheet(L.sheet1Title);
    const n = responses.length;

    ws1.columns = [{ header: L.criteriaHeader, key: "crit", width: 50 }];
    for (let i = 0; i < n; i++) {
      ws1.columns!.push({ header: `${L.participantShort} ${i + 1}`, key: `p${i + 1}`, width: 12 });
    }
    ws1.columns!.push({ header: L.averageHeader, key: "avg", width: 12 });
    ws1.columns!.push({ header: L.targetHeader, key: "target", width: 12 });

    let r = 1;
    ws1.mergeCells(r, 1, r, n + 3);
    ws1.getCell(r, 1).value = `${L.reportTitle} — ${form.title}`;
    ws1.getCell(r, 1).font = { bold: true, size: 14 };
    r += 2;

    ws1.addRow([`${L.trainer}: ${form.trainerName ?? ""}`]);
    ws1.addRow([`${L.date}: ${form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""}`]);
    ws1.addRow([`${L.location}: ${form.location ?? ""}`]);
    r += 4;

    const groupTitle = (title: string) => {
      ws1.addRow([title]);
      const rr = ws1.lastRow!;
      ws1.mergeCells(rr.number, 1, rr.number, n + 3);
      rr.font = { bold: true };
      rr.fill = solidGrayFill();
    };

    const num = (d: Record<string, any>, key: string) => {
      const v = d?.[key];
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    const writeCriteriaBlock = (rows: { key: string; label: string }[]) => {
      for (const row of rows) {
        const vals: (string | number | null)[] = [row.label];
        const nums: number[] = [];
        for (let i = 0; i < n; i++) {
          const v = num(responses[i]?.data ?? {}, row.key);
          vals.push(Number.isFinite(v) ? v : "");
          if (Number.isFinite(v)) nums.push(v);
        }
        const m = avg(nums);
        vals.push(m !== null ? Number(m.toFixed(2)) : "");
        vals.push(2.5);
        ws1.addRow(vals as any);
      }
    };

    groupTitle(L.envTitle);
    writeCriteriaBlock(envRows);
    groupTitle(L.contTitle);
    writeCriteriaBlock(contRows);
    groupTitle(L.formTitle);
    writeCriteriaBlock(formRows);

    autoOutline(ws1, 7, 1, ws1.lastRow!.number, n + 3);

    r = ws1.lastRow!.number + 2;

    // Tableau ATTENTES
    ws1.addRow([L.expectationsTitle]);
    bold(ws1, ws1.lastRow!.number);
    const attRowStart = ws1.lastRow!.number + 1;

    const attKeys = ["OUI", "PARTIELLEMENT", "NON"];
    const attMap = new Map<string, number>();
    for (const k of attKeys) attMap.set(k, 0);
    for (const resp of responses) {
      const v = (resp.data?.reponduAttentes ?? "").toString().toUpperCase();
      if (attMap.has(v)) attMap.set(v, (attMap.get(v) || 0) + 1);
    }
    const totalAtt = responses.length || 1;

    ws1.addRow([L.expectationsQuestion, "", "", L.percentHeader]);
    bold(ws1, ws1.lastRow!.number);
    for (const k of attKeys) {
      const count = attMap.get(k) || 0;
      const pct = Math.round((count * 100) / totalAtt);
      ws1.addRow([k, "", "", `${pct}%`]);
    }
    autoOutline(ws1, attRowStart, 1, ws1.lastRow!.number, 4);

    r = ws1.lastRow!.number + 2;

    // Formations complémentaires
    ws1.addRow([L.complementaryTitle]);
    bold(ws1, ws1.lastRow!.number);
    ws1.addRow([L.freeTextHeader]);
    bold(ws1, ws1.lastRow!.number);
    for (const resp of responses) {
      const txt = (resp.data?.formationsComplementaires ?? "").toString().trim();
      if (txt) ws1.addRow([txt]);
    }

    r = ws1.lastRow!.number + 2;

    // Témoignages
    ws1.addRow([L.testimonialsTitle]);
    bold(ws1, ws1.lastRow!.number);
    ws1.addRow([L.freeTextHeader]);
    bold(ws1, ws1.lastRow!.number);
    for (const resp of responses) {
      const txt = (resp.data?.temoignage ?? "").toString().trim();
      if (txt) ws1.addRow([txt]);
    }

    // ========== FEUILLE 2 : Graphiques ==========
    const ws2 = wb.addWorksheet(L.sheet2Title);
    ws2.columns = [{ header: "", key: "c1", width: 150 }];
    ws2.addRow([L.chartTitle]);
    bold(ws2, ws2.lastRow!.number);

    const means: { label: string; value: number }[] = [];
    for (const row of [...envRows, ...contRows, ...formRows]) {
      const arr = responses.map((r) => num(r.data, row.key)).filter((x) => Number.isFinite(x)) as number[];
      const m = avg(arr);
      if (m !== null) means.push({ label: row.label, value: Number(m.toFixed(2)) });
    }

    const labels = means.map((x) => x.label);
    const dataVals = means.map((x) => x.value);
    const targetVals = means.map(() => 2.5);

    const qcConfig = {
      type: "bar",
      data: {
        labels,
        datasets: [
          { type: "bar", label: L.averageHeader, data: dataVals },
          { type: "line", label: L.targetHeader, data: targetVals, borderWidth: 2, fill: false },
        ],
      },
      options: {
        plugins: { legend: { position: "top" } },
        scales: { y: { min: 0, max: 4 } },
      },
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(qcConfig))}&backgroundColor=white&devicePixelRatio=2&format=png&width=1400&height=600`;
    const imgResp = await fetch(chartUrl);
    if (imgResp.ok) {
      const ab = await imgResp.arrayBuffer();
      const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
      ws2.addImage(imgId, { tl: { col: 0, row: 2 }, ext: { width: 1300, height: 520 } });
    } else {
      ws2.addRow([L.chartError]);
    }

    // ========== FEUILLE 3 : Détails ==========
    const ws3 = wb.addWorksheet(L.sheet3Title);
    const detailHeaders = [
      L.hdTimestamp,
      "Nom",
      "Prénoms",
      "Fonction",
      "Entreprise",
      ...[...envRows, ...contRows, ...formRows].map((r) => r.label),
      "Attentes",
      "Compléments",
      "Témoignage",
      "Consentement",
    ];
    ws3.columns = detailHeaders.map((h) => ({ header: h, key: h, width: 22 }));
    ws3.addRow(detailHeaders);
    bold(ws3, 1);

    for (const resp of responses) {
      const d = resp.data;
      ws3.addRow([
        resp.createdAt.toISOString(),
        d.participantNom ?? "",
        d.participantPrenoms ?? "",
        d.participantFonction ?? "",
        d.participantEntreprise ?? "",
        ...[...envRows, ...contRows, ...formRows].map((r) => {
          const v = num(d, r.key);
          return Number.isFinite(v) ? v : "";
        }),
        d.reponduAttentes ?? "",
        d.formationsComplementaires ?? "",
        d.temoignage ?? "",
        d.consentementTemoignage ? "OUI" : "NON",
      ]);
    }

    // ========== FEUILLE 4 : Meta ==========
    const ws4 = wb.addWorksheet(L.sheet4Title);
    ws4.columns = [
      { header: "", key: "k", width: 35 },
      { header: "", key: "v", width: 80 },
    ];
    ws4.addRow([L.metaTitle]);
    bold(ws4, 1);
    ws4.addRow([L.formTitleMeta, form.title]);
    ws4.addRow([L.trainer, form.trainerName ?? ""]);
    ws4.addRow([L.date, form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""]);
    ws4.addRow([L.location, form.location ?? ""]);
    ws4.addRow([L.responsesCount, responses.length.toString()]);

    // ========== Génération du fichier ==========
    const filenameSafe = `${(form.title || "rapport").replace(/[^a-z0-9_\-]+/gi, "_")}_${lang.toUpperCase()}.xlsx`;
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filenameSafe}"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Export failed" }, { status: 500 });
  }
}
