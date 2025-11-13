// app/f/[slug]/page.client.tsx
"use client";

import FormClient from "../../components/FormClient";

type Props = {
  form: any;
  serverLang: "fr" | "en";
};

export default function ClientPublicForm({ form, serverLang }: Props) {
  // Pas de fetch, pas d'effet → jamais recréé → saisie stable
  return <FormClient form={form} lang={serverLang} />;
}
