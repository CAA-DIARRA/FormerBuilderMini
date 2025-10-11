// app/lib/labels.ts
export type CritKey =
  | "envAccueil" | "envLieu" | "envMateriel"
  | "contAttentes" | "contUtiliteTravail" | "contExercices" | "contMethodologie" | "contSupports" | "contRythme" | "contGlobal"
  | "formMaitrise" | "formCommunication" | "formClarte" | "formMethodo" | "formGlobal";

type Crit = { key: CritKey; label: string };

export type Labels = {
  envTitle: string;
  contTitle: string;
  formTitle: string;
  env: Crit[];
  cont: Crit[];
  form: Crit[];
};

const FR: Labels = {
  envTitle: "I. L’environnement de la formation",
  contTitle: "II. Le Contenu de la formation",
  formTitle: "Le(s) Formateur(s)",
  env: [
    { key: "envAccueil", label: "1. Comment avez-vous trouvé l’Accueil ?" },
    { key: "envLieu", label: "2. Comment avez-vous trouvé le(s) Lieu(x) de formation ?" },
    { key: "envMateriel", label: "3. Comment avez-vous trouvé le Matériel mis à disposition ?" },
  ],
  cont: [
    { key: "contAttentes", label: "1. Le contenu couvre-t-il vos attentes ?" },
    { key: "contUtiliteTravail", label: "2. Le contenu est-il utile pour votre travail ?" },
    { key: "contExercices", label: "3. Comment avez-vous trouvé les exercices / exemples / vidéos ?" },
    { key: "contMethodologie", label: "4. Comment avez-vous trouvé la méthodologie utilisée pour la formation ?" },
    { key: "contSupports", label: "5. Comment avez-vous trouvé les supports de la formation ?" },
    { key: "contRythme", label: "6. Comment avez-vous trouvé le rythme de la formation ?" },
    { key: "contGlobal", label: "Évaluation globale de la formation" },
  ],
  form: [
    { key: "formMaitrise", label: "1. Maîtrise du sujet" },
    { key: "formCommunication", label: "2. Qualité de communication" },
    { key: "formClarte", label: "3. Clarté des réponses aux questions" },
    { key: "formMethodo", label: "4. Maîtrise méthodologie de la formation" },
    { key: "formGlobal", label: "5. Évaluation globale du formateur" },
  ],
};

const EN: Labels = {
  envTitle: "I. Training environment",
  contTitle: "II. Training content",
  formTitle: "Trainer(s)",
  env: [
    { key: "envAccueil", label: "1. How did you find the welcome/reception?" },
    { key: "envLieu", label: "2. How did you find the training venue(s)?" },
    { key: "envMateriel", label: "3. How did you find the equipment provided?" },
  ],
  cont: [
    { key: "contAttentes", label: "1. Does the content meet your expectations?" },
    { key: "contUtiliteTravail", label: "2. Is the content useful for your work?" },
    { key: "contExercices", label: "3. How did you find the exercises / examples / videos?" },
    { key: "contMethodologie", label: "4. How did you find the training methodology used?" },
    { key: "contSupports", label: "5. How did you find the training materials?" },
    { key: "contRythme", label: "6. How did you find the training pace?" },
    { key: "contGlobal", label: "Overall evaluation of the training" },
  ],
  form: [
    { key: "formMaitrise", label: "1. Mastery of the subject" },
    { key: "formCommunication", label: "2. Quality of communication" },
    { key: "formClarte", label: "3. Clarity of answers to questions" },
    { key: "formMethodo", label: "4. Mastery of training methodology" },
    { key: "formGlobal", label: "5. Overall evaluation of the trainer" },
  ],
};

export function getLabels(lang: "fr" | "en" = "fr"): Labels {
  return lang === "en" ? EN : FR;
}

// Cibles par langue et par section (modifiable)
export const TARGETS = {
  fr: { env: 2.5, cont: 2.5, form: 2.5 },
  en: { env: 2.5, cont: 2.5, form: 2.5 },
} as const;

// Libellés de colonnes selon la langue
export const COLS = {
  fr: { critere: "Critère", moyenne: "Moyenne", cible: "Cible", participant: "Participant" },
  en: { critere: "Criterion", moyenne: "Average", cible: "Target", participant: "Participant" },
} as const;
