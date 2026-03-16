"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getNBALogo } from "@/lib/nbaTeams";

type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
};

type MyPick = {
  id: number;
  user_id: string;
  user_name: string;
  user_image: string | null;
  game_id: string;
  away_team: string;
  home_team: string;
  commence_time: string;
  pick_type: string | null;
  prop: string;
  american_odds: string;
  decimal_odds: string;
  bookie: string;
  created_at: string;
  result: "win" | "loss" | "pending" | null;
  settled_at: string | null;
};

function parseGameTime(dateString: string) {
  const ts = Date.parse(String(dateString));
  return Number.isNaN(ts) ? null : ts;
}

function hasGameStarted(dateString: string) {
  const ts = parseGameTime(dateString);
  if (ts === null) return true;
  return ts <= Date.now();
}

function americanToDecimal(input: string) {
  const cleaned = input.trim().replace(/[^\d+.-]/g, "");
  const odds = Number(cleaned);

  if (!cleaned || Number.isNaN(odds) || odds === 0) return "";

  const decimalOdds =
    odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;

  return decimalOdds.toFixed(2);
}

function decimalToAmerican(input: string) {
  const cleaned = input.trim().replace(/[^\d.]/g, "");
  const odds = Number(cleaned);

  if (!cleaned || Number.isNaN(odds) || odds <= 1) return "";

  if (odds >= 2) {
    return `+${Math.round((odds - 1) * 100)}`;
  }

  return `${Math.round(-100 / (odds - 1))}`;
}

function formatGameTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function TeamLogo({ team }: { team: string }) {
  const src = getNBALogo(team);

  if (!src) {
    return (
      <div
        style={{
          width: 42,
          height: 42,
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
      width={42}
      height={42}
      unoptimized
      style={{ objectFit: "contain" }}
    />
  );
}

export default function SubmitPickPage() {
  const { data: session, status } = useSession();

  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState("");

  const [selectedGameId, setSelectedGameId] = useState("");
  const [pickType, setPickType] = useState("moneyline");
  const [pickProp, setPickProp] = useState("");
  const [americanOdds, setAmericanOdds] = useState("");
  const [decimalOdds, setDecimalOdds] = useState("");
  const [bookie, setBookie] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [checkingMyPick, setCheckingMyPick] = useState(true);
  const [alreadyPicked, setAlreadyPicked] = useState(false);
  const [myPick, setMyPick] = useState<MyPick | null>(null);

  const futureGames = useMemo(() => {
    return games
      .filter((game) => {
        const ts = parseGameTime(game.commence_time);
        return ts !== null && ts > Date.now();
      })
      .sort((a, b) => {
        const aTs = parseGameTime(a.commence_time) ?? 0;
        const bTs = parseGameTime(b.commence_time) ?? 0;
        return aTs - bTs;
      });
  }, [games]);

  const existingPickLocked = myPick
    ? hasGameStarted(myPick.commence_time)
    : false;

  const isEditing = alreadyPicked && !!myPick && !existingPickLocked;

  const selectedGame = useMemo(() => {
    if (isEditing && myPick) {
      return games.find((g) => g.id === myPick.game_id) ?? null;
    }

    return futureGames.find((g) => g.id === selectedGameId) ?? null;
  }, [games, futureGames, selectedGameId, isEditing, myPick]);

  useEffect(() => {
    async function loadGames() {
      try {
        setGamesLoading(true);
        setGamesError("");

        const res = await fetch("/api/nba-games", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load games");
        }

        setGames(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setGamesError(err.message || "Could not load games");
      } finally {
        setGamesLoading(false);
      }
    }

    loadGames();
  }, []);

  useEffect(() => {
    async function loadMyPick() {
      try {
        setCheckingMyPick(true);

        const res = await fetch("/api/my-pick-today", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to check today's pick");
        }

        const hasPick = !!data.hasPick;
        const pick = data.pick ?? null;

        setAlreadyPicked(hasPick);
        setMyPick(pick);

        if (hasPick && pick) {
          setSelectedGameId(pick.game_id ?? "");
          setPickType(pick.pick_type ?? "moneyline");
          setPickProp(pick.prop ?? "");
          setAmericanOdds(pick.american_odds ?? "");
          setDecimalOdds(
            pick.decimal_odds ?? americanToDecimal(pick.american_odds ?? "")
          );
          setBookie(pick.bookie ?? "");
        } else {
          setSelectedGameId("");
          setPickType("moneyline");
          setPickProp("");
          setAmericanOdds("");
          setDecimalOdds("");
          setBookie("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingMyPick(false);
      }
    }

    if (session) {
      loadMyPick();
    } else if (status !== "loading") {
      setCheckingMyPick(false);
    }
  }, [session, status]);

  useEffect(() => {
    if (isEditing) return;

    if (futureGames.length === 0) {
      setSelectedGameId("");
      return;
    }

    setSelectedGameId((current) => {
      const stillValid = futureGames.some((game) => game.id === current);
      return stillValid ? current : futureGames[0].id;
    });
  }, [futureGames, isEditing]);

  function handleAmericanOddsChange(value: string) {
    setAmericanOdds(value);
    setDecimalOdds(americanToDecimal(value));
    setSubmitError("");
  }

  function handleDecimalOddsChange(value: string) {
    setDecimalOdds(value);
    setAmericanOdds(decimalToAmerican(value));
    setSubmitError("");
  }

  async function handleSubmit() {
    setSubmitMessage("");
    setSubmitError("");

    if (!selectedGameId || !pickType || !pickProp || !bookie) {
      setSubmitError("Please fill in all fields.");
      return;
    }

    if (!americanOdds || !decimalOdds) {
      setSubmitError("Please enter valid American or Decimal odds.");
      return;
    }

    if (!selectedGame) {
      setSubmitError("Please select a valid upcoming game.");
      return;
    }

    if (hasGameStarted(selectedGame.commence_time)) {
      setSubmitError(
        "This game has already started and can no longer be selected."
      );
      return;
    }

    if (alreadyPicked && existingPickLocked) {
      setSubmitError("Your pick is locked because the game already started.");
      return;
    }

    try {
      setSubmitting(true);

      const endpoint = isEditing ? "/api/my-pick" : "/api/submit-pick";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: selectedGame.id,
          awayTeam: selectedGame.away_team,
          homeTeam: selectedGame.home_team,
          commenceTime: selectedGame.commence_time,
          pickType,
          prop: pickProp,
          americanOdds,
          decimalOdds,
          bookie,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (isEditing ? "Failed to update pick" : "Failed to submit pick")
        );
      }

      setSubmitMessage(
        isEditing ? "Pick updated successfully." : "Pick submitted successfully."
      );

      setAlreadyPicked(true);
      setMyPick(data.pick);
      setSelectedGameId(data.pick?.game_id ?? selectedGame.id);
      setPickType(data.pick?.pick_type ?? pickType);
      setPickProp(data.pick?.prop ?? pickProp);
      setAmericanOdds(data.pick?.american_odds ?? americanOdds);
      setDecimalOdds(data.pick?.decimal_odds ?? decimalOdds);
      setBookie(data.pick?.bookie ?? bookie);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitMessage("");
    setSubmitError("");

    if (!myPick) {
      setSubmitError("No pick found to delete.");
      return;
    }

    if (existingPickLocked) {
      setSubmitError("Your pick is locked because the game already started.");
      return;
    }

    try {
      setDeleting(true);

      const res = await fetch("/api/my-pick", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete pick");
      }

      setSubmitMessage("Pick deleted successfully.");
      setAlreadyPicked(false);
      setMyPick(null);
      setSelectedGameId("");
      setPickType("moneyline");
      setPickProp("");
      setAmericanOdds("");
      setDecimalOdds("");
      setBookie("");
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
          color: "white",
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </main>
    );
  }

  if (!session) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          padding: "60px 24px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Please sign in to submit a pick.</h1>
        </div>
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
          Daily competition
        </p>

        <h1 style={{ fontSize: "46px", marginTop: 0, marginBottom: 12 }}>
          Submit Today&apos;s NBA Pick
        </h1>

        <p style={{ color: "#c7c3da", marginBottom: 10 }}>
          Logged in as{" "}
          <strong style={{ color: "white" }}>{session.user?.name}</strong>
        </p>

        <p style={{ color: "#9f96c7", fontSize: 14, marginBottom: 20 }}>
          Slate resets daily at 2:00 AM ET.
        </p>

        {checkingMyPick ? (
          <p style={{ color: "#9f96c7", marginBottom: 24 }}>
            Checking today&apos;s submission...
          </p>
        ) : alreadyPicked && myPick ? (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: 16,
              border: existingPickLocked
                ? "1px solid rgba(252,165,165,0.28)"
                : "1px solid rgba(129,140,248,0.30)",
              background: "#110f1b",
              boxShadow: existingPickLocked
                ? "0 0 16px rgba(252,165,165,0.08)"
                : "0 0 18px rgba(99,102,241,0.10)",
            }}
          >
            <div
              style={{
                color: existingPickLocked ? "#fca5a5" : "#a5b4fc",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {existingPickLocked
                ? "Your pick is locked"
                : "You already submitted a pick today"}
            </div>

            <div style={{ color: "#e5e7eb", fontSize: 14 }}>
              {myPick.away_team} vs {myPick.home_team}
            </div>

            <div style={{ color: "#d6d3e6", fontSize: 14, marginTop: 4 }}>
              {myPick.pick_type || "moneyline"} • {myPick.prop} •{" "}
              {myPick.american_odds} ({myPick.decimal_odds}) • {myPick.bookie}
            </div>

            <div style={{ color: "#9f96c7", fontSize: 13, marginTop: 8 }}>
              {existingPickLocked
                ? "This pick can no longer be edited or deleted because the game already started."
                : "You can still edit or delete this pick until the game starts."}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 22,
              background: "linear-gradient(180deg, #131021, #0b0914)",
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 18 }}>
              Today&apos;s Games
            </h2>

            {gamesLoading && (
              <p style={{ color: "#b4b4c7" }}>Loading games...</p>
            )}

            {gamesError && <p style={{ color: "#fca5a5" }}>{gamesError}</p>}

            {!gamesLoading && !gamesError && futureGames.length === 0 && (
              <p style={{ color: "#b4b4c7" }}>No upcoming games available.</p>
            )}

            {!gamesLoading && !gamesError && futureGames.length > 0 && (
              <div style={{ display: "grid", gap: 16 }}>
                {futureGames.map((game) => {
                  const isSelected = selectedGameId === game.id;
                  const canSelect = !existingPickLocked;

                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        if (!canSelect) return;
                        setSelectedGameId(game.id);
                        setSubmitError("");
                      }}
                      disabled={!canSelect}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: isSelected
                          ? "1px solid rgba(129,140,248,0.45)"
                          : !canSelect
                          ? "1px solid #2b2444"
                          : "1px solid #31294c",
                        borderRadius: 18,
                        background: isSelected
                          ? "linear-gradient(180deg, rgba(99,102,241,0.18), rgba(255,255,255,0.02))"
                          : !canSelect
                          ? "#0d0a16"
                          : "#110f1b",
                        padding: 18,
                        cursor: !canSelect ? "not-allowed" : "pointer",
                        color: !canSelect ? "#7b7693" : "white",
                        transition: "0.2s ease",
                        opacity: !canSelect ? 0.65 : 1,
                        boxShadow: isSelected
                          ? "0 0 18px rgba(99,102,241,0.12)"
                          : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <div style={{ display: "grid", gap: 14, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <TeamLogo team={game.away_team} />
                            <div>
                              <div style={{ fontSize: "13px", color: "#9f96c7" }}>
                                Away
                              </div>
                              <div style={{ fontWeight: 700, fontSize: "18px" }}>
                                {game.away_team}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <TeamLogo team={game.home_team} />
                            <div>
                              <div style={{ fontSize: "13px", color: "#9f96c7" }}>
                                Home
                              </div>
                              <div style={{ fontWeight: 700, fontSize: "18px" }}>
                                {game.home_team}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "12px",
                              color: isSelected ? "#a5b4fc" : "#9f96c7",
                              marginBottom: 8,
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {isSelected ? "Selected" : "Game"}
                          </div>
                          <div style={{ color: "#d6d3e6", fontSize: "14px" }}>
                            {formatGameTime(game.commence_time)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              border: "1px solid #31294c",
              borderRadius: 22,
              background: "linear-gradient(180deg, #131021, #0b0914)",
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              position: "sticky",
              top: 24,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 18 }}>
              {isEditing ? "Edit Pick" : "Pick Form"}
            </h2>

            {selectedGame && !existingPickLocked && (
              <div
                style={{
                  border: "1px solid #31294c",
                  borderRadius: 16,
                  background: "#110f1b",
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    color: "#9f96c7",
                    fontSize: "12px",
                    marginBottom: 10,
                  }}
                >
                  SELECTED MATCHUP
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TeamLogo team={selectedGame.away_team} />
                    <span style={{ fontWeight: 700 }}>{selectedGame.away_team}</span>
                  </div>

                  <div style={{ color: "#8e86aa", fontSize: "13px" }}>vs</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TeamLogo team={selectedGame.home_team} />
                    <span style={{ fontWeight: 700 }}>{selectedGame.home_team}</span>
                  </div>

                  <div style={{ color: "#c7c3da", marginTop: 6 }}>
                    {formatGameTime(selectedGame.commence_time)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Select Game
                </label>
                <select
                  value={selectedGameId}
                  onChange={(e) => {
                    setSelectedGameId(e.target.value);
                    setSubmitError("");
                  }}
                  disabled={existingPickLocked}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "white",
                  }}
                >
                  <option value="">Choose a game</option>
                  {futureGames.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.away_team} vs {game.home_team} —{" "}
                      {formatGameTime(game.commence_time)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Pick Type
                </label>
                <select
                  value={pickType}
                  onChange={(e) => {
                    setPickType(e.target.value);
                    setSubmitError("");
                  }}
                  disabled={existingPickLocked}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "white",
                  }}
                >
                  <option value="moneyline">Moneyline</option>
                  <option value="spread">Spread</option>
                  <option value="total">Total</option>
                  <option value="player_prop">Player Prop</option>
                </select>
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Prop / Pick
                </label>
                <input
                  type="text"
                  value={pickProp}
                  onChange={(e) => {
                    setPickProp(e.target.value);
                    setSubmitError("");
                  }}
                  disabled={existingPickLocked}
                  placeholder="Example: LeBron over 27.5 points"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "white",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  American Odds
                </label>
                <input
                  type="text"
                  value={americanOdds}
                  onChange={(e) => handleAmericanOddsChange(e.target.value)}
                  disabled={existingPickLocked}
                  placeholder="Example: -110 or +150"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "white",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Decimal Odds
                </label>
                <input
                  type="text"
                  value={decimalOdds}
                  onChange={(e) => handleDecimalOddsChange(e.target.value)}
                  disabled={existingPickLocked}
                  placeholder="Example: 1.91"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "#a5b4fc",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Bookie
                </label>
                <input
                  type="text"
                  value={bookie}
                  onChange={(e) => {
                    setBookie(e.target.value);
                    setSubmitError("");
                  }}
                  disabled={existingPickLocked}
                  placeholder="Example: FanDuel"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #31294c",
                    background: existingPickLocked ? "#0d0a16" : "#110f1b",
                    color: "white",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || deleting || existingPickLocked}
                style={{
                  marginTop: 8,
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid #31294c",
                  background: existingPickLocked
                    ? "#2b2444"
                    : submitting
                    ? "#5b5f88"
                    : "#6366f1",
                  color: "white",
                  fontWeight: 700,
                  cursor:
                    submitting || deleting || existingPickLocked
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    !existingPickLocked && !submitting
                      ? "0 0 16px rgba(99,102,241,0.20)"
                      : "none",
                }}
              >
                {existingPickLocked
                  ? "Pick Locked"
                  : submitting
                  ? isEditing
                    ? "Updating..."
                    : "Submitting..."
                  : isEditing
                  ? "Update Pick"
                  : "Submit Pick"}
              </button>

              {isEditing && !existingPickLocked && (
                <button
                  onClick={handleDelete}
                  disabled={submitting || deleting}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(252,165,165,0.28)",
                    background: deleting ? "#5a2430" : "#28131b",
                    color: "#fca5a5",
                    fontWeight: 700,
                    cursor: submitting || deleting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete Pick"}
                </button>
              )}

              {submitMessage && (
                <div
                  style={{
                    marginTop: 4,
                    color: "#a5b4fc",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {submitMessage}
                </div>
              )}

              {submitError && (
                <div
                  style={{
                    marginTop: 4,
                    color: "#fca5a5",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {submitError}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}