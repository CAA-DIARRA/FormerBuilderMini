import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Builder",
  description: "Collecte d'évaluations de formation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50">{children}</body>
    </html>
  );
}
