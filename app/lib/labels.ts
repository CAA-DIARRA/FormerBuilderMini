// app/lib/labels.ts

export const LABELS = {
  fr: {
    // TITRES DES FEUILLES
    sheet1Title: "SYNTHÈSE",
    sheet2Title: "GRAPHIQUE CONTENU",
    sheet3Title: "GRAPHIQUE FORMATEUR",
    sheet4Title: "CAMEMBERT ATTENTES",

    // MÉTA FORMATION
    formTitle: "Fiche formation",
    sessionDate: "Date de session",
    trainerName: "Formateur",
    location: "Lieu",
    formPublicUrl: "URL publique du formulaire",

    // TITRES DES BLOCS
    envTitle: "ENVIRONNEMENT DE FORMATION",
    contTitle: "CONTENU DE LA FORMATION",
    formTitleBlock: "FORMATEUR / ANIMATION",
    expectTitle: "ATTENTES DES PARTICIPANTS",
    complementaryTitle: "Formations complémentaires envisagées",
    testimonyTitle: "Témoignages des participants",

    // EN-TÊTES DE TABLEAUX
    criteriaHeader: "Critère",
    avgHeader: "Moyenne",
    targetHeader: "Cible",

    // QUESTIONS / TEXTES
    expectQuestion: "Cette formation a-t-elle répondu à vos attentes ?",
    expectYesLabel: "OUI",
    expectPartialLabel: "PARTIELLEMENT",
    expectNoLabel: "NON",
    noneText: "—",

    // ERREUR
    chartError: "Erreur de génération du graphique",

    // LIGNES DE CRITÈRES
    envRows: [
      { key: "envAccueil", label: "1. Comment avez-vous trouvé l’Accueil ?" },
      { key: "envLieu", label: "2. Comment avez-vous trouvé le(s) Lieu(x) de formation ?" },
      { key: "envMateriel", label: "3. Comment avez-vous trouvé le Matériel mis à disposition ?" },
    ],
    contRows: [
      { key: "contAttentes", label: "1. Le contenu répondait-il à vos attentes ?" },
      { key: "contUtiliteTravail", label: "2. Le contenu vous sera-t-il utile dans votre travail ?" },
      { key: "contExercices", label: "3. Les exercices étaient-ils adaptés ?" },
      { key: "contMethodologie", label: "4. La méthodologie employée était-elle pertinente ?" },
      { key: "contSupports", label: "5. Les supports de formation étaient-ils adaptés ?" },
      { key: "contRythme", label: "6. Le rythme de la formation était-il approprié ?" },
      { key: "contGlobal", label: "7. Évaluation globale du contenu" },
    ],
    formRows: [
      { key: "formMaitrise", label: "1. Le formateur maîtrise-t-il son sujet ?" },
      { key: "formCommunication", label: "2. Le formateur communique-t-il clairement ?" },
      { key: "formClarte", label: "3. Le formateur répond-il clairement aux questions ?" },
      { key: "formMethodo", label: "4. Sa méthode pédagogique était-elle adaptée ?" },
      { key: "formGlobal", label: "5. Évaluation globale du formateur" },
    ],
  },

  en: {
    // SHEET TITLES
    sheet1Title: "SYNTHESIS",
    sheet2Title: "CONTENT CHART",
    sheet3Title: "TRAINER CHART",
    sheet4Title: "EXPECTATIONS PIE",

    // META FORM INFO
    formTitle: "Training summary",
    sessionDate: "Session date",
    trainerName: "Trainer",
    location: "Location",
    formPublicUrl: "Public form URL",

    // SECTION TITLES
    envTitle: "TRAINING ENVIRONMENT",
    contTitle: "TRAINING CONTENT",
    formTitleBlock: "TRAINER / DELIVERY",
    expectTitle: "PARTICIPANTS’ EXPECTATIONS",
    complementaryTitle: "Planned complementary training",
    testimonyTitle: "Participants’ testimonials",

    // TABLE HEADERS
    criteriaHeader: "Criteria",
    avgHeader: "Average",
    targetHeader: "Target",

    // QUESTIONS / TEXTS
    expectQuestion: "Did this training meet your expectations?",
    expectYesLabel: "YES",
    expectPartialLabel: "PARTIALLY",
    expectNoLabel: "NO",
    noneText: "—",

    // ERRORS
    chartError: "Chart generation error",

    // CRITERIA ROWS
    envRows: [
      { key: "envAccueil", label: "1. How did you find the Welcome?" },
      { key: "envLieu", label: "2. How did you find the Training Location(s)?" },
      { key: "envMateriel", label: "3. How did you find the provided Materials?" },
    ],
    contRows: [
      { key: "contAttentes", label: "1. Did the content meet your expectations?" },
      { key: "contUtiliteTravail", label: "2. Will the content be useful in your job?" },
      { key: "contExercices", label: "3. Were the exercises appropriate?" },
      { key: "contMethodologie", label: "4. Was the methodology relevant?" },
      { key: "contSupports", label: "5. Were the materials suitable?" },
      { key: "contRythme", label: "6. Was the training pace appropriate?" },
      { key: "contGlobal", label: "7. Overall content evaluation" },
    ],
    formRows: [
      { key: "formMaitrise", label: "1. Did the trainer master the subject?" },
      { key: "formCommunication", label: "2. Did the trainer communicate clearly?" },
      { key: "formClarte", label: "3. Did the trainer answer questions clearly?" },
      { key: "formMethodo", label: "4. Was the teaching method appropriate?" },
      { key: "formGlobal", label: "5. Overall trainer evaluation" },
    ],
  },
} as const;
