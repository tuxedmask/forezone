"use client";

import { useState } from "react";

export default function AutoGradeSoccerButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleAutoGrade() {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const res = await fetch("/api/soccer/auto-grade", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to auto grade");
      }

      setMessage(
        `Done. Graded ${data.gradedCount} picks across ${data.matchesChecked} matches.`
      );
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Soccer Auto Grading
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Pull finished match scores and automatically grade ungraded picks.
          </p>
        </div>

        <button
          onClick={handleAutoGrade}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Auto Grading..." : "Auto Grade Soccer Picks"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}