"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type LinkedAccount = {
  provider: "discord" | "twitch";
  email: string | null;
};

type Props = {
  accounts: LinkedAccount[];
};

function AccountRow({
  title,
  subtitle,
  linked,
  loading,
  onClick,
}: {
  title: string;
  subtitle: string;
  linked: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#2e2750] bg-[linear-gradient(180deg,#151127,#100c1d)] px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="mt-1 truncate text-xs text-[#a79fcf]">{subtitle}</p>
        </div>

        {linked ? (
          <div className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            Linked
          </div>
        ) : (
          <button
            onClick={onClick}
            disabled={loading}
            className="shrink-0 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connecting..." : `Link ${title}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LinkAccountsCard({ accounts }: Props) {
  const [loading, setLoading] = useState<"discord" | "twitch" | null>(null);

  const discordAccount = accounts.find((a) => a.provider === "discord");
  const twitchAccount = accounts.find((a) => a.provider === "twitch");

  const discordLinked = !!discordAccount;
  const twitchLinked = !!twitchAccount;

  async function startLink(provider: "discord" | "twitch") {
    if (
      (provider === "discord" && discordLinked) ||
      (provider === "twitch" && twitchLinked)
    ) {
      return;
    }

    try {
      setLoading(provider);

      const res = await fetch("/api/account-link/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start linking");
        setLoading(null);
        return;
      }

      await signIn(provider, {
        callbackUrl: "/profile",
      });
    } catch (error) {
      console.error("startLink error:", error);
      alert("Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#131021,#0d0a19)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b3a9df]">
          Linked Accounts
        </h3>
        <p className="mt-2 text-sm text-[#c7c3da]">
          Connect both accounts so you can log in with either Discord or Twitch.
        </p>
      </div>

      <div className="space-y-3">
        <AccountRow
          title="Discord"
          linked={discordLinked}
          loading={loading === "discord"}
          subtitle={
            discordLinked
              ? discordAccount?.email || "Discord account linked"
              : "Use your Discord login for this Fore Zone account"
          }
          onClick={() => startLink("discord")}
        />

        <AccountRow
          title="Twitch"
          linked={twitchLinked}
          loading={loading === "twitch"}
          subtitle={
            twitchLinked
              ? twitchAccount?.email || "Twitch account linked"
              : "Use your Twitch login for this Fore Zone account"
          }
          onClick={() => startLink("twitch")}
        />
      </div>
    </div>
  );
}