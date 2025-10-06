"use client";
import { useState } from "react";

// En-têtes visibles au-dessus des colonnes (desktop)
const ScaleHeader = () => (
  <div className="hidden md:grid grid-cols-5 gap-2 text-xs text-neutral-600 mb-2">
    <div />{/* colonne du libellé */}
    <div className="text-center">Très bien (4)</div>
    <div className="text-center">Bien (3)</div>
    <div className="text-center">Passable (2)</div>
    <div className="text-center">Mauvais (1)</div>
  </div>
);

// Une ligne question + radios alignées sous les bonnes colonnes
function RadioRow({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3 py-1">
      {/* Libellé (colonne 1) */}
      <div className="md:col-span-1">{label}</div>

      {/* Colonnes 4,3,2,1 */}
      {[4, 3, 2, 1].map((v) => (
        <div
          key={v}
          className="flex items-center justify-start md:justify-center gap-2"
        >
          <input
            type="radio"
            name={name}
            checked={value === v}
            onChange={() => onChange(v)}
            className="accent-black"
            aria-label={
              v === 4
                ? "Très bien (4)"
                : v === 3
                ? "Bien (3)"
                : v === 2
                ? "Passable (2)"
                : "Mauvais (1)"
            }
          />
          {/* En mobile on montre le libellé à côté de la radio */}
          <span className="text-xs md:hidden">
            {v === 4
              ? "Très bien (4)"
              : v === 3
              ? "Bien (3)"
              : v === 2
              ? "Passable (2)"
              : "Mauvais (1)"}
          </span>
        </div>
      ))}
    </div>
  );
}

const Section = ({ title, children }: any) => (
  <section className="border rounded-2xl p-4 space-y-3 bg-white">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

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
              setVals((s: any) => ({
                ...s,
                participantPrenoms: e.target.value,
              }))
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

      {/* I. L’environnement de la formation */}
      <Section title="I. L’environnement de la formation">
        <ScaleHeader />
        <RadioRow
          label="1. Comment avez-vous trouvé l’Accueil ?"
          name="envAccueil"
          value={vals.envAccueil}
          onChange={(v) => setVals((s: any) => ({ ...s, envAccueil: v }))}
        />
        <RadioRow
          label="2. Comment avez-vous trouvé le(s) lieu(x) de formation ?"
          name="envLieu"
          value={vals.envLieu}
          onChange={(v) => setVals((s: any) => ({ ...s, envLieu: v }))}
        />
        <RadioRow
          label="3. Comment avez-vous trouvé le matériel mis à disposition ?"
          name="envMateriel"
          value={vals.envMateriel}
          onChange={(v) => setVals((s: any) => ({ ...s, envMateriel: v }))}
        />
        <textarea
          className="w-full border rounded-xl p-2"
          placeholder="Vos propositions d’amélioration"
          value={vals.envAmeliorations}
          onChange={(e) =>
            setVals((s: any) => ({
              ...s,
              envAmeliorations: e.target.value,
            }))
          }
        />
      </Section>

      {/* II. Le contenu de la formation */}
      <Section title="II. Le contenu de la formation">
        <ScaleHeader />
        <RadioRow
          label="1. Le contenu couvre-t-il vos attentes ?"
          name="contAttentes"
          value={vals.contAttentes}
          onChange={(v) => setVals((s: any) => ({ ...s, contAttentes: v }))}
        />
        <RadioRow
          label="2. Le contenu est-il utile pour votre travail ?"
          name="contUtiliteTravail"
          value={vals.contUtiliteTravail}
          onChange={(v) =>
            setVals((s: any) => ({ ...s, contUtiliteTravail: v }))
          }
        />
        <RadioRow
          label="3. Comment avez-vous trouvé les exercices / exemples / vidéos ?"
          name="contExercices"
          value={vals.contExercices}
          onChange={(v) => setVals((s: any) => ({ ...s, contExercices: v }))}
        />
        <RadioRow
          label="4. Comment avez-vous trouvé la méthodologie utilisée pour la formation ?"
          name="contMethodologie"
          value={vals.contMethodologie}
          onChange={(v) =>
            setVals((s: any) => ({ ...s, contMethodologie: v }))
          }
        />
        <RadioRow
          label="5. Comment avez-vous trouvé les supports de la formation ?"
          name="contSupports"
          value={vals.contSupports}
          onChange={(v) => setVals((s: any) => ({ ...s, contSupports: v }))}
        />
        <RadioRow
          label="6. Comment avez-vous trouvé le rythme de la formation ?"
          name="contRythme"
          value={vals.contRythme}
          onChange={(v) => setVals((s: any) => ({ ...s, contRythme: v }))}
        />
        <RadioRow
          label="7. Évaluation globale de la formation"
          name="contGlobal"
          value={vals.contGlobal}
          onChange={(v) => setVals((s: any) => ({ ...s, contGlobal: v }))}
        />
      </Section>

      {/* III. Le(s) formateur(s) */}
      <Section title="III. Le(s) formateur(s)">
        <ScaleHeader />
        <RadioRow
          label="1. Maîtrise du sujet"
          name="formMaitrise"
          value={vals.formMaitrise}
          onChange={(v) => setVals((s: any) => ({ ...s, formMaitrise: v }))}
        />
        <RadioRow
          label="2. Qualité de communication"
          name="formCommunication"
          value={vals.formCommunication}
          onChange={(v) =>
            setVals((s: any) => ({ ...s, formCommunication: v }))
          }
        />
        <RadioRow
          label="3. Clarté des réponses aux questions"
          name="formClarte"
          value={vals.formClarte}
          onChange={(v) => setVals((s: any) => ({ ...s, formClarte: v }))}
        />
        <RadioRow
          label="4. Maîtrise de la méthodologie de la formation"
          name="formMethodo"
          value={vals.formMethodo}
          onChange={(v) => setVals((s: any) => ({ ...s, formMethodo: v }))}
        />
        <RadioRow
          label="5. Évaluation globale du formateur"
          name="formGlobal"
          value={vals.formGlobal}
          onChange={(v) => setVals((s: any) => ({ ...s, formGlobal: v }))}
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
          <span>J’autorise la publication de mon témoignage</span>
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
