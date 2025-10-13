// app/api/forms/[formId]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { LABELS } from "../../../../lib/labels";

const prisma = new PrismaClient();

type RespRow = {
  participantNom?: string | null;
  participantPrenoms?: string | null;
  participantEntreprise?: string | null;

  // Environnement
  envAccueil?: number | null;
  envLieu?: number | null;
  envMateriel?: number | null;

  // Contenu
  contAttentes?: number | null;
  contUtiliteTravail?: number | null;
  contExercices?: number | null;
  contMethodologie?: number | null;
  contSupports?: number | null;
  contRythme?: number | null;
  contGlobal?: number | null;

  // Formateur
  formMaitrise?: number | null;
  formCommunication?: number | null;
  formClarte?: number | null;
  formMethodo?: number | null;
  formGlobal?: number | null;

  // Synthèse
  reponduAttentes?: "OUI" | "PARTIELLEMENT" | "NON" | null;
  formationsComplementaires?: string | null;
  temoignage?: string | null;
};

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    // --- Langue ---
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "fr") as "fr" | "en";
    // On détend le typage pour éviter les erreurs TS si votre fichier labels évolue
    const L = (LABELS as any)[lang] as any;

    // --- Form ---
    const form = await prisma.form.findUnique({ where: { id: params.formId } });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // --- Réponses ---
    // On évite les erreurs de typage Prisma en restant “souple”
    const raw: any[] = await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: { id: "asc" } as any,
    });

    // Votre schéma peut exposer la charge utile sous data/payload/answers…
    const participants: RespRow[] = raw.map((r: any) => {
      const d = r?.data ?? r?.payload ?? r?.answers ?? r;
      return d as RespRow;
    });

    // --- Excel ---
    const wb = new ExcelJS.Workbook();
    wb.creator = "FormerBuilder";
    wb.created = new Date();

    // Styles
    const grayFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFEFEFEF" } };
    const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1A73E8" } };
    const white = { argb: "FFFFFFFF" };

    const cible: number = (L?.cibleValue ?? 2.5) as number;

    // ===============================
    // FEUILLE 1 — SYNTHÈSE (tableaux)
    // ===============================
    const ws1 = wb.addWorksheet(L?.sheet1Title ?? "SYNTHÈSE");
    ws1.properties.defaultRowHeight = 18;

    // Titre / méta
    ws1.addRow([L?.reportTitle ?? "Rapport d’évaluation"]);
    ws1.mergeCells("A1:E1");
    ws1.getCell("A1").font = { bold: true, size: 14 };

    const metaRows = [
      [L?.sessionDate ?? "Date de session", form.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : ""],
      [L?.trainerName ?? "Formateur", form.trainerName ?? ""],
      [L?.location ?? "Lieu", form.location ?? ""],
      [L?.formPublicUrl ?? "Lien du formulaire", `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/f/${form.slug}`],
    ];
    metaRows.forEach((r) => ws1.addRow(r));
    ws1.addRow([]);

    // Initiales dynamiques (colonnes des participants)
    const initials = participants.map((p, idx) => {
      const pn = (p.participantPrenoms || "").trim();
      const nm = (p.participantNom || "").trim();
      if (!pn && !nm) return `P${idx + 1}`;
      const i1 = pn ? pn[0] : "";
      const i2 = nm ? nm[0] : "";
      return `${(i1 + i2).toUpperCase() || `P${idx + 1}`}`;
    });

    // En-tête de bloc
    const makeHeader = (title: string) => {
      const colsCount = 1 + initials.length + 2; // Critère + N participants + (Moyenne, Cible)
      const r = ws1.addRow([title]);
      ws1.mergeCells(r.number, 1, r.number, colsCount);
      r.font = { bold: true };
      r.fill = grayFill;
      r.alignment = { vertical: "middle", horizontal: "left" };

      const head = ws1.addRow([
        L?.criteriaHeader ?? "Critère",
        ...initials,
        L?.avgHeader ?? "Moyenne",
        L?.targetHeader ?? "Cible",
      ]);
      head.font = { bold: true, color: white };
      head.fill = headerFill;
      head.alignment = { vertical: "middle", horizontal: "center" };

      const widths = [40, ...Array(initials.length).fill(8), 10, 10];
      widths.forEach((w, i) => (ws1.getColumn(i + 1).width = w));
    };

    // Écrit un bloc de critères
    function writeCriteriaBlock(rows: ReadonlyArray<{ key: string; label: string }>) {
      rows.forEach((r) => {
        const vals = participants.map((p) => (p[r.key as keyof RespRow] ?? null) as number | null);
        // moyenne “safe”
        const sum = vals.reduce((s, v) => s + (Number(v) || 0), 0);
        const avg = vals.length ? sum / vals.length : null;
        ws1.addRow([r.label, ...vals, avg, cible]);
      });
      ws1.addRow([]);
    }

    // Blocs de la synthèse
    const envRows = (L?.envRows ?? []) as ReadonlyArray<{ key: string; label: string }>;
    const contRows = (L?.contRows ?? []) as ReadonlyArray<{ key: string; label: string }>;
    const formRows = (L?.formRows ?? []) as ReadonlyArray<{ key: string; label: string }>;

    makeHeader(L?.envTitle ?? "I. Environnement");
    writeCriteriaBlock(envRows);

    makeHeader(L?.contTitle ?? "II. Contenu");
    writeCriteriaBlock(contRows);

    makeHeader(L?.formTitle ?? "III. Formateur(s)");
    writeCriteriaBlock(formRows);

    // --- Attentes (table %)
    const attTitle = ws1.addRow([L?.expectTitle ?? "ATTENTES DES PARTICIPANTS"]);
    ws1.mergeCells(attTitle.number, 1, attTitle.number, Math.max(6, 1 + initials.length));
    attTitle.font = { bold: true };
    attTitle.fill = grayFill;
    attTitle.alignment = { vertical: "middle", horizontal: "left" };

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

    ws1.addRow([L?.expectQuestion ?? "Cette formation a-t-elle répondu à vos attentes ?", "", "", "", "", "%"]);
    ws1.addRow(["OUI", ...Array(Math.max(0, initials.length - 1)).fill(""), "", "", "", `${pct.oui}%`]);
    ws1.addRow(["PARTIELLEMENT", ...Array(Math.max(0, initials.length - 1)).fill(""), "", "", "", `${pct.partiel}%`]);
    ws1.addRow(["NON", ...Array(Math.max(0, initials.length - 1)).fill(""), "", "", "", `${pct.non}%`]);
    ws1.addRow([]);

    // --- Formations complémentaires
    const compTitle = ws1.addRow([L?.complementaryTitle ?? "Formations complémentaires envisagées"]);
    ws1.mergeCells(compTitle.number, 1, compTitle.number, Math.max(6, 1 + initials.length));
    compTitle.font = { bold: true };
    compTitle.fill = grayFill;

    const compList = participants.map((p) => (p.formationsComplementaires || "").trim()).filter(Boolean);
    if (compList.length === 0) {
      ws1.addRow([L?.noneText ?? "—"]);
    } else {
      compList.forEach((txt, i) => ws1.addRow([`${i + 1}. ${txt}`]));
    }
    ws1.addRow([]);

    // --- Témoignages
    const temoTitle = ws1.addRow([L?.testimonyTitle ?? "Témoignages des participants"]);
    ws1.mergeCells(temoTitle.number, 1, temoTitle.number, Math.max(6, 1 + initials.length));
    temoTitle.font = { bold: true };
    temoTitle.fill = grayFill;

    const temoList = participants.map((p) => (p.temoignage || "").trim()).filter(Boolean);
    if (temoList.length === 0) {
      ws1.addRow([L?.noneText ?? "—"]);
    } else {
      temoList.forEach((txt, i) => ws1.addRow([`${i + 1}. ${txt}`]));
    }

    // ===============================
    // FEUILLE 2 — GRAPHIQUE CONTENU
    // ===============================
    const ws2 = wb.addWorksheet(L?.sheet2Title ?? "GRAPHIQUE CONTENU");
    ws2.getColumn(1).width = 160;

    const contLabels = contRows.map((r) => r.label);
    const contAvgs = contRows.map((r) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] as number | null) ?? null);
      const sum = vals.reduce((s, v) => s + (Number(v) || 0), 0);
      return vals.length ? sum / vals.length : 0;
    });

    const chartCfg1 = {
      type: "bar",
      data: {
        labels: contLabels,
        datasets: [
          { label: L?.avgHeader ?? "Moyenne", data: contAvgs },
          { label: L?.targetHeader ?? "Cible", data: contAvgs.map(() => cible) },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L?.sheet2Title ?? "GRAPHIQUE CONTENU" },
        },
        scales: { x: { suggestedMin: 0, suggestedMax: 4 } },
      },
    };

    const qcUrl1 = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartCfg1))}&format=png&backgroundColor=white&width=1200&height=550`;
    const img1Resp = await fetch(qcUrl1);
    if (img1Resp.ok) {
      const ab = await img1Resp.arrayBuffer();
      // 👉 ExcelJS typings: on passe l'ArrayBuffer (cast any)
      const imgId = wb.addImage({ buffer: ab as any, extension: "png" });
      ws2.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    } else {
      ws2.addRow([L?.chartError ?? "Erreur de génération du graphique"]);
    }

    // =================================
    // FEUILLE 3 — GRAPHIQUE FORMATEUR
    // =================================
    const ws3 = wb.addWorksheet(L?.sheet3Title ?? "GRAPHIQUE FORMATEUR");
    ws3.getColumn(1).width = 160;

    const formLabels = formRows.map((r) => r.label);
    const formAvgs = formRows.map((r) => {
      const vals = participants.map((p) => (p[r.key as keyof RespRow] as number | null) ?? null);
      const sum = vals.reduce((s, v) => s + (Number(v) || 0), 0);
      return vals.length ? sum / vals.length : 0;
    });

    const chartCfg2 = {
      type: "bar",
      data: {
        labels: formLabels,
        datasets: [
          { label: L?.avgHeader ?? "Moyenne", data: formAvgs },
          { label: L?.targetHeader ?? "Cible", data: formAvgs.map(() => cible) },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L?.sheet3Title ?? "GRAPHIQUE FORMATEUR" },
        },
        scales: { x: { suggestedMin: 0, suggestedMax: 4 } },
      },
    };

    const qcUrl2 = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartCfg2))}&format=png&backgroundColor=white&width=1200&height=550`;
    const img2Resp = await fetch(qcUrl2);
    if (img2Resp.ok) {
      const ab = await img2Resp.arrayBuffer();
      const imgId = wb.addImage({ buffer: ab as any, extension: "png" });
      ws3.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 1200, height: 520 } });
    } else {
      ws3.addRow([L?.chartError ?? "Erreur de génération du graphique"]);
    }

    // ===============================
    // FEUILLE 4 — CAMEMBERT ATTENTES
    // ===============================
    const ws4 = wb.addWorksheet(L?.sheet4Title ?? "CAMEMBERT ATTENTES");
    ws4.getColumn(1).width = 160;

    const pieCfg = {
      type: "pie",
      data: {
        labels: [
          L?.expectYesLabel ?? "OUI",
          L?.expectPartialLabel ?? "PARTIELLEMENT",
          L?.expectNoLabel ?? "NON",
        ],
        datasets: [{ data: [count.oui, count.partiel, count.non] }],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: L?.sheet4Title ?? "CAMEMBERT ATTENTES" },
        },
      },
    };

    const qcPie = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(pieCfg))}&format=png&backgroundColor=white&width=800&height=480`;
    const imgPieResp = await fetch(qcPie);
    if (imgPieResp.ok) {
      const ab = await imgPieResp.arrayBuffer();
      const imgId = wb.addImage({ buffer: ab as any, extension: "png" });
      ws4.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 800, height: 480 } });
    } else {
      ws4.addRow([L?.chartError ?? "Erreur de génération du graphique"]);
    }

    // --- Buffer Excel & réponse ---
    const xbuf = await wb.xlsx.writeBuffer();
    const fnameBase = (form.title || "evaluation").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60);
    const filename = `${fnameBase}_${(lang || "fr").toUpperCase()}.xlsx`;

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
