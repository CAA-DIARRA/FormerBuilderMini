// app/components/FormClient.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";

type Lang = "fr" | "en";
const scale = [4, 3, 2, 1];

type FormDto = {
  id: string;
  slug: string;
  title?: string | null;
  trainerName?: string | null;
  sessionDate?: string | null;
  location?: string | null;
  isOpen: boolean;
};

type Props = {
  form: FormDto;
  lang?: Lang;
};

export default function FormClient({ form, lang = "fr" }: Props) {
  // ====== Traductions ======
  const T = useMemo(() => {
    if (lang === "en") {
      return {
        pageTitle: form?.title ?? "Training evaluation",
        headerLine: (d: string) =>
          `Trainer: ${form?.trainerName ?? ""} • Date: ${d} • Location: ${form?.location ?? ""}`,

        participant: "PARTICIPANT",
        fields: {
          lastName: "Last name",
          firstNames: "First names",
          role: "Role",
          company: "Company",
        },

        envTitle: "I. Training environment",
        env: {
          accueil: "1. How did you find the welcome/reception?",
          lieux: "2. How did you find the training venue(s)?",
          materiel: "3. How did you find the equipment provided?",
          ameliors: "4. Your suggestions for improvement",
        },

        contTitle: "II. Training content",
        cont: {
          attentes: "1. Does the content meet your expectations?",
          utile: "2. Is the content useful for your work?",
          exos: "3. How did you find the exercises / examples / videos?",
          methodo: "4. How did you find the methodology used?",
          supports: "5. How did you find the training materials?",
          rythme: "6. How did you find the training pace?",
          global: "Overall evaluation of the training",
        },

        formTitle: "III. Trainer(s)",
        formSec: {
          maitrise: "1. Mastery of the subject",
          com: "2. Quality of communication",
          clarte: "3. Clarity of answers to questions",
          methodo: "4. Mastery of the training methodology",
          global: "5. Overall evaluation of the trainer",
        },

        synthTitle: "Summary",
        synthQ: "Did this training meet your expectations?",
        // 🔥 PARTIALLY supprimé
        opts: ["YES", "NO"],

        extraTitle: "Additional courses & Testimonial",
        extraQ1: "What complementary training would you consider?",
        extraQ2: "What testimonial can you leave about this training?",
        consent: "I authorize the publication of my testimonial",

        scaleH: ["Very good (4)", "Good (3)", "Fair (2)", "Poor (1)"],

        send: "Submit",
        ok: "Thank you for your feedback!",
        ko: "An error occurred while submitting.",
      };
    }

    // ===== FR =====
    return {
      pageTitle: form?.title ?? "Évaluation de formation",
      headerLine: (d: string) =>
        `Formateur : ${form?.trainerName ?? ""} • Date : ${d} • Lieu : ${form?.location ?? ""}`,

      participant: "PARTICIPANT",
      fields: {
        lastName: "Nom",
        firstNames: "Prénoms",
        role: "Fonction",
        company: "Entreprise",
      },

      envTitle: "I. L’environnement de la formation",
      env: {
        accueil: "1. Comment avez-vous trouvé l’Accueil ?",
        lieux: "2. Comment avez-vous trouvé le(s) Lieu(x) de formation ?",
        materiel: "3. Comment avez-vous trouvé le Matériel mis à disposition ?",
        ameliors: "4. Vos propositions d’amélioration",
      },

      contTitle: "II. Le Contenu de la formation",
      cont: {
        attentes: "1. Le contenu couvre-t-il vos attentes ?",
        utile: "2. Le contenu est-il utile pour votre travail ?",
        exos: "3. Comment avez-vous trouvé les exercices / exemples / vidéos ?",
        methodo: "4. Comment avez-vous trouvé la méthodologie utilisée pour la formation ?",
        supports: "5. Comment avez-vous trouvé les supports de la formation ?",
        rythme: "6. Comment avez-vous trouvé le rythme de la formation ?",
        global: "Évaluation globale de la formation",
      },

      formTitle: "III. Le(s) Formateur(s)",
      formSec: {
        maitrise: "1. Maîtrise du sujet",
        com: "2. Qualité de communication",
        clarte: "3. Clarté des réponses aux questions",
        methodo: "4. Maîtrise méthodologie de la formation",
        global: "5. Évaluation globale du formateur",
      },

      synthTitle: "Synthèse",
      synthQ: "Cette formation a-t-elle répondu à vos attentes ?",
      // 🔥 PARTIELLEMENT supprimé
      opts: ["OUI", "NON"],

      extraTitle: "Compléments & Témoignage",
      extraQ1: "Quelles formations complémentaires envisagez-vous ?",
      extraQ2: "Quel témoignage pouvez-vous laisser de cette formation ?",
      consent: "J’autorise la publication de mon témoignage",

      scaleH: ["Très bien (4)", "Bien (3)", "Passable (2)", "Mauvais (1)"],

      send: "Envoyer",
      ok: "Merci pour votre retour !",
      ko: "Une erreur est survenue lors de l’envoi.",
    };
  }, [lang, form?.title, form?.trainerName, form?.location]);

  // ====== Réf du formulaire DOM (pour lire les valeurs texte) ======
  const formRef = useRef<HTMLFormElement | null>(null);

  // ====== États pour les notes (radio 4–3–2–1) ======
  const [notes, setNotes] = useState({
    envAccueil: 4,
    envLieu: 4,
    envMateriel: 4,

    contAttentes: 4,
    contUtiliteTravail: 4,
    contExercices: 4,
    contMethodologie: 4,
    contSupports: 4,
    contRythme: 4,
    contGlobal: 4,

    formMaitrise: 4,
    formCommunication: 4,
    formClarte: 4,
    formMethodo: 4,
    formGlobal: 4,
  });

  const updateNote = (key: keyof typeof notes, value: number) => {
    setNotes((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  };

  // OUI / NON
  const [reponduAttentes, setReponduAttentes] = useState(lang === "en" ? "YES" : "OUI");

  // Consentement
  const [consentementTemoignage, setConsentementTemoignage] = useState(false);

  const [loading, setLoading] = useState(false);

  const safeDate = form?.sessionDate ? new Date(form.sessionDate).toLocaleDateString() : "";

  // ====== Envoi ======
  const send = async () => {
    if (!formRef.current) return;

    try {
      setLoading(true);

      const fd = new FormData(formRef.current);

      const payload = {
        participantNom: (fd.get("participantNom") || "").toString(),
        participantPrenoms: (fd.get("participantPrenoms") || "").toString(),
        participantFonction: (fd.get("participantFonction") || "").toString(),
        participantEntreprise: (fd.get("participantEntreprise") || "").toString(),

        envAmeliorations: (fd.get("envAmeliorations") || "").toString(),
        formationsComplementaires: (fd.get("formationsComplementaires") || "").toString(),
        temoignage: (fd.get("temoignage") || "").toString(),

        consentementTemoignage,

        reponduAttentes,

        ...notes,
      };

      const res = await fetch(`/api/forms/${form?.id}/responses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("submit_failed");

      alert(T.ok);
      // on ne touche pas aux valeurs des inputs texte → l’utilisateur garde ce qu’il a écrit
    } catch (e) {
      console.error(e);
      alert(T.ko);
    } finally {
      setLoading(false);
    }
  };

  // ====== Composants internes ======
  const Section = ({
    title,
    children,
  }: React.PropsWithChildren<{
    title: string;
  }>) => (
    <section className="border rounded-2xl p-4 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );

  const ScaleHeader = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs text-neutral-600">
      <div className="col-span-2" />
      {T.scaleH.map((h) => (
        <div key={h} className="text-center">
          {h}
        </div>
      ))}
    </div>
  );

  const RadioRow = ({ label, name }: { label: string; name: keyof typeof notes }) => (
    <div className="grid grid-cols-2 md:grid-cols-6 items-center gap-2">
      <div className="col-span-2">{label}</div>
      {scale.map((v) => (
        <label key={`${name}-${v}`} className="flex items-center justify-center gap-1">
          <input
            type="radio"
            name={name}
            checked={notes[name] === v}
            onChange={() => updateNote(name, v)}
          />
        </label>
      ))}
    </div>
  );

  // ====== Rendu ======
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{T.pageTitle}</h1>
        <p className="text-sm">{T.headerLine(safeDate)}</p>
      </header>

      {/* On met tout dans un <form> pour utiliser FormData */}
      <form
        ref={formRef}
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) void send();
        }}
      >
        {/* PARTICIPANT */}
        <Section title={T.participant}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-xl p-2"
              name="participantNom"
              placeholder={T.fields.lastName}
              // 🔓 pas de value → input non contrôlé
              defaultValue=""
            />
            <input
              className="border rounded-xl p-2"
              name="participantPrenoms"
              placeholder={T.fields.firstNames}
              defaultValue=""
            />
            <input
              className="border rounded-xl p-2"
              name="participantFonction"
              placeholder={T.fields.role}
              defaultValue=""
            />
            <input
              className="border rounded-xl p-2"
              name="participantEntreprise"
              placeholder={T.fields.company}
              defaultValue=""
            />
          </div>
        </Section>

        {/* ENVIRONNEMENT */}
        <Section title={T.envTitle}>
          <ScaleHeader />
          <RadioRow label={T.env.accueil} name="envAccueil" />
          <RadioRow label={T.env.lieux} name="envLieu" />
          <RadioRow label={T.env.materiel} name="envMateriel" />
          <textarea
            className="w-full border rounded-xl p-2"
            name="envAmeliorations"
            placeholder={T.env.ameliors}
            defaultValue=""
          />
        </Section>

        {/* CONTENU */}
        <Section title={T.contTitle}>
          <ScaleHeader />
          <RadioRow label={T.cont.attentes} name="contAttentes" />
          <RadioRow label={T.cont.utile} name="contUtiliteTravail" />
          <RadioRow label={T.cont.exos} name="contExercices" />
          <RadioRow label={T.cont.methodo} name="contMethodologie" />
          <RadioRow label={T.cont.supports} name="contSupports" />
          <RadioRow label={T.cont.rythme} name="contRythme" />
          <RadioRow label={T.cont.global} name="contGlobal" />
        </Section>

        {/* FORMATEUR(S) */}
        <Section title={T.formTitle}>
          <ScaleHeader />
          <RadioRow label={T.formSec.maitrise} name="formMaitrise" />
          <RadioRow label={T.formSec.com} name="formCommunication" />
          <RadioRow label={T.formSec.clarte} name="formClarte" />
          <RadioRow label={T.formSec.methodo} name="formMethodo" />
          <RadioRow label={T.formSec.global} name="formGlobal" />
        </Section>

        {/* SYNTHÈSE */}
        <Section title={T.synthTitle}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <span>{T.synthQ}</span>
            <div className="flex gap-4">
              {T.opts.map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reponduAttentes"
                    checked={reponduAttentes === opt}
                    onChange={() => setReponduAttentes(opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* COMPLÉMENTS / TÉMOIGNAGE */}
        <Section title={T.extraTitle}>
          <textarea
            className="w-full border rounded-xl p-2"
            name="formationsComplementaires"
            placeholder={T.extraQ1}
            defaultValue=""
          />
          <textarea
            className="w-full border rounded-xl p-2"
            name="temoignage"
            placeholder={T.extraQ2}
            defaultValue=""
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={consentementTemoignage}
              onChange={(e) => setConsentementTemoignage(e.target.checked)}
            />
            <span>{T.consent}</span>
          </label>
        </Section>

        <button
          type="submit"
          className="px-4 py-2 rounded-2xl border shadow bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {T.send}
        </button>
      </form>
    </div>
  );
}
