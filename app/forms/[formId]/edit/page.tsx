"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(3, "Intitulé trop court"),
  trainerName: z.string().min(2, "Nom du formateur requis"),
  sessionDate: z.string().min(1, "Date requise"),
  location: z.string().min(2, "Lieu requis"),
});
type Input = z.infer<typeof Schema>;

export default function EditFormPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const [input, setInput] = useState<Input>({ title: "", trainerName: "", sessionDate: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { (async () => {
    const res = await fetch(`/api/forms/${params.formId}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const { form } = await res.json();
    const isoDate = form.sessionDate?.slice(0,10) ?? "";
    setInput({ title: form.title || "", trainerName: form.trainerName || "", sessionDate: isoDate, location: form.location || "" });
    setLoading(false);
  })(); }, [params.formId, router]);

  const submit = async () => {
    setErrors({});
    const parsed = Schema.safeParse(input);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach(i => { e[i.path[0] as string] = i.message; });
      setErrors(e); return;
    }
    setSaving(true);
    const res = await fetch(`/api/forms/${params.formId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    setSaving(false);
    if (!res.ok) { alert("Échec de l'enregistrement"); return; }
    router.push(`/dashboard/forms/${params.formId}`);
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-xl mx-auto bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Éditer le formulaire</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Intitulé de la formation</label>
            <input className="w-full border rounded-xl p-2" value={input.title} onChange={e=>setInput(s=>({ ...s, title: e.target.value }))} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Formateur</label>
            <input className="w-full border rounded-xl p-2" value={input.trainerName} onChange={e=>setInput(s=>({ ...s, trainerName: e.target.value }))} />
            {errors.trainerName && <p className="text-sm text-red-600 mt-1">{errors.trainerName}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" className="w-full border rounded-xl p-2" value={input.sessionDate} onChange={e=>setInput(s=>({ ...s, sessionDate: e.target.value }))} />
              {errors.sessionDate && <p className="text-sm text-red-600 mt-1">{errors.sessionDate}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Lieu</label>
              <input className="w-full border rounded-xl p-2" value={input.location} onChange={e=>setInput(s=>({ ...s, location: e.target.value }))} />
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 rounded-xl border" onClick={()=>router.back()}>Annuler</button>
            <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={submit} disabled={saving}>{saving?"Enregistrement…":"Enregistrer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
