// Centralise tous les libellés utilisés par l’export Excel (FR/EN)

export const LABELS = {
  fr: {
    // Titres de feuilles (tu peux les renommer librement)
    sheet1Title: "SYNTHÈSE",
    sheet2Title: "GRAPHIQUES",
    sheet3Title: "DÉTAILS",
    sheet4Title: "MÉTA",

    // En-têtes / champs communs
    reportTitle: "Rapport d’évaluation",
    trainer: "Formateur",
    date: "Date",
    location: "Lieu",
    criteriaHeader: "Critère",
    participantShort: "P",
    averageHeader: "Moyenne",
    targetHeader: "Cible",
    responsesCount: "Nombre de réponses",
    formTitleMeta: "Intitulé de la formation",

    // Bloc attentes
    expectationsTitle: "ATTENTES DES PARTICIPANTS",
    expectationsQuestion: "Cette formation a-t-elle répondu à vos attentes ?",
    percentHeader: "%",

    // Textes libres
    complementaryTitle: "Formations complémentaires envisagées",
    freeTextHeader: "Texte libre",
    testimonialsTitle: "Témoignages des participants",

    // Feuille 2 (graphiques)
    chartTitle: "Moyennes par critère (ligne = cible 2,5)",
    chartError: "Impossible de générer le graphique QuickChart",

    // Feuille 3 (détails)
    hdTimestamp: "Horodatage",

    // Groupes + lignes (clé = champs JSON de la réponse)
    envTitle: "I. L’environnement de la formation",
    envRows: [
      { key: "envAccueil",   label: "1. Comment avez-vous trouvé l’Accueil ?" },
      { key: "envLieu",      label: "2. Comment avez-vous trouvé le(s) Lieu(x) de formation ?" },
      { key: "envMateriel",  label: "3. Comment avez-vous trouvé le Matériel mis à disposition ?" },
    ],

    contTitle: "II. Le Contenu de la formation",
    contRows: [
      { key: "contAttentes",        label: "1. Le contenu couvre-t-il vos attentes ?" },
      { key: "contUtiliteTravail",  label: "2. Le contenu est-il utile pour votre travail ?" },
      { key: "contExercices",       label: "3. Exercices / exemples / vidéos" },
      { key: "contMethodologie",    label: "4. Méthodologie utilisée" },
      { key: "contSupports",        label: "5. Supports de formation" },
      { key: "contRythme",          label: "6. Rythme de la formation" },
      { key: "contGlobal",          label: "Évaluation globale de la formation" },
    ],

    formTitle: "III. Le(s) Formateur(s)",
    formRows: [
      { key: "formMaitrise",       label: "1. Maîtrise du sujet" },
      { key: "formCommunication",  label: "2. Qualité de communication" },
      { key: "formClarte",         label: "3. Clarté des réponses aux questions" },
      { key: "formMethodo",        label: "4. Maîtrise de la méthodologie de formation" },
      { key: "formGlobal",         label: "5. Évaluation globale du formateur" },
    ],
  },

  en: {
    sheet1Title: "SUMMARY",
    sheet2Title: "CHARTS",
    sheet3Title: "DETAILS",
    sheet4Title: "META",

    reportTitle: "Training evaluation report",
    trainer: "Trainer",
    date: "Date",
    location: "Location",
    criteriaHeader: "Criterion",
    participantShort: "P",
    averageHeader: "Average",
    targetHeader: "Target",
    responsesCount: "Responses count",
    formTitleMeta: "Training title",

    expectationsTitle: "PARTICIPANTS’ EXPECTATIONS",
    expectationsQuestion: "Did this training meet your expectations?",
    percentHeader: "%",

    complementaryTitle: "Additional trainings considered",
    freeTextHeader: "Free text",
    testimonialsTitle: "Participants’ testimonials",

    chartTitle: "Averages per criterion (line = target 2.5)",
    chartError: "Unable to generate chart from QuickChart",

    hdTimestamp: "Timestamp",

    envTitle: "I. Training environment",
    envRows: [
      { key: "envAccueil",   label: "1. How did you find the welcome/reception?" },
      { key: "envLieu",      label: "2. How did you find the training venue(s)?" },
      { key: "envMateriel",  label: "3. How did you find the equipment provided?" },
    ],

    contTitle: "II. Training content",
    contRows: [
      { key: "contAttentes",        label: "1. Does the content meet your expectations?" },
      { key: "contUtiliteTravail",  label: "2. Is the content useful for your work?" },
      { key: "contExercices",       label: "3. Exercises / examples / videos" },
      { key: "contMethodologie",    label: "4. Methodology used" },
      { key: "contSupports",        label: "5. Training materials" },
      { key: "contRythme",          label: "6. Training pace" },
      { key: "contGlobal",          label: "Overall evaluation of the training" },
    ],

    formTitle: "III. Trainer(s)",
    formRows: [
      { key: "formMaitrise",       label: "1. Mastery of the subject" },
      { key: "formCommunication",  label: "2. Quality of communication" },
      { key: "formClarte",         label: "3. Clarity of answers to questions" },
      { key: "formMethodo",        label: "4. Mastery of training methodology" },
      { key: "formGlobal",         label: "5. Overall evaluation of the trainer" },
    ],
  },
} as const;

export type Labels = typeof LABELS["fr"];
