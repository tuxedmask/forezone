"use client";

import { useEffect, useState } from "react";

type Match = {
  id: number;
  home: string;
  away: string;
  kickoff: string;
};

export default function SoccerAdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<
    Record<string, { home: string; away: string }>
  >({});
  const [matchweek, setMatchweek] = useState("Week 33");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
     const res = await fetch(
  `/api/soccer/predictions/premier-league/matchweek?matchweek=${matchweek}`
);
if (!res.ok) {
  console.error("Failed to load matches");
  return;
}
      const data = await res.json();
      setMatches(data.matches || []);
    }

    load();
  }, [matchweek]);

  function updateScore(matchId: number, side: "home" | "away", value: string) {
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value,
      },
    }));
  }

  async function handleGrade() {
    console.log("MATCHES:", matches);

    const payload = {
      leagueSlug: "premier-league",
      matchweekLabel: matchweek,
      results: matches.map((m) => ({
        match_id: String(m.id),
        actual_home_score: Number(results[m.id]?.home || 0),
        actual_away_score: Number(results[m.id]?.away || 0),
      })),
    };

    const res = await fetch("/api/soccer/predictions/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    setLoading(false);

    if (data.error) {
      alert(data.error);
    } else {
      alert("Grading complete 🔥");
    }
  }

  return (
    <div className="min-h-screen bg-[#05070f] text-white p-8">
      <h1 className="text-4xl font-black mb-6">
        Soccer Admin Grading
      </h1>

      {/* Matchweek Selector */}
      <div className="mb-6">
        <input
          value={matchweek}
          onChange={(e) => setMatchweek(e.target.value)}
          className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl"
        />
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="w-1/3 font-semibold">
              {m.home} vs {m.away}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0"
                value={results[m.id]?.home || ""}
                onChange={(e) =>
                  updateScore(m.id, "home", e.target.value)
                }
                className="w-16 text-center bg-black/40 rounded-lg p-2"
              />

              <span>-</span>

              <input
                type="number"
                placeholder="0"
                value={results[m.id]?.away || ""}
                onChange={(e) =>
                  updateScore(m.id, "away", e.target.value)
                }
                className="w-16 text-center bg-black/40 rounded-lg p-2"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Grade Button */}
      <button
        onClick={handleGrade}
        disabled={loading}
        className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold"
      >
        {loading ? "Grading..." : "Grade Matches"}
      </button>
    </div>
  );
}