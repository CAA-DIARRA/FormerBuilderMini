// app/lib/labels.ts
export const LABELS = {
  fr: {
    // Feuilles
    sheet1Title: "SYNTHÈSE",
    sheet2Title: "GRAPHIQUE CONTENU",
    sheet3Title: "GRAPHIQUE FORMATEUR",
    sheet4Title: "CAMEMBERT ATTENTES",

    // Métadonnées
    sessionDate: "Date de session",
    location: "Lieu",
    trainerName: "Formateur",

    // Sections
    envTitle: "I. L’environnement de la formation",
    contTitle: "II. Le contenu de la formation",
    formTitle: "III. Le(s) formateur(s)",

    // En-têtes & libellés génériques
    criteria: "Critère",
    participantShort: "P",
    participant: "Participant",
    response: "Réponse",
    avg: "Moyenne",
    target: "Cible",
    scaleLegend: "Échelle : Très Bien (4) • Bien (3) • Passable (2) • Mauvais (1)",
    none: "Aucune réponse",
    chartError: "Impossible de générer le graphique",
    fileSuffix: "FR",

    // Contenu (questions)
    content: {
      content_expectations: "1. Le contenu couvre-t-il vos attentes ?",
      content_useful: "2. Le contenu est-il utile pour votre travail ?",
      content_exercises: "3. Exercices / exemples / vidéos",
      content_method: "4. Méthodologie utilisée",
      content_materials: "5. Supports de formation",
      content_rhythm: "6. Rythme de la formation",
      content_overall: "Évaluation globale de la formation",
    },

    // Formateur (questions)
    trainer: {
      trainer_mastery: "1. Maîtrise du sujet",
      trainer_comm: "2. Qualité de la communication",
      trainer_clarity: "3. Clarté des réponses aux questions",
      trainer_method: "4. Maîtrise méthodologie de la formation",
      trainer_overall: "5. Évaluation globale du formateur",
    },

    // Attentes / blocs texte
    attentesTitle: "ATTENTES DES PARTICIPANTS",
    attentesQuestion: "Cette formation a-t-elle répondu à vos attentes ?",
    oui: "OUI",
    non: "NON",

    complementTitle: "Formations complémentaires envisagées",
    testimonyTitle: "Témoignages des participants",
  },

  en: {
    // Sheets
    sheet1Title: "SUMMARY",
    sheet2Title: "CONTENT CHART",
    sheet3Title: "TRAINER CHART",
    sheet4Title: "EXPECTATION PIE",

    // Meta
    sessionDate: "Session date",
    location: "Location",
    trainerName: "Trainer",

    // Sections
    envTitle: "I. Training environment",
    contTitle: "II. Training content",
    formTitle: "III. Trainer(s)",

    // Headers & generic labels
    criteria: "Criteria",
    participantShort: "P",
    participant: "Participant",
    response: "Response",
    avg: "Average",
    target: "Target",
    scaleLegend: "Scale: Excellent (4) • Good (3) • Fair (2) • Poor (1)",
    none: "No responses",
    chartError: "Chart generation failed",
    fileSuffix: "EN",

    // Content (questions)
    content: {
      content_expectations: "1. Content meets your expectations?",
      content_useful: "2. Content is useful for your job?",
      content_exercises: "3. Exercises / examples / videos",
      content_method: "4. Training methodology",
      content_materials: "5. Training materials",
      content_rhythm: "6. Training pace",
      content_overall: "Overall evaluation of the training",
    },

    // Trainer (questions)
    trainer: {
      trainer_mastery: "1. Subject mastery",
      trainer_comm: "2. Communication quality",
      trainer_clarity: "3. Clarity of answers",
      trainer_method: "4. Mastery of training methodology",
      trainer_overall: "5. Overall evaluation of the trainer",
    },

    // Expectations / text blocks
    attentesTitle: "PARTICIPANTS’ EXPECTATIONS",
    attentesQuestion: "Did this training meet your expectations?",
    oui: "YES",
    non: "NO",

    complementTitle: "Additional trainings considered",
    testimonyTitle: "Participants’ testimonials",
  },
} as const;
