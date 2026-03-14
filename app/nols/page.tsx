"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getNBALogo } from "@/lib/nbaTeams";

type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
};

type Pick = {
  id: number;
  user_id: string;
  user_name: string;
  user_image: string | null;
  game_id: string;
  away_team: string;
  home_team: string;
  commence_time: string;
  pick_type?: string | null;
  prop: string;
  american_odds: string;
  decimal_odds: string;
  bookie: string;
  created_at: string;
  result?: "win" | "loss" | "pending" | null;
};

function formatGameTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function formatSubmittedTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function hasGameStarted(dateString: string) {
  return new Date(dateString).getTime() <= Date.now();
}

function formatPickType(pickType?: string | null) {
  switch (pickType) {
    case "moneyline":
      return "Moneyline";
    case "spread":
      return "Spread";
    case "total":
      return "Total";
    case "player_prop":
      return "Player Prop";
    default:
      return "Pick";
  }
}

function TeamLogo({ team }: { team: string }) {
  const src = getNBALogo(team);

  if (!src) {
    return (
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "#1a1630",
          border: "1px solid #31294c",
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={team}
      width={38}
      height={38}
      unoptimized
      style={{ objectFit: "contain" }}
    />
  );
}

function resultColor(result?: string | null) {
  if (result === "win") return "#4ade80";
  if (result === "loss") return "#fca5a5";
  return "#c7c3da";
}

function resultLabel(result?: string | null) {
  if (result === "win") return "WIN";
  if (result === "loss") return "LOSS";
  return "PENDING";
}

function getPickTypeBadge(pickType?: string | null) {
  switch (pickType) {
    case "moneyline":
      return {
        border: "1px solid rgba(129,140,248,0.30)",
        background: "rgba(99,102,241,0.14)",
        color: "#c7d2fe",
      };
    case "spread":
      return {
        border: "1px solid rgba(168,85,247,0.28)",
        background: "rgba(168,85,247,0.14)",
        color: "#e9d5ff",
      };
    case "total":
      return {
        border: "1px solid rgba(245,158,11,0.28)",
        background: "rgba(245,158,11,0.12)",
        color: "#fde68a",
      };
    case "player_prop":
      return {
        border: "1px solid rgba(34,197,94,0.24)",
        background: "rgba(34,197,94,0.12)",
        color: "#bbf7d0",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        color: "#d4d4d8",
      };
  }
}

function getPickCardStyle(result?: string | null) {
  if (result === "win") {
    return {
      border: "1px solid rgba(74, 222, 128, 0.38)",
      background: "linear-gradient(180deg, #101a14, #0d1310)",
      boxShadow:
        "0 0 0 1px rgba(74,222,128,0.08), 0 0 18px rgba(74,222,128,0.14)",
    };
  }

  if (result === "loss") {
    return {
      border: "1px solid rgba(252, 165, 165, 0.24)",
      background: "linear-gradient(180deg, #181012, #120c0d)",
      boxShadow: "0 0 16px rgba(252,165,165,0.06)",
    };
  }

  return {
    border: "1px solid #31294c",
    background: "#110f1b",
    boxShadow: "none",
  };
}

function getGameCardStyle(winCount: number, lossCount: number) {
  if (winCount > lossCount && winCount > 0) {
    return {
      border: "1px solid rgba(74, 222, 128, 0.24)",
      background: "linear-gradient(180deg, #131d17, #0b0f0d)",
      boxShadow: "0 0 18px rgba(74,222,128,0.08)",
    };
  }

  if (lossCount > winCount && lossCount > 0) {
    return {
      border: "1px solid rgba(252, 165, 165, 0.20)",
      background: "linear-gradient(180deg, #171113, #0b0910)",
      boxShadow: "0 0 16px rgba(252,165,165,0.05)",
    };
  }

  return {
    border: "1px solid #31294c",
    background: "linear-gradient(180deg, #131021, #0b0914)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  };
}

export default function NoLsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setError("");

        const [gamesRes, picksRes] = await Promise.all([
          fetch("/api/nba-games", { cache: "no-store" }),
          fetch("/api/daily-picks", { cache: "no-store" }),
        ]);

        const gamesData = await gamesRes.json();
        const picksData = await picksRes.json();

        if (!gamesRes.ok) {
          throw new Error(gamesData.error || "Failed to load games");
        }

        if (!picksRes.ok) {
          throw new Error(picksData.error || "Failed to load picks");
        }

        if (!mounted) return;

        setGames(Array.isArray(gamesData) ? gamesData : []);
        setPicks(Array.isArray(picksData) ? picksData : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load board");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    const interval = setInterval(loadData, 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const allPicksSorted = useMemo(() => {
    return [...picks].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [picks]);

  const picksByGame = useMemo(() => {
    const map = new Map<string, Pick[]>();

    for (const pick of picks) {
      const arr = map.get(pick.game_id) ?? [];
      arr.push(pick);
      map.set(pick.game_id, arr);
    }

    for (const [gameId, arr] of map.entries()) {
      arr.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      map.set(gameId, arr);
    }

    return map;
  }, [picks]);

  if (loading) {
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
            padding: "56px 24px 80px",
          }}
        >
          <p style={{ color: "#c7c3da" }}>Loading board...</p>
        </section>
      </main>
    );
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
          padding: "56px 24px 80px",
        }}
      >
        <p
          style={{
            color: "#9f96c7",
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          Daily board
        </p>

        <h1 style={{ fontSize: "44px", marginTop: 0, marginBottom: 12 }}>
          NoLs
        </h1>

        <p style={{ color: "#c7c3da", marginBottom: 10 }}>
          Fore Zone daily slate and all submitted picks.
        </p>

        <p style={{ color: "#9f96c7", fontSize: 14, marginBottom: 32 }}>
          Slate resets daily at 2:00 AM ET. Started and finished games stay visible.
        </p>

        {error && <p style={{ color: "#fca5a5", marginBottom: 24 }}>{error}</p>}

        {!error && (
          <>
            <div
              style={{
                border: "1px solid #31294c",
                borderRadius: 22,
                background: "linear-gradient(180deg, #131021, #0b0914)",
                padding: 22,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                marginBottom: 24,
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>All Picks Today</h2>

              {allPicksSorted.length === 0 ? (
                <div style={{ color: "#9f96c7" }}>No picks submitted yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {allPicksSorted.map((pick, index) => {
                    const pickCardStyle = getPickCardStyle(pick.result);
                    const pickTypeBadge = getPickTypeBadge(pick.pick_type);

                    return (
                      <div
                        key={pick.id}
                        style={{
                          border: pickCardStyle.border,
                          borderRadius: 16,
                          background: pickCardStyle.background,
                          boxShadow: pickCardStyle.boxShadow,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            alignItems: "center",
                            marginBottom: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                minWidth: 26,
                                height: 26,
                                borderRadius: 999,
                                background: "#1a1630",
                                border: "1px solid #31294c",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: "#d6d3e6",
                                fontWeight: 700,
                              }}
                            >
                              {index + 1}
                            </div>

                            {pick.user_image ? (
                              <Image
                                src={pick.user_image}
                                alt={pick.user_name}
                                width={34}
                                height={34}
                                unoptimized
                                style={{ borderRadius: "999px", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "999px",
                                  background: "#1a1630",
                                  border: "1px solid #31294c",
                                }}
                              />
                            )}

                            <div>
                              <div style={{ fontWeight: 700 }}>{pick.user_name}</div>
                              <div style={{ fontSize: 12, color: "#9f96c7" }}>
                                Submitted {formatSubmittedTime(pick.created_at)}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                ...pickTypeBadge,
                              }}
                            >
                              {formatPickType(pick.pick_type)}
                            </span>

                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: resultColor(pick.result),
                                letterSpacing: "1px",
                              }}
                            >
                              {resultLabel(pick.result)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                          <div>
                            <span style={{ color: "#9f96c7" }}>Game: </span>
                            <span>
                              {pick.away_team} vs {pick.home_team}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#9f96c7" }}>Prop: </span>
                            <span>{pick.prop}</span>
                          </div>
                          <div>
                            <span style={{ color: "#9f96c7" }}>Odds: </span>
                            <span>
                              {pick.american_odds} ({pick.decimal_odds})
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#9f96c7" }}>Bookie: </span>
                            <span>{pick.bookie}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {games.length === 0 && (
              <div
                style={{
                  border: "1px solid #31294c",
                  borderRadius: 22,
                  background: "linear-gradient(180deg, #131021, #0b0914)",
                  padding: 22,
                  color: "#9f96c7",
                }}
              >
                No games found for the current slate.
              </div>
            )}

            {games.length > 0 && (
              <div style={{ display: "grid", gap: 20 }}>
                {games.map((game) => {
                  const gamePicks = picksByGame.get(game.id) ?? [];
                  const started = hasGameStarted(game.commence_time);

                  const winCount = gamePicks.filter(
                    (pick) => pick.result === "win"
                  ).length;

                  const lossCount = gamePicks.filter(
                    (pick) => pick.result === "loss"
                  ).length;

                  const pendingCount = gamePicks.filter(
                    (pick) => !pick.result || pick.result === "pending"
                  ).length;

                  const gameCardStyle = getGameCardStyle(winCount, lossCount);

                  return (
                    <div
                      key={game.id}
                      style={{
                        border: gameCardStyle.border,
                        borderRadius: 22,
                        background: gameCardStyle.background,
                        boxShadow: gameCardStyle.boxShadow,
                        padding: 22,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 20,
                          alignItems: "center",
                          marginBottom: 18,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <TeamLogo team={game.away_team} />
                            <span style={{ fontWeight: 700 }}>{game.away_team}</span>
                          </div>

                          <div style={{ color: "#8e86aa", fontSize: 13 }}>vs</div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <TeamLogo team={game.home_team} />
                            <span style={{ fontWeight: 700 }}>{game.home_team}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 12,
                              letterSpacing: "1px",
                              marginBottom: 6,
                              color: started ? "#fca5a5" : "#a5b4fc",
                              fontWeight: 700,
                            }}
                          >
                            {started ? "LOCKED" : "OPEN"}
                          </div>
                          <div style={{ color: "#c7c3da", fontSize: 14 }}>
                            {formatGameTime(game.commence_time)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(74,222,128,0.28)",
                            background: "rgba(74,222,128,0.10)",
                            color: "#4ade80",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Correct: {winCount}
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(252,165,165,0.24)",
                            background: "rgba(252,165,165,0.08)",
                            color: "#fca5a5",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Wrong: {lossCount}
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(199,195,218,0.18)",
                            background: "rgba(199,195,218,0.06)",
                            color: "#c7c3da",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Pending: {pendingCount}
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(129,140,248,0.18)",
                            background: "rgba(99,102,241,0.08)",
                            color: "#c7d2fe",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Total Picks: {gamePicks.length}
                        </div>
                      </div>

                      {gamePicks.length === 0 ? (
                        <div
                          style={{
                            borderTop: "1px solid #31294c",
                            paddingTop: 14,
                            color: "#9f96c7",
                          }}
                        >
                          No picks submitted for this game yet.
                        </div>
                      ) : (
                        <div
                          style={{
                            borderTop: "1px solid #31294c",
                            paddingTop: 14,
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          {gamePicks.map((pick, index) => {
                            const pickCardStyle = getPickCardStyle(pick.result);
                            const pickTypeBadge = getPickTypeBadge(pick.pick_type);

                            return (
                              <div
                                key={pick.id}
                                style={{
                                  border: pickCardStyle.border,
                                  borderRadius: 16,
                                  background: pickCardStyle.background,
                                  boxShadow: pickCardStyle.boxShadow,
                                  padding: 14,
                                  transition: "0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    alignItems: "center",
                                    marginBottom: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div
                                      style={{
                                        minWidth: 26,
                                        height: 26,
                                        borderRadius: 999,
                                        background: "#1a1630",
                                        border: "1px solid #31294c",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        color: "#d6d3e6",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {index + 1}
                                    </div>

                                    {pick.user_image ? (
                                      <Image
                                        src={pick.user_image}
                                        alt={pick.user_name}
                                        width={34}
                                        height={34}
                                        unoptimized
                                        style={{ borderRadius: "999px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 34,
                                          height: 34,
                                          borderRadius: "999px",
                                          background: "#1a1630",
                                          border: "1px solid #31294c",
                                        }}
                                      />
                                    )}

                                    <div>
                                      <div style={{ fontWeight: 700 }}>{pick.user_name}</div>
                                      <div style={{ fontSize: 12, color: "#9f96c7" }}>
                                        Submitted {formatSubmittedTime(pick.created_at)}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        ...pickTypeBadge,
                                      }}
                                    >
                                      {formatPickType(pick.pick_type)}
                                    </span>

                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: resultColor(pick.result),
                                        letterSpacing: "1px",
                                      }}
                                    >
                                      {resultLabel(pick.result)}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "grid", gap: 6 }}>
                                  <div>
                                    <span style={{ color: "#9f96c7" }}>Prop: </span>
                                    <span>{pick.prop}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: "#9f96c7" }}>Odds: </span>
                                    <span>
                                      {pick.american_odds} ({pick.decimal_odds})
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: "#9f96c7" }}>Bookie: </span>
                                    <span>{pick.bookie}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}