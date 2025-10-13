import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"; // Utilise le singleton
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

// Helper : ArrayBuffer → Buffer (pour addImage d’ExcelJS)
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

export async function GET(
  req: Request,
  { params }: { params: { formId: string } }
) {
  try {
    // --- Langue depuis la query ?lang=fr|en (défaut fr)
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    const L = LABELS[lang];

    // --- Formulaire
    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // --- Réponses
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

    // --- Workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    // Styles basiques
    const grayFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFEFEFEF" } };
    const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1A73E8" } };
    const white = { argb: "FFFFFFFF" };
    const cible = 2.5; // cible (peut être rendue dynamique plus tard)

    // ===============================
    // FEUILLE 1 — SYNTHÈSE (tableaux)
    // ===============================
    const ws1 = wb.addWorksheet(L.sheet1Title);
    ws1.properties.defaultRowHeight = 18;

    // Titre/méta
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

    // En-têtes dynamiques pour chaque participant (initiales)
    const initials = participants.map((p, i) => {
      const prenom = (p.participantPrenoms || "").trim();
      const nom = (p.participantNom || "").trim();
      if (!prenom && !nom) return `P${i + 1}`;
      return `${(prenom[0] || "").toUpperCase()}${(nom[0] || "").toUpperCase()}`;
    });

    const makeHeader = (title: string) => {
      const colsCount = 1 + participants.length + 2; // Critère + N réponses + Moyenne + Cible
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
      head.alignment = { vertical: "middle", horizontal: "center" };

      const widths = [40, ...Array(initials.length).fill(8), 10, 10];
      widths.forEach((w, i) => (ws1.getColumn(i + 1).width = w));
    };

    function writeCriteriaBlock(rows: ReadonlyArray<{ key: string; label: string }>) {
      rows.forEach((r) => {
        const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? null) as number | null);
        // Correction TypeScript: s'assurer que s et v sont toujours des nombres
        const avg = vals.length
          ? vals.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0) / vals.length
          : null;
        ws1.addRow([r.label, ...vals, avg, cible]);
      });
      ws1.addRow([]);
    }

    // 1) Environnement
    makeHeader(L.envTitle);
    writeCriteriaBlock(L.envRows);

    // 2) Contenu
    makeHeader(L.contTitle);
    writeCriteriaBlock(L.contRows);

    // 3) Formateur(s)
    makeHeader(L.formTitleBlock);
    writeCriteriaBlock(L.formRows);

    // 4) Attentes — tableau % OUI/PARTIELLEMENT/NON
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

    const attTitle = ws1.addRow([L.expectTitle]);
    ws1.mergeCells(attTitle.number, 1, attTitle.number, 6);
    attTitle.font = { bold: true };
    attTitle.fill = grayFill;

    ws1.addRow([L.expectQuestion, "", "", "", "", "%"]);
    ws1.addRow([L.expectYesLabel, "", "", "", "", `${pct.oui}%`]);
    ws1.addRow([L.expectPartialLabel, "", "", "", "", `${pct.partiel}%`]);
    ws1.addRow([L.expectNoLabel, "", "", "", "", `${pct.non}%`]);
    ws1.addRow([]);

    // 5) Formations complémentaires — liste
    const compTitle = ws1.addRow([L.complementaryTitle]);
    ws1.mergeCells(compTitle.number, 1, compTitle.number, 6);
    compTitle.font = { bold: true };
    compTitle.fill = grayFill;

    const compList = participants
      .map((p) => (p.formationsComplementaires || "").trim())
      .filter(Boolean);
    if (compList.length === 0) {
      ws1.addRow([L.noneText]);
    } else {
      compList.forEach((txt, i) => ws1.addRow([`${i + 1}. ${txt}`]));
    }
    ws1.addRow([]);

    // 6) Témoignages — liste
    const temoTitle = ws1.addRow([L.testimonyTitle]);
    ws1.mergeCells(temoTitle.number, 1, temoTitle.number, 6);
    temoTitle.font = { bold: true };
    temoTitle.fill = grayFill;

    const temoList = participants
      .map((p) => (p.temoignage || "").trim())
      .filter(Boolean);
    if (temoList.length === 0) {
      ws1.addRow([L.noneText]);
    } else {
      temoList.forEach((txt, i) => ws1.addRow([`${i + 1}. ${txt}`]));
    }

    // ===============================
    // FEUILLE 2 — GRAPHIQUE CONTENU
    // ===============================
    const ws2 = wb.addWorksheet(L.sheet2Title);
    ws2.getColumn(1).width = 160;

    const contKeys = L.contRows.map((r) => r.key);
    const contLabels = L.contRows.map((r) => r.label);
    const contAvgs = contKeys.map((k) => {
      const vals = participants.map((p) => (p[k as keyof RespRow] as number | null) ?? null);
      return vals.length
        ? vals.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0) / vals.length
        : 0;
    });

    const chartCfg1 = {
      type: "bar",
      data: {
        labels: contLabels,
        datasets: [
          { label: L.avgHeader, data: contAvgs },
          { label: L.targetHeader, data: contAvgs.map(() => cible) },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L.sheet2Title },
        },
        scales: { x: { suggestedMin: 0, suggestedMax: 4 } },
      },
    };

    const qcUrl1 = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartCfg1))}&format=png&backgroundColor=white&width=1200&height=550`;
    let img1Resp: Response;
    try {
      img1Resp = await fetch(qcUrl1);
      if (img1Resp.ok) {
        const ab = await img1Resp.arrayBuffer();
        const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
        ws2.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
      } else {
        ws2.addRow([L.chartError]);
      }
    } catch (err) {
      ws2.addRow([L.chartError]);
    }

    // =================================
    // FEUILLE 3 — GRAPHIQUE FORMATEUR
    // =================================
    const ws3 = wb.addWorksheet(L.sheet3Title);
    ws3.getColumn(1).width = 160;

    const formKeys = L.formRows.map((r) => r.key);
    const formLabels = L.formRows.map((r) => r.label);
    const formAvgs = formKeys.map((k) => {
      const vals = participants.map((p) => (p[k as keyof RespRow] as number | null) ?? null);
      return vals.length
        ? vals.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0) / vals.length
        : 0;
    });

    const chartCfg2 = {
      type: "bar",
      data: {
        labels: formLabels,
        datasets: [
          { label: L.avgHeader, data: formAvgs },
          { label: L.targetHeader, data: formAvgs.map(() => cible) },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L.sheet3Title },
        },
        scales: { x: { suggestedMin: 0, suggestedMax: 4 } },
      },
    };

    const qcUrl2 = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartCfg2))}&format=png&backgroundColor=white&width=1200&height=550`;
    let img2Resp: Response;
    try {
      img2Resp = await fetch(qcUrl2);
      if (img2Resp.ok) {
        const ab = await img2Resp.arrayBuffer();
        const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
        ws3.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
      } else {
        ws3.addRow([L.chartError]);
      }
    } catch (err) {
      ws3.addRow([L.chartError]);
    }

    // ===============================
    // FEUILLE 4 — CAMEMBERT ATTENTES
    // ===============================
    const ws4 = wb.addWorksheet(L.sheet4Title);
    ws4.getColumn(1).width = 160;

    const pieCfg = {
      type: "pie",
      data: {
        labels: [L.expectYesLabel, L.expectPartialLabel, L.expectNoLabel],
        datasets: [{ data: [count.oui, count.partiel, count.non] }],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L.sheet4Title },
        },
      },
    };

    const qcPie = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(pieCfg))}&format=png&backgroundColor=white&width=800&height=480`;
    let imgPieResp: Response;
    try {
      imgPieResp = await fetch(qcPie);
      if (imgPieResp.ok) {
        const ab = await imgPieResp.arrayBuffer();
        const imgId = wb.addImage({ buffer: bufFrom(ab), extension: "png" });
        ws4.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 800, height: 480 } });
      } else {
        ws4.addRow([L.chartError]);
      }
    } catch (err) {
      ws4.addRow([L.chartError]);
    }

    // --- Buffer & réponse
    const xbuf = await wb.xlsx.writeBuffer();
    const uint8 = new Uint8Array(xbuf);
    const fnameBase = (form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60);
    const filename = `${fnameBase}_${lang.toUpperCase()}.xlsx`;

    return new NextResponse(uint8, {
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
