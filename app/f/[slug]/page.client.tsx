// app/f/[slug]/page.client.tsx
"use client";

import FormClient from "../../components/FormClient";

type Props = {
  form: any;
  serverLang: "fr" | "en";
};

export default function ClientPublicForm({ form, serverLang }: Props) {
  // ⚠️ Aucun fetch, aucun state, aucun useEffect
  // Le composant FormClient reçoit toujours les mêmes props → il ne se remonte plus.
  return <FormClient form={form} lang={serverLang} />;
}
