"use client";
import { useState } from "react";

// Valeurs enregistrées inchangées (4,3,2,1)
const likert = [4, 3, 2, 1] as const;

// En-têtes visibles au-dessus des colonnes
const scaleHeaders = ["Très bien (4)", "Bien (3)", "Passable (2)", "Mauvais (1)"];

// Libellés d’options (affichés sur mobile)
const scaleOptions = [
  { value: 4, label: "Très bien (4)" },
  { value: 3, label: "Bien (3)" },
  { value: 2, label: "Passable (2)" },
  { value: 1, label: "Mauvais (1)" },
] as const;

export default function FormClient({ form }: { form: any }) {
  const [loading, setLoading] = useState(false);
  const [vals, setVals] = useState<any>({
    participantNom: "",
    participantPrenoms: "",
    participantFonction: "",
    participantEntreprise: "",
    envAccueil: 4,
    envLieu: 4,
    envMateriel: 4,
    envAmeliorations: "",
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
    reponduAttentes: "OUI",
    formationsComplementaires: "",
    temoignage: "",
    consentementTemoignage: false,
  });

  const send = async () => {
    setLoading(true);
    await fetch(`/api/forms/${form.id}/responses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(vals),
    });
    setLoading(false);
    alert("Merci pour votre retour !");
  };

  const Section = ({ title, children }: any) => (
    <section className="border rounded-2xl p-4 space-y-3 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );

  // Ligne avec entêtes d’échelle au-dessus + rangée de radios
  const RadioRow = ({ label, name }: { label: string; name: string }) => (
    <div className="grid grid-cols-2 md:grid-cols-6 items-center gap-2">
      {/* Libellé de la question */}
      <div className="col-span-2 md:col-span-2">{label}</div>

      {/* En-têtes d’échelle (desktop) */}
      {scaleHeaders.map((h) => (
        <div
          key={h}
          className="hidden md:block text-center text-xs text-neutral-600"
        >
          {h}
        </div>
      ))}

      {/* Rangée de choix (mobile + desktop) */}
      <div className="col-span-2 md:col-span-4 flex justify-between md:justify-around">
        {scaleOptions.map((opt) => (
          <label key={opt.value} className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={vals[name] === opt.value}
              onChange={() =>
                setVals((s: any) => ({ ...s, [name]: opt.value }))
              }
              className="accent-black"
              aria-label={opt.label}
            />
            {/* Sur mobile on affiche le texte, sur desktop on s'appuie sur les en-têtes */}
            <span className="text-xs md:hidden">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-sm">
          Formateur : {form.trainerName} • Date :{" "}
          {new Date(form.sessionDate).toLocaleDateString()} • Lieu :{" "}
          {form.location}
        </p>
      </header>

      {/* Participant */}
      <Section title="Participant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-xl p-2"
            placeholder="Nom"
            value={vals.participantNom}
            onChange={(e) =>
              setVals((s: any) => ({ ...s, participantNom: e.target.value }))
            }
          />
          <input
            className="border rounded-xl p-2"
            placeholder="Prénoms"
            value={vals.participantPrenoms}
            onChange={(e) =>
              setVals((s: any) => ({ ...s, participantPrenoms: e.target.value }))
            }
          />
          <input
            className="border rounded-xl p-2"
            placeholder="Fonction"
            value={vals.participantFonction}
            onChange={(e) =>
              setVals((s: any) => ({
                ...s,
                participantFonction: e.target.value,
              }))
            }
          />
          <input
            className="border rounded-xl p-2"
            placeholder="Entreprise"
            value={vals.participantEntreprise}
            onChange={(e) =>
              setVals((s: any) => ({
                ...s,
                participantEntreprise: e.target.value,
              }))
            }
          />
        </div>
      </Section>

      {/* I. Lenvironnement de la formation */}
      <Section title="I. Lenvironnement de la formation">
        <RadioRow
          label="1. Comment avez-vous trouvé l'Acceuil ?"
          name="envAccueil"
        />
        <RadioRow
          label="2. comment avez-vous trouvé le(s) Lieu(x) de formation ?"
          name="envLieu"
        />
        <RadioRow
          label="3. Comment avez-vous trouvé le Materiel mise à disposition ?"
          name="envMateriel"
        />
        <textarea
          className="w-full border rounded-xl p-2"
          placeholder="Vos propositions d'amélioration"
          value={vals.envAmeliorations}
          onChange={(e) =>
            setVals((s: any) => ({ ...s, envAmeliorations: e.target.value }))
          }
        />
      </Section>

      {/* II. Le Contenu de la formation */}
      <Section title="II. Le Contenu de la formation">
        <RadioRow
          label="1. Le contenu couvre t-il vos attentes ?"
          name="contAttentes"
        />
        <RadioRow
          label="2. Le contenu est-il utile pour votre travail ?"
          name="contUtiliteTravail"
        />
        <RadioRow
          label="3. Comment avez-vous trouvé les exercices / exemples / vidéos ?"
          name="contExercices"
        />
        <RadioRow
          label="4. Comment avez-vous trouvé la méthodologie utilisée pour la formation ?"
          name="contMethodologie"
        />
        <RadioRow
          label="5. Comment avez-vous trouvé les supports de la formation ?"
          name="contSupports"
        />
        <RadioRow
          label="6. Comment avez-vous trouvé le rythme de la formation ?"
          name="contRythme"
        />
        <RadioRow
          label="Évaluation globale de la formation"
          name="contGlobal"
        />
      </Section>

      {/* III. Le(s) Formateur(s) */}
      <Section title="Le(s) Formateur(s)">
        <RadioRow label="1. Maîtrise du sujet" name="formMaitrise" />
        <RadioRow
          label="2. Qualité de communication"
          name="formCommunication"
        />
        <RadioRow
          label="3. Clarté des réponses aux questions"
          name="formClarte"
        />
        <RadioRow
          label="4. Maîtrise méthodologie de la formation"
          name="formMethodo"
        />
        <RadioRow
          label="5. Évaluation globale du formateur"
          name="formGlobal"
        />
      </Section>

      {/* Synthèse */}
      <Section title="Synthèse">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
          <span>Cette formation a-t-elle répondu à vos attentes ?</span>
          {["OUI", "PARTIELLEMENT", "NON"].map((opt) => (
            <label key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                name="reponduAttentes"
                checked={vals.reponduAttentes === opt}
                onChange={() =>
                  setVals((s: any) => ({ ...s, reponduAttentes: opt }))
                }
                className="accent-black"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Compléments & Témoignage */}
      <Section title="Compléments & Témoignage">
        <textarea
          className="w-full border rounded-xl p-2"
          placeholder="Formations complémentaires ?"
          value={vals.formationsComplementaires}
          onChange={(e) =>
            setVals((s: any) => ({
              ...s,
              formationsComplementaires: e.target.value,
            }))
          }
        />
        <textarea
          className="w-full border rounded-xl p-2"
          placeholder="Votre témoignage"
          value={vals.temoignage}
          onChange={(e) =>
            setVals((s: any) => ({ ...s, temoignage: e.target.value }))
          }
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={vals.consentementTemoignage}
            onChange={(e) =>
              setVals((s: any) => ({
                ...s,
                consentementTemoignage: e.target.checked,
              }))
            }
            className="accent-black"
          />
          <span>J'autorise la publication de mon témoignage</span>
        </label>
      </Section>

      <button
        className="px-4 py-2 rounded-2xl border shadow bg-black text-white"
        disabled={loading}
        onClick={send}
      >
        Envoyer
      </button>
    </div>
  );
}
