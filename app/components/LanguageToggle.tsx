"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("lang") === "en" ? "en" : "fr";

  const toggle = () => {
    const newLang = current === "fr" ? "en" : "fr";
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", newLang);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
    >
      <span className="text-lg">🌐</span>
      {current === "fr" ? "English" : "Français"}
    </button>
  );
}
