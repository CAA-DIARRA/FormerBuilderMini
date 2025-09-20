import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { formId: string } }) {
  const r = await prisma.response.findMany({ where: { formId: params.formId } });
  const keys = [
    "envAccueil","envLieu","envMateriel",
    "contAttentes","contUtiliteTravail","contExercices","contMethodologie","contSupports","contRythme","contGlobal",
    "formMaitrise","formCommunication","formClarte","formMethodo","formGlobal"
  ] as const;
  const avg = Object.fromEntries(keys.map((k:any) => {
    const vals = r.map((x:any)=> x[k]).filter((v:any)=> typeof v === "number");
    const mean = vals.length ? vals.reduce((s:number,v:number)=>s+v,0)/vals.length : 0;
    return [k, Number(mean.toFixed(2))];
  }));
  return new Response(JSON.stringify({ count: r.length, avg }), { headers: { "content-type": "application/json" } });
}
