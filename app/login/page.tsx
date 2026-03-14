"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </main>
    );
  }

  if (session) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
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
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 28,
              background: "linear-gradient(180deg, #151127, #0d0a17)",
              padding: 36,
              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "rgba(99,102,241,0.14)",
                filter: "blur(20px)",
              }}
            />

            <p
              style={{
                color: "#9f96c7",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontSize: "12px",
                marginBottom: "12px",
                position: "relative",
              }}
            >
              Welcome to Fore Zone
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
                position: "relative",
              }}
            >
              <Image
                src="/forezone-logo.png"
                alt="Fore Zone"
                width={38}
                height={38}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#eef2ff",
                }}
              >
                Fore Zone
              </span>
            </div>

            <h1
              style={{
                fontSize: "54px",
                lineHeight: 1.05,
                marginTop: 0,
                marginBottom: 16,
                maxWidth: 620,
                position: "relative",
              }}
            >
              Daily picks.
              <br />
              Live board.
              <br />
              Real competition.
            </h1>

            <p
              style={{
                color: "#c7c3da",
                fontSize: 18,
                lineHeight: 1.65,
                maxWidth: 640,
                marginBottom: 28,
                position: "relative",
              }}
            >
              Log in with Discord or Twitch to submit your NBA pick of the day,
              track the NoLs board, and climb the leaderboard.
            </p>

            <div
              style={{
                display: "grid",
                gap: 14,
                maxWidth: 560,
                position: "relative",
              }}
            >
              {[
                "One pick per day",
                "Live public board and leaderboard",
                "Edit or delete your pick until game start",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid #31294c",
                    background: "rgba(17,15,27,0.82)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(99,102,241,0.16)",
                      color: "#c7d2fe",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "#e5e7eb", fontWeight: 600 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 28,
              background: "linear-gradient(180deg, #131021, #0b0914)",
              padding: 32,
              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  color: "#9f96c7",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontSize: "12px",
                  marginBottom: 10,
                }}
              >
                Sign in
              </p>

              <h2
                style={{
                  fontSize: 34,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                Choose your account
              </h2>

              <p
                style={{
                  color: "#c7c3da",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Use the account you want tied to your Fore Zone profile.
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <button
                type="button"
                onClick={() => signIn("discord", { callbackUrl: "/" })}
                style={{
                  width: "100%",
                  padding: "15px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(129,140,248,0.32)",
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.22), rgba(99,102,241,0.12))",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(99,102,241,0.16)",
                }}
              >
                Continue with Discord
              </button>

              <button
                type="button"
                onClick={() => signIn("twitch", { callbackUrl: "/" })}
                style={{
                  width: "100%",
                  padding: "15px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(168,85,247,0.28)",
                  background:
                    "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.10))",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(168,85,247,0.14)",
                }}
              >
                Continue with Twitch
              </button>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid #31294c",
                background: "#110f1b",
                color: "#9f96c7",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Your sign-in is used for your profile, daily picks, and leaderboard
              progress.
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 920px) {
          section > div {
            grid-template-columns: 1fr !important;
          }

          h1 {
            font-size: 42px !important;
          }
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 36px !important;
          }
        }
      `}</style>
    </main>
  );
}