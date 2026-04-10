export type ScoreBreakdown = {
  predicted1x2: "1" | "X" | "2";
  actual1x2: "1" | "X" | "2" | null;
  predictedOU: "Over" | "Under";
  actualOU: "Over" | "Under" | null;
  predictedBTTS: "Yes" | "No";
  actualBTTS: "Yes" | "No" | null;
  correct1x2: boolean;
  correctOU: boolean;
  correctBTTS: boolean;
  correctScore: boolean;
  points1x2: number;
  pointsOU: number;
  pointsBTTS: number;
  pointsCS: number;
  totalPoints: number;
};

function get1x2(home: number, away: number): "1" | "X" | "2" {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

function getOU(home: number, away: number): "Over" | "Under" {
  return home + away > 2.5 ? "Over" : "Under";
}

function getBTTS(home: number, away: number): "Yes" | "No" {
  return home > 0 && away > 0 ? "Yes" : "No";
}

export function getScoreBreakdown(args: {
  predictedHome: number;
  predictedAway: number;
  actualHome?: number | null;
  actualAway?: number | null;
}) : ScoreBreakdown {
  const { predictedHome, predictedAway, actualHome, actualAway } = args;

  const predicted1x2 = get1x2(predictedHome, predictedAway);
  const predictedOU = getOU(predictedHome, predictedAway);
  const predictedBTTS = getBTTS(predictedHome, predictedAway);

  const hasActual =
    typeof actualHome === "number" && typeof actualAway === "number";

  const actual1x2 = hasActual ? get1x2(actualHome!, actualAway!) : null;
  const actualOU = hasActual ? getOU(actualHome!, actualAway!) : null;
  const actualBTTS = hasActual ? getBTTS(actualHome!, actualAway!) : null;

  const correct1x2 = hasActual && predicted1x2 === actual1x2;
  const correctOU = hasActual && predictedOU === actualOU;
  const correctBTTS = hasActual && predictedBTTS === actualBTTS;
  const correctScore =
    hasActual &&
    predictedHome === actualHome &&
    predictedAway === actualAway;

  const points1x2 = correct1x2 ? 18 : 0;
  const pointsOU = correctOU ? 9 : 0;
  const pointsBTTS = correctBTTS ? 8.75 : 0;
  const pointsCS = correctScore ? 85 : 0;

  return {
    predicted1x2,
    actual1x2,
    predictedOU,
    actualOU,
    predictedBTTS,
    actualBTTS,
    correct1x2,
    correctOU,
    correctBTTS,
    correctScore,
    points1x2,
    pointsOU,
    pointsBTTS,
    pointsCS,
    totalPoints: points1x2 + pointsOU + pointsBTTS + pointsCS,
  };
}