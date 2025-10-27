"use client";

export type Lang = "fr" | "en";

type Props = {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
};

export default function LanguageToggle({ value, onChange, className }: Props) {
  return (
    <div className={className}>
      <div className="inline-flex rounded-xl border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange("fr")}
          className={`px-3 py-1.5 text-sm ${
            value === "fr" ? "bg-black text-white" : "bg-white hover:bg-neutral-50"
          }`}
          aria-pressed={value === "fr"}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => onChange("en")}
          className={`px-3 py-1.5 text-sm border-l ${
            value === "en" ? "bg-black text-white" : "bg-white hover:bg-neutral-50"
          }`}
          aria-pressed={value === "en"}
        >
          EN
        </button>
      </div>
    </div>
  );
}
