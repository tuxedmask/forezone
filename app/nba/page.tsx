export default function NbaPage() {
  return (
    <main className="min-h-screen bg-[#070914] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          NBA Section
        </div>

        <h1 className="text-4xl font-semibold tracking-tight">NBA Hub</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          This is where your NBA slate, submit pick card, recent picks, and NBA
          leaderboard preview will go.
        </p>
      </div>
    </main>
  );
}