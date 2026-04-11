"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const authError =
    typeof searchParams?.error === "string" ? searchParams.error : null;

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </main>
    );
  }

  if (session) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
        color: "white",
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "64px 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 28,
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 28,
              background: "linear-gradient(180deg, #151127, #0d0a17)",
              padding: 36,
            }}
          >
            <h1 style={{ fontSize: 48, marginBottom: 16 }}>
              Daily picks.
              <br />
              Live board.
              <br />
              Real competition.
            </h1>

            <p style={{ color: "#c7c3da", fontSize: 18 }}>
              Log in with Discord or Twitch to submit picks and climb the
              leaderboard.
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 28,
              background: "linear-gradient(180deg, #131021, #0b0914)",
              padding: 32,
            }}
          >
            <h2 style={{ fontSize: 30, marginBottom: 10 }}>
              Choose your account
            </h2>

            {/* ERROR MESSAGE */}
            {authError === "twitch" && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(239,68,68,0.28)",
                  background: "rgba(127,29,29,0.18)",
                  color: "#fecaca",
                  fontSize: 14,
                }}
              >
                Twitch sign-in was blocked. Try again or open Fore Zone in an
                incognito window.
              </div>
            )}

            <div style={{ display: "grid", gap: 14 }}>
              {/* DISCORD */}
              <button
                onClick={() => signIn("discord", { callbackUrl: "/" })}
                style={{
                  padding: "15px",
                  borderRadius: 16,
                  border: "1px solid #6366f1",
                  background: "#6366f1",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue with Discord
              </button>

              {/* TWITCH (DIRECT LINK — MOST RELIABLE) */}
              <a
                href="/api/auth/signin/twitch?callbackUrl=https%3A%2F%2Fforezone.vercel.app%2F"
                style={{
                  padding: "15px",
                  borderRadius: 16,
                  border: "1px solid #a855f7",
                  background: "#7c3aed",
                  color: "white",
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Continue with Twitch
              </a>

              {/* GOOGLE */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                style={{
                  padding: "15px",
                  borderRadius: 16,
                  border: "1px solid #22c55e",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}