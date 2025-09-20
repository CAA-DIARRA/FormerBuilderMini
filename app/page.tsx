export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold">Form Builder — Évaluations de formation</h1>
        <p className="text-neutral-600">Créez un formulaire, partagez, collectez, exportez.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/dashboard" className="px-4 py-2 rounded-xl bg-black text-white">Aller au Dashboard</a>
          <a href="/forms/new" className="px-4 py-2 rounded-xl border">Créer un formulaire</a>
        </div>
      </div>
    </main>
  );
}
