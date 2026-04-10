export type ProjectedPointsInput = {
  homeScore: number;
  awayScore: number;
  btts_yes_odds: number | null;
  btts_no_odds: number | null;
  over_2_5_odds: number | null;
  under_2_5_odds: number | null;
  home_win_odds: number | null;
  draw_odds: number | null;
  away_win_odds: number | null;
};

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

export function getProjectedPointsFromScores(input: ProjectedPointsInput) {
  const {
    homeScore,
    awayScore,
    btts_yes_odds,
    btts_no_odds,
    over_2_5_odds,
    under_2_5_odds,
    home_win_odds,
    draw_odds,
    away_win_odds,
  } = input;

  if (
    Number.isNaN(homeScore) ||
    Number.isNaN(awayScore)
  ) {
    return null;
  }

  const isDraw = homeScore === awayScore;
  const isHomeWin = homeScore > awayScore;
  const bttsYes = homeScore > 0 && awayScore > 0;
  const totalGoals = homeScore + awayScore;
  const isOver = totalGoals > 2;

  const bttsBonus =
    0.5 * Number(bttsYes ? btts_yes_odds ?? 0 : btts_no_odds ?? 0) * 10;

  const ouBonus =
    0.5 * Number(isOver ? over_2_5_odds ?? 0 : under_2_5_odds ?? 0) * 10;

  const onextwoBonus = isHomeWin
    ? 0.2 * Number(home_win_odds ?? 0) * 10
    : isDraw
      ? 0.5 * Number(draw_odds ?? 0) * 10
      : 0.3 * Number(away_win_odds ?? 0) * 10;

  const correctScoreBonus = 17.5 + 17.5 + (isDraw ? 50 : 0);

  const total = bttsBonus + ouBonus + onextwoBonus + correctScoreBonus;

  return {
    bttsBonus: roundPoints(bttsBonus),
    ouBonus: roundPoints(ouBonus),
    onextwoBonus: roundPoints(onextwoBonus),
    correctScoreBonus: roundPoints(correctScoreBonus),
    total: roundPoints(total),
  };
}