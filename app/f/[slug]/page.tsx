// app/f/[slug]/page.tsx
import ClientFormPage from "./page.client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function PublicFormPage({ params }: { params: { slug: string } }) {
  return <ClientFormPage slug={params.slug} />;
}
