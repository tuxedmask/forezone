const SOCCER_TEAM_LOGOS: Record<string, string> = {
  // Premier League
  Arsenal: "https://crests.football-data.org/57.png",
  "Aston Villa": "https://crests.football-data.org/58.png",
  Bournemouth: "https://crests.football-data.org/1044.png",
  Brentford: "https://crests.football-data.org/402.png",
  Brighton: "https://crests.football-data.org/397.png",
  Burnley: "https://crests.football-data.org/328.png",
  Chelsea: "https://crests.football-data.org/61.png",
  "Crystal Palace": "https://crests.football-data.org/354.png",
  Everton: "https://crests.football-data.org/62.png",
  Fulham: "https://crests.football-data.org/63.png",
  Ipswich: "https://crests.football-data.org/349.png",
  Leicester: "https://crests.football-data.org/338.png",
  Liverpool: "https://crests.football-data.org/64.png",
  "Manchester City": "https://crests.football-data.org/65.png",
  "Manchester United": "https://crests.football-data.org/66.png",
  Newcastle: "https://crests.football-data.org/67.png",
  "Newcastle United": "https://crests.football-data.org/67.png",
  Nottingham: "https://crests.football-data.org/351.png",
  "Nottingham Forest": "https://crests.football-data.org/351.png",
  Southampton: "https://crests.football-data.org/340.png",
  Tottenham: "https://crests.football-data.org/73.png",
  "Tottenham Hotspur": "https://crests.football-data.org/73.png",
  "West Ham": "https://crests.football-data.org/563.png",
  "West Ham United": "https://crests.football-data.org/563.png",
  Wolves: "https://crests.football-data.org/76.png",
  Wolverhampton: "https://crests.football-data.org/76.png",
  "Wolverhampton Wanderers": "https://crests.football-data.org/76.png",
  "Leeds United": "https://crests.football-data.org/341.png",
  Leeds: "https://crests.football-data.org/341.png",

  // Bundesliga
  "Bayern Munich": "https://crests.football-data.org/5.png",
  Dortmund: "https://crests.football-data.org/4.png",
  "Borussia Dortmund": "https://crests.football-data.org/4.png",
  Leverkusen: "https://crests.football-data.org/3.png",
  "Bayer Leverkusen": "https://crests.football-data.org/3.png",
  Leipzig: "https://crests.football-data.org/721.png",
  "RB Leipzig": "https://crests.football-data.org/721.png",
  Freiburg: "https://crests.football-data.org/17.png",
  Frankfurt: "https://crests.football-data.org/19.png",
  "Eintracht Frankfurt": "https://crests.football-data.org/19.png",
  Stuttgart: "https://crests.football-data.org/10.png",
  Wolfsburg: "https://crests.football-data.org/11.png",
  Mainz: "https://crests.football-data.org/15.png",
  Augsburg: "https://crests.football-data.org/16.png",
  Hoffenheim: "https://crests.football-data.org/2.png",
  Bremen: "https://crests.football-data.org/12.png",
  "Werder Bremen": "https://crests.football-data.org/12.png",
  Gladbach: "https://crests.football-data.org/18.png",
  "Borussia Mönchengladbach": "https://crests.football-data.org/18.png",
  Bochum: "https://crests.football-data.org/36.png",
  Union: "https://crests.football-data.org/28.png",
  "Union Berlin": "https://crests.football-data.org/28.png",

  // La Liga
  "Real Madrid": "https://crests.football-data.org/86.png",
  Barcelona: "https://crests.football-data.org/81.png",
  Atlético: "https://crests.football-data.org/78.png",
  "Atletico Madrid": "https://crests.football-data.org/78.png",
  "Atlético Madrid": "https://crests.football-data.org/78.png",
  Sevilla: "https://crests.football-data.org/559.png",
  Valencia: "https://crests.football-data.org/95.png",
  Villarreal: "https://crests.football-data.org/94.png",
  Betis: "https://crests.football-data.org/90.png",
  "Real Betis": "https://crests.football-data.org/90.png",
  Sociedad: "https://crests.football-data.org/92.png",
  "Real Sociedad": "https://crests.football-data.org/92.png",

  // Serie A
  Juventus: "https://crests.football-data.org/109.png",
  Inter: "https://crests.football-data.org/108.png",
  "Inter Milan": "https://crests.football-data.org/108.png",
  Milan: "https://crests.football-data.org/98.png",
  "AC Milan": "https://crests.football-data.org/98.png",
  Napoli: "https://crests.football-data.org/113.png",
  Roma: "https://crests.football-data.org/100.png",
  Lazio: "https://crests.football-data.org/110.png",
  Atalanta: "https://crests.football-data.org/102.png",
  Fiorentina: "https://crests.football-data.org/99.png",
};

const TEAM_ALIASES: Record<string, string> = {
  "brighton hove": "Brighton",
  "brighton hove albion": "Brighton",

  "man city": "Manchester City",
  "manchester city": "Manchester City",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "manchester united": "Manchester United",

  spurs: "Tottenham",
  "tottenham hotspur": "Tottenham",

  wolves: "Wolves",
  wolverhampton: "Wolverhampton",
  "wolverhampton wanderers": "Wolverhampton",

  newcastle: "Newcastle United",
  "newcastle utd": "Newcastle United",
  "newcastle united": "Newcastle United",

  "west ham": "West Ham",
  "west ham united": "West Ham",

  nottingham: "Nottingham Forest",
  "nottingham forest": "Nottingham Forest",

  bournemouth: "Bournemouth",
  "afc bournemouth": "Bournemouth",

  "crystal palace": "Crystal Palace",
  "leicester city": "Leicester",

  ipswich: "Ipswich",
  "ipswich town": "Ipswich",

  sunderland: "Sunderland",
  "leeds united": "Leeds United",
  leeds: "Leeds United",

  "borussia dortmund": "Borussia Dortmund",
  dortmund: "Borussia Dortmund",
  "bayer leverkusen": "Bayer Leverkusen",
  leverkusen: "Bayer Leverkusen",
  "rb leipzig": "RB Leipzig",
  leipzig: "RB Leipzig",
  "eintracht frankfurt": "Eintracht Frankfurt",
  frankfurt: "Eintracht Frankfurt",
  "werder bremen": "Werder Bremen",
  bremen: "Werder Bremen",
  "union berlin": "Union Berlin",
  union: "Union Berlin",
  gladbach: "Borussia Mönchengladbach",

  "real madrid": "Real Madrid",
  barcelona: "Barcelona",
  "atletico madrid": "Atletico Madrid",
  "atlético madrid": "Atlético Madrid",
  sevilla: "Sevilla",
  valencia: "Valencia",
  villarreal: "Villarreal",
  betis: "Real Betis",
  sociedade: "Real Sociedad",
  sociedad: "Real Sociedad",

  inter: "Inter Milan",
  milan: "AC Milan",
};

function normalizeTeamName(team: string | null) {
  if (!team) return "";
  return team
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, "")
    .replace(/fc$/i, "")
    .trim();
}

export function getTeamLogo(team: string | null) {
  if (!team) return null;

  if (team === "Sunderland") {
    return null;
  }

  if (SOCCER_TEAM_LOGOS[team]) {
    return SOCCER_TEAM_LOGOS[team];
  }

  const normalized = normalizeTeamName(team);
  const alias = TEAM_ALIASES[normalized];

  if (alias === "Sunderland") {
    return null;
  }

  if (alias && SOCCER_TEAM_LOGOS[alias]) {
    return SOCCER_TEAM_LOGOS[alias];
  }

  const directMatch = Object.keys(SOCCER_TEAM_LOGOS).find(
    (key) => normalizeTeamName(key) === normalized
  );

  return directMatch ? SOCCER_TEAM_LOGOS[directMatch] : null;
}