"use client";
import { useState } from "react";
const likert = [4,3,2,1];

export default function FormClient({ form }: { form: any }) {
  const [loading, setLoading] = useState(false);
  const [vals, setVals] = useState<any>({
    participantNom: "", participantPrenoms: "", participantFonction: "", participantEntreprise: "",
    envAccueil: 4, envLieu: 4, envMateriel: 4, envAmeliorations: "",
    contAttentes: 4, contUtiliteTravail: 4, contExercices: 4, contMethodologie: 4, contSupports: 4, contRythme: 4, contGlobal: 4,
    formMaitrise: 4, formCommunication: 4, formClarte: 4, formMethodo: 4, formGlobal: 4,
    reponduAttentes: "OUI",
    formationsComplementaires: "", temoignage: "", consentementTemoignage: false
  });

  const send = async () => {
    setLoading(true);
    await fetch(`/api/forms/${form.id}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(vals) });
    setLoading(false);
    alert("Merci pour votre retour !");
  };

  const Section = ({ title, children }: any) => (<section className="border rounded-2xl p-4 space-y-3 bg-white"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>);
  const RadioRow = ({ label, name }: { label: string; name: string }) => (
    <div className="grid grid-cols-2 md:grid-cols-6 items-center gap-2">
      <div className="col-span-2 md:col-span-2">{label}</div>
      {likert.map(v => (
        <label key={v} className="flex items-center gap-2 justify-center">
          <input type="radio" name={name} checked={vals[name]===v} onChange={()=>setVals((s:any)=>({...s,[name]:v}))} />
          <span className="text-sm">{v}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-sm">Formateur : {form.trainerName} • Date : {new Date(form.sessionDate).toLocaleDateString()} • Lieu : {form.location}</p>
      </header>
      <Section title="Participant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded-xl p-2" placeholder="Nom" value={vals.participantNom} onChange={e=>setVals((s:any)=>({...s,participantNom:e.target.value}))}/>
          <input className="border rounded-xl p-2" placeholder="Prénoms" value={vals.participantPrenoms} onChange={e=>setVals((s:any)=>({...s,participantPrenoms:e.target.value}))}/>
          <input className="border rounded-xl p-2" placeholder="Fonction" value={vals.participantFonction} onChange={e=>setVals((s:any)=>({...s,participantFonction:e.target.value}))}/>
          <input className="border rounded-xl p-2" placeholder="Entreprise" value={vals.participantEntreprise} onChange={e=>setVals((s:any)=>({...s,participantEntreprise:e.target.value}))}/>
        </div>
      </Section>
      <Section title="I. Environnement (4→1)">
        <RadioRow label="Accueil" name="envAccueil" />
        <RadioRow label="Lieu(x)" name="envLieu" />
        <RadioRow label="Matériel" name="envMateriel" />
        <textarea className="w-full border rounded-xl p-2" placeholder="Vos propositions d'amélioration" value={vals.envAmeliorations} onChange={e=>setVals((s:any)=>({...s,envAmeliorations:e.target.value}))} />
      </Section>
      <Section title="II. Contenu (4→1)">
        <RadioRow label="Couvre vos attentes" name="contAttentes" />
        <RadioRow label="Utile pour votre travail" name="contUtiliteTravail" />
        <RadioRow label="Exercices / exemples / vidéos" name="contExercices" />
        <RadioRow label="Méthodologie" name="contMethodologie" />
        <RadioRow label="Supports" name="contSupports" />
        <RadioRow label="Rythme" name="contRythme" />
        <RadioRow label="Évaluation globale" name="contGlobal" />
      </Section>
      <Section title="III. Formateur(s) (4→1)">
        <RadioRow label="Maîtrise du sujet" name="formMaitrise" />
        <RadioRow label="Communication" name="formCommunication" />
        <RadioRow label="Clarté des réponses" name="formClarte" />
        <RadioRow label="Méthodologie de formation" name="formMethodo" />
        <RadioRow label="Évaluation globale" name="formGlobal" />
      </Section>
      <Section title="Synthèse">
        <div className="flex gap-6 items-center">
          <span>Cette formation a-t-elle répondu à vos attentes ?</span>
          {["OUI","PARTIELLEMENT","NON"].map((opt)=> (
            <label key={opt} className="flex items-center gap-2">
              <input type="radio" name="reponduAttentes" checked={vals.reponduAttentes===opt} onChange={()=>setVals((s:any)=>({...s,reponduAttentes:opt}))} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </Section>
      <Section title="Compléments & Témoignage">
        <textarea className="w-full border rounded-xl p-2" placeholder="Formations complémentaires ?" value={vals.formationsComplementaires} onChange={e=>setVals((s:any)=>({...s,formationsComplementaires:e.target.value}))} />
        <textarea className="w-full border rounded-xl p-2" placeholder="Votre témoignage" value={vals.temoignage} onChange={e=>setVals((s:any)=>({...s,temoignage:e.target.value}))} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={vals.consentementTemoignage} onChange={e=>setVals((s:any)=>({...s,consentementTemoignage:e.target.checked}))} />
          <span>J'autorise la publication de mon témoignage</span>
        </label>
      </Section>
      <button className="px-4 py-2 rounded-2xl border shadow bg-black text-white" disabled={loading} onClick={send}>Envoyer</button>
    </div>
  );
}
