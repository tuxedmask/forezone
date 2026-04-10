"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AliasCard({
  currentAlias,
  fallbackName,
  compact = false,
  onSaved,
}: {
  currentAlias: string | null;
  fallbackName: string;
  compact?: boolean;
  onSaved?: () => void;
}) {
  const router = useRouter();

  const [alias, setAlias] = useState(currentAlias ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveAlias() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const res = await fetch("/api/profile/alias", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alias }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update alias.");
      }

      setMessage("Alias updated.");
      router.refresh();

      if (onSaved) {
        setTimeout(() => onSaved(), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#120f1d,#0e0b18)] p-4 shadow-[0_0_18px_rgba(0,0,0,0.12)]"
          : "mt-6 rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#120f1d,#0e0b18)] p-4 shadow-[0_0_18px_rgba(0,0,0,0.12)]"
      }
    >
      {!compact ? (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
            Display Name
          </div>

          <p className="mt-2 text-sm text-[#c7c3da]">
            Choose the name shown on your profile, picks, and leaderboard.
          </p>
        </>
      ) : null}

      <div className="rounded-xl border border-[#31294c] bg-[#0d0a17] px-4 py-3 text-sm text-[#c7c3da]">
        Current:{" "}
        <span className="font-semibold text-white">
          {currentAlias || fallbackName}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Enter your alias"
          maxLength={24}
          className="rounded-xl border border-[#31294c] bg-[#0d0a17] px-4 py-3 text-white outline-none placeholder:text-[#7f78a8]"
        />

        <button
          type="button"
          onClick={saveAlias}
          disabled={saving}
          className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Alias"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 text-sm text-emerald-300">{message}</div>
      ) : null}

      {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
    </div>
  );
}