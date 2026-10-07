import { useEffect, useState } from "react";

type Matchup = {
  home: string;
  round?: number;
  away: string;
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  penaltyWinner?: string;
};

type Standing = {
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  pts: number;
};

type ClubHistoryEntry = {
  competitionId: number;
  competition: string;
  country: string;
  state?: string;
  division: string;
  season: string;
  position?: number;
  champion?: boolean;
  access?: boolean;
  relegated?: boolean;
  phase?: string;
};

type Championship = {
  id: number;
  name: string;
  season: string;
  division: string;
  country: string;
  state?: string;
  teams?: string[];
  rules?: string[];
  phases?: string[];
  standings?: Record<string, Standing>;
  phaseStandings?: Record<string, Record<string, Standing>>;
  phaseMatches?: Record<string, Matchup[]>;
  firstTurnWinner?: string;
  secondTurnWinner?: string;
  champion?: string;
  championHistory?: Record<string, string>;
  accessTeams?: string[];
  relegatedTeams?: string[];
  amazonasGroups?: { A: string[]; B: string[] };
  rioGroups?: { A: string[]; B: string[] };
  santaCatarinaGroups?: { A: string[]; B: string[] };
  cearaGroups?: { A: string[]; B: string[] };
  cearaSecondGroups?: { C: string[]; D: string[] };
  rioGrandeDoSulGroups?: { A: string[]; B: string[] };
  paranaGroups?: { A: string[]; B: string[] };
  pernambucoGroups?: { A: string[]; B: string[]; C: string[]; D: string[] };
  pernambucoSecondGroups?: { A: string[]; B: string[] };
  saoPauloPots?: { A: string[]; B: string[]; C: string[]; D: string[] };
  minasGeraisGroups?: { A: string[]; B: string[]; C: string[] };
  serieCGroups?: { A: string[]; B: string[] };
  serieDGroups?: Record<string, string[]>;
};

const SERIE_D_STATE_SLOTS: Record<string, number> = {
  "São Paulo": 4,
  "Rio de Janeiro": 3,
  "Minas Gerais": 3,
  "Rio Grande do Sul": 3,
  "Paraná": 3,
  "Ceará": 3,
  "Goiás": 3,
  "Santa Catarina": 3,
  "Bahia": 3,
  "Pernambuco": 2,
  "Alagoas": 2,
  "Pará": 2,
  "Mato Grosso": 2,
  "Amazonas": 2,
  "Rio Grande do Norte": 2,
  "Paraíba": 2,
  "Maranhão": 2,
  "Sergipe": 2,
  "Distrito Federal": 2,
  "Piauí": 2,
  "Espírito Santo": 2,
  "Tocantins": 2,
  "Acre": 2,
  "Rondônia": 2,
  "Roraima": 2,
  "Mato Grosso do Sul": 2,
  "Amapá": 2,
};

type SerieDVacancy = {
  state: string;
  slots: number;
  selected: string[];
  skipped: string[];
  guaranteedRelegated: string[];
};

function getSerieDGuaranteedRelegated(
  championships: Championship[],
  season: string
): string[] {
  const targetYear = Number(season);
  if (!Number.isFinite(targetYear)) return [];

  const previousSeason = String(targetYear - 1);
  const previousSerieC = championships.find(
    (item) =>
      item.country === "Brasil" &&
      item.division === "Série C" &&
      item.season === previousSeason
  );

  return previousSerieC?.relegatedTeams ? [...previousSerieC.relegatedTeams] : [];
}

function getStateChampionshipRanking(
  championships: Championship[],
  state: string,
  season: string
) {
  const championship = championships.find(
    (item) =>
      item.country === "Brasil" &&
      item.state === state &&
      item.division === "1ª Divisão" &&
      item.season === season
  );

  if (!championship) return [];

  const teams = championship.teams ?? [];
  const table =
    championship.standings ??
    championship.phaseStandings?.["Primeira fase"] ??
    {};

  return [...teams].sort((a, b) => {
    const A = table[a] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    const B = table[b] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
  });
}

function getSerieDSemifinalists(championship: Championship): string[] {
  const stored = championship.accessTeams ?? [];
  if (championship.division !== "Série D" || championship.country !== "Brasil") {
    return stored;
  }

  if (stored.length >= 4) {
    return stored.slice(0, 4);
  }

  const semifinalMatches = championship.phaseMatches?.["Semifinal"] ?? [];
  const semifinalists: string[] = [];

  for (const match of semifinalMatches) {
    for (const club of [match.home, match.away]) {
      if (club && !semifinalists.includes(club)) {
        semifinalists.push(club);
      }
    }
  }

  return semifinalists.length >= 4 ? semifinalists.slice(0, 4) : stored;
}

function calculateSerieDStateVacancies(
  championships: Championship[],
  season: string,
  extraBlocked: string[] = []
): SerieDVacancy[] {
  const guaranteedRelegated = getSerieDGuaranteedRelegated(championships, season);

  const blocked = new Set([
    ...championships
      .filter(
        (item) =>
          item.country === "Brasil" &&
          item.season === season &&
          ["Série A", "Série B", "Série C"].includes(item.division)
      )
      .flatMap((item) => item.teams ?? []),
    ...extraBlocked,
  ]);

  return Object.entries(SERIE_D_STATE_SLOTS).map(([state, slots]) => {
    const ranking = getStateChampionshipRanking(championships, state, season);
    const selected: string[] = [];
    const skipped: string[] = [];

    for (const club of ranking) {
      if (blocked.has(club)) {
        skipped.push(club);
        continue;
      }
      if (selected.length < slots) {
        selected.push(club);
      }
    }

    return { state, slots, selected, skipped, guaranteedRelegated };
  });
}

function vacanciesStateLabel(championships: Championship[], season: string, club: string): string {
  const state = championships.find(
    (item) =>
      item.country === "Brasil" &&
      item.season === season &&
      item.state &&
      (item.teams ?? []).includes(club)
  )?.state;
  return state ?? "";
}

type SerieDNextSeasonPlan = {
  season: string;
  guaranteedRelegated: string[];
  stateQualified: string[];
  previousSecondPhase: string[];
  allTeams: string[];
  ready: boolean;
};

function getSerieDNextSeasonPlan(
  championships: Championship[],
  currentSeason: string
): SerieDNextSeasonPlan {
  const year = Number(currentSeason);
  const nextSeason = Number.isFinite(year) ? String(year + 1) : currentSeason;
  const currentSerieD = championships.find(
    (item) =>
      item.country === "Brasil" &&
      item.division === "Série D" &&
      item.season === currentSeason
  );

  const access = currentSerieD ? getSerieDSemifinalists(currentSerieD) : [];
  const guaranteedRelegated = currentSerieD
    ? getSerieDGuaranteedRelegated(championships, nextSeason)
    : [];

  const vacancies = calculateSerieDStateVacancies(
    championships,
    currentSeason,
    access
  );

  const stateQualified = vacancies.flatMap((item) => item.selected);
  const stateSet = new Set(stateQualified);
  const accessSet = new Set(access);
  const guaranteedSet = new Set(guaranteedRelegated);

  const secondPhaseParticipants: string[] = [];
  const secondPhaseMatches = currentSerieD?.phaseMatches?.["Segunda fase"] ?? [];
  for (const match of secondPhaseMatches) {
    for (const club of [match.home, match.away]) {
      if (
        club &&
        !accessSet.has(club) &&
        !guaranteedSet.has(club) &&
        !stateSet.has(club) &&
        !secondPhaseParticipants.includes(club)
      ) {
        secondPhaseParticipants.push(club);
      }
    }
  }

  const previousSecondPhase = secondPhaseParticipants.slice(0, 28);
  const allTeams = [
    ...guaranteedRelegated,
    ...stateQualified,
    ...previousSecondPhase,
  ].filter((club, index, list) => list.indexOf(club) === index);

  return {
    season: nextSeason,
    guaranteedRelegated,
    stateQualified,
    previousSecondPhase,
    allTeams,
    ready: allTeams.length === 96,
  };
}

const ACRE_CHAMPIONSHIPS: Championship[] = [
  {
    id: 1001,
    name: "Acre",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Acre",
    teams: [
      "Galvez - AC",
      "Humaitá - AC",
      "Santa Cruz - AC",
      "Rio Branco - AC",
      "Independência - AC",
      "Senador Guiomard - AC",
      "São Francisco - AC",
      "Vasco da Gama - AC",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 7 rodadas.",
      "Os 4 primeiros colocados avançam ao mata-mata.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogo único.",
    ],
  },
];

const AMAPA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 3001,
    name: "Amapá",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Amapá",
    teams: [
      "São José - AP",
      "Oratório - AP",
      "Santos - AP",
      "Independente - AP",
      "Trem - AP",
      "Ypiranga - AP",
      "Macapá - AP",
      "Cristal - AP",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 7 rodadas.",
      "Os 4 primeiros colocados avançam ao mata-mata.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
    ],
  },
];

const ALAGOAS_CHAMPIONSHIPS: Championship[] = [
  {
    id: 2001,
    name: "Alagoas",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Alagoas",
    teams: [
      "ASA - AL",
      "CSA - AL",
      "CRB - AL",
      "Murici - AL",
      "Cruzeiro Arapiraca - AL",
      "Coruripe - AL",
      "SC Penedense - AL",
      "CSE - AL",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 7 rodadas.",
      "Os 4 primeiros colocados avançam ao mata-mata.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
    ],
  },
];

const AMAZONAS_CHAMPIONSHIPS: Championship[] = [
  {
    id: 4001,
    name: "Amazonas",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Amazonas",
    teams: [
      "Amazonas - AM",
      "Itacoatiara - AM",
      "Manauara - AM",
      "Parintins - AM",
      "Nacional - AM",
      "Princesa do Solimões - AM",
      "Manaus - AM",
      "São Raimundo - AM",
    ],
    phases: [
      "1º Turno",
      "Quartas de final - 1º Turno",
      "Semi final - 1º Turno",
      "Final do 1º Turno",
      "2º Turno",
      "Quartas de final - 2º Turno",
      "Semi final - 2º Turno",
      "Final do 2º Turno",
      "Final geral",
    ],
    rules: [
      "1º turno: 2 grupos de 4 times; cada time enfrenta todos os times do outro grupo, totalizando 4 rodadas.",
      "1º A e 1º B avançam diretamente às semifinais; 2º A, 3º A, 2º B e 3º B disputam as quartas.",
      "Quartas, semifinais e final do turno são em jogo único, com pênaltis automáticos em caso de empate.",
      "O campeão do 1º turno garante vaga na Final geral.",
      "2º turno: 2 grupos de 4 times; os times jogam entre si dentro do próprio grupo, totalizando 3 rodadas.",
      "1º A e 1º B avançam diretamente às semifinais; 2º A, 3º A, 2º B e 3º B disputam as quartas.",
      "Quartas, semifinais e final do turno são em jogo único, com pênaltis automáticos em caso de empate.",
      "O campeão do 2º turno garante vaga na Final geral.",
      "Final geral em jogo único entre os campeões dos dois turnos. Se o mesmo time vencer os dois turnos, a final geral não é disputada.",
    ],
  },
];

const BAHIA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 5001,
    name: "Bahia",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Bahia",
    teams: [
      "Bahia - BA",
      "Vitória - BA",
      "Jacuipense - BA",
      "Juazeirense - BA",
      "Jequié - BA",
      "Porto - BA",
      "Barcelona - BA",
      "Galícia - BA",
      "Bahia de Feira - BA",
      "Alagoinhas - BA",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 9 rodadas.",
      "Os 4 primeiros colocados avançam ao mata-mata.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const DISTRITO_FEDERAL_CHAMPIONSHIPS: Championship[] = [
  {
    id: 6001,
    name: "Distrito Federal",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Distrito Federal",
    teams: [
      "Gama - DF",
      "Samambaia - DF",
      "Sobradinho - DF",
      "Ceilândia - DF",
      "Capital - DF",
      "Brasiliense - DF",
      "Real Brasília - DF",
      "Paranoa - DF",
      "Brasília - DF",
      "ARUC - DF",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 9 rodadas.",
      "Os 4 primeiros colocados avançam ao mata-mata.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const ESPIRITO_SANTO_CHAMPIONSHIPS: Championship[] = [
  {
    id: 7001,
    name: "Espírito Santo",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Espírito Santo",
    teams: [
      "Vitória - ES",
      "Serra - ES",
      "Vilavelhense - ES",
      "Rio Branco - ES",
      "Porto Vitória - ES",
      "Desportiva Ferroviária - ES",
      "Real Noroeste - ES",
      "Forte - ES",
      "Capixava SC - ES",
      "Rio Branco VN - ES",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "Primeira fase em turno único, com 9 rodadas.",
      "Os 8 primeiros colocados avançam ao mata-mata.",
      "Quartas de final em jogos de ida e volta: 1º x 8º, 2º x 7º, 3º x 6º e 4º x 5º.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const RIO_DE_JANEIRO_CHAMPIONSHIPS: Championship[] = [
  {
    id: 8001,
    name: "Rio de Janeiro",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Rio de Janeiro",
    teams: [
      "Fluminense - RJ",
      "Vasco da Gama - RJ",
      "Volta Redonda - RJ",
      "Bangu - RJ",
      "Portuguesa - RJ",
      "Sampaio Corrêa - RJ",
      "Botafogo - RJ",
      "Madureira - RJ",
      "Boavista - RJ",
      "Flamengo - RJ",
      "Nova Iguaçu - RJ",
      "Maricá - RJ",
    ],
    phases: [
      "Taça Guanabara",
      "Quartas de final",
      "Semi final - Taça Guanabara",
      "Final - Taça Guanabara",
      "Semi final - Taça Rio",
      "Final - Taça Rio",
    ],
    rules: [
      "Taça Guanabara com 12 equipes divididas em dois grupos de 6.",
      "As equipes enfrentam os clubes do outro grupo, totalizando 6 rodadas.",
      "O líder de cada grupo é comparado pelos pontos; o líder com mais pontos é o campeão da Taça Guanabara.",
      "Os 4 primeiros de cada grupo avançam à fase final.",
      "Quartas de final em jogo único: A1 x A4, A2 x A3, B1 x B4 e B2 x B3.",
      "As semifinais da Taça Guanabara são definidas por sorteio e disputadas em ida e volta.",
      "A final da Taça Guanabara é disputada em jogo único.",
      "Os quatro derrotados das quartas disputam a Taça Rio, com confrontos definidos por sorteio, em ida e volta.",
      "A final da Taça Rio é disputada em jogo único.",
      "Em jogos únicos, empate gera pênaltis automaticamente. Em jogos de ida e volta, pênaltis somente se o agregado terminar empatado.",
    ],
  },
];

const SANTA_CATARINA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 9001,
    name: "Santa Catarina",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Santa Catarina",
    teams: [
      "Brusque - SC",
      "Avaí - SC",
      "Camboriú - SC",
      "Concórdia - SC",
      "Marcílio Dias - SC",
      "Joinville - SC",
      "Santa Catarina - SC",
      "Chapecoense - SC",
      "Criciúma - SC",
      "Barra - SC",
      "Figueirense - SC",
      "Carlos Renaux - SC",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "12 equipes divididas por sorteio em dois grupos de 6.",
      "Na primeira fase, as equipes do Grupo A enfrentam as do Grupo B em turno único, totalizando 6 rodadas.",
      "Os 4 melhores colocados de cada grupo avançam às quartas de final.",
      "As quartas de final são disputadas dentro de cada grupo, com confrontos novos em relação à primeira fase.",
      "Quartas de final, semifinais e final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const CEARA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 10001,
    name: "Ceará",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Ceará",
    teams: [
      "Fortaleza - CE",
      "Ferroviário - CE",
      "Horizonte - CE",
      "Quixadá - CE",
      "Maracanã - CE",
      "Ceará - CE",
      "Floresta - CE",
      "Iguatu - CE",
      "Maranguape - CE",
      "Tirol - CE",
    ],
    phases: ["Primeira fase", "Segunda fase", "Semi final", "Final"],
    rules: [
      "Primeira fase com 10 clubes divididos por sorteio em dois grupos de 5.",
      "Cada equipe enfrenta as demais do próprio grupo em turno único, totalizando 4 jogos por equipe em 5 rodadas.",
      "Os 3 melhores colocados de cada grupo avançam à segunda fase.",
      "Na segunda fase, os seis classificados da primeira fase são sorteados automaticamente em dois novos grupos de 3, Grupos C e D.",
      "Os grupos C e D se enfrentam em turno único, totalizando 3 jogos por equipe.",
      "Os grupos C e D se enfrentam em turno único, totalizando 3 jogos por equipe.",
      "Os 2 primeiros colocados de cada grupo da segunda fase avançam às semifinais.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const RIO_GRANDE_DO_SUL_CHAMPIONSHIPS: Championship[] = [
  {
    id: 11001,
    name: "Rio Grande do Sul",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Rio Grande do Sul",
    teams: [
      "Internacional - RS",
      "Juventude - RS",
      "São José - RS",
      "São Luiz - RS",
      "Avenida - RS",
      "Guarany de Bagé - RS",
      "Grêmio - RS",
      "Caxias - RS",
      "Ypiranga de Erechim - RS",
      "Novo Hamburgo - RS",
      "Monsoon - RS",
      "Inter de Santa Maria - RS",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "12 clubes divididos por sorteio em dois grupos de 6.",
      "Na primeira fase, cada equipe enfrenta somente os clubes do outro grupo, em turno único, totalizando 6 rodadas.",
      "Os 4 primeiros colocados de cada grupo avançam à fase final.",
      "Quartas de final em jogo único.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogos de ida e volta.",
      "Empate nas quartas em jogo único gera pênaltis automaticamente.",
      "Empate no agregado das semifinais ou da final gera pênaltis automaticamente.",
    ],
  },
];


const GOIAS_CHAMPIONSHIPS: Championship[] = [
  {
    id: 12001,
    name: "Goiás",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Goiás",
    teams: [
      "Goiás - GO",
      "Vila Nova FC - GO",
      "Jataiense - GO",
      "Atlético - GO",
      "Ouvidorense - GO",
      "Anapolina - GO",
      "Anápolis - GO",
      "CRAC - GO",
      "Goiatuba - GO",
      "Aparecidense - GO",
      "Centro Oeste - GO",
      "Inhumas - GO",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "12 clubes disputam a primeira fase em turno único, totalizando 11 rodadas.",
      "Os 8 melhores colocados avançam às quartas de final.",
      "Quartas de final, semifinais e final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const MARANHAO_CHAMPIONSHIPS: Championship[] = [
  {
    id: 13001,
    name: "Maranhão",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Maranhão",
    teams: [
      "Moto Club - MA",
      "Maranhão - MA",
      "Sampaio Correa - MA",
      "IAPE - MA",
      "Luminense - MA",
      "Tuntum - MA",
      "Imperatriz - MA",
      "ITZ Sport - MA",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "8 clubes disputam a primeira fase em turno único, totalizando 7 rodadas.",
      "Os 4 melhores colocados avançam ao mata-mata.",
      "Semifinais e final em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];


const RIO_GRANDE_DO_NORTE_CHAMPIONSHIPS: Championship[] = [
  {
    id: 22001,
    name: "Rio Grande do Norte",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Rio Grande do Norte",
    teams: [
      "América - RN",
      "ABC - RN",
      "QFC - RN",
      "Potiguar de Mossoró - RN",
      "Laguna - RN",
      "Santa Cruz de Natal - RN",
      "Potyguar Seridoense - RN",
      "Globo - RN",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "8 clubes disputam a primeira fase em turno único, totalizando 7 rodadas.",
      "Os 2 primeiros colocados avançam diretamente às semifinais.",
      "3º, 4º, 5º e 6º colocados disputam as quartas de final em jogo único.",
      "Os vencedores das quartas enfrentam os 2 primeiros colocados nas semifinais.",
      "Semifinais e final são disputadas em jogos de ida e volta.",
      "Em caso de empate no agregado das fases de ida e volta, a decisão é definida automaticamente nos pênaltis.",
      "Em caso de empate nas quartas de final, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];


const TOCANTINS_CHAMPIONSHIPS: Championship[] = [
  {
    id: 27001,
    name: "Tocantins",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Tocantins",
    teams: [
      "Tocantinópolis - TO",
      "União Carmolandense - TO",
      "Gurupi - TO",
      "Capital - TO",
      "Araguaina - TO",
      "Bela Vista - TO",
      "Palmas - TO",
      "Guarai - TO",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "8 clubes disputam a primeira fase em turno único, totalizando 7 rodadas.",
      "Os 4 melhores colocados avançam ao mata-mata.",
      "As semifinais e a final são disputadas em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const MATO_GROSSO_DO_SUL_CHAMPIONSHIPS: Championship[] = [
  {
    id: 26001,
    name: "Mato Grosso do Sul",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Mato Grosso do Sul",
    teams: [
      "Naviraiense - MS",
      "Operário - MS",
      "Corumbaense - MS",
      "Ivinhema - MS",
      "Bataguassu - MS",
      "Dourados - MS",
      "CR Aquidauana - MS",
      "Pantanal - MS",
      "Costa Rica - MS",
      "Águia Negra - MS",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "10 clubes disputam a primeira fase em turno único, totalizando 9 rodadas.",
      "Os 2 primeiros colocados se classificam diretamente para as semifinais.",
      "Nas quartas de final: 3º x 6º e 4º x 5º, em jogo único.",
      "As semifinais e a final são disputadas em jogos de ida e volta.",
      "Em caso de empate em jogo único ou no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const SERGIPE_CHAMPIONSHIPS: Championship[] = [
  {
    id: 25001,
    name: "Sergipe",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Sergipe",
    teams: [
      "Sergipe - SE",
      "Itabaiana - SE",
      "Lagarto - SE",
      "Confiança - SE",
      "Guarany - SE",
      "America - SE",
      "Falcon - SE",
      "Atlético Gloriense - SE",
      "Dorense - SE",
      "Desportiva Aracaju - SE",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "10 clubes disputam a primeira fase em turno único, totalizando 9 rodadas.",
      "O líder da primeira fase se classifica diretamente para as semifinais.",
      "Nas quartas de final: 2º x 7º, 3º x 6º e 4º x 5º, em jogo único.",
      "As semifinais e a final são disputadas em jogos de ida e volta.",
      "Em caso de empate em jogo único ou no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const RORAIMA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 24001,
    name: "Roraima",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Roraima",
    teams: [
      "São Raimundo - RR",
      "Monte Roraima - RR",
      "GAS - RR",
      "Baré - RR",
      "River - RR",
      "Progresso - RR",
      "Rio Negro - RR",
      "Náutico - RR",
      "Atlético - RR",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "9 clubes disputam a primeira fase em turno único, totalizando 8 rodadas.",
      "Os 4 melhores colocados avançam ao mata-mata.",
      "Semifinais e final são disputadas em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const RONDONIA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 23001,
    name: "Rondônia",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Rondônia",
    teams: [
      "Ji Paraná - RO",
      "Porto Velho - RO",
      "Guaporé - RO",
      "Rondoniense - RO",
      "Barcelona - RO",
      "Genus - RO",
      "União Cacoalense - RO",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "7 clubes disputam a primeira fase em turno e returno, totalizando 12 rodadas.",
      "Os 4 melhores colocados avançam às semifinais.",
      "As semifinais são disputadas em jogos de ida e volta: 1º x 4º e 2º x 3º.",
      "A final é disputada em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];
const PIAUI_CHAMPIONSHIPS: Championship[] = [
  {
    id: 21001,
    name: "Piauí",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Piauí",
    teams: [
      "Atlético - PI",
      "Piauí - PI",
      "Fluminense - PI",
      "AE Altos - PI",
      "Oeirense - PI",
      "TEC - PI",
      "Corisabba - PI",
      "Parnahhyba - PI",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "8 clubes disputam a primeira fase em turno único, totalizando 7 rodadas.",
      "Os 4 melhores colocados avançam ao mata-mata.",
      "Semifinais e final são disputadas em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const PARA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 16001,
    name: "Pará",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Pará",
    teams: [
      "Cametá - PA",
      "Capitão Poço - PA",
      "Paysandu - PA",
      "Águia de Marabá - PA",
      "Remo - PA",
      "Tuna Luso - PA",
      "Castanhal - PA",
      "Santa Rosa - PA",
      "São Raimundo - PA",
      "Amazonia IFC - PA",
      "Bragantino - PA",
      "São Francisco - PA",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "12 clubes disputam a primeira fase em turno único, totalizando 11 rodadas.",
      "Os 8 melhores colocados avançam ao mata-mata.",
      "Quartas de final, semifinais e final são disputadas em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const SAO_PAULO_CHAMPIONSHIPS: Championship[] = [
  {
    id: 19001,
    name: "São Paulo",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "São Paulo",
    teams: [
      "Novorizontino - SP",
      "Palmeiras - SP",
      "Red Bull Bragantino - SP",
      "Portuguesa - SP",
      "Corinthians - SP",
      "São Paulo - SP",
      "Capivariano - SP",
      "Santos - SP",
      "Guarani - SP",
      "Botafogo - SP",
      "Mirassol - SP",
      "Primavera - SP",
      "São Bernardo - SP",
      "Noroeste - SP",
      "Velo Clube - SP",
      "Ponte Preta - SP",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "16 clubes são divididos por sorteio em quatro potes de 4 equipes.",
      "Cada clube enfrenta os 3 adversários do próprio pote e mais 5 adversários de outros potes, em turno único, totalizando 8 jogos.",
      "Os 8 melhores colocados avançam às quartas de final.",
      "Quartas de final e semifinais são disputadas em jogo único.",
      "A final é disputada em jogos de ida e volta.",
      "Empate em jogo único ou no agregado da final é decidido automaticamente nos pênaltis.",
    ],
  },
];

const PARANA_CHAMPIONSHIPS: Championship[] = [{
    id: 18001, name: "Paraná", season: "2026", division: "1ª Divisão", country: "Brasil", state: "Paraná",
    teams: ["Londrina - PR","Foz do Iguaçu - PR","Athletico - PR","São Joseense - PR","Maringá - PR","FC Cascavel - PR","Azuriz - PR","Coritiba - PR","Cianorte - PR","Operário - PR","Andraus - PR","Galo Maringá - PR"],
    phases: ["Primeira fase","Quartas de final","Semi final","Final"],
    rules: [
      "12 clubes são divididos por sorteio em dois grupos de 6.",
      "Cada equipe enfrenta exclusivamente as 6 equipes do outro grupo, em turno único, totalizando 6 jogos por equipe.",
      "Os 4 melhores de cada grupo avançam ao mata-mata, totalizando 8 classificados.",
      "Quartas de final, semifinais e final são disputadas em jogos de ida e volta.",
      "Empate no placar agregado é decidido automaticamente nos pênaltis."
    ]
  }];

const PARAIBA_CHAMPIONSHIPS: Championship[] = [
  {
    id: 17001,
    name: "Paraíba",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Paraíba",
    teams: [
      "Botafogo - PB",
      "Campinense - PB",
      "Sousa - PB",
      "Serra Branca - PB",
      "Nacional de Patos - PB",
      "Treze - PB",
      "EC de Patos - PB",
      "Atlético Cajazeirense - PB",
      "Confiança - PB",
      "Pombal - PB",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "10 clubes disputam a primeira fase em turno único, totalizando 9 rodadas.",
      "Os 4 melhores colocados avançam ao mata-mata.",
      "As semifinais são disputadas em jogos de ida e volta.",
      "A final é disputada em jogos de ida e volta.",
      "Em caso de empate no placar agregado, a decisão é definida automaticamente nos pênaltis.",
    ],
  },
];

const MINAS_GERAIS_CHAMPIONSHIPS: Championship[] = [
  {
    id: 15001,
    name: "Minas Gerais",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Minas Gerais",
    teams: [
      "Atlético - MG",
      "URT - MG",
      "Uberlândia - MG",
      "Democrata GV - MG",
      "América - MG",
      "Pouso Alegre - MG",
      "Tombense - MG",
      "Betim Futebol - MG",
      "Cruzeiro - MG",
      "North - MG",
      "Itabirito - MG",
      "Athletic - MG",
    ],
    phases: ["Primeira fase", "Semi final", "Final"],
    rules: [
      "12 clubes são divididos por sorteio em 3 grupos de 4.",
      "Na primeira fase, cada equipe enfrenta somente adversários dos outros grupos, sem enfrentar equipes do próprio grupo, totalizando 8 jogos por equipe.",
      "O líder de cada grupo e o melhor segundo colocado geral avançam às semifinais.",
      "Semifinais em jogos de ida e volta.",
      "Final em jogo único.",
      "Empate no placar agregado das semifinais gera pênaltis automaticamente.",
      "Empate na final em jogo único gera pênaltis automaticamente.",
    ],
  },
];

const MATO_GROSSO_CHAMPIONSHIPS: Championship[] = [
  {
    id: 14001,
    name: "Mato Grosso",
    season: "2026",
    division: "1ª Divisão",
    country: "Brasil",
    state: "Mato Grosso",
    teams: [
      "Luverdense - MT",
      "Mixto - MT",
      "Operário VG - MT",
      "Sport Sinop - MT",
      "Cuiabá - MT",
      "Nova Mutum - MT",
      "Chapada - MT",
      "União Rondonópolis - MT",
      "Primavera AC - MT",
      "Várzea Grande - MT",
    ],
    phases: ["Primeira fase", "Quartas de final", "Semi final", "Final"],
    rules: [
      "10 clubes disputam a primeira fase em turno único, com 9 rodadas.",
      "1º e 2º colocados avançam diretamente às semifinais.",
      "3º x 6º e 4º x 5º disputam as quartas de final em jogo único.",
      "Os vencedores das quartas enfrentam 1º e 2º colocados nas semifinais.",
      "Semifinais e final são disputadas em jogos de ida e volta.",
      "Empate em jogo único ou no placar agregado é decidido automaticamente nos pênaltis.",
    ],
  },
];

const PERNAMBUCO_CHAMPIONSHIPS: Championship[] = [{
  id: 20001, name: "Pernambuco", season: "2026", division: "1ª Divisão", country: "Brasil", state: "Pernambuco",
  teams: ["Afogados - PE","1° de Maio - PE","Petrolina - PE","Salgueiro - PE","Ferroviário do Cabo - PE","Facilnet - PE","Pesqueira - PE","Belo Jardim - PE","Central - PE","Ypiranga - PE","Porto - PE","Chã Grande - PE","Águia de Cumaru - PE","Centro Limoeirense - PE","Atlético Pernambucano - PE","Santa Fé - PE","Serrano - PE","Jaguar - PE","América - PE","Íbis - PE","Ipojuca - PE","Sete de Setembro - PE","Guarany de Camaragibe - PE","Vera Cruz - PE","Sport - PE","Retrô - PE","Decisão - PE","Náutico - PE","Santa Cruz - PE","Maguary - PE","Vitória das Tabocas - PE"],
  phases: ["1º Turno - Fase de grupos","1º Turno - Oitavas de final","1º Turno - Quartas de final","1º Turno - Quadrangular final","2º Turno - Fase de grupos","2º Turno - Segunda fase","2º Turno - Semifinal","2º Turno - Final"],
  rules: ["Torneio Frevo: 24 clubes em quatro grupos de 6, com jogos dentro do próprio grupo em turno único.","Os 4 melhores de cada grupo avançam às oitavas de final, em jogo único e em dois blocos: A/B e C/D.","Quartas de final em jogo único e regionalizadas. Empates nas oitavas e quartas são decididos automaticamente nos pênaltis.","Os quatro vencedores das quartas formam um quadrangular final em turno único. Os 3 melhores avançam ao Torneio Forró.","Torneio Forró: os 3 classificados do primeiro turno juntam-se a Sport, Retrô, Decisão, Náutico, Santa Cruz, Maguary e Vitória das Tabocas.","Na fase principal do segundo turno são dois grupos de 5, com cada clube enfrentando apenas os clubes do outro grupo.","Os líderes avançam diretamente às semifinais. 2º x 3º de cada grupo disputam a segunda fase em ida e volta dentro do próprio grupo.","Semifinais e final são disputadas em ida e volta. Empates no agregado são decididos automaticamente nos pênaltis."]
}];

const SERIE_D_CHAMPIONSHIPS: Championship[] = [
  {
    id: 31001,
    name: "Série D",
    season: "2026",
    division: "Série D",
    country: "Brasil",
    teams: [
      "ABC - RN",
      "ABECAT - GO",
      "Água Santa - SP",
      "Águia de Marabá - PA",
      "Altos - PI",
      "America - RJ",
      "América - RN",
      "Aparecidense - GO",
      "Araguaína - TO",
      "ASA - AL",
      "Atlético - CE",
      "Alagoinhas - BA",
      "Azuriz - PR",
      "Betim Futebol - MG",
      "Brasil de Pelotas - RS",
      "Brasiliense - DF",
      "Blumenau - SC",
      "Capital - DF",
      "Ceilândia - DF",
      "Central - PE",
      "Cianorte - PR",
      "CRAC - GO",
      "CSA - AL",
      "CSE - AL",
      "Decisão Goiana - PE",
      "Democrata GV - MG",
      "FC Cascavel - PR",
      "Ferroviário - CE",
      "Fluminense - PI",
      "Galvez - AC",
      "Gama - DF",
      "GAS - RR",
      "Porto Velho - RO",
      "Goiatuba - GO",
      "Guaporé - RO",
      "Guarany de Bagé - RS",
      "Humaitá - AC",
      "IAPE - MA",
      "Iguatu - CE",
      "Imperatriz - MA",
      "Independência - AC",
      "Inhumas - GO",
      "Ivinhema - MS",
      "Jacuipense - BA",
      "Joinville - SC",
      "Juazeirense - BA",
      "Lagarto - SE",
      "Laguna - RN",
      "Luverdense - MT",
      "Madureira - RJ",
      "Maguary - PE",
      "Manauara - AM",
      "Manaus - AM",
      "Maracanã - CE",
      "Marcílio Dias - SC",
      "Maricá - RJ",
      "Mixto - MT",
      "Monte Roraima - RR",
      "Moto Club - MA",
      "Nacional - AM",
      "Noroeste - SP",
      "Nova Iguaçu - RJ",
      "Operário - MS",
      "Operário VG - MT",
      "Oratório - AP",
      "Parnahyba - PI",
      "Piauí - PI",
      "Porto - BA",
      "Portuguesa - SP",
      "Portuguesa - RJ",
      "Pouso Alegre - MG",
      "Primavera - MT",
      "Real Noroeste - ES",
      "Retrô - PE",
      "Rio Branco - ES",
      "Sampaio Corrêa - MA",
      "Sampaio Corrêa - RJ",
      "Santa Catarina - SC",
      "São José - RS",
      "São Joseense - PR",
      "São Luiz - RS",
      "São Raimundo - RR",
      "Sergipe - SE",
      "Serra Branca - PB",
      "Sousa - PB",
      "Tirol - CE",
      "Tocantinópolis - TO",
      "Tombense - MG",
      "Trem - AP",
      "Treze - PB",
      "Tuna Luso - PA",
      "Uberlândia - MG",
      "União Rondonópolis - MT",
      "Velo Clube - SP",
      "Vitória - ES",
      "XV de Piracicaba - SP",
    ],
    phases: ["Primeira fase", "Segunda fase", "Terceira fase", "Oitavas de final", "Quartas de final", "Semifinal", "Final"],
    rules: [
      "96 clubes disputam a primeira fase, divididos aleatoriamente pelo sistema em 16 grupos de 6 clubes.",
      "A primeira fase é disputada em turno e returno dentro de cada grupo, totalizando 10 rodadas por grupo.",
      "Os 4 primeiros colocados de cada grupo avançam à segunda fase, formando 64 clubes.",
      "A partir da segunda fase, todos os confrontos eliminatórios são disputados em jogos de ida e volta.",
      "Em caso de empate no placar agregado de qualquer confronto eliminatório, a decisão é definida automaticamente nos pênaltis.",
      "Os quatro clubes que chegarem à semifinal conquistam o acesso à Série C da temporada seguinte.",
      "Os dois clubes da final disputam o título da Série D em jogos de ida e volta.",
      "Os resultados e os grupos são gerados automaticamente pelo sistema quando a temporada é simulada.",
    ],
  },
];

const SERIE_A_CHAMPIONSHIPS: Championship[] = [
  {
    id: 28001,
    name: "Série A",
    season: "2026",
    division: "Série A",
    country: "Brasil",
    teams: [
      "Flamengo - RJ",
      "Palmeiras - SP",
      "Athletico - PR",
      "Fluminense - RJ",
      "Bahia - BA",
      "Cruzeiro - MG",
      "Atlético - MG",
      "Santos - SP",
      "Coritiba - PR",
      "São Paulo - SP",
      "Red Bull Bragantino - SP",
      "Botafogo - RJ",
      "Vitória - BA",
      "Corinthians - SP",
      "Mirassol - SP",
      "Vasco da Gama - RJ",
      "Grêmio - RS",
      "Internacional - RS",
      "Remo - PA",
      "Chapecoense - SC",
    ],
    phases: ["Primeira fase"],
    rules: [
      "20 clubes disputam a competição em turno e returno, totalizando 38 rodadas e 380 partidas.",
      "O campeão é o clube que terminar a 38ª rodada com mais pontos na classificação geral.",
      "Os 4 últimos colocados da classificação final são rebaixados para a Série B.",
      "Os resultados são gerados automaticamente pelo sistema quando a temporada é simulada.",
    ],
  },
];

const SERIE_B_CHAMPIONSHIPS: Championship[] = [
  {
    id: 29001,
    name: "Série B",
    season: "2026",
    division: "Série B",
    country: "Brasil",
    teams: [
      "Vila Nova - GO",
      "Juventude - RS",
      "Novorizontino - SP",
      "Criciúma - SC",
      "Fortaleza - CE",
      "Atlético - GO",
      "CRB - AL",
      "Operário - PR",
      "Sport - PE",
      "Cuiabá - MT",
      "São Bernardo - SP",
      "Goiás - GO",
      "Náutico - PE",
      "Athletic - MG",
      "Ceará - CE",
      "Botafogo - SP",
      "Avaí - SC",
      "Londrina - PR",
      "América - MG",
      "Ponte Preta - SP",
    ],
    phases: ["Primeira fase", "Play-off de acesso"],
    rules: [
      "20 clubes disputam a competição em turno e returno, totalizando 38 rodadas e 380 partidas.",
      "Os 2 primeiros colocados ao final da 38ª rodada sobem diretamente para a Série A.",
      "O 3º enfrenta o 6º e o 4º enfrenta o 5º em play-offs de ida e volta pelas 2 últimas vagas de acesso.",
      "Os 4 últimos colocados da classificação final são rebaixados para a Série C.",
      "Os jogos do play-off não alteram a classificação da primeira fase.",
      "Empates no agregado dos play-offs são decididos automaticamente nos pênaltis.",
    ],
  },
];

const SERIE_C_CHAMPIONSHIPS: Championship[] = [
  {
    id: 30001,
    name: "Série C",
    season: "2026",
    division: "Série C",
    country: "Brasil",
    teams: [
      "Botafogo - PB",
      "Brusque - SC",
      "Ferroviária - SP",
      "Maringá - PR",
      "Floresta - CE",
      "Inter de Limeira - SP",
      "Paysandu - PA",
      "Santa Cruz - PE",
      "Ypiranga de Erechim - RS",
      "Guarani - SP",
      "Figueirense - SC",
      "Maranhão - MA",
      "Amazonas - AM",
      "Caxias - RS",
      "Ituano - SP",
      "Volta Redonda - RJ",
      "Barra - SC",
      "Anápolis - GO",
      "Itabaiana - SE",
      "Confiança - SE",
    ],
    phases: ["Primeira fase", "Segunda fase", "Final"],
    rules: [
      "20 clubes disputam a primeira fase em turno único, totalizando 19 rodadas e 190 partidas.",
      "Os 8 primeiros colocados da primeira fase avançam para a segunda fase.",
      "Na segunda fase, os classificados são distribuídos em dois grupos de 4: Grupo A = 1º, 3º, 5º e 7º; Grupo B = 2º, 4º, 6º e 8º.",
      "A pontuação é zerada no início da segunda fase.",
      "Os clubes de cada grupo jogam entre si em turno e returno, totalizando 6 rodadas por grupo.",
      "Os 2 primeiros colocados de cada grupo conquistam o acesso à Série B.",
      "Os líderes dos dois grupos disputam a final em jogos de ida e volta.",
      "Em caso de empate no placar agregado da final, a decisão é definida automaticamente nos pênaltis.",
      "Os 4 últimos colocados da primeira fase são rebaixados para a Série D.",
      "Os resultados são gerados automaticamente pelo sistema quando a temporada é simulada.",
    ],
  },
];

const INITIAL_CHAMPIONSHIPS: Championship[] = [
  ...SERIE_A_CHAMPIONSHIPS,
  ...SERIE_B_CHAMPIONSHIPS,
  ...SERIE_C_CHAMPIONSHIPS,
  ...SERIE_D_CHAMPIONSHIPS,
  ...ACRE_CHAMPIONSHIPS,
  ...ALAGOAS_CHAMPIONSHIPS,
  ...AMAPA_CHAMPIONSHIPS,
  ...AMAZONAS_CHAMPIONSHIPS,
  ...BAHIA_CHAMPIONSHIPS,
  ...DISTRITO_FEDERAL_CHAMPIONSHIPS,
  ...ESPIRITO_SANTO_CHAMPIONSHIPS,
  ...RIO_DE_JANEIRO_CHAMPIONSHIPS,
  ...SANTA_CATARINA_CHAMPIONSHIPS,
  ...CEARA_CHAMPIONSHIPS,
  ...RIO_GRANDE_DO_SUL_CHAMPIONSHIPS,
  ...GOIAS_CHAMPIONSHIPS,
  ...MARANHAO_CHAMPIONSHIPS,
  ...MINAS_GERAIS_CHAMPIONSHIPS,
  ...PARA_CHAMPIONSHIPS,
  ...PARAIBA_CHAMPIONSHIPS,
  ...PARANA_CHAMPIONSHIPS,
  ...SAO_PAULO_CHAMPIONSHIPS,
  ...MATO_GROSSO_CHAMPIONSHIPS,
  ...PERNAMBUCO_CHAMPIONSHIPS,
  ...PIAUI_CHAMPIONSHIPS,
  ...RIO_GRANDE_DO_NORTE_CHAMPIONSHIPS,
  ...RONDONIA_CHAMPIONSHIPS,
  ...RORAIMA_CHAMPIONSHIPS,
  ...SERGIPE_CHAMPIONSHIPS,
  ...MATO_GROSSO_DO_SUL_CHAMPIONSHIPS,
  ...TOCANTINS_CHAMPIONSHIPS,
];

const STORAGE_KEY = "football-manager-clean-v2";

export default function App() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [clubHistory, setClubHistory] = useState<Record<string, ClubHistoryEntry[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [estaduaisOpen, setEstaduaisOpen] = useState(false);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [season, setSeason] = useState("2026");
  const [division, setDivision] = useState("Estadual");
  const [selectedPhase, setSelectedPhase] = useState<Record<number, string>>({});
  const [selectedSection, setSelectedSection] = useState<Record<number, "competition" | "rules" | "clubs" | "movement" | "history" | "serieDNextSeason">>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("football-manager-club-history-v1");
      if (saved) setClubHistory(JSON.parse(saved) as Record<string, ClubHistoryEntry[]>);
    } catch {
      localStorage.removeItem("football-manager-club-history-v1");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("football-manager-club-history-v1", JSON.stringify(clubHistory));
  }, [clubHistory]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = (JSON.parse(saved) as Championship[]).filter((champ) => champ.id !== 1002 && !(champ.state === "Acre" && champ.division !== "1ª Divisão"));
        const merged = parsed.map((champ) => {
          const definition = INITIAL_CHAMPIONSHIPS.find((item) => item.id === champ.id);
          return definition
            ? {
                ...champ,
                name: definition.name,
                country: definition.country,
                state: definition.state,
                division: definition.division,
                teams: champ.teams?.length ? champ.teams : definition.teams,
                phases: definition.phases,
                rules: definition.rules,
              }
            : champ;
        });

        for (const definition of INITIAL_CHAMPIONSHIPS) {
          if (!merged.some((champ) => champ.id === definition.id)) {
            merged.push(definition);
          }
        }

        setChampionships(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } else {
        setChampionships(INITIAL_CHAMPIONSHIPS);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(championships));
  }, [championships]);

  // Guarda automaticamente o campeão de cada temporada para formar o histórico.
  useEffect(() => {
    setClubHistory((current) => {
      let changed = false;
      const next = { ...current };

      for (const championship of championships) {
        const table =
          championship.standings ??
          championship.phaseStandings?.["Primeira fase"] ??
          {};
        const ordered = Object.keys(table).length
          ? sortStandingTeams(championship.teams ?? Object.keys(table), table)
          : [];

        if (!ordered.length && !championship.champion && !(championship.accessTeams?.length) && !(championship.relegatedTeams?.length)) {
          continue;
        }

        for (const club of championship.teams ?? []) {
          const position = ordered.indexOf(club) >= 0 ? ordered.indexOf(club) + 1 : undefined;
          const champion = championship.champion === club;
          const access = (championship.division === "Série D"
            ? getSerieDSemifinalists(championship)
            : championship.accessTeams ?? []
          ).includes(club);
          const relegated = (championship.relegatedTeams ?? []).includes(club);

          if (!position && !champion && !access && !relegated) continue;

          const entry: ClubHistoryEntry = {
            competitionId: championship.id,
            competition: championship.name,
            country: championship.country,
            state: championship.state,
            division: championship.division,
            season: championship.season,
            position,
            champion,
            access,
            relegated,
          };

          const key = String(club);
          const previous = next[key] ?? [];
          const existingIndex = previous.findIndex(
            (item) => item.competitionId === entry.competitionId && item.season === entry.season
          );

          if (existingIndex >= 0) {
            const old = previous[existingIndex];
            if (JSON.stringify(old) !== JSON.stringify(entry)) {
              const updatedEntries = [...previous];
              updatedEntries[existingIndex] = entry;
              next[key] = updatedEntries;
              changed = true;
            }
          } else {
            next[key] = [...previous, entry].sort(
              (a, b) => Number(b.season) - Number(a.season) || b.competitionId - a.competitionId
            );
            changed = true;
          }
        }
      }

      return changed ? next : current;
    });
  }, [championships]);

  useEffect(() => {
    let changed = false;
    const updated = championships.map((championship) => {
      if (!championship.champion) return championship;

      const history = { ...(championship.championHistory ?? {}) };
      if (history[championship.season] === championship.champion) {
        return championship;
      }

      history[championship.season] = championship.champion;
      changed = true;
      return {
        ...championship,
        championHistory: history,
      };
    });

    if (changed) {
      setChampionships(updated);
    }
  }, [championships]);

  const selected = championships.find((c) => c.id === selectedId) ?? null;
  const estadualChampionships = championships.filter((champ) => champ.state);
  const stateNames = [...new Set([...estadualChampionships.map((champ) => champ.state!), ...INITIAL_CHAMPIONSHIPS.map((champ) => champ.state!).filter(Boolean), "Rondônia"])].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));

  function openClubHistory(club: string) {
    setSelectedClub(club);
  }

  function clubLink(club: string, className = "club-link") {
    return (
      <button
        type="button"
        className={className}
        onClick={() => openClubHistory(club)}
        title={`Ver histórico de ${club}`}
      >
        {club}
      </button>
    );
  }

  function drawAmazonasGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Amazonas") return;
    const championshipId = championship.id;

    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const groups = {
      A: teams.slice(0, 4),
      B: teams.slice(4, 8),
    };

    const updated: Championship = {
      ...championship,
      amazonasGroups: groups,
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      firstTurnWinner: undefined,
      secondTurnWinner: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === selectedId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "1º Turno",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function drawRioGrandeDoSulGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Rio Grande do Sul") return;
    const championshipId = championship.id;
    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const updated: Championship = {
      ...championship,
      rioGrandeDoSulGroups: { A: teams.slice(0, 6), B: teams.slice(6, 12) },
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === championshipId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "Primeira fase",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function drawCearaGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Ceará") return;
    const championshipId = championship.id;
    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const updated: Championship = {
      ...championship,
      cearaGroups: { A: teams.slice(0, 5), B: teams.slice(5, 10) },
      cearaSecondGroups: undefined,
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
      accessTeams: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === championshipId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "Primeira fase",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function drawMinasGeraisGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Minas Gerais") return;
    const championshipId = championship.id;
    const teams = [...(championship.teams ?? [])];

    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const updated: Championship = {
      ...championship,
      minasGeraisGroups: {
        A: teams.slice(0, 4),
        B: teams.slice(4, 8),
        C: teams.slice(8, 12),
      },
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
      accessTeams: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === championshipId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "Primeira fase",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function drawSaoPauloPots() {
    const championship = championships.find(item => item.id === selectedId);
    if (!championship || championship.state !== "São Paulo") return;
    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }
    const updated: Championship = {
      ...championship,
      saoPauloPots: {
        A: teams.slice(0, 4),
        B: teams.slice(4, 8),
        C: teams.slice(8, 12),
        D: teams.slice(12, 16),
      },
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
      accessTeams: undefined,
    };
    setChampionships(current => current.map(item => item.id === championship.id ? updated : item));
    setSelectedPhase(current => ({...current,[championship.id]:"Primeira fase"}));
    setSelectedSection(current => ({...current,[championship.id]:"competition"}));
  }

  function drawPernambucoGroups() {
    const championship=championships.find(item=>item.id===selectedId); if(!championship||championship.state!=="Pernambuco") return;
    const pre=["Sport - PE","Retrô - PE","Decisão - PE","Náutico - PE","Santa Cruz - PE","Maguary - PE","Vitória das Tabocas - PE"];
    const t=(championship.teams??[]).filter(x=>!pre.includes(x)); for(let i=t.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]];}
    const updated={...championship,pernambucoGroups:{A:t.slice(0,6),B:t.slice(6,12),C:t.slice(12,18),D:t.slice(18,24)},pernambucoSecondGroups:undefined,standings:undefined,phaseStandings:undefined,phaseMatches:undefined,champion:undefined};
    setChampionships(cur=>cur.map(x=>x.id===championship.id?updated:x));setSelectedPhase(cur=>({...cur,[championship.id]:"1º Turno - Fase de grupos"}));setSelectedSection(cur=>({...cur,[championship.id]:"competition"}));
  }

  function drawParanaGroups() {
    const championship=championships.find(item=>item.id===selectedId);
    if(!championship || championship.state!=="Paraná") return;
    const teams=[...(championship.teams??[])];
    for(let i=teams.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[teams[i],teams[j]]=[teams[j],teams[i]];}
    const updated={...championship,paranaGroups:{A:teams.slice(0,6),B:teams.slice(6,12)},standings:undefined,phaseStandings:undefined,phaseMatches:undefined,champion:undefined,accessTeams:undefined};
    setChampionships(current=>current.map(item=>item.id===championship.id?updated:item));
    setSelectedPhase(current=>({...current,[championship.id]:"Primeira fase"}));
    setSelectedSection(current=>({...current,[championship.id]:"competition"}));
  }

  function drawSantaCatarinaGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Santa Catarina") return;
    const championshipId = championship.id;
    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const updated: Championship = {
      ...championship,
      santaCatarinaGroups: { A: teams.slice(0, 6), B: teams.slice(6, 12) },
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === championshipId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "Primeira fase",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function drawRioDeJaneiroGroups() {
    const championship = championships.find((item) => item.id === selectedId);
    if (!championship || championship.state !== "Rio de Janeiro") return;
    const championshipId = championship.id;
    const teams = [...(championship.teams ?? [])];
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const updated: Championship = {
      ...championship,
      rioGroups: { A: teams.slice(0, 6), B: teams.slice(6, 12) },
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      firstTurnWinner: undefined,
      secondTurnWinner: undefined,
      champion: undefined,
    };

    setChampionships((current) =>
      current.map((item) => (item.id === championshipId ? updated : item))
    );
    setSelectedPhase((current) => ({
      ...current,
      [championshipId]: "Taça Guanabara",
    }));
    setSelectedSection((current) => ({
      ...current,
      [championshipId]: "competition",
    }));
  }

  function createChampionship() {
    const cleanName = name.trim();
    if (!cleanName) return;

    const championship: Championship = {
      id: Date.now(),
      name: cleanName,
      season: season.trim() || "2026",
      division,
      country: "Brasil",
    };

    setChampionships((current) => [...current, championship]);
    setSelectedId(championship.id);
    setName("");
    setShowCreate(false);
  }

  function deleteChampionship(id: number) {
    setChampionships((current) => current.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function getNextSeasonNationalDivision(season: string, club: string) {
    const currentA = championships.find((item) => item.country === "Brasil" && item.season === season && item.division === "Série A");
    const currentB = championships.find((item) => item.country === "Brasil" && item.season === season && item.division === "Série B");
    const currentC = championships.find((item) => item.country === "Brasil" && item.season === season && item.division === "Série C");
    const currentD = championships.find((item) => item.country === "Brasil" && item.season === season && item.division === "Série D");

    const aRelegated = currentA?.relegatedTeams ?? [];
    const bAccess = currentB?.accessTeams ?? [];
    const bRelegated = currentB?.relegatedTeams ?? [];
    const cAccess = currentC?.accessTeams ?? [];
    const cRelegated = currentC?.relegatedTeams ?? [];
    const dAccess = currentD ? getSerieDSemifinalists(currentD) : [];

    if (bAccess.includes(club)) return "Série A";
    if (aRelegated.includes(club)) return "Série B";
    if (cAccess.includes(club)) return "Série B";
    if (bRelegated.includes(club)) return "Série C";
    if (dAccess.includes(club)) return "Série C";
    if (cRelegated.includes(club)) return "Série D";

    if (currentA?.teams?.includes(club)) return "Série A";
    if (currentB?.teams?.includes(club)) return "Série B";
    if (currentC?.teams?.includes(club)) return "Série C";
    if (currentD?.teams?.includes(club)) return "Série D";

    const vacancy = calculateSerieDStateVacancies(championships, season);
    const state = championships.find(
      (item) =>
        item.country === "Brasil" &&
        item.season === season &&
        item.state &&
        (item.teams ?? []).includes(club)
    )?.state;

    if (state) {
      const stateVacancy = vacancy.find((item) => item.state === state);
      if (stateVacancy?.selected.includes(club)) return "Série D";
      if (stateVacancy?.guaranteedRelegated.includes(club)) return "Série D";
    }

    return "Sem divisão nacional";
  }

  function getClubStateInfo(state: string, season: string, club: string) {
    const stateChampionships = championships.filter((item) => item.country === "Brasil" && item.state === state && item.season === season && item.division !== "Estadual").sort((a, b) => {
      const divisionA = Number.parseInt(a.division.match(/\\d+/)?.[0] ?? "99", 10);
      const divisionB = Number.parseInt(b.division.match(/\\d+/)?.[0] ?? "99", 10);
      return divisionA - divisionB;
    });
    const stateChampionship = stateChampionships.find((item) => (item.teams ?? []).includes(club));
    const nationalChampionship = championships.find((item) => item.country === "Brasil" && item.season === season && ["Série A", "Série B", "Série C", "Série D"].includes(item.division) && (item.teams ?? []).includes(club));
    const nationalRanking = nationalChampionship
      ? sortStandingTeams(nationalChampionship.teams ?? [], nationalChampionship.standings ?? nationalChampionship.phaseStandings?.["Primeira fase"] ?? {})
      : [];
    const nationalFinalTableReady = Boolean(nationalChampionship && (nationalChampionship.standings || nationalChampionship.phaseStandings?.["Primeira fase"]));
    const serieARelegated = Boolean(
      nationalChampionship?.division === "Série A" &&
      nationalFinalTableReady &&
      nationalRanking.slice(-4).includes(club)
    );
    const serieDGuaranteedRelegated = getSerieDGuaranteedRelegated(championships, season);
    const vacancy = calculateSerieDStateVacancies(championships, season).find((item) => item.state === state);
    const firstDivision = stateChampionships.find((item) => item.division === "1ª Divisão");
    const firstDivisionRanking = firstDivision ? getStateChampionshipRanking(championships, state, season) : [];
    const rankingPosition = firstDivisionRanking.indexOf(club) + 1;
    const hasFinalRanking = Boolean(firstDivision && (firstDivision.standings || firstDivision.phaseStandings?.["Primeira fase"]));

    const nextNationalDivision = getNextSeasonNationalDivision(season, club);

    let serieDStatus = "NÃO APTO";
    let serieDReason = "Fora da 1ª divisão estadual.";

    if (nextNationalDivision === "Série C" && getSerieDSemifinalists(championships.find((item) => item.country === "Brasil" && item.season === season && item.division === "Série D") ?? { division: "Série D", country: "Brasil", name: "", season } as Championship).includes(club)) {
      serieDStatus = "ACESSO À SÉRIE C";
      serieDReason = "Chegou à semifinal da Série D e disputará a Série C na próxima temporada.";
    } else if (serieDGuaranteedRelegated.includes(club)) {
      serieDStatus = "GARANTIDO NA SÉRIE D";
      serieDReason = "Rebaixado da Série C na temporada anterior. Vaga garantida na Série D seguinte.";
    } else if (nationalChampionship?.division === "Série D" && nextNationalDivision === "Série D") {
      serieDStatus = "SÉRIE D";
      serieDReason = "Permanece na Série D na próxima temporada.";
    } else if (nextNationalDivision !== "Sem divisão nacional") {
      serieDStatus = "NÃO APTO";
      serieDReason = "Disputará a " + nextNationalDivision + " na próxima temporada.";
    } else if (stateChampionship?.division !== "1ª Divisão") {
      serieDStatus = "NÃO APTO";
      serieDReason = "Precisa estar na 1ª divisão estadual para disputar a vaga estadual.";
    } else if (!hasFinalRanking) {
      serieDStatus = "EM DEFINIÇÃO";
      serieDReason = "A classificação final do estadual ainda não foi definida.";
    } else if (vacancy?.selected.includes(club)) {
      serieDStatus = "APTO";
      serieDReason = "Está dentro das " + vacancy.slots + " vagas estaduais previstas para " + state + " na próxima temporada.";
    } else if (rankingPosition > 0 && vacancy) {
      serieDStatus = "NÃO APTO";
      serieDReason = "Está fora das " + vacancy.slots + " vagas estaduais da Série D para a próxima temporada.";
    }

    return {
      stateDivision: stateChampionship?.division ?? "Não inscrito",
      nationalDivision: nextNationalDivision,
      rankingPosition,
      serieDStatus,
      serieDReason
    };
  }

  function getStateClubsForSeason(state: string, season: string) {
    const clubs = new Set<string>();
    championships.filter((item) => item.country === "Brasil" && item.state === state && item.season === season && item.teams?.length).forEach((item) => (item.teams ?? []).forEach((club) => clubs.add(club)));
    return [...clubs].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function getRowClass(championship: Championship, phase: string, index: number) {
    if (
      championship.country === "Brasil" &&
      championship.division === "Série B" &&
      phase === "Primeira fase"
    ) {
      if (index < 2) return "zone-promotion";
      if (index < 6) return "zone-playoff";
      if (index >= 16) return "zone-relegation";
    }

    // Na Série C, os 8 primeiros avançam à segunda fase e os 4 últimos são rebaixados para a Série D.
    if (
      championship.country === "Brasil" &&
      championship.division === "Série C" &&
      phase === "Primeira fase"
    ) {
      if (index < 8) return "zone-second-phase";
      if (index >= 16) return "zone-relegation";
    }

    // Na Série A, os 4 últimos da classificação final são rebaixados para a Série B.
    if (
      championship.country === "Brasil" &&
      championship.division === "Série A" &&
      phase === "Primeira fase" &&
      index >= 16
    ) {
      return "zone-relegation";
    }

    if (
      championship.state === "Amazonas" &&
      championship.division === "1ª Divisão" &&
      (phase === "1º Turno" || phase === "2º Turno")
    ) {
      if (index === 0) return "amazonas-group-first";
      if (index === 1 || index === 2) return "amazonas-group-qualified";
    }

    // No Espírito Santo, os 8 primeiros avançam às quartas de final.
    if (
      championship.state === "Espírito Santo" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase" &&
      index < 8
    ) {
      return "zone-second-phase";
    }

    // Em Goiás, os 8 primeiros da primeira fase avançam às quartas de final.
    if (
      championship.state === "Goiás" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase" &&
      index < 8
    ) {
      return "zone-second-phase";
    }

    if (
      championship.state === "Minas Gerais" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase"
    ) {
      return "";
    }

    if (
      championship.state === "Mato Grosso do Sul" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase"
    ) {
      if (index < 2) return "mato-grosso-do-sul-direct-semi";
      if (index < 6) return "mato-grosso-do-sul-quarterfinal";
    }

    if (
      championship.state === "Mato Grosso" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase"
    ) {
      if (index < 2) return "mato-grosso-direct-semi";
      if (index < 6) return "mato-grosso-quarterfinal";
    }

    if (
      championship.state === "Sergipe" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase"
    ) {
      if (index === 0) return "sergipe-direct-semi";
      if (index < 7) return "sergipe-quarterfinal";
    }

    if (
      championship.state === "Rio Grande do Norte" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase"
    ) {
      if (index < 2) return "rn-direct-semi";
      if (index < 6) return "rn-quarterfinal";
    }

    // Em São Paulo, os 8 primeiros da primeira fase avançam às quartas de final.
    if (championship.state === "São Paulo" && championship.division === "1ª Divisão" && phase === "Primeira fase" && index < 8) {
      return "zone-second-phase";
    }

    // No Pará, os 8 primeiros da primeira fase avançam às quartas de final.
    if (
      championship.state === "Pará" &&
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase" &&
      index < 8
    ) {
      return "zone-second-phase";
    }

    // Nas primeiras divisões estaduais com 4 classificados, os 4 primeiros avançam ao mata-mata.
    if (
      championship.division === "1ª Divisão" &&
      phase === "Primeira fase" &&
      index < 4
    ) {
      return "zone-second-phase";
    }

    return "";
  }

  function simulateRoundRobin(teams: string[]) {
    const table: Record<string, Standing> = {};
    teams.forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const home = teams[i];
        const away = teams[j];
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);

        table[home].j++;
        table[away].j++;
        table[home].gp += homeGoals;
        table[home].gc += awayGoals;
        table[away].gp += awayGoals;
        table[away].gc += homeGoals;

        if (homeGoals > awayGoals) {
          table[home].v++;
          table[home].pts += 3;
          table[away].d++;
        } else if (homeGoals < awayGoals) {
          table[away].v++;
          table[away].pts += 3;
          table[home].d++;
        } else {
          table[home].e++;
          table[away].e++;
          table[home].pts++;
          table[away].pts++;
        }
      }
    }

    Object.values(table).forEach((row) => {
      row.sg = row.gp - row.gc;
    });
    return table;
  }

  function simulateRoundRobinWithMatches(teams: string[]) {
    const table: Record<string, Standing> = {};
    const matches: Matchup[] = [];
    teams.forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const home = teams[i];
        const away = teams[j];
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);

        matches.push({ home, away, homeScore: homeGoals, awayScore: awayGoals });

        table[home].j++;
        table[away].j++;
        table[home].gp += homeGoals;
        table[home].gc += awayGoals;
        table[away].gp += awayGoals;
        table[away].gc += homeGoals;

        if (homeGoals > awayGoals) {
          table[home].v++;
          table[home].pts += 3;
          table[away].d++;
        } else if (homeGoals < awayGoals) {
          table[away].v++;
          table[away].pts += 3;
          table[home].d++;
        } else {
          table[home].e++;
          table[away].e++;
          table[home].pts++;
          table[away].pts++;
        }
      }
    }

    Object.values(table).forEach((row) => {
      row.sg = row.gp - row.gc;
    });

    return { table, matches };
  }

  function simulateDoubleRoundRobin(teams: string[]) {
    const table: Record<string, Standing> = {};
    const matches: Matchup[] = [];
    teams.forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    const buildLeg = (reverseHome: boolean, roundOffset: number) => {
      const rotation = [...teams];
      for (let r = 0; r < teams.length - 1; r++) {
        for (let i = 0; i < teams.length / 2; i++) {
          const first = rotation[i];
          const second = rotation[teams.length - 1 - i];
          const home = reverseHome ? second : first;
          const away = reverseHome ? first : second;
          const homeGoals = Math.floor(Math.random() * 5);
          const awayGoals = Math.floor(Math.random() * 5);

          matches.push({
            home,
            away,
            homeScore: homeGoals,
            awayScore: awayGoals,
            round: roundOffset + r + 1,
          });

          table[home].j++;
          table[away].j++;
          table[home].gp += homeGoals;
          table[home].gc += awayGoals;
          table[away].gp += awayGoals;
          table[away].gc += homeGoals;

          if (homeGoals > awayGoals) {
            table[home].v++;
            table[home].pts += 3;
            table[away].d++;
          } else if (homeGoals < awayGoals) {
            table[away].v++;
            table[away].pts += 3;
            table[home].d++;
          } else {
            table[home].e++;
            table[away].e++;
            table[home].pts++;
            table[away].pts++;
          }
        }

        const fixed = rotation[0];
        const rest = rotation.slice(1);
        rest.unshift(rest.pop()!);
        rotation.splice(0, rotation.length, fixed, ...rest);
      }
    };

    buildLeg(false, 0);
    buildLeg(true, teams.length - 1);

    Object.values(table).forEach((row) => {
      row.sg = row.gp - row.gc;
    });

    return { table, matches };
  }

  function sortStandingTeams(teams: string[], table: Record<string, Standing> = {}) {
    return [...teams].sort((a, b) => {
      const A = table[a] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      const B = table[b] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });
  }

  function sortedTeams(championship: Championship) {
    const teams = championship.teams ?? [];
    const table = championship.standings ?? {};
    return [...teams].sort((a, b) => {
      const A = table[a] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      const B = table[b] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });
  }

  function generateSemiFinals(teams: string[]) {
    if (teams.length < 4) return [];
    return [
      { home: teams[0], away: teams[3] },
      { home: teams[1], away: teams[2] },
    ];
  }

  function automaticPenaltyShootout(home: string, away: string) {
    let homeGoals = 0;
    let awayGoals = 0;

    for (let i = 0; i < 5; i++) {
      if (Math.random() < 0.75) homeGoals++;
      if (Math.random() < 0.75) awayGoals++;
    }

    while (homeGoals === awayGoals) {
      if (Math.random() < 0.75) homeGoals++;
      if (Math.random() < 0.75) awayGoals++;
    }

    return {
      home: homeGoals,
      away: awayGoals,
      winner: homeGoals > awayGoals ? home : away,
    };
  }

  function resolveKnockoutTie(match: Matchup) {
    if (match.homeScore === undefined || match.awayScore === undefined) return match;
    if (match.homeScore !== match.awayScore) return match;

    const shootout = automaticPenaltyShootout(match.home, match.away);
    return {
      ...match,
      penaltyHome: shootout.home,
      penaltyAway: shootout.away,
      penaltyWinner: shootout.winner,
    };
  }

  // Partida de ida/volta: o resultado do jogo NÃO gera pênaltis.
  // O desempate é feito somente pelo placar agregado após a segunda partida.
  function simulateKnockoutMatch(home: string, away: string): Matchup {
    return {
      home,
      away,
      homeScore: Math.floor(Math.random() * 5),
      awayScore: Math.floor(Math.random() * 5),
    };
  }

  // Jogo único: empate no tempo regulamentar gera pênaltis automaticamente.
  function simulateSingleKnockoutMatch(home: string, away: string): Matchup {
    const match: Matchup = {
      home,
      away,
      homeScore: Math.floor(Math.random() * 5),
      awayScore: Math.floor(Math.random() * 5),
    };

    return resolveKnockoutTie(match);
  }

  function resolveTwoLeggedTie(leg1: Matchup, leg2: Matchup) {
    const totalHome = (leg1.homeScore ?? 0) + (leg2.awayScore ?? 0);
    const totalAway = (leg1.awayScore ?? 0) + (leg2.homeScore ?? 0);

    if (totalHome !== totalAway) {
      return totalHome > totalAway ? leg1.home : leg1.away;
    }

    if (leg2.penaltyWinner) return leg2.penaltyWinner;

    const shootout = automaticPenaltyShootout(leg2.home, leg2.away);
    leg2.penaltyHome = shootout.home;
    leg2.penaltyAway = shootout.away;
    leg2.penaltyWinner = shootout.winner;
    return shootout.winner;
  }

  function simulateAcreFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const firstStandings = simulateRoundRobin(teams);
    const ordered = [...teams].sort((a, b) => {
      const A = firstStandings[a];
      const B = firstStandings[b];
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });

    const qualified = ordered.slice(0, 4);
    const semiPairs = [
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ];

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];

    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);

      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatch = semiWinners.length === 2
      ? [simulateSingleKnockoutMatch(semiWinners[0], semiWinners[1])]
      : [];

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatch,
      },
    };
  }

  function simulateAmapaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];
    const semiPairs = [
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ];

    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    if (semiWinners.length === 2) {
      const finalLeg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const finalLeg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      resolveTwoLeggedTie(finalLeg1, finalLeg2);
      finalMatches.push(finalLeg1, finalLeg2);
    }

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
    };
  }

  function simulateAlagoasFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const semiPairs = [
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ];

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];

    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    if (semiWinners.length === 2) {
      const finalLeg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const finalLeg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      resolveTwoLeggedTie(finalLeg1, finalLeg2);
      finalMatches.push(finalLeg1, finalLeg2);
    }

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
    };
  }

  function simulateAmazonasFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 8) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const drawnGroups = championship.amazonasGroups
      ? championship.amazonasGroups
      : (() => {
          const drawn = shuffle(teams);
          return { A: drawn.slice(0, 4), B: drawn.slice(4, 8) };
        })();

    const groupA = drawnGroups.A;
    const groupB = drawnGroups.B;

    function simulateCrossGroup(firstGroup: string[], secondGroup: string[]) {
      const table: Record<string, Standing> = {};
      [...firstGroup, ...secondGroup].forEach((team) => {
        table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      });
      for (const home of firstGroup) {
        for (const away of secondGroup) {
          const match = simulateKnockoutMatch(home, away);
          const hg = match.homeScore ?? 0;
          const ag = match.awayScore ?? 0;
          table[home].j++; table[away].j++;
          table[home].gp += hg; table[home].gc += ag;
          table[away].gp += ag; table[away].gc += hg;
          if (hg > ag) { table[home].v++; table[away].d++; table[home].pts += 3; }
          else if (hg < ag) { table[away].v++; table[home].d++; table[away].pts += 3; }
          else { table[home].e++; table[away].e++; table[home].pts++; table[away].pts++; }
        }
      }
      Object.values(table).forEach((row) => { row.sg = row.gp - row.gc; });
      return table;
    }

    function winnerOf(match: Matchup) {
      return match.penaltyWinner ?? (
        (match.homeScore ?? 0) > (match.awayScore ?? 0) ? match.home : match.away
      );
    }

    function simulateTurn(crossGroup: boolean) {
      const table = crossGroup
        ? simulateCrossGroup(groupA, groupB)
        : { ...simulateRoundRobin(groupA), ...simulateRoundRobin(groupB) };
      const orderedA = sortStandingTeams(groupA, table);
      const orderedB = sortStandingTeams(groupB, table);

      const quarterMatches = [
        simulateSingleKnockoutMatch(orderedA[1], orderedB[2]),
        simulateSingleKnockoutMatch(orderedB[1], orderedA[2]),
      ];
      const quarterWinners = quarterMatches.map(winnerOf);

      const semiMatches = [
        simulateSingleKnockoutMatch(orderedA[0], quarterWinners[0]),
        simulateSingleKnockoutMatch(orderedB[0], quarterWinners[1]),
      ];
      const semiWinners = semiMatches.map(winnerOf);
      const finalMatch = simulateSingleKnockoutMatch(semiWinners[0], semiWinners[1]);

      return {
        table,
        quarterMatches,
        semiMatches,
        finalMatch,
        winner: winnerOf(finalMatch),
      };
    }

    const firstTurn = simulateTurn(true);
    const secondTurn = simulateTurn(false);
    const finalMatches: Matchup[] = [];

    if (firstTurn.winner !== secondTurn.winner) {
      finalMatches.push(simulateSingleKnockoutMatch(firstTurn.winner, secondTurn.winner));
    }

    return {
      ...championship,
      standings: firstTurn.table,
      amazonasGroups: drawnGroups,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "1º Turno": firstTurn.table,
        "2º Turno": secondTurn.table,
        "1º Turno - Grupo A": Object.fromEntries(groupA.map((team) => [team, firstTurn.table[team]])),
        "1º Turno - Grupo B": Object.fromEntries(groupB.map((team) => [team, firstTurn.table[team]])),
        "2º Turno - Grupo A": Object.fromEntries(groupA.map((team) => [team, secondTurn.table[team]])),
        "2º Turno - Grupo B": Object.fromEntries(groupB.map((team) => [team, secondTurn.table[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final - 1º Turno": firstTurn.quarterMatches,
        "Semi final - 1º Turno": firstTurn.semiMatches,
        "Final do 1º Turno": [firstTurn.finalMatch],
        "Quartas de final - 2º Turno": secondTurn.quarterMatches,
        "Semi final - 2º Turno": secondTurn.semiMatches,
        "Final do 2º Turno": [secondTurn.finalMatch],
        "Final geral": finalMatches,
      },
      firstTurnWinner: firstTurn.winner,
      secondTurnWinner: secondTurn.winner,
    };
  }

  function simulateBahiaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 4) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];

    for (const [teamA, teamB] of [
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ]) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    let champion: string | undefined;

    if (semiWinners.length === 2) {
      const finalLeg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const finalLeg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      finalMatches.push(finalLeg1, finalLeg2);
      champion = resolveTwoLeggedTie(finalLeg1, finalLeg2);
    }

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
      champion,
    };
  }

  function simulateDistritoFederalFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 4) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];

    for (const [teamA, teamB] of [
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ]) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    let champion: string | undefined;

    if (semiWinners.length === 2) {
      const finalLeg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const finalLeg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      finalMatches.push(finalLeg1, finalLeg2);
      champion = resolveTwoLeggedTie(finalLeg1, finalLeg2);
    }

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
      champion,
    };
  }

  function simulateEspiritoSantoFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 8) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 8);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const quarter = simulateTwoLeggedRound([
      [qualified[0], qualified[7]],
      [qualified[1], qualified[6]],
      [qualified[2], qualified[5]],
      [qualified[3], qualified[4]],
    ]);

    const semi = simulateTwoLeggedRound([
      [quarter.winners[0], quarter.winners[3]],
      [quarter.winners[1], quarter.winners[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarter.matches,
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateRioDeJaneiroFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 12) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const groups = championship.rioGroups
      ? championship.rioGroups
      : (() => {
          const drawn = shuffle(teams);
          return { A: drawn.slice(0, 6), B: drawn.slice(6, 12) };
        })();

    const table: Record<string, Standing> = {};
    [...groups.A, ...groups.B].forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    for (const home of groups.A) {
      for (const away of groups.B) {
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);
        const h = table[home];
        const a = table[away];

        h.j++; a.j++;
        h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
        a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

        if (homeGoals > awayGoals) {
          h.v++; a.d++; h.pts += 3;
        } else if (homeGoals < awayGoals) {
          a.v++; h.d++; a.pts += 3;
        } else {
          h.e++; a.e++; h.pts++; a.pts++;
        }
      }
    }

    const groupAOrdered = sortStandingTeams(groups.A, table);
    const groupBOrdered = sortStandingTeams(groups.B, table);
    const groupLeaders = [groupAOrdered[0], groupBOrdered[0]];
    const tacaGuanabaraWinner = sortStandingTeams(groupLeaders, table)[0];

    const quarterPairs: [string, string][] = [
      [groupAOrdered[0], groupAOrdered[3]],
      [groupAOrdered[1], groupAOrdered[2]],
      [groupBOrdered[0], groupBOrdered[3]],
      [groupBOrdered[1], groupBOrdered[2]],
    ];

    const quarterMatches: Matchup[] = [];
    const quarterWinners: string[] = [];
    const quarterLosers: string[] = [];

    for (const [home, away] of quarterPairs) {
      const match = simulateSingleKnockoutMatch(home, away);
      quarterMatches.push(match);
      const winner = match.penaltyWinner ?? (
        (match.homeScore ?? 0) >= (match.awayScore ?? 0) ? home : away
      );
      quarterWinners.push(winner);
      quarterLosers.push(winner === home ? away : home);
    }

    const semiTeams = shuffle(quarterWinners);
    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];
    for (const [teamA, teamB] of [
      [semiTeams[0], semiTeams[1]],
      [semiTeams[2], semiTeams[3]],
    ] as [string, string][]) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const guanabaraFinal = semiWinners.length === 2
      ? [simulateSingleKnockoutMatch(semiWinners[0], semiWinners[1])]
      : [];

    const rioTeams = shuffle(quarterLosers);
    const rioSemiMatches: Matchup[] = [];
    const rioSemiWinners: string[] = [];
    for (const [teamA, teamB] of [
      [rioTeams[0], rioTeams[1]],
      [rioTeams[2], rioTeams[3]],
    ] as [string, string][]) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      rioSemiMatches.push(leg1, leg2);
      rioSemiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const rioFinal = rioSemiWinners.length === 2
      ? [simulateSingleKnockoutMatch(rioSemiWinners[0], rioSemiWinners[1])]
      : [];

    return {
      ...championship,
      rioGroups: groups,
      standings: table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Taça Guanabara - Grupo A": Object.fromEntries(groupAOrdered.map((team) => [team, table[team]])),
        "Taça Guanabara - Grupo B": Object.fromEntries(groupBOrdered.map((team) => [team, table[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarterMatches,
        "Semi final - Taça Guanabara": semiMatches,
        "Final - Taça Guanabara": guanabaraFinal,
        "Semi final - Taça Rio": rioSemiMatches,
        "Final - Taça Rio": rioFinal,
      },
      firstTurnWinner: tacaGuanabaraWinner,
      champion: guanabaraFinal[0]?.penaltyWinner ?? (
        guanabaraFinal[0]
          ? ((guanabaraFinal[0].homeScore ?? 0) > (guanabaraFinal[0].awayScore ?? 0)
            ? guanabaraFinal[0].home
            : guanabaraFinal[0].away)
          : undefined
      ),
    };
  }

  function simulatePernambucoFirstDivision(championship: Championship): Championship {
    const pre = ["Sport - PE","Retrô - PE","Decisão - PE","Náutico - PE","Santa Cruz - PE","Maguary - PE","Vitória das Tabocas - PE"];
    const first = (championship.teams??[]).filter(t=>!pre.includes(t)).slice(0,24);
    if(first.length!==24) return championship;
    const shuffle=(a:string[])=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
    const groups=championship.pernambucoGroups??(()=>{const d=shuffle(first);return {A:d.slice(0,6),B:d.slice(6,12),C:d.slice(12,18),D:d.slice(18,24)}})();
    const sim=(list:string[])=>{const table:Record<string,Standing>={};const matches:Matchup[]=[];list.forEach(t=>table[t]={j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0});for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const home=list[i],away=list[j],hg=Math.floor(Math.random()*5),ag=Math.floor(Math.random()*5),h=table[home],a=table[away];h.j++;a.j++;h.gp+=hg;h.gc+=ag;h.sg=h.gp-h.gc;a.gp+=ag;a.gc+=hg;a.sg=a.gp-a.gc;if(hg>ag){h.v++;a.d++;h.pts+=3}else if(hg<ag){a.v++;h.d++;a.pts+=3}else{h.e++;a.e++;h.pts++;a.pts++}matches.push({home,away,homeScore:hg,awayScore:ag})}return {table,matches};};
    const ps:Record<string,Record<string,Standing>>={},pm:Record<string,Matchup[]>={};
    for(const l of ["A","B","C","D"] as const){const r=sim(groups[l]);ps[`1º Turno - Grupo ${l}`]=r.table;pm["1º Turno - Fase de grupos"]=[...(pm["1º Turno - Fase de grupos"]??[]),...r.matches];}
    const g={A:sortStandingTeams(groups.A,ps["1º Turno - Grupo A"]),B:sortStandingTeams(groups.B,ps["1º Turno - Grupo B"]),C:sortStandingTeams(groups.C,ps["1º Turno - Grupo C"]),D:sortStandingTeams(groups.D,ps["1º Turno - Grupo D"])};
    const win=(m:Matchup)=>m.penaltyWinner??((m.homeScore??0)>(m.awayScore??0)?m.home:m.away);
    const ko=(pairs:[string,string][])=>pairs.map(([h,a])=>resolveKnockoutTie(simulateKnockoutMatch(h,a)));
    const oit=ko([[g.A[0],g.B[3]],[g.A[1],g.B[2]],[g.A[2],g.B[1]],[g.A[3],g.B[0]],[g.C[0],g.D[3]],[g.C[1],g.D[2]],[g.C[2],g.D[1]],[g.C[3],g.D[0]]]);
    pm["1º Turno - Oitavas de final"]=oit;
    const q=ko([[win(oit[0]),win(oit[3])],[win(oit[1]),win(oit[2])],[win(oit[4]),win(oit[7])],[win(oit[5]),win(oit[6])]]);
    pm["1º Turno - Quartas de final"]=q;
    const qr=q.map(win), quad=sim(qr); ps["1º Turno - Quadrangular final"]=quad.table;pm["1º Turno - Quadrangular final"]=quad.matches;
    const qord=sortStandingTeams(qr,quad.table), second=shuffle([...qord.slice(0,3),...pre]), sg={A:second.slice(0,5),B:second.slice(5,10)};
    ps["2º Turno - Grupo A"]={};ps["2º Turno - Grupo B"]={};const sm:Matchup[]=[];
    for(const h of sg.A)for(const a of sg.B){const hg=Math.floor(Math.random()*5),ag=Math.floor(Math.random()*5),ht=(ps["2º Turno - Grupo A"][h]??={j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0}),at=(ps["2º Turno - Grupo B"][a]??={j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0});ht.j++;at.j++;ht.gp+=hg;ht.gc+=ag;ht.sg=ht.gp-ht.gc;at.gp+=ag;at.gc+=hg;at.sg=at.gp-at.gc;if(hg>ag){ht.v++;at.d++;ht.pts+=3}else if(hg<ag){at.v++;ht.d++;at.pts+=3}else{ht.e++;at.e++;ht.pts++;at.pts++}sm.push({home:h,away:a,homeScore:hg,awayScore:ag})}
    pm["2º Turno - Fase de grupos"]=sm;
    const A=sortStandingTeams(sg.A,ps["2º Turno - Grupo A"]),B=sortStandingTeams(sg.B,ps["2º Turno - Grupo B"]),sp=ko([[A[1],A[2]],[B[1],B[2]]]);pm["2º Turno - Segunda fase"]=sp;
    const l11=simulateKnockoutMatch(A[0],win(sp[0])),l12=simulateKnockoutMatch(win(sp[0]),A[0]),l21=simulateKnockoutMatch(B[0],win(sp[1])),l22=simulateKnockoutMatch(win(sp[1]),B[0]);pm["2º Turno - Semifinal"]=[l11,l12,l21,l22];
    const sw1=resolveTwoLeggedTie(l11,l12),sw2=resolveTwoLeggedTie(l21,l22),f1=simulateKnockoutMatch(sw1,sw2),f2=simulateKnockoutMatch(sw2,sw1),champion=resolveTwoLeggedTie(f1,f2);pm["2º Turno - Final"]=[f1,f2];
    return {...championship,pernambucoGroups:groups,pernambucoSecondGroups:sg,standings:quad.table,phaseStandings:ps,phaseMatches:pm,champion};
  }

  function simulateParanaFirstDivision(championship: Championship): Championship {
  const teams = championship.teams ?? [];
  if (teams.length < 12) return championship;
  const shuffle = (items: string[]) => {
    const r=[...items]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r;
  };
  const groups = championship.paranaGroups ?? (()=>{const d=shuffle(teams);return {A:d.slice(0,6),B:d.slice(6,12)};})();
  const table: Record<string, Standing> = {};
  [...groups.A,...groups.B].forEach(t=>table[t]={j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0});
  for(const home of groups.A) for(const away of groups.B){
    const hg=Math.floor(Math.random()*5), ag=Math.floor(Math.random()*5), h=table[home], a=table[away];
    h.j++;a.j++;h.gp+=hg;h.gc+=ag;h.sg=h.gp-h.gc;a.gp+=ag;a.gc+=hg;a.sg=a.gp-a.gc;
    if(hg>ag){h.v++;a.d++;h.pts+=3;}else if(hg<ag){a.v++;h.d++;a.pts+=3;}else{h.e++;a.e++;h.pts++;a.pts++;}
  }
  const A=sortStandingTeams(groups.A,table), B=sortStandingTeams(groups.B,table), qa=A.slice(0,4), qb=B.slice(0,4);
  const twoLegs=(pairs:[string,string][])=>{
    const matches:Matchup[]=[], winners:string[]=[];
    for(const [x,y] of pairs){const l1=simulateKnockoutMatch(x,y),l2=simulateKnockoutMatch(y,x);matches.push(l1,l2);winners.push(resolveTwoLeggedTie(l1,l2));}
    return {matches,winners};
  };
  const q=twoLegs([[qa[0],qb[3]],[qa[1],qb[2]],[qb[0],qa[3]],[qb[1],qa[2]]]);
  const s=twoLegs([[q.winners[0],q.winners[3]],[q.winners[1],q.winners[2]]]);
  const fin=twoLegs([[s.winners[0],s.winners[1]]]);
  return {...championship,paranaGroups:groups,standings:table,
    phaseStandings:{...(championship.phaseStandings??{}),"Primeira fase - Grupo A":Object.fromEntries(A.map(t=>[t,table[t]])),"Primeira fase - Grupo B":Object.fromEntries(B.map(t=>[t,table[t]]))},
    phaseMatches:{...(championship.phaseMatches??{}),"Quartas de final":q.matches,"Semi final":s.matches,"Final":fin.matches},
    accessTeams:[...qa,...qb],champion:fin.winners[0]};
}

function simulateSaoPauloFirstDivision(championship: Championship): Championship {
  const teams = championship.teams ?? [];
  if (teams.length < 16) return championship;

  const shuffle = (items: string[]) => {
    const r = [...items];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  const pots = championship.saoPauloPots ?? (() => {
    const drawn = shuffle(teams);
    return { A: drawn.slice(0,4), B: drawn.slice(4,8), C: drawn.slice(8,12), D: drawn.slice(12,16) };
  })();

  const table: Record<string, Standing> = {};
  teams.forEach(team => table[team] = { j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0 });

  const played = new Set<string>();
  const play = (home:string, away:string) => {
    const key=[home,away].sort().join("|");
    if(played.has(key)) return;
    played.add(key);
    const hg=Math.floor(Math.random()*5), ag=Math.floor(Math.random()*5);
    const h=table[home], a=table[away];
    h.j++; a.j++; h.gp+=hg; h.gc+=ag; h.sg=h.gp-h.gc; a.gp+=ag; a.gc+=hg; a.sg=a.gp-a.gc;
    if(hg>ag){h.v++;a.d++;h.pts+=3;}else if(hg<ag){a.v++;h.d++;a.pts+=3;}else{h.e++;a.e++;h.pts++;a.pts++;}
  };

  const potList=[pots.A,pots.B,pots.C,pots.D];

  // Os 3 rivais do próprio pote.
  for(const pot of potList) for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) play(pot[i],pot[j]);

  // Cinco rodadas de confrontos entre potes. Em cada rodada todos os clubes
  // disputam exatamente um jogo contra outro pote, garantindo 8 jogos por clube.
  const potPairings = [
    [[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]],
    [[0,1],[2,3]], [[0,2],[1,3]]
  ] as [number,number][][];
  for(let round=0;round<5;round++){
    for(const [pa,pb] of potPairings[round]){
      const left=potList[pa], right=potList[pb];
      const offset=Math.floor(Math.random()*4);
      for(let i=0;i<4;i++) play(left[i],right[(i+offset)%4]);
    }
  }

  const ordered=sortStandingTeams(teams,table);
  const qualified=ordered.slice(0,8);
  const single=(home:string,away:string)=>resolveKnockoutTie(simulateKnockoutMatch(home,away));
  const winner=(m:Matchup)=>m.penaltyWinner ?? ((m.homeScore??0)>(m.awayScore??0)?m.home:m.away);

  const q1=single(qualified[0],qualified[7]);
  const q2=single(qualified[3],qualified[4]);
  const q3=single(qualified[1],qualified[6]);
  const q4=single(qualified[2],qualified[5]);
  const s1=single(winner(q1),winner(q2));
  const s2=single(winner(q3),winner(q4));
  const final1=simulateKnockoutMatch(winner(s1),winner(s2));
  const final2=simulateKnockoutMatch(winner(s2),winner(s1));
  const finalWinner=resolveTwoLeggedTie(final1,final2);

  return {
    ...championship,
    saoPauloPots:pots,
    standings:table,
    phaseStandings:{...(championship.phaseStandings??{}),"Primeira fase":table},
    phaseMatches:{...(championship.phaseMatches??{}),"Quartas de final":[q1,q2,q3,q4],"Semi final":[s1,s2],"Final":[final1,final2]},
    champion:finalWinner,
  };
}

function simulateSantaCatarinaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 12) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const groups = championship.santaCatarinaGroups
      ? championship.santaCatarinaGroups
      : (() => {
          const drawn = shuffle(teams);
          return { A: drawn.slice(0, 6), B: drawn.slice(6, 12) };
        })();

    const table: Record<string, Standing> = {};
    [...groups.A, ...groups.B].forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    // Primeira fase: cada equipe enfrenta as 6 equipes do grupo oposto.
    for (const home of groups.A) {
      for (const away of groups.B) {
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);
        const h = table[home];
        const a = table[away];

        h.j++; a.j++;
        h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
        a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

        if (homeGoals > awayGoals) {
          h.v++; a.d++; h.pts += 3;
        } else if (homeGoals < awayGoals) {
          a.v++; h.d++; a.pts += 3;
        } else {
          h.e++; a.e++; h.pts++; a.pts++;
        }
      }
    }

    const groupAOrdered = sortStandingTeams(groups.A, table);
    const groupBOrdered = sortStandingTeams(groups.B, table);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    // Quartas: apenas times do mesmo grupo se enfrentam.
    const quarter = simulateTwoLeggedRound([
      [groupAOrdered[0], groupAOrdered[3]],
      [groupAOrdered[1], groupAOrdered[2]],
      [groupBOrdered[0], groupBOrdered[3]],
      [groupBOrdered[1], groupBOrdered[2]],
    ]);

    const semi = simulateTwoLeggedRound([
      [quarter.winners[0], quarter.winners[3]],
      [quarter.winners[1], quarter.winners[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      santaCatarinaGroups: groups,
      standings: table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase - Grupo A": Object.fromEntries(groupAOrdered.map((team) => [team, table[team]])),
        "Primeira fase - Grupo B": Object.fromEntries(groupBOrdered.map((team) => [team, table[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarter.matches,
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateCearaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 10) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const groups = championship.cearaGroups
      ? championship.cearaGroups
      : (() => {
          const drawn = shuffle(teams);
          return { A: drawn.slice(0, 5), B: drawn.slice(5, 10) };
        })();

    const simulateGroupRoundRobin = (group: string[]) => {
      const table: Record<string, Standing> = {};
      group.forEach((team) => {
        table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
      });

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const home = group[i];
          const away = group[j];
          const homeGoals = Math.floor(Math.random() * 5);
          const awayGoals = Math.floor(Math.random() * 5);
          const h = table[home];
          const a = table[away];

          h.j++; a.j++;
          h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
          a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

          if (homeGoals > awayGoals) {
            h.v++; a.d++; h.pts += 3;
          } else if (homeGoals < awayGoals) {
            a.v++; h.d++; a.pts += 3;
          } else {
            h.e++; a.e++; h.pts++; a.pts++;
          }
        }
      }

      return table;
    };

    const groupATable = simulateGroupRoundRobin(groups.A);
    const groupBTable = simulateGroupRoundRobin(groups.B);
    const groupAOrdered = sortStandingTeams(groups.A, groupATable);
    const groupBOrdered = sortStandingTeams(groups.B, groupBTable);

    // Os seis classificados da primeira fase são sorteados novamente,
    // independentemente dos grupos A e B originais.
    const qualified = [
      ...groupAOrdered.slice(0, 3),
      ...groupBOrdered.slice(0, 3),
    ];
    const secondDraw = shuffle(qualified);
    const secondGroups = {
      C: secondDraw.slice(0, 3),
      D: secondDraw.slice(3, 6),
    };

    const secondPhaseTable: Record<string, Standing> = {};
    [...secondGroups.C, ...secondGroups.D].forEach((team) => {
      secondPhaseTable[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    for (const home of secondGroups.C) {
      for (const away of secondGroups.D) {
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);
        const h = secondPhaseTable[home];
        const a = secondPhaseTable[away];

        h.j++; a.j++;
        h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
        a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

        if (homeGoals > awayGoals) {
          h.v++; a.d++; h.pts += 3;
        } else if (homeGoals < awayGoals) {
          a.v++; h.d++; a.pts += 3;
        } else {
          h.e++; a.e++; h.pts++; a.pts++;
        }
      }
    }

    const groupCOrdered = sortStandingTeams(secondGroups.C, secondPhaseTable);
    const groupDOrdered = sortStandingTeams(secondGroups.D, secondPhaseTable);

    const semiPairs: [string, string][] = [
      [groupCOrdered[0], groupDOrdered[1]],
      [groupDOrdered[0], groupCOrdered[1]],
    ];

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];
    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    let champion: string | undefined;
    if (semiWinners.length === 2) {
      const finalLeg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const finalLeg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      finalMatches.push(finalLeg1, finalLeg2);
      champion = resolveTwoLeggedTie(finalLeg1, finalLeg2);
    }

    return {
      ...championship,
      cearaGroups: groups,
      cearaSecondGroups: secondGroups,
      standings: secondPhaseTable,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase - Grupo A": Object.fromEntries(groupAOrdered.map((team) => [team, groupATable[team]])),
        "Primeira fase - Grupo B": Object.fromEntries(groupBOrdered.map((team) => [team, groupBTable[team]])),
        "Segunda fase - Grupo C": Object.fromEntries(groupCOrdered.map((team) => [team, secondPhaseTable[team]])),
        "Segunda fase - Grupo D": Object.fromEntries(groupDOrdered.map((team) => [team, secondPhaseTable[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
      champion,
      accessTeams: semiWinners,
    };
  }


  function simulateGoiasFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 8) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 8);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const quarter = simulateTwoLeggedRound([
      [qualified[0], qualified[7]],
      [qualified[1], qualified[6]],
      [qualified[2], qualified[5]],
      [qualified[3], qualified[4]],
    ]);

    const semi = simulateTwoLeggedRound([
      [quarter.winners[0], quarter.winners[3]],
      [quarter.winners[1], quarter.winners[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarter.matches,
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateMaranhaoFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 4) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const semi = simulateTwoLeggedRound([
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateParaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 8) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 8);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const quarter = simulateTwoLeggedRound([
      [qualified[0], qualified[7]],
      [qualified[1], qualified[6]],
      [qualified[2], qualified[5]],
      [qualified[3], qualified[4]],
    ]);

    const semi = simulateTwoLeggedRound([
      [quarter.winners[0], quarter.winners[3]],
      [quarter.winners[1], quarter.winners[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarter.matches,
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateParaibaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 4) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const semi = simulateTwoLeggedRound([
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }


  function simulateRioGrandeDoNorteFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 8) return championship;

    const standings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, standings);

    const getWinner = (match: Matchup) =>
      match.penaltyWinner ?? ((match.homeScore ?? 0) > (match.awayScore ?? 0) ? match.home : match.away);

    const quarterMatches = [
      resolveKnockoutTie(simulateKnockoutMatch(ordered[2], ordered[5])),
      resolveKnockoutTie(simulateKnockoutMatch(ordered[3], ordered[4])),
    ];

    const playTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      const winner = resolveTwoLeggedTie(leg1, leg2);
      return { matches: [leg1, leg2], winner };
    };

    const semi1 = playTwoLegs(ordered[0], getWinner(quarterMatches[0]));
    const semi2 = playTwoLegs(ordered[1], getWinner(quarterMatches[1]));
    const final = playTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarterMatches,
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }


  function simulateTocantinsFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 8) return championship;

    const standings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, standings);
    const qualified = ordered.slice(0, 4);

    const playTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      return {
        matches: [leg1, leg2],
        winner: resolveTwoLeggedTie(leg1, leg2),
      };
    };

    const semi1 = playTwoLegs(qualified[0], qualified[3]);
    const semi2 = playTwoLegs(qualified[1], qualified[2]);
    const final = playTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }

function simulateMatoGrossoDoSulFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 10) return championship;

    const standings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, standings);

    const quarter1 = resolveKnockoutTie(simulateKnockoutMatch(ordered[2], ordered[5]));
    const quarter2 = resolveKnockoutTie(simulateKnockoutMatch(ordered[3], ordered[4]));

    const quarter1Winner = quarter1.penaltyWinner ?? (quarter1.homeScore! > quarter1.awayScore! ? quarter1.home : quarter1.away);
    const quarter2Winner = quarter2.penaltyWinner ?? (quarter2.homeScore! > quarter2.awayScore! ? quarter2.home : quarter2.away);

    const simulateTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      return {
        matches: [leg1, leg2],
        winner: resolveTwoLeggedTie(leg1, leg2),
      };
    };

    const semi1 = simulateTwoLegs(ordered[0], quarter2Winner);
    const semi2 = simulateTwoLegs(ordered[1], quarter1Winner);
    const final = simulateTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": [quarter1, quarter2],
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }

function simulateSergipeFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 10) return championship;

    const standings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, standings);
    const leader = ordered[0];

    const simulateTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      return {
        matches: [leg1, leg2],
        winner: resolveTwoLeggedTie(leg1, leg2),
      };
    };

    const quarter1 = resolveKnockoutTie(simulateKnockoutMatch(ordered[1], ordered[6]));
    const quarter2 = resolveKnockoutTie(simulateKnockoutMatch(ordered[2], ordered[5]));
    const quarter3 = resolveKnockoutTie(simulateKnockoutMatch(ordered[3], ordered[4]));

    const semi1 = simulateTwoLegs(leader, quarter3.penaltyWinner ?? (quarter3.homeScore! > quarter3.awayScore! ? quarter3.home : quarter3.away));
    const semi2 = simulateTwoLegs(
      quarter1.penaltyWinner ?? (quarter1.homeScore! > quarter1.awayScore! ? quarter1.home : quarter1.away),
      quarter2.penaltyWinner ?? (quarter2.homeScore! > quarter2.awayScore! ? quarter2.home : quarter2.away)
    );

    const final = simulateTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": [quarter1, quarter2, quarter3],
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }

function simulateRoraimaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 9) return championship;

    const standings = simulateRoundRobin(teams);

    const ordered = sortStandingTeams(teams, standings);
    const qualified = ordered.slice(0, 4);

    const playTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      const winner = resolveTwoLeggedTie(leg1, leg2);
      return { matches: [leg1, leg2], winner };
    };

    const semi1 = playTwoLegs(qualified[0], qualified[3]);
    const semi2 = playTwoLegs(qualified[1], qualified[2]);
    const final = playTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }

function simulateRondoniaFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length !== 7) return championship;

    const standings: Record<string, Standing> = {};
    teams.forEach((team) => {
      standings[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    // Turno + returno: cada clube enfrenta os outros 6 duas vezes.
    for (let leg = 0; leg < 2; leg++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const home = leg === 0 ? teams[i] : teams[j];
          const away = leg === 0 ? teams[j] : teams[i];
          const homeGoals = Math.floor(Math.random() * 5);
          const awayGoals = Math.floor(Math.random() * 5);

          standings[home].j++;
          standings[away].j++;
          standings[home].gp += homeGoals;
          standings[home].gc += awayGoals;
          standings[away].gp += awayGoals;
          standings[away].gc += homeGoals;

          if (homeGoals > awayGoals) {
            standings[home].v++;
            standings[home].pts += 3;
            standings[away].d++;
          } else if (homeGoals < awayGoals) {
            standings[away].v++;
            standings[away].pts += 3;
            standings[home].d++;
          } else {
            standings[home].e++;
            standings[away].e++;
            standings[home].pts++;
            standings[away].pts++;
          }
        }
      }
    }

    Object.values(standings).forEach((row) => {
      row.sg = row.gp - row.gc;
    });

    const ordered = sortStandingTeams(teams, standings);
    const qualified = ordered.slice(0, 4);

    const playTwoLegs = (home: string, away: string) => {
      const leg1 = simulateKnockoutMatch(home, away);
      const leg2 = simulateKnockoutMatch(away, home);
      const winner = resolveTwoLeggedTie(leg1, leg2);
      return { matches: [leg1, leg2], winner };
    };

    const semi1 = playTwoLegs(qualified[0], qualified[3]);
    const semi2 = playTwoLegs(qualified[1], qualified[2]);
    const final = playTwoLegs(semi1.winner, semi2.winner);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": standings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": [...semi1.matches, ...semi2.matches],
        "Final": final.matches,
      },
      champion: final.winner,
    };
  }

  function simulatePiauiFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 4) return championship;

    const firstStandings = simulateRoundRobin(teams);
    const ordered = sortStandingTeams(teams, firstStandings);
    const qualified = ordered.slice(0, 4);

    const simulateTwoLeggedRound = (pairings: [string, string][]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];

      for (const [teamA, teamB] of pairings) {
        const leg1 = simulateKnockoutMatch(teamA, teamB);
        const leg2 = simulateKnockoutMatch(teamB, teamA);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }

      return { matches, winners };
    };

    const semi = simulateTwoLeggedRound([
      [qualified[0], qualified[3]],
      [qualified[1], qualified[2]],
    ]);

    const final = simulateTwoLeggedRound([
      [semi.winners[0], semi.winners[1]],
    ]);

    return {
      ...championship,
      standings: firstStandings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstStandings,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semi.matches,
        "Final": final.matches,
      },
      champion: final.winners[0],
    };
  }

  function simulateMinasGeraisFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 12) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const groups = championship.minasGeraisGroups
      ? championship.minasGeraisGroups
      : (() => {
          const drawn = shuffle(teams);
          return {
            A: drawn.slice(0, 4),
            B: drawn.slice(4, 8),
            C: drawn.slice(8, 12),
          };
        })();

    const table: Record<string, Standing> = {};
    [...groups.A, ...groups.B, ...groups.C].forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    const play = (home: string, away: string) => {
      const homeGoals = Math.floor(Math.random() * 5);
      const awayGoals = Math.floor(Math.random() * 5);
      const h = table[home];
      const a = table[away];

      h.j++; a.j++;
      h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
      a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

      if (homeGoals > awayGoals) {
        h.v++; a.d++; h.pts += 3;
      } else if (homeGoals < awayGoals) {
        a.v++; h.d++; a.pts += 3;
      } else {
        h.e++; a.e++; h.pts++; a.pts++;
      }
    };

    // Cada clube enfrenta os 8 clubes dos outros dois grupos.
    for (const home of groups.A) {
      for (const away of [...groups.B, ...groups.C]) play(home, away);
    }
    for (const home of groups.B) {
      for (const away of groups.C) play(home, away);
    }

    const groupAOrdered = sortStandingTeams(groups.A, table);
    const groupBOrdered = sortStandingTeams(groups.B, table);
    const groupCOrdered = sortStandingTeams(groups.C, table);

    const leaders = [groupAOrdered[0], groupBOrdered[0], groupCOrdered[0]];
    const seconds = [groupAOrdered[1], groupBOrdered[1], groupCOrdered[1]];
    const bestSecond = sortStandingTeams(seconds, table)[0];

    const semiTeams = leaders.filter((team) => team !== bestSecond);
    const rankedLeaders = sortStandingTeams(semiTeams, table);

    const semiPairs: [string, string][] = [
      [rankedLeaders[0], bestSecond],
      [rankedLeaders[1], rankedLeaders[2]],
    ];

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];
    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    let finalMatches: Matchup[] = [];
    let champion: string | undefined;
    if (semiWinners.length === 2) {
      const final = simulateSingleKnockoutMatch(semiWinners[0], semiWinners[1]);
      finalMatches = [final];
      champion = final.penaltyWinner ?? (
        (final.homeScore ?? 0) > (final.awayScore ?? 0)
          ? final.home
          : final.away
      );
    }

    return {
      ...championship,
      minasGeraisGroups: groups,
      standings: table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase - Grupo A": Object.fromEntries(groupAOrdered.map((team) => [team, table[team]])),
        "Primeira fase - Grupo B": Object.fromEntries(groupBOrdered.map((team) => [team, table[team]])),
        "Primeira fase - Grupo C": Object.fromEntries(groupCOrdered.map((team) => [team, table[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
      accessTeams: [leaders[0], leaders[1], leaders[2], bestSecond],
      champion,
    };
  }

  function simulateMatoGrossoFirstDivision(championship: Championship): Championship {
  const teams = championship.teams ?? [];
  if (teams.length !== 10) return championship;

  const standings = simulateRoundRobin(teams);
  const ordered = sortStandingTeams(teams, standings);

  const quarters = [
    resolveKnockoutTie(simulateKnockoutMatch(ordered[2], ordered[5])),
    resolveKnockoutTie(simulateKnockoutMatch(ordered[3], ordered[4])),
  ];

  const getWinner = (match: Matchup) => {
    if (match.penaltyWinner) return match.penaltyWinner;
    return (match.homeScore ?? 0) > (match.awayScore ?? 0)
      ? match.home
      : match.away;
  };

  const playTwoLegs = (home: string, away: string) => {
    const firstLeg = simulateKnockoutMatch(home, away);
    const secondLeg = simulateKnockoutMatch(away, home);
    const winner = resolveTwoLeggedTie(firstLeg, secondLeg);
    return { matches: [firstLeg, secondLeg], winner };
  };

  const semi1 = playTwoLegs(ordered[0], getWinner(quarters[0]));
  const semi2 = playTwoLegs(ordered[1], getWinner(quarters[1]));
  const final = playTwoLegs(semi1.winner, semi2.winner);

  return {
    ...championship,
    standings,
    phaseStandings: {
      ...(championship.phaseStandings ?? {}),
      "Primeira fase": standings,
    },
    phaseMatches: {
      ...(championship.phaseMatches ?? {}),
      "Quartas de final": quarters,
      "Semi final": [...semi1.matches, ...semi2.matches],
      "Final": final.matches,
    },
    champion: final.winner,
  };
}

function simulateRioGrandeDoSulFirstDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (teams.length < 12) return championship;

    const shuffle = (items: string[]) => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const groups = championship.rioGrandeDoSulGroups
      ? championship.rioGrandeDoSulGroups
      : (() => {
          const drawn = shuffle(teams);
          return { A: drawn.slice(0, 6), B: drawn.slice(6, 12) };
        })();

    const table: Record<string, Standing> = {};
    [...groups.A, ...groups.B].forEach((team) => {
      table[team] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
    });

    // Primeira fase: Grupo A x Grupo B, turno único.
    for (const home of groups.A) {
      for (const away of groups.B) {
        const homeGoals = Math.floor(Math.random() * 5);
        const awayGoals = Math.floor(Math.random() * 5);
        const h = table[home];
        const a = table[away];

        h.j++; a.j++;
        h.gp += homeGoals; h.gc += awayGoals; h.sg = h.gp - h.gc;
        a.gp += awayGoals; a.gc += homeGoals; a.sg = a.gp - a.gc;

        if (homeGoals > awayGoals) {
          h.v++; a.d++; h.pts += 3;
        } else if (homeGoals < awayGoals) {
          a.v++; h.d++; a.pts += 3;
        } else {
          h.e++; a.e++; h.pts++; a.pts++;
        }
      }
    }

    const groupAOrdered = sortStandingTeams(groups.A, table);
    const groupBOrdered = sortStandingTeams(groups.B, table);
    const qualifiedA = groupAOrdered.slice(0, 4);
    const qualifiedB = groupBOrdered.slice(0, 4);

    // Quartas: jogo único. Confrontos entre equipes classificadas.
    const quarterPairs: [string, string][] = [
      [qualifiedA[0], qualifiedB[3]],
      [qualifiedA[1], qualifiedB[2]],
      [qualifiedB[0], qualifiedA[3]],
      [qualifiedB[1], qualifiedA[2]],
    ];

    const quarterMatches: Matchup[] = [];
    const quarterWinners: string[] = [];
    for (const [home, away] of quarterPairs) {
      const match = simulateSingleKnockoutMatch(home, away);
      quarterMatches.push(match);
      const winner = match.penaltyWinner ?? (
        (match.homeScore ?? 0) > (match.awayScore ?? 0) ? home : away
      );
      quarterWinners.push(winner);
    }

    const semiPairs: [string, string][] = [
      [quarterWinners[0], quarterWinners[3]],
      [quarterWinners[1], quarterWinners[2]],
    ];

    const semiMatches: Matchup[] = [];
    const semiWinners: string[] = [];
    for (const [teamA, teamB] of semiPairs) {
      const leg1 = simulateKnockoutMatch(teamA, teamB);
      const leg2 = simulateKnockoutMatch(teamB, teamA);
      semiMatches.push(leg1, leg2);
      semiWinners.push(resolveTwoLeggedTie(leg1, leg2));
    }

    const finalMatches: Matchup[] = [];
    let champion: string | undefined;
    if (semiWinners.length === 2) {
      const leg1 = simulateKnockoutMatch(semiWinners[0], semiWinners[1]);
      const leg2 = simulateKnockoutMatch(semiWinners[1], semiWinners[0]);
      finalMatches.push(leg1, leg2);
      champion = resolveTwoLeggedTie(leg1, leg2);
    }

    return {
      ...championship,
      rioGrandeDoSulGroups: groups,
      standings: table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase - Grupo A": Object.fromEntries(groupAOrdered.map((team) => [team, table[team]])),
        "Primeira fase - Grupo B": Object.fromEntries(groupBOrdered.map((team) => [team, table[team]])),
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Quartas de final": quarterMatches,
        "Semi final": semiMatches,
        "Final": finalMatches,
      },
      champion,
    };
  }

  function simulateGenericChampionship(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    if (!teams.length) return championship;

    const firstPhase = championship.phases?.[0] ?? "Classificação";
    const standings = simulateRoundRobin(teams);

    return {
      ...championship,
      standings,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        [firstPhase]: standings,
      },
    };
  }

  function simulateCompleteCountrySeason(country: string) {
    const countryChampionships = championships.filter(
      (championship) => championship.country === country
    );

    if (!countryChampionships.length) {
      window.alert("Não há campeonatos cadastrados para este país.");
      return;
    }

    const nationalDivisions = new Set(["Série A", "Série B", "Série C", "Série D"]);

    // ETAPA 1: todos os campeonatos estaduais são simulados primeiro.
    // Isso garante que os resultados estaduais estejam concluídos antes do início das divisões nacionais.
    let updated = championships.map((championship) => {
      if (championship.country !== country || nationalDivisions.has(championship.division)) {
        return championship;
      }

      if (championship.state === "Acre" && championship.division === "1ª Divisão") {
        return simulateAcreFirstDivision(championship);
      }
      if (championship.state === "Alagoas" && championship.division === "1ª Divisão") {
        return simulateAlagoasFirstDivision(championship);
      }
      if (championship.state === "Amapá" && championship.division === "1ª Divisão") {
        return simulateAmapaFirstDivision(championship);
      }
      if (championship.state === "Amazonas" && championship.division === "1ª Divisão") {
        return simulateAmazonasFirstDivision(championship);
      }
      if (championship.state === "Bahia" && championship.division === "1ª Divisão") {
        return simulateBahiaFirstDivision(championship);
      }
      if (championship.state === "Distrito Federal" && championship.division === "1ª Divisão") {
        return simulateDistritoFederalFirstDivision(championship);
      }
      if (championship.state === "Espírito Santo" && championship.division === "1ª Divisão") {
        return simulateEspiritoSantoFirstDivision(championship);
      }
      if (championship.state === "Rio de Janeiro" && championship.division === "1ª Divisão") {
        return simulateRioDeJaneiroFirstDivision(championship);
      }
      if (championship.state === "Santa Catarina" && championship.division === "1ª Divisão") {
        return simulateSantaCatarinaFirstDivision(championship);
      }
      if (championship.state === "Ceará" && championship.division === "1ª Divisão") {
        return simulateCearaFirstDivision(championship);
      }
      if (championship.state === "Rio Grande do Sul" && championship.division === "1ª Divisão") {
        return simulateRioGrandeDoSulFirstDivision(championship);
      }
      if (championship.state === "São Paulo" && championship.division === "1ª Divisão") {
        return simulateSaoPauloFirstDivision(championship);
      }
      if (championship.state === "Paraná" && championship.division === "1ª Divisão") {
        return simulateParanaFirstDivision(championship);
      }
      if (championship.state === "Goiás" && championship.division === "1ª Divisão") {
        return simulateGoiasFirstDivision(championship);
      }
      if (championship.state === "Maranhão" && championship.division === "1ª Divisão") {
        return simulateMaranhaoFirstDivision(championship);
      }
      if (championship.state === "Pará" && championship.division === "1ª Divisão") {
        return simulateParaFirstDivision(championship);
      }
      if (championship.state === "Paraíba" && championship.division === "1ª Divisão") {
        return simulateParaibaFirstDivision(championship);
      }
      if (championship.state === "Minas Gerais" && championship.division === "1ª Divisão") {
        return simulateMinasGeraisFirstDivision(championship);
      }
      if (championship.state === "Mato Grosso" && championship.division === "1ª Divisão") {
        return simulateMatoGrossoFirstDivision(championship);
      }
      if (championship.state === "Pernambuco" && championship.division === "1ª Divisão") {
        return simulatePernambucoFirstDivision(championship);
      }
      if (championship.state === "Piauí" && championship.division === "1ª Divisão") {
        return simulatePiauiFirstDivision(championship);
      }
      if (championship.state === "Rio Grande do Norte" && championship.division === "1ª Divisão") {
        return simulateRioGrandeDoNorteFirstDivision(championship);
      }
      if (championship.state === "Rondônia" && championship.division === "1ª Divisão") {
        return simulateRondoniaFirstDivision(championship);
      }
      if (championship.state === "Roraima" && championship.division === "1ª Divisão") {
        return simulateRoraimaFirstDivision(championship);
      }
      if (championship.state === "Sergipe" && championship.division === "1ª Divisão") {
        return simulateSergipeFirstDivision(championship);
      }
      if (championship.state === "Mato Grosso do Sul" && championship.division === "1ª Divisão") {
        return simulateMatoGrossoDoSulFirstDivision(championship);
      }
      if (championship.state === "Tocantins" && championship.division === "1ª Divisão") {
        return simulateTocantinsFirstDivision(championship);
      }

      return simulateGenericChampionship(championship);
    });

    // ETAPA 2: somente depois de terminar os estaduais, simulamos A, B, C e D.
    updated = updated.map((championship) => {
      if (championship.country !== country || !nationalDivisions.has(championship.division)) {
        return championship;
      }

      if (championship.division === "Série A") {
        return simulateSerieA(championship);
      }

      if (championship.division === "Série B") {
        return simulateSerieB(championship);
      }

      if (championship.division === "Série C") {
        return simulateSerieC(championship);
      }

      // A Série D sorteia seus 16 grupos automaticamente no início da simulação.
      if (championship.division === "Série D") {
        const teams = [...(championship.teams ?? [])];

        if (teams.length !== 96) {
          return championship;
        }

        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const groups: Record<string, string[]> = {};

        for (let index = 0; index < 16; index += 1) {
          const letter = String.fromCharCode(65 + index);
          groups[letter] = shuffled.slice(index * 6, index * 6 + 6);
        }

        return simulateSerieD({
          ...championship,
          serieDGroups: groups,
          standings: undefined,
          phaseStandings: undefined,
          phaseMatches: undefined,
          champion: undefined,
          accessTeams: undefined,
          relegatedTeams: undefined,
        });
      }

      return championship;
    });

    setChampionships(updated);

    setSelectedPhase((current) => {
      const next = { ...current };
      updated
        .filter((championship) => championship.country === country)
        .forEach((championship) => {
          if (championship.phases?.length) {
            next[championship.id] = championship.phases[0];
          }
        });
      return next;
    });

    window.alert(
      "Temporada completa simulada: primeiro os estaduais, depois as divisões nacionais. A Série D teve seus grupos sorteados automaticamente."
    );
  }

  function simulateSerieB(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const result = simulateDoubleRoundRobin(teams);
    const ordered = sortStandingTeams(teams, result.table);
    const directAccess = ordered.slice(0, 2);
    const playoffSeeds = ordered.slice(2, 6);
    const relegated = ordered.slice(-4);

    const playoffPairs = [
      [playoffSeeds[0], playoffSeeds[3]],
      [playoffSeeds[1], playoffSeeds[2]],
    ];

    const playoffMatches: Matchup[] = [];
    const playoffWinners: string[] = [];

    for (const [higher, lower] of playoffPairs) {
      const leg1 = simulateKnockoutMatch(higher, lower);
      const leg2 = simulateKnockoutMatch(lower, higher);
      const winner = resolveTwoLeggedTie(leg1, leg2);
      playoffMatches.push(leg1, leg2);
      playoffWinners.push(winner);
    }

    const accessTeams = [...directAccess, ...playoffWinners];

    return {
      ...championship,
      standings: result.table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": result.table,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Primeira fase": result.matches,
        "Play-off de acesso": playoffMatches,
      },
      champion: ordered[0],
      accessTeams,
      relegatedTeams: relegated,
      rules: [
        ...(championship.rules ?? []).filter((rule) => !rule.startsWith("Classificação final gerada")),
        `Classificação final gerada: acesso direto = ${directAccess.join(", ")}; play-off = ${playoffWinners.join(", ")}; rebaixados = ${relegated.join(", ")}.`,
      ],
    };
  }

  function simulateSerieC(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const firstPhase = simulateRoundRobinWithMatches(teams);
    const ordered = sortStandingTeams(teams, firstPhase.table);
    const qualified = ordered.slice(0, 8);
    const groupA = [qualified[0], qualified[2], qualified[4], qualified[6]];
    const groupB = [qualified[1], qualified[3], qualified[5], qualified[7]];

    const groupAResult = simulateDoubleRoundRobin(groupA);
    const groupBResult = simulateDoubleRoundRobin(groupB);
    const groupAOrdered = sortStandingTeams(groupA, groupAResult.table);
    const groupBOrdered = sortStandingTeams(groupB, groupBResult.table);

    const accessTeams = [...groupAOrdered.slice(0, 2), ...groupBOrdered.slice(0, 2)];
    const relegated = ordered.slice(-4);

    const finalMatches: Matchup[] = [];
    if (groupAOrdered[0] && groupBOrdered[0]) {
      const finalLeg1 = simulateKnockoutMatch(groupAOrdered[0], groupBOrdered[0]);
      const finalLeg2 = simulateKnockoutMatch(groupBOrdered[0], groupAOrdered[0]);
      const champion = resolveTwoLeggedTie(finalLeg1, finalLeg2);
      finalMatches.push(finalLeg1, finalLeg2);

      return {
        ...championship,
        standings: firstPhase.table,
        phaseStandings: {
          ...(championship.phaseStandings ?? {}),
          "Primeira fase": firstPhase.table,
          "Segunda fase - Grupo A": groupAResult.table,
          "Segunda fase - Grupo B": groupBResult.table,
        },
        phaseMatches: {
          ...(championship.phaseMatches ?? {}),
          "Primeira fase": firstPhase.matches,
          "Segunda fase": [...groupAResult.matches, ...groupBResult.matches],
          "Final": finalMatches,
        },
        serieCGroups: {
          A: groupA,
          B: groupB,
        },
        champion,
        accessTeams,
        relegatedTeams: relegated,
        rules: [
          ...(championship.rules ?? []).filter((rule) => !rule.startsWith("Classificação final gerada")),
          `Classificação final gerada: campeão = ${champion}; acesso = ${accessTeams.join(", ")}; rebaixados = ${relegated.join(", ")}.`,
        ],
      };
    }

    return {
      ...championship,
      standings: firstPhase.table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": firstPhase.table,
        "Segunda fase - Grupo A": groupAResult.table,
        "Segunda fase - Grupo B": groupBResult.table,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Primeira fase": firstPhase.matches,
        "Segunda fase": [...groupAResult.matches, ...groupBResult.matches],
      },
      serieCGroups: { A: groupA, B: groupB },
      accessTeams,
      relegatedTeams: relegated,
    };
  }

  function generateSerieDGroups() {
    if (!selected || selected.division !== "Série D" || selected.country !== "Brasil") return;

    const teams = [...(selected.teams ?? [])];
    if (teams.length !== 96) return;

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const groups: Record<string, string[]> = {};

    for (let index = 0; index < 16; index += 1) {
      const letter = String.fromCharCode(65 + index);
      groups[letter] = shuffled.slice(index * 6, index * 6 + 6);
    }

    const prepared: Championship = {
      ...selected,
      serieDGroups: groups,
      standings: undefined,
      phaseStandings: undefined,
      phaseMatches: undefined,
      champion: undefined,
      accessTeams: undefined,
      relegatedTeams: undefined,
    };

    setChampionships((current) =>
      current.map((championship) =>
        championship.id === selected.id ? prepared : championship
      )
    );
    setSelectedPhase((current) => ({
      ...current,
      [selected.id]: "Primeira fase",
    }));
  }

  function simulateSerieD(championship: Championship): Championship {
    const groups: Record<string, string[]> = Object.fromEntries(
      Object.entries(championship.serieDGroups ?? {}).map(([letter, group]) => [letter, [...group]])
    );

    const phaseStandings: Record<string, Record<string, Standing>> = {};
    const phaseMatches: Record<string, Matchup[]> = {};
    const qualified: string[] = [];

    Object.entries(groups).forEach(([letter, group]) => {
      const result = simulateDoubleRoundRobin(group);
      phaseStandings[`Primeira fase - Grupo ${letter}`] = result.table;
      phaseMatches[`Primeira fase - Grupo ${letter}`] = result.matches;
      qualified.push(...sortStandingTeams(group, result.table).slice(0, 4));
    });

    const runKnockout = (phaseName: string, participants: string[]) => {
      const matches: Matchup[] = [];
      const winners: string[] = [];
      for (let i = 0; i < participants.length; i += 2) {
        if (!participants[i] || !participants[i + 1]) continue;
        const leg1 = simulateKnockoutMatch(participants[i], participants[i + 1]);
        const leg2 = simulateKnockoutMatch(participants[i + 1], participants[i]);
        matches.push(leg1, leg2);
        winners.push(resolveTwoLeggedTie(leg1, leg2));
      }
      phaseMatches[phaseName] = matches;
      return winners;
    };

    const second = runKnockout("Segunda fase", qualified);
    const third = runKnockout("Terceira fase", second);
    const roundOf16 = runKnockout("Oitavas de final", third);
    const quarterfinals = runKnockout("Quartas de final", roundOf16);
    const semifinalists = runKnockout("Semifinal", quarterfinals);

    // Os 4 clubes que chegam à semifinal garantem o acesso à Série C.
    // Os vencedores das semifinais disputam apenas o título.
    const accessTeams = [...quarterfinals];

    let champion: string | undefined;
    const finalMatches: Matchup[] = [];
    if (semifinalists.length === 2) {
      const leg1 = simulateKnockoutMatch(semifinalists[0], semifinalists[1]);
      const leg2 = simulateKnockoutMatch(semifinalists[1], semifinalists[0]);
      champion = resolveTwoLeggedTie(leg1, leg2);
      finalMatches.push(leg1, leg2);
    }
    phaseMatches["Final"] = finalMatches;

    const standings: Record<string, Standing> = {};
    Object.values(phaseStandings).slice(0, 16).forEach((table) => Object.assign(standings, table));

    return {
      ...championship,
      serieDGroups: groups,
      standings,
      phaseStandings,
      phaseMatches,
      champion,
      accessTeams,
      relegatedTeams: [],
      rules: [
        ...(championship.rules ?? []).filter((rule) => !rule.startsWith("Classificação final gerada")),
        `Classificação final gerada: campeão = ${champion ?? "não definido"}; acesso à Série C = ${semifinalists.join(", ")}.`,
      ],
    };
  }

  function simulateSerieA(championship: Championship): Championship {
    const teams = championship.teams ?? [];
    const result = simulateDoubleRoundRobin(teams);
    const ordered = sortStandingTeams(teams, result.table);
    const champion = ordered[0];
    const relegated = ordered.slice(-4);

    return {
      ...championship,
      standings: result.table,
      phaseStandings: {
        ...(championship.phaseStandings ?? {}),
        "Primeira fase": result.table,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Primeira fase": result.matches,
      },
      champion,
      accessTeams: [],
      relegatedTeams: relegated,
      rules: [
        ...(championship.rules ?? []).filter((rule) => !rule.startsWith("Classificação final gerada")),
        `Classificação final gerada: campeão = ${champion}; rebaixados = ${relegated.join(", ")}.`,
      ],
    };
  }

  function simulateSeason() {
    if (!selected) return;

    if (selected.division === "Série A" && selected.country === "Brasil") {
      const updated = simulateSerieA(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
      return;
    }

    if (selected.division === "Série B" && selected.country === "Brasil") {
      const updated = simulateSerieB(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
      return;
    }

    if (selected.division === "Série C" && selected.country === "Brasil") {
      const updated = simulateSerieC(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
      return;
    }

    if (selected.division === "Série D" && selected.country === "Brasil") {
      if (!selected.serieDGroups || Object.keys(selected.serieDGroups).length !== 16) return;
      const updated = simulateSerieD(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
      return;
    }

    if (selected.state === "Acre" && selected.division === "1ª Divisão") {
      const updated = simulateAcreFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Amapá" && selected.division === "1ª Divisão") {
      const updated = simulateAmapaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Amazonas" && selected.division === "1ª Divisão") {
      const updated = simulateAmazonasFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "1º Turno - Grupo A",
      }));
    } else if (selected.state === "Bahia" && selected.division === "1ª Divisão") {
      const updated = simulateBahiaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Distrito Federal" && selected.division === "1ª Divisão") {
      const updated = simulateDistritoFederalFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Espírito Santo" && selected.division === "1ª Divisão") {
      const updated = simulateEspiritoSantoFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Rio Grande do Sul" && selected.division === "1ª Divisão") {
      const updated = simulateRioGrandeDoSulFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "São Paulo" && selected.division === "1ª Divisão") {
      const updated = simulateSaoPauloFirstDivision(selected);
      setChampionships(current => current.map(championship => championship.id === selected.id ? updated : championship));
      setSelectedPhase(current => ({...current,[selected.id]:"Primeira fase"}));
    } else if (selected.state === "Paraná" && selected.division === "1ª Divisão") {
      const updated = simulateParanaFirstDivision(selected);
      setChampionships(current => current.map(championship => championship.id === selected.id ? updated : championship));
      setSelectedPhase(current => ({...current,[selected.id]:"Primeira fase"}));
    } else if (selected.state === "Pernambuco" && selected.division === "1ª Divisão") {
      const updated=simulatePernambucoFirstDivision(selected);
      setChampionships(cur=>cur.map(x=>x.id===selected.id?updated:x));
      setSelectedPhase(cur=>({...cur,[selected.id]:"1º Turno - Fase de grupos"}));
    } else if (selected.state === "Rio Grande do Norte" && selected.division === "1ª Divisão") {
      const updated = simulateRioGrandeDoNorteFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Roraima" && selected.division === "1ª Divisão") {
      const updated = simulateRoraimaFirstDivision(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
    } else if (selected.state === "Sergipe" && selected.division === "1ª Divisão") {
      const updated = simulateSergipeFirstDivision(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
    } else if (selected.state === "Mato Grosso do Sul" && selected.division === "1ª Divisão") {
      const updated = simulateMatoGrossoDoSulFirstDivision(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
    } else if (selected.state === "Tocantins" && selected.division === "1ª Divisão") {
      const updated = simulateTocantinsFirstDivision(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
    } else if (selected.state === "Rondônia" && selected.division === "1ª Divisão") {
      const updated = simulateRondoniaFirstDivision(selected);
      setChampionships((current) => current.map((championship) => championship.id === selected.id ? updated : championship));
      setSelectedPhase((current) => ({ ...current, [selected.id]: "Primeira fase" }));
    } else if (selected.state === "Piauí" && selected.division === "1ª Divisão") {
      const updated = simulatePiauiFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));

    } else if (selected.state === "Goiás" && selected.division === "1ª Divisão") {
      const updated = simulateGoiasFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Maranhão" && selected.division === "1ª Divisão") {
      const updated = simulateMaranhaoFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Pará" && selected.division === "1ª Divisão") {
      const updated = simulateParaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Paraíba" && selected.division === "1ª Divisão") {
      const updated = simulateParaibaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Minas Gerais" && selected.division === "1ª Divisão") {
      const updated = simulateMinasGeraisFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Mato Grosso" && selected.division === "1ª Divisão") {
      const updated = simulateMatoGrossoFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Ceará" && selected.division === "1ª Divisão") {
      const updated = simulateCearaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Santa Catarina" && selected.division === "1ª Divisão") {
      const updated = simulateSantaCatarinaFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else if (selected.state === "Rio de Janeiro" && selected.division === "1ª Divisão") {
      const updated = simulateRioDeJaneiroFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Taça Guanabara",
      }));
    } else if (selected.state === "Alagoas" && selected.division === "1ª Divisão") {
      const updated = simulateAlagoasFirstDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeira fase",
      }));
    } else {
      const updated = simulateGenericChampionship(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
    }

    setSelectedSection((current) => ({
      ...current,
      [selected.id]: "competition",
    }));
  }

  function resetEverything() {
    if (!window.confirm("Apagar todos os campeonatos e começar novamente do zero?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setChampionships([]);
    setSelectedId(null);
    setShowCreate(false);
  }

  function isChampionshipSeasonSimulated(championship: Championship): boolean {
    if (!championship.champion) return false;
    const phaseMatches = championship.phaseMatches ?? {};
    return Object.values(phaseMatches).some((matches) => matches.length > 0);
  }

  function isCurrentSeasonFullySimulated(): boolean {
    const brazilChampionships = championships.filter((item) => item.country === "Brasil");
    if (!brazilChampionships.length) return false;

    const currentYear = Math.max(
      ...brazilChampionships.map((item) => Number(item.season) || 2026)
    );
    const currentSeasonChampionships = brazilChampionships.filter(
      (item) => item.season === String(currentYear)
    );

    return (
      currentSeasonChampionships.length > 0 &&
      currentSeasonChampionships.every(isChampionshipSeasonSimulated)
    );
  }

  function goToNextSeason() {
    const country = "Brasil";
    const countryChampionships = championships.filter((c) => c.country === country);

    if (!countryChampionships.length) {
      window.alert("Não há campeonatos cadastrados para avançar.");
      return;
    }

    if (!isCurrentSeasonFullySimulated()) {
      window.alert("A próxima temporada só pode ser criada depois que 100% dos campeonatos da temporada vigente forem simulados.");
      return;
    }

    const currentYear = Math.max(
      ...countryChampionships.map((c) => Number(c.season) || 2026)
    );
    const nextYear = String(currentYear + 1);

    const getDivision = (division: string) =>
      countryChampionships.find(
        (item) => item.division === division && item.season === String(currentYear)
      );

    const serieA = getDivision("Série A");
    const serieB = getDivision("Série B");
    const serieC = getDivision("Série C");
    const serieD = getDivision("Série D");

    const aRelegated = serieA?.relegatedTeams ?? [];
    const bAccess = serieB?.accessTeams ?? [];
    const bRelegated = serieB?.relegatedTeams ?? [];
    const cAccess = serieC?.accessTeams ?? [];
    const cRelegated = serieC?.relegatedTeams ?? [];
    const dAccess = serieD ? getSerieDSemifinalists(serieD) : [];

    const nextTeams = (division: string, fallback: string[]) => {
      if (division === "Série A") {
        return [...fallback.filter((club) => !aRelegated.includes(club)), ...bAccess]
          .filter((club, index, list) => list.indexOf(club) === index);
      }

      if (division === "Série B") {
        return [
          ...fallback.filter((club) => !bRelegated.includes(club) && !bAccess.includes(club)),
          ...aRelegated,
          ...cAccess,
        ].filter((club, index, list) => list.indexOf(club) === index);
      }

      if (division === "Série C") {
        return [...fallback.filter((club) => !cRelegated.includes(club) && !cAccess.includes(club)), ...bRelegated, ...dAccess]
          .filter((club, index, list) => list.indexOf(club) === index);
      }

      return fallback;
    };

    setChampionships((current) =>
      current.map((championship) => {
        if (championship.country !== country) return championship;

        let teams = championship.teams;

        if (!championship.state && championship.division === "Série A") {
          teams = nextTeams("Série A", serieA?.teams ?? championship.teams ?? []);
        } else if (!championship.state && championship.division === "Série B") {
          teams = nextTeams("Série B", serieB?.teams ?? championship.teams ?? []);
        } else if (!championship.state && championship.division === "Série C") {
          teams = nextTeams("Série C", serieC?.teams ?? championship.teams ?? []);
        }

        return {
          ...championship,
          season: nextYear,
          teams,
          standings: undefined,
          phaseStandings: undefined,
          phaseMatches: undefined,
          firstTurnWinner: undefined,
          accessTeams: undefined,
          relegatedTeams: undefined,
          champion: undefined,
          serieDGroups: undefined,
          amazonasGroups: championship.state === "Amazonas" ? undefined : championship.amazonasGroups,
          paranaGroups: championship.state === "Paraná" ? undefined : championship.paranaGroups,
          pernambucoGroups: championship.state === "Pernambuco" ? undefined : championship.pernambucoGroups,
          pernambucoSecondGroups: championship.state === "Pernambuco" ? undefined : championship.pernambucoSecondGroups,
          saoPauloPots: championship.state === "São Paulo" ? undefined : championship.saoPauloPots,
          secondTurnWinner: undefined,
        };
      })
    );

    setSelectedId(1001);
    setSelectedPhase((current) => ({
      ...current,
      [1001]: "Primeira fase",
    }));
    setSelectedSection((current) => ({
      ...current,
      [1001]: "competition",
    }));

    window.alert(
      `Temporada ${nextYear} criada. Os acessos e rebaixamentos nacionais foram aplicados; os 4 promovidos da Série D agora fazem parte da Série C e deixam de consumir vagas estaduais da Série D.`
    );
  }

  function resetSeasonTo2026() {
    if (!window.confirm("Zerar todas as simulações e voltar todos os campeonatos para a temporada 2026?")) return;

    const resetChampionships = championships.map((championship) => {
      const definition = INITIAL_CHAMPIONSHIPS.find((item) => item.id === championship.id);

      return {
        ...championship,
        season: "2026",
        teams: definition ? [...(definition.teams ?? [])] : championship.teams,
        standings: undefined,
        phaseStandings: undefined,
        phaseMatches: undefined,
        firstTurnWinner: undefined,
        amazonasGroups: championship.state === "Amazonas" ? undefined : championship.amazonasGroups,
        paranaGroups: championship.state === "Paraná" ? undefined : championship.paranaGroups,
        pernambucoGroups: championship.state === "Pernambuco" ? undefined : championship.pernambucoGroups,
        pernambucoSecondGroups: championship.state === "Pernambuco" ? undefined : championship.pernambucoSecondGroups,
        secondTurnWinner: undefined,
      };
    });

    setChampionships(resetChampionships);

    const resetPhases: Record<number, string> = {};
    resetChampionships.forEach((championship) => {
      if (championship.phases?.length) resetPhases[championship.id] = championship.phases[0];
    });

    setSelectedPhase(resetPhases);
    setSelectedSection({});
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚽</div>
          <div>
            <strong>Gerenciador</strong>
            <span>de Campeonatos</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">PAÍSES</div>
          <button className="country active">🇧🇷 Brasil</button>
        </div>

        <div className="sidebar-section">
          <div className="section-title">CAMPEONATOS</div>
          {championships.filter((champ) => !champ.state && champ.division !== "Estadual").length === 0 ? (
            <div className="empty-sidebar">Nenhum campeonato criado.</div>
          ) : (
            championships
              .filter((champ) => !champ.state && champ.division !== "Estadual")
              .map((champ) => (
                <button
                  key={champ.id}
                  className={`champ-link ${selectedId === champ.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(champ.id)}
                >
                  <span>{champ.name}</span>
                  <small>{champ.season}</small>
                </button>
              ))
          )}

          <button
            className={`state-menu-toggle ${estaduaisOpen ? "open" : ""}`}
            onClick={() => setEstaduaisOpen((open) => !open)}
            aria-expanded={estaduaisOpen}
          >
            <span>Estaduais</span>
            <span className="state-chevron">{estaduaisOpen ? "▾" : "▸"}</span>
          </button>

          {estaduaisOpen && (
            <div className="state-menu">
              {stateNames.length === 0 ? (
                <div className="state-empty">Nenhum estadual criado.</div>
              ) : (
                stateNames.map((stateName) => {
                  const stateDivisions = [...new Set([
                    ...estadualChampionships
                      .filter((champ) => champ.state === stateName)
                      .map((champ) => champ.division),
                    ...INITIAL_CHAMPIONSHIPS
                      .filter((champ) => champ.state === stateName)
                      .map((champ) => champ.division),
                  ])].sort((a, b) => a.localeCompare(b, "pt-BR"));

                  return (
                    <div key={stateName} className="state-group">
                      <button
                        className={`state-name-toggle ${openStates[stateName] ? "open" : ""}`}
                        onClick={() =>
                          setOpenStates((current) => ({
                            ...current,
                            [stateName]: !current[stateName],
                          }))
                        }
                        aria-expanded={!!openStates[stateName]}
                      >
                        <span>🇧🇷 {stateName}</span>
                        <span className="state-chevron">{openStates[stateName] ? "▾" : "▸"}</span>
                      </button>

                      {openStates[stateName] && (
                        <div className="division-menu">
                          {stateDivisions.map((divisionName) => {
                            const divisionSeasons = [
                              ...estadualChampionships.filter(
                                (champ) =>
                                  champ.state === stateName &&
                                  champ.division === divisionName
                              ),
                              ...INITIAL_CHAMPIONSHIPS.filter(
                                (champ) =>
                                  champ.state === stateName &&
                                  champ.division === divisionName &&
                                  !estadualChampionships.some((saved) => saved.id === champ.id)
                              ),
                            ].sort(
                              (a, b) =>
                                Number(b.season) - Number(a.season) ||
                                b.id - a.id
                            );
                            const latest = divisionSeasons[0];

                            return (
                              <button
                                key={`${stateName}-${divisionName}`}
                                className={`state-link ${selectedId === latest.id ? "selected" : ""}`}
                                onClick={() => setSelectedId(latest.id)}
                              >
                                <span>{divisionName}</span>
                                <small>{latest.season}</small>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="new-button" onClick={() => setShowCreate(true)}>
            + Criar campeonato
          </button>
          <button className="reset-button" onClick={resetEverything}>
            Zerar sistema
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="country-heading">
              <div className="eyebrow">BRASIL</div>
              <button
                className="simulate-season"
                onClick={() => simulateCompleteCountrySeason("Brasil")}
              >
                ▶ Simular temporada completa
              </button>
              <button
                className="reset-season"
                onClick={resetSeasonTo2026}
                title="Apagar os resultados e voltar para 2026"
              >
                ↺ Zerar temporada
              </button>
            </div>
            <h1>{selected ? selected.name : "Novo começo"}</h1>
          </div>
          <button
            className="top-action"
            onClick={goToNextSeason}
            disabled={!isCurrentSeasonFullySimulated()}
            title={
              isCurrentSeasonFullySimulated()
                ? "Criar a próxima temporada"
                : "Simule 100% dos campeonatos da temporada vigente antes de avançar"
            }
          >
            → Próxima temporada
          </button>
        </header>

        {selected ? (
          <section className="card">
            <div className="card-header">
              <div>
                <div className="eyebrow">TEMPORADA {selected.season}</div>
                <h2>{selected.name}</h2>
              </div>
              <button className="danger-link" onClick={() => deleteChampionship(selected.id)}>
                Excluir campeonato
              </button>
            </div>

            <div className="info-grid">
              <div><span>País</span><strong>{selected.country}</strong></div>
              <div><span>Divisão</span><strong>{selected.division}</strong></div>
              <div><span>Temporada de referência</span><strong>{selected.season}</strong></div>
                          <div><span>Próxima temporada</span><strong>{String(Number(selected.season) + 1)}</strong></div>
            </div>

            <div className="phase-area">
              <div className="section-tabs">
                <button
                  className={`section-tab ${(selectedSection[selected.id] ?? "competition") === "competition" ? "active" : ""}`}
                  onClick={() =>
                    setSelectedSection((current) => ({
                      ...current,
                      [selected.id]: "competition",
                    }))
                  }
                >
                  Competição
                </button>
                <button
                  className={`section-tab ${selectedSection[selected.id] === "rules" ? "active" : ""}`}
                  onClick={() =>
                    setSelectedSection((current) => ({
                      ...current,
                      [selected.id]: "rules",
                    }))
                  }
                >
                  Regulamento
                </button>
                {selected.country === "Brasil" && ["Série A", "Série B", "Série C", "Série D"].includes(selected.division) && (
                  <button
                    className={`section-tab ${selectedSection[selected.id] === "movement" ? "active" : ""}`}
                    onClick={() =>
                      setSelectedSection((current) => ({
                        ...current,
                        [selected.id]: "movement",
                      }))
                    }
                  >
                    Acessos / Rebaixamentos
                  </button>
                )}

                <button
                  className={`section-tab ${selectedSection[selected.id] === "history" ? "active" : ""}`}
                  onClick={() =>
                    setSelectedSection((current) => ({
                      ...current,
                      [selected.id]: "history",
                    }))
                  }
                >
                  Histórico
                </button>

                {selected.division === "Série D" && selected.country === "Brasil" && (
                  <button
                    className={`section-tab ${selectedSection[selected.id] === "serieDNextSeason" ? "active" : ""}`}
                    onClick={() =>
                      setSelectedSection((current) => ({
                        ...current,
                        [selected.id]: "serieDNextSeason",
                      }))
                    }
                  >
                    Próxima temporada
                  </button>
                )}

                {selected.state && (
                  <button
                    className={`section-tab ${selectedSection[selected.id] === "clubs" ? "active" : ""}`}
                    onClick={() =>
                      setSelectedSection((current) => ({
                        ...current,
                        [selected.id]: "clubs",
                      }))
                    }
                  >
                    Clubes / Série D
                  </button>
                )}

                {selected.division === "Série D" && selected.country === "Brasil" && (
                  <button
                    className="section-tab"
                    onClick={generateSerieDGroups}
                  >
                    🎲 Gerar grupos
                  </button>
                )}

                {selected.state === "Amazonas" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawAmazonasGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}

                {selected.state === "Rio de Janeiro" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawRioDeJaneiroGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}

                {selected.state === "Minas Gerais" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawMinasGeraisGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}

                {selected.state === "Santa Catarina" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawSantaCatarinaGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}

                {selected.state === "Ceará" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawCearaGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}

                {selected.state === "São Paulo" && selected.division === "1ª Divisão" && (
                  <button className="section-tab" onClick={drawSaoPauloPots}>🎲 Sortear potes</button>
                )}

                {selected.state === "Pernambuco" && selected.division === "1ª Divisão" && (<button className="section-tab" onClick={drawPernambucoGroups}>🎲 Sortear grupos</button>)}

                {selected.state === "Paraná" && selected.division === "1ª Divisão" && (
                  <button className="section-tab" onClick={drawParanaGroups}>🎲 Sortear grupos</button>
                )}

                {selected.state === "Rio Grande do Sul" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawRioGrandeDoSulGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}
              </div>

              {selectedSection[selected.id] === "serieDNextSeason" ? (
                <div className="competition-block serie-d-next-season-panel">
                  {(() => {
                    const plan = getSerieDNextSeasonPlan(championships, selected.season);
                    const rows = [
                      ...plan.guaranteedRelegated.map((club) => ({ club, origin: "Rebaixado da Série C — vaga garantida" })),
                      ...plan.stateQualified.map((club) => {
                        const state = vacanciesStateLabel(championships, selected.season, club);
                        return { club, origin: "Vaga estadual" + (state ? " — " + state : "") };
                      }),
                      ...plan.previousSecondPhase.map((club) => ({ club, origin: "Classificado para a 2ª fase da Série D anterior" })),
                    ].filter((row, index, list) => list.findIndex((item) => item.club === row.club) === index);

                    return (
                      <>
                        <div className="block-title">CLUBES DA SÉRIE D — TEMPORADA {plan.season}</div>
                        <div className="history-subtitle">
                          Composição projetada para a próxima temporada: 4 vagas garantidas da Série C, 64 vagas estaduais e 28 vagas destinadas a clubes da segunda fase da Série D anterior.
                        </div>

                        <div className="serie-d-next-summary">
                          <div><span>Vagas garantidas</span><strong>{plan.guaranteedRelegated.length}/4</strong></div>
                          <div><span>Vagas estaduais</span><strong>{plan.stateQualified.length}/64</strong></div>
                          <div><span>Vagas da Série D anterior</span><strong>{plan.previousSecondPhase.length}/28</strong></div>
                          <div><span>Total</span><strong>{plan.allTeams.length}/96</strong></div>
                        </div>

                        {!plan.ready ? (
                          <div className="movement-empty">
                            A composição ainda não está completa. Simule todos os estaduais e as divisões nacionais para que o sistema determine automaticamente os 96 clubes da próxima Série D.
                          </div>
                        ) : (
                          <div className="clubs-table-wrap">
                            <table className="clubs-table">
                              <thead>
                                <tr><th>#</th><th>CLUBE</th><th>ORIGEM DA VAGA</th></tr>
                              </thead>
                              <tbody>
                                {rows.map((row, index) => (
                                  <tr key={row.club}>
                                    <td>{index + 1}</td>
                                    <td className="club-name-cell">{clubLink(row.club, "club-link club-link-strong")}</td>
                                    <td>{row.origin}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : selectedSection[selected.id] === "history" ? (
                <div className="competition-block championship-history-panel">
                  {(() => {
                    const history = { ...(selected.championHistory ?? {}) };
                    if (selected.champion) {
                      history[selected.season] = selected.champion;
                    }

                    const seasons = Object.entries(history)
                      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA));

                    return (
                      <>
                        <div className="block-title">HISTÓRICO DE CAMPEÕES</div>
                        <div className="history-subtitle">
                          Campeões de todas as temporadas registradas neste campeonato.
                        </div>

                        {seasons.length ? (
                          <div className="champion-history-list">
                            {seasons.map(([year, champion], index) => (
                              <div className="champion-history-row" key={year}>
                                <div className="champion-history-year">{year}</div>
                                <div className="champion-history-trophy">{index === 0 ? "🏆" : "🏆"}</div>
                                <div className="champion-history-club">
                                  {clubLink(champion, "club-link club-link-strong")}
                                  {year === selected.season && <span>Temporada atual</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="movement-empty">
                            Nenhum campeão registrado ainda. O histórico será preenchido automaticamente após cada temporada simulada.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : selectedSection[selected.id] === "movement" ? (
                <div className="competition-block national-movement-panel">
                  {(() => {
                    const table = selected.standings ?? selected.phaseStandings?.["Primeira fase"] ?? {};
                    const teams = selected.teams ?? [];
                    const simulated = Object.keys(table).length > 0;
                    const ordered = simulated ? sortStandingTeams(teams, table) : [];
                    const relegated = selected.relegatedTeams ?? (
                      simulated && selected.division === "Série A" ? ordered.slice(-4) :
                      simulated && selected.division === "Série B" ? ordered.slice(-4) : []
                    );
                    const access = selected.division === "Série D"
                      ? getSerieDSemifinalists(selected)
                      : (selected.accessTeams ?? []);
                    const directAccess = selected.division === "Série B" && simulated ? access.filter((club) => ordered.slice(0, 2).includes(club)) : [];
                    const playoffAccess = selected.division === "Série B" && simulated ? access.filter((club) => !directAccess.includes(club)) : [];
                    const genericAccess = selected.division !== "Série B" ? access : [];

                    if (!simulated) {
                      return (
                        <>
                          <div className="block-title">MOVIMENTAÇÃO DA TEMPORADA {selected.season}</div>
                          <div className="movement-empty">A temporada ainda não foi simulada. Os acessos e rebaixamentos aparecerão aqui automaticamente ao final da competição.</div>
                        </>
                      );
                    }

                    return (
                      <>
                        <div className="block-title">MOVIMENTAÇÃO DA TEMPORADA {selected.season}</div>
                        <div className="movement-grid">
                          <div className="movement-card movement-access">
                            <div className="movement-card-title">🟢 ACESSO</div>
                            <div className="movement-subtitle">Clubes que conquistaram vaga na divisão superior</div>
                            {selected.division === "Série A" ? (
                              <div className="movement-empty small">Não há acesso a partir da Série A.</div>
                            ) : selected.division === "Série B" ? (
                              <>
                                <div className="movement-group-title">Acesso direto</div>
                                {directAccess.length ? directAccess.map((club) => <div className="movement-club" key={club}>{clubLink(club, "club-link club-link-strong")}<span>1º/2º — acesso direto</span></div>) : <div className="movement-empty small">Nenhum definido.</div>}
                                <div className="movement-group-title">Acesso via play-off</div>
                                {playoffAccess.length ? playoffAccess.map((club) => <div className="movement-club" key={club}>{clubLink(club, "club-link club-link-strong")}<span>Vencedor do play-off</span></div>) : <div className="movement-empty small">Nenhum definido.</div>}
                              </>
                            ) : genericAccess.length ? (
                              <>
                                {selected.division === "Série D" && <div className="movement-group-title">4 semifinalistas — acesso à Série C</div>}
                                {genericAccess.map((club) => <div className="movement-club" key={club}>{clubLink(club, "club-link club-link-strong")}<span>{selected.division === "Série D" ? "Acesso garantido à Série C" : "Acesso conquistado"}</span></div>)}
                              </>
                            ) : <div className="movement-empty small">Nenhum acesso registrado nesta divisão.</div>}
                          </div>

                          <div className="movement-card movement-relegation">
                            <div className="movement-card-title">🔴 REBAIXAMENTO</div>
                            <div className="movement-subtitle">Clubes que perderam a divisão nacional</div>
                            {relegated.length ? relegated.map((club) => <div className="movement-club" key={club}>{clubLink(club, "club-link club-link-strong")}<span>Rebaixado para a divisão inferior</span></div>) : <div className="movement-empty small">Nenhum rebaixamento registrado nesta divisão.</div>}
                          </div>
                        </div>
                        <div className="clubs-note"><strong>Atualização automática:</strong> esta aba mostra exclusivamente a movimentação da temporada vigente. Quando uma temporada for simulada, os clubes que conquistarem acesso ou forem rebaixados serão atualizados automaticamente.</div>
                      </>
                    );
                  })()}
                </div>
              ) : (selectedSection[selected.id] ?? "competition") === "clubs" ? (
                <div className="competition-block clubs-panel">
                  <div className="block-title">CLUBES DO ESTADO — CONDIÇÃO PARA A PRÓXIMA TEMPORADA</div>
                  {selected.state ? (() => {
                    const clubs = getStateClubsForSeason(selected.state!, selected.season);
                    const vacancy = calculateSerieDStateVacancies(championships, selected.season).find((item) => item.state === selected.state);
                    return (
                      <>
                        <div className="clubs-summary">
                          <div><span>Estado</span><strong>{selected.state}</strong></div>
                          <div><span>Temporada</span><strong>{selected.season}</strong></div>
                          <div><span>Vagas estaduais da Série D</span><strong>{vacancy?.slots ?? 0}</strong></div>
                          <div><span>Clubes monitorados</span><strong>{clubs.length}</strong></div>
                          <div><span>Rebaixados da Série C com vaga garantida</span><strong>{vacancy?.guaranteedRelegated.length ?? 0}</strong></div>
                        </div>
                        <div className="clubs-table-wrap">
                          <table className="clubs-table">
                            <thead><tr><th>CLUBE</th><th>DIVISÃO ESTADUAL</th><th>DIVISÃO NACIONAL — PRÓXIMA TEMPORADA</th><th>POSIÇÃO ESTADUAL</th><th>SÉRIE D</th><th>MOTIVO</th></tr></thead>
                            <tbody>
                              {clubs.map((club) => {
                                const info = getClubStateInfo(selected.state!, selected.season, club);
                                const statusClass = info.serieDStatus === "APTO" || info.serieDStatus === "GARANTIDO NA SÉRIE D" ? "club-status-ok" : info.serieDStatus === "EM DEFINIÇÃO" ? "club-status-pending" : info.serieDStatus === "JÁ ESTÁ NA SÉRIE D" ? "club-status-d" : "club-status-no";
                                return (
                                  <tr key={club}>
                                    <td className="club-name-cell">{clubLink(club, "club-link club-link-strong")}</td>
                                    <td>{info.stateDivision}</td>
                                    <td>{info.nationalDivision}</td>
                                    <td>{info.rankingPosition > 0 ? info.rankingPosition + "º" : "—"}</td>
                                    <td><span className={"club-status " + statusClass}>{info.serieDStatus}</span></td>
                                    <td>{info.serieDReason}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="clubs-note"><strong>Condição da próxima temporada:</strong> esta tela projeta automaticamente a divisão nacional que cada clube terá após os acessos e rebaixamentos da temporada de referência. Os 4 semifinalistas da Série D sobem para a Série C e deixam de ocupar vaga estadual da Série D; rebaixados e promovidos das Séries A, B e C também são atualizados aqui. Para clubes sem divisão nacional, a elegibilidade para a Série D é calculada pela classificação estadual e pelas vagas do estado.</div>
                      </>
                    );
                  })() : null}
                </div>
              ) : (selectedSection[selected.id] ?? "competition") === "competition" ? (
                <>
                  {selected.phases && selected.phases.length > 1 && (
                    <div className="phase-tabs">
                      {selected.phases.map((phase) => {
                        const activePhase = selectedPhase[selected.id] ?? selected.phases![0];
                        return (
                          <button
                            key={phase}
                            className={`phase-tab ${activePhase === phase ? "active" : ""}`}
                            onClick={() =>
                              setSelectedPhase((current) => ({
                                ...current,
                                [selected.id]: phase,
                              }))
                            }
                          >
                            {phase}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="competition-content">
                    <div className="competition-block standings-block full-width-block">
                      <div className="block-title">
                        {(() => {
                          const currentPhase = selectedPhase[selected.id] ?? selected.phases?.[0] ?? "CLASSIFICAÇÃO";
                          return currentPhase.includes("Semi final") || currentPhase.includes("Semifinal") || currentPhase.includes("Final")
                            ? currentPhase.toUpperCase()
                            : `TABELA — ${currentPhase}`;
                        })()}
                      </div>

                      {(() => {
                        const currentPhase = selectedPhase[selected.id] ?? selected.phases?.[0] ?? "CLASSIFICAÇÃO";
                        const matches = selected.phaseMatches?.[currentPhase] ?? [];

                        if (selected.state === "Pernambuco" && currentPhase === "1º Turno - Fase de grupos") {
                          const groups=selected.pernambucoGroups??{A:[],B:[],C:[],D:[]};
                          const render=(letter:string)=>{const group=groups[letter as keyof typeof groups]??[],table=selected.phaseStandings?.[`1º Turno - Grupo ${letter}`]??{},ordered=sortStandingTeams(group,table);return <div className="amazonas-group-table"><div className="amazonas-group-title">{`GRUPO ${letter}`}</div><div className="standings-wrap"><table className="standings-table"><thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{ordered.map((team,index)=>{const row=table[team]??{j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0};return <tr key={team} className={index<4?"zone-second-phase":""}><td>{index+1}</td><td className="standing-team">{clubLink(team)}</td><td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td><td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td></tr>})}</tbody></table></div></div>};return <div className="amazonas-groups-grid">{render("A")}{render("B")}{render("C")}{render("D")}</div>;
                        }

                        if (selected.state === "Pernambuco" && currentPhase === "1º Turno - Quadrangular final") {
                          const table=selected.phaseStandings?.["1º Turno - Quadrangular final"]??{},ordered=sortStandingTeams(Object.keys(table),table);return <div className="standings-wrap"><table className="standings-table"><thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{ordered.map((team,index)=>{const row=table[team];return <tr key={team} className={index<3?"zone-second-phase":""}><td>{index+1}</td><td className="standing-team">{clubLink(team)}</td><td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td><td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td></tr>})}</tbody></table><div className="standings-legend"><span><i className="legend-second-phase"/> Classificados para o segundo turno</span></div></div>;
                        }

                        if (selected.state === "Pernambuco" && currentPhase === "2º Turno - Fase de grupos") {
                          const groups=selected.pernambucoSecondGroups??{A:[],B:[]};const render=(letter:string)=>{const group=groups[letter as keyof typeof groups]??[],table=selected.phaseStandings?.[`2º Turno - Grupo ${letter}`]??{},ordered=sortStandingTeams(group,table);return <div className="amazonas-group-table"><div className="amazonas-group-title">{`GRUPO ${letter}`}</div><div className="standings-wrap"><table className="standings-table"><thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{ordered.map((team,index)=>{const row=table[team]??{j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0};return <tr key={team} className={index===0?"zone-second-phase":index<3?"zone-playoff":""}><td>{index+1}</td><td className="standing-team">{clubLink(team)}</td><td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td><td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td></tr>})}</tbody></table></div></div>};return <div className="amazonas-groups-grid">{render("A")}{render("B")}</div>;
                        }

                        if (
                          selected.division === "Série D" &&
                          currentPhase === "Primeira fase"
                        ) {
                          const groups = selected.serieDGroups ?? {};
                          const letters = Object.keys(groups).sort();
                          const renderGroup = (letter: string) => {
                            const group = groups[letter] ?? [];
                            const table = selected.phaseStandings?.[`Primeira fase - Grupo ${letter}`] ?? {};
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{`GRUPO ${letter}`}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr key={team} className={index < 4 ? "zone-second-phase" : ""}>
                                            <td>{index + 1}</td><td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };
                          return (
                            <>
                              <div className="amazonas-groups-grid">
                                {letters.map((letter) => renderGroup(letter))}
                              </div>
                              <div className="standings-legend">
                                <span><i className="legend-second-phase" /> Classificados para a segunda fase</span>
                              </div>
                            </>
                          );
                        }

                        if (
                          selected.division === "Série C" &&
                          currentPhase === "Segunda fase"
                        ) {
                          const groups = selected.serieCGroups ?? { A: [], B: [] };
                          const renderGroup = (letter: "A" | "B") => {
                            const group = groups[letter] ?? [];
                            const table = selected.phaseStandings?.[`Segunda fase - Grupo ${letter}`] ?? {};
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{`GRUPO ${letter}`}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        const zone = index < 2 ? "zone-promotion" : "";
                                        return (
                                          <tr key={team} className={zone}>
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };
                          return (
                            <>
                              <div className="amazonas-groups-grid">
                                {renderGroup("A")}
                                {renderGroup("B")}
                              </div>
                              <div className="standings-legend">
                                <span><i className="legend-promotion" /> Acesso à Série B</span>
                              </div>
                            </>
                          );
                        }

                        if (currentPhase.includes("Oitavas de final") || currentPhase.includes("Quartas de final") || currentPhase.includes("Terceira fase") || currentPhase.includes("Segunda fase") || currentPhase.includes("Play-off de acesso") || currentPhase.includes("Semi final") || currentPhase.includes("Semifinal") || currentPhase.includes("Final")) {
                          return (
                            <div className="knockout-list">
                              {matches.length === 0 ? (
                                <div className="phase-empty">
                                  <div className="phase-empty-icon">⚽</div>
                                  <strong>Confrontos ainda não gerados</strong>
                                  <span>Simule a fase anterior para gerar os jogos.</span>
                                </div>
                              ) : (
                                matches.map((match, index) => {
                                  const homeScore = match.homeScore;
                                  const awayScore = match.awayScore;
                                  const played = homeScore !== undefined && awayScore !== undefined;
                                  const homeWinner = played && (
                                    homeScore > awayScore ||
                                    match.penaltyWinner === match.home
                                  );
                                  const awayWinner = played && (
                                    awayScore > homeScore ||
                                    match.penaltyWinner === match.away
                                  );

                                  return (
                                    <div className="knockout-card" key={`${currentPhase}-${index}`}>
                                      <div className="knockout-card-header">
                                        <span>{currentPhase.includes("Oitavas de final") ? "OITAVAS " + (index + 1) : currentPhase.includes("Quartas de final") ? "QUARTAS " + (index + 1) : currentPhase.includes("Segunda fase") ? "SEGUNDA FASE " + (index + 1) : currentPhase.includes("Play-off de acesso") ? "PLAY-OFF " + (index < 2 ? "3º × 6º" : "4º × 5º") + " — " + (index % 2 === 0 ? "IDA" : "VOLTA") : currentPhase.includes("Semi final") ? "SEMIFINAL " + (index + 1) : "FINAL"}</span>
                                        <span>{played ? "ENCERRADO" : "A DEFINIR"}</span>
                                      </div>
                                      <div className="knockout-teams">
                                        <div className={`knockout-team ${homeWinner ? "winner" : ""}`}>
                                          <span className="knockout-team-position">CASA</span>
                                          {clubLink(match.home, "club-link knockout-club-link")}
                                        </div>
                                        <div className="knockout-score">
                                          <span>PLACAR</span>
                                          <strong>{played ? `${homeScore} × ${awayScore}` : "— × —"}</strong>
                                          {played && match.penaltyWinner && (
                                            <small className="penalty-result">
                                              Pênaltis: {match.penaltyHome} × {match.penaltyAway}
                                            </small>
                                          )}
                                        </div>
                                        <div className={`knockout-team away ${awayWinner ? "winner" : ""}`}>
                                          <span className="knockout-team-position">FORA</span>
                                          {clubLink(match.away, "club-link knockout-club-link")}
                                        </div>
                                      </div>
                                      <div className="knockout-card-footer">
                                        <span>⚽ Jogo {index + 1}</span>
                                        {played && (homeWinner || awayWinner) && (
                                          <span className="knockout-winner">✓ Vencedor definido</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        }

                        if (
                          selected.state === "Amazonas" &&
                          (currentPhase === "1º Turno" || currentPhase === "2º Turno")
                        ) {
                          const prefix = currentPhase === "1º Turno" ? "1º Turno" : "2º Turno";
                          const groupATable = selected.phaseStandings?.[prefix + " - Grupo A"] ?? {};
                          const groupBTable = selected.phaseStandings?.[prefix + " - Grupo B"] ?? {};
                          const groupA = selected.amazonasGroups?.A ?? [];
                          const groupB = selected.amazonasGroups?.B ?? [];

                          const renderGroupTable = (title: string, group: string[], table: Record<string, Standing>) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr key={team} className={getRowClass(selected, currentPhase, index)}>
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid">
                              {renderGroupTable("GRUPO A", groupA, groupATable)}
                              {renderGroupTable("GRUPO B", groupB, groupBTable)}
                            </div>
                          );
                        }

                        if (selected.state === "São Paulo" && currentPhase === "Primeira fase") {
                          const pots = selected.saoPauloPots ?? {A:[],B:[],C:[],D:[]};
                          const renderPot = (title:string, teams:string[]) => (
                            <div className="amazonas-group-table">
                              <div className="amazonas-group-title">{title}</div>
                              <div className="standings-wrap">
                                <div className="standing-note">Pote com 4 clubes — todos se enfrentam.</div>
                                <div className="standings-table" style={{padding:"14px"}}>
                                  {teams.map((team,index) => <div key={team} className="standing-team" style={{padding:"7px 0"}}>{index+1}. {team}</div>)}
                                </div>
                              </div>
                            </div>
                          );
                          const ordered = sortStandingTeams(selected.teams ?? [], selected.standings ?? {});
                          const table = selected.standings ?? {};
                          return (
                            <div>
                              <div className="amazonas-groups-grid">
                                {renderPot("POTE A",pots.A)}
                                {renderPot("POTE B",pots.B)}
                                {renderPot("POTE C",pots.C)}
                                {renderPot("POTE D",pots.D)}
                              </div>
                              <div style={{marginTop:"24px"}}>
                                <div className="amazonas-group-title">CLASSIFICAÇÃO GERAL — PRIMEIRA FASE</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead><tr>
                                      <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                    </tr></thead>
                                    <tbody>
                                      {ordered.map((team,index) => {
                                        const row = table[team] ?? {j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0};
                                        return (
                                          <tr key={team} className={getRowClass(selected,currentPhase,index)}>
                                            <td>{index+1}</td><td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="standings-legend">
                                  <span><i className="legend-second-phase" /> Classificados para as quartas de final</span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (selected.state === "Paraná" && currentPhase === "Primeira fase") {
                          const a=selected.paranaGroups?.A??[], b=selected.paranaGroups?.B??[];
                          const ta=selected.phaseStandings?.["Primeira fase - Grupo A"]??{}, tb=selected.phaseStandings?.["Primeira fase - Grupo B"]??{};
                          const renderGroup=(title:string,group:string[],table:Record<string,Standing>)=>{const ordered=sortStandingTeams(group,table);return <div className="amazonas-group-table"><div className="amazonas-group-title">{title}</div><div className="standings-wrap"><table className="standings-table"><thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{ordered.map((team,index)=>{const row=table[team]??{j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0};return <tr key={team} className={index<4?"zone-second-phase":""}><td>{index+1}</td><td className="standing-team">{clubLink(team)}</td><td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td><td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td><td className="standing-points">{row.pts}</td></tr>})}</tbody></table></div></div>};
                          return <div className="amazonas-groups-grid">{renderGroup("GRUPO A",a,ta)}{renderGroup("GRUPO B",b,tb)}</div>;
                        }

                        if (
                          selected.state === "Rio Grande do Sul" &&
                          currentPhase === "Primeira fase"
                        ) {
                          const groupATable = selected.phaseStandings?.["Primeira fase - Grupo A"] ?? {};
                          const groupBTable = selected.phaseStandings?.["Primeira fase - Grupo B"] ?? {};
                          const groupA = selected.rioGrandeDoSulGroups?.A ?? [];
                          const groupB = selected.rioGrandeDoSulGroups?.B ?? [];

                          const renderRSGroup = (title: string, group: string[], table: Record<string, Standing>) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr key={team} className={index < 4 ? "zone-second-phase" : ""}>
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid">
                              {renderRSGroup("GRUPO A", groupA, groupATable)}
                              {renderRSGroup("GRUPO B", groupB, groupBTable)}
                            </div>
                          );
                        }

                        if (
                          selected.state === "Ceará" &&
                          (currentPhase === "Primeira fase" || currentPhase === "Segunda fase")
                        ) {
                          const isFirst = currentPhase === "Primeira fase";
                          const groupKeys = isFirst
                            ? ["Primeira fase - Grupo A", "Primeira fase - Grupo B"]
                            : ["Segunda fase - Grupo C", "Segunda fase - Grupo D"];
                          const groupTeams = isFirst
                            ? [selected.cearaGroups?.A ?? [], selected.cearaGroups?.B ?? []]
                            : [
                                selected.cearaSecondGroups?.C ?? [],
                                selected.cearaSecondGroups?.D ?? [],
                              ];
                          const renderCearaGroup = (title: string, group: string[], table: Record<string, Standing>, qualifiedCount: number) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr key={team} className={index < qualifiedCount ? "zone-second-phase" : ""}>
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid">
                              {renderCearaGroup(groupKeys[0], groupTeams[0], isFirst ? selected.phaseStandings?.[groupKeys[0]] ?? {} : selected.phaseStandings?.[groupKeys[0]] ?? {}, isFirst ? 3 : 2)}
                              {renderCearaGroup(groupKeys[1], groupTeams[1], isFirst ? selected.phaseStandings?.[groupKeys[1]] ?? {} : selected.phaseStandings?.[groupKeys[1]] ?? {}, isFirst ? 3 : 2)}
                            </div>
                          );
                        }

                        if (
                          selected.state === "Minas Gerais" &&
                          currentPhase === "Primeira fase"
                        ) {
                          const groups = selected.minasGeraisGroups;
                          const tables = {
                            A: selected.phaseStandings?.["Primeira fase - Grupo A"] ?? {},
                            B: selected.phaseStandings?.["Primeira fase - Grupo B"] ?? {},
                            C: selected.phaseStandings?.["Primeira fase - Grupo C"] ?? {},
                          };

                          const orderedGroups = groups
                            ? {
                                A: sortStandingTeams(groups.A, tables.A),
                                B: sortStandingTeams(groups.B, tables.B),
                                C: sortStandingTeams(groups.C, tables.C),
                              }
                            : undefined;

                          const allSeconds = orderedGroups
                            ? [
                                orderedGroups.A[1],
                                orderedGroups.B[1],
                                orderedGroups.C[1],
                              ].filter(Boolean) as string[]
                            : [];

                          const bestSecond = orderedGroups
                            ? sortStandingTeams(allSeconds, {
                                ...tables.A,
                                ...tables.B,
                                ...tables.C,
                              })[0]
                            : undefined;

                          const renderMGGroup = (
                            title: string,
                            group: string[],
                            table: Record<string, Standing>
                          ) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        const qualified = index === 0 || team === bestSecond;
                                        return (
                                          <tr key={team} className={qualified ? "zone-second-phase" : ""}>
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid minas-gerais-groups-grid">
                              {renderMGGroup("GRUPO A", groups?.A ?? [], tables.A)}
                              {renderMGGroup("GRUPO B", groups?.B ?? [], tables.B)}
                              {renderMGGroup("GRUPO C", groups?.C ?? [], tables.C)}
                            </div>
                          );
                        }

                        if (
                          selected.state === "Santa Catarina" &&
                          currentPhase === "Primeira fase"
                        ) {
                          const groupATable = selected.phaseStandings?.["Primeira fase - Grupo A"] ?? {};
                          const groupBTable = selected.phaseStandings?.["Primeira fase - Grupo B"] ?? {};
                          const groupA = selected.santaCatarinaGroups?.A ?? [];
                          const groupB = selected.santaCatarinaGroups?.B ?? [];

                          const renderSCGroup = (title: string, group: string[], table: Record<string, Standing>) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr
                                            key={team}
                                            className={index < 4 ? "zone-second-phase" : ""}
                                          >
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid">
                              {renderSCGroup("GRUPO A", groupA, groupATable)}
                              {renderSCGroup("GRUPO B", groupB, groupBTable)}
                            </div>
                          );
                        }

                        if (
                          selected.state === "Rio de Janeiro" &&
                          currentPhase === "Taça Guanabara"
                        ) {
                          const groupATable = selected.phaseStandings?.["Taça Guanabara - Grupo A"] ?? {};
                          const groupBTable = selected.phaseStandings?.["Taça Guanabara - Grupo B"] ?? {};
                          const groupA = selected.rioGroups?.A ?? [];
                          const groupB = selected.rioGroups?.B ?? [];

                          const renderRioGroup = (title: string, group: string[], table: Record<string, Standing>) => {
                            const ordered = sortStandingTeams(group, table);
                            return (
                              <div className="amazonas-group-table">
                                <div className="amazonas-group-title">{title}</div>
                                <div className="standings-wrap">
                                  <table className="standings-table">
                                    <thead>
                                      <tr>
                                        <th>#</th><th>TIME</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ordered.map((team, index) => {
                                        const row = table[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                        return (
                                          <tr
                                            key={team}
                                            className={
                                              index < 4
                                                ? "zone-second-phase"
                                                : ""
                                            }
                                          >
                                            <td>{index + 1}</td>
                                            <td className="standing-team">{clubLink(team)}</td>
                                            <td>{row.j}</td><td>{row.v}</td><td>{row.e}</td><td>{row.d}</td>
                                            <td>{row.gp}</td><td>{row.gc}</td><td>{row.sg}</td>
                                            <td className="standing-points">{row.pts}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="amazonas-groups-grid">
                              {renderRioGroup("GRUPO A", groupA, groupATable)}
                              {renderRioGroup("GRUPO B", groupB, groupBTable)}
                            </div>
                          );
                        }

                        const phaseTable = selected.phaseStandings?.[currentPhase] ?? selected.standings ?? {};
                        const phaseTeams = sortStandingTeams(selected.teams ?? [], phaseTable);

                        return (
                          <div className="standings-wrap">
                            <table className="standings-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>TIME</th>
                                  <th>J</th>
                                  <th>V</th>
                                  <th>E</th>
                                  <th>D</th>
                                  <th>GP</th>
                                  <th>GC</th>
                                  <th>SG</th>
                                  <th>PTS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {phaseTeams.map((team, index) => {
                                  const row = phaseTable[team] ?? { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
                                  return (
                                    <tr key={team} className={getRowClass(selected, currentPhase, index)}>
                                      <td>{index + 1}</td>
                                      <td className="standing-team">{clubLink(team)}</td>
                                      <td>{row.j}</td>
                                      <td>{row.v}</td>
                                      <td>{row.e}</td>
                                      <td>{row.d}</td>
                                      <td>{row.gp}</td>
                                      <td>{row.gc}</td>
                                      <td>{row.sg}</td>
                                      <td className="standing-points">{row.pts}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}

                      <div className="standings-legend">
                        <span><i className="legend-second-phase" /> Classificado para a segunda fase</span>
                        <span><i className="legend-promotion" /> Acesso direto</span>
                        <span><i className="legend-playoff" /> Play-off de acesso</span>
                        <span><i className="legend-relegation" /> Rebaixamento</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="competition-block rules-panel">
                  <div className="block-title">REGULAMENTO DA COMPETIÇÃO</div>
                  <div className="rules-list">
                    {(selected.rules ?? ["Estrutura ainda não definida."]).map((rule) => (
                      <div className="rule-item" key={rule}>• {rule}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="welcome">
            <div className="welcome-icon">⚽</div>
            <h2>Sistema zerado</h2>
            <p>
              Não há campeonatos, clubes, partidas ou temporadas cadastrados.
              Vamos construir o novo sistema a partir daqui.
            </p>
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              Criar o primeiro campeonato
            </button>
          </section>
        )}

        {selectedClub && (
          <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedClub(null)}>
            <div className="modal club-history-modal">
              {(() => {
                const entries = (clubHistory[selectedClub] ?? []).slice().sort(
                  (a, b) => Number(b.season) - Number(a.season) || b.competitionId - a.competitionId
                );
                const currentNational =
                  entries.find(
                    (item) =>
                      Number(item.season) === Math.max(...entries.map((item) => Number(item.season)), 0) &&
                      item.division.startsWith("Série ")
                  )?.division ?? "Sem divisão nacional";
                const titles = entries.filter((item) => item.champion).length;

                const resultLabel = (entry: ClubHistoryEntry) => {
                  if (entry.champion) return "CAMPEÃO";
                  if (entry.access) return "ACESSO";
                  if (entry.relegated) return "REBAIXADO";
                  return entry.position ? `${entry.position}º lugar` : "PARTICIPOU";
                };

                return (
                  <>
                    <div className="modal-header club-history-header">
                      <div>
                        <div className="eyebrow">HISTÓRICO DO CLUBE</div>
                        <h2>{selectedClub}</h2>
                      </div>
                      <button className="close" onClick={() => setSelectedClub(null)}>×</button>
                    </div>

                    <div className="club-history-stats">
                      <span>{entries.length} registros</span>
                      <span>{titles} {titles === 1 ? "título" : "títulos"}</span>
                      <span>{currentNational}</span>
                    </div>

                    {entries.length ? (
                      <div className="club-history-simple">
                        <div className="club-history-simple-head">
                          <span>ANO</span>
                          <span>COMPETIÇÃO</span>
                          <span>RESULTADO</span>
                        </div>

                        {entries.map((entry) => (
                          <div className="club-history-simple-row" key={`${entry.competitionId}-${entry.season}`}>
                            <div className="club-history-simple-season">{entry.season}</div>
                            <div className="club-history-simple-competition">
                              <strong>{entry.competition}</strong>
                              <span>
                                {entry.division}
                                {entry.state ? ` — ${entry.state}` : ""}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`club-history-result-badge ${
                                  entry.champion
                                    ? "is-champion"
                                    : entry.access
                                      ? "is-access"
                                      : entry.relegated
                                        ? "is-relegated"
                                        : ""
                                }`}
                              >
                                {resultLabel(entry)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="movement-empty">
                        O histórico será preenchido automaticamente assim que o clube disputar uma competição simulada.
                      </div>
                    )}

                    <div className="clubs-note">
                      <strong>Histórico automático:</strong> cada temporada simulada registra a competição, posição final, títulos, acessos e rebaixamentos.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {showCreate && (
          <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="modal">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">NOVO</div>
                  <h2>Criar campeonato</h2>
                </div>
                <button className="close" onClick={() => setShowCreate(false)}>×</button>
              </div>

              <label>
                Nome do campeonato
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Campeonato Brasileiro" autoFocus />
              </label>

              <div className="form-row">
                <label>
                  Temporada
                  <input value={season} onChange={(e) => setSeason(e.target.value)} />
                </label>
                <label>
                  Divisão
                  <select value={division} onChange={(e) => setDivision(e.target.value)}>
                    <option>Série A</option>
                    <option>Série B</option>
                    <option>Série C</option>
                    <option>Série D</option>
                    <option>Estadual</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="primary-button" onClick={createChampionship} disabled={!name.trim()}>
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b1020; color: #eef2ff; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }
        .app { min-height: 100vh; display: flex; background: #0b1020; }
        .sidebar { width: 270px; min-height: 100vh; background: #080c18; border-right: 1px solid #20283b; padding: 22px 16px; display: flex; flex-direction: column; }
        .brand { display: flex; gap: 12px; align-items: center; padding: 4px 8px 28px; }
        .brand-icon { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; background: #18233a; font-size: 20px; }
        .brand strong, .brand span { display: block; }
        .brand strong { font-size: 15px; }
        .brand span { color: #8e9ab4; font-size: 12px; margin-top: 2px; }
        .sidebar-section { margin-bottom: 22px; }
        .section-title, .eyebrow { color: #71809f; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
        .country, .champ-link { width: 100%; border: 0; background: transparent; color: #b8c2d9; text-align: left; border-radius: 9px; padding: 10px 11px; }
        .country.active, .champ-link.selected { background: #17213a; color: #fff; }
        .champ-link { margin-top: 4px; display: flex; justify-content: space-between; gap: 8px; }
        .champ-link small { color: #68758f; }
        .empty-sidebar { color: #66728b; font-size: 12px; padding: 12px 11px; line-height: 1.5; }
        .state-menu-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; margin-top: 7px; padding: 10px 11px; border: 0; border-radius: 9px; background: transparent; color: #b8c2d9; text-align: left; font-weight: 700; }
        .state-menu-toggle:hover, .state-menu-toggle.open { background: #121b30; color: #fff; }
        .state-chevron { color: #71809f; font-size: 12px; }
        .state-menu { margin: 2px 0 0 9px; padding-left: 8px; border-left: 1px solid #26314a; }
        .state-group { margin-bottom: 5px; }
        .state-name-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; border: 0; background: transparent; color: #d5dcf0; font-size: 12px; font-weight: 800; text-align: left; border-radius: 7px; padding: 8px 10px 5px; }
        .state-name-toggle:hover, .state-name-toggle.open { background: #111a2e; color: #fff; }
        .division-menu { margin-left: 9px; padding-left: 8px; border-left: 1px solid #26314a; }
        .phase-area { padding-top: 22px; }
        .section-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
        .section-tab { border: 1px solid #293651; background: #0c1323; color: #8e9ab4; border-radius: 8px; padding: 9px 15px; font-size: 11px; font-weight: 800; }
        .section-tab:hover { background: #141e34; color: #dce5ff; }
        .section-tab.active { background: #3157d5; border-color: #3157d5; color: #fff; }
        .phase-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .phase-tab { border: 1px solid #293651; background: #0c1323; color: #8e9ab4; border-radius: 8px; padding: 8px 13px; font-size: 11px; font-weight: 800; }
        .phase-tab:hover { background: #141e34; color: #dce5ff; }
        .phase-tab.active { background: #3157d5; border-color: #3157d5; color: #fff; }
        .competition-content { display: block; }
        .full-width-block { width: 100%; }
        .rules-panel { width: 100%; }
        .competition-block { background: #0c1323; border: 1px solid #202a40; border-radius: 12px; padding: 17px; }
        .block-title { color: #71809f; font-size: 10px; font-weight: 800; letter-spacing: .14em; margin-bottom: 12px; }
        .standings-block { min-width: 0; }
        .standings-wrap { overflow-x: auto; }
        .standings-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
        .standings-table th { color: #71809f; font-size: 8px; font-weight: 800; letter-spacing: .04em; text-align: center; padding: 7px 3px; border-bottom: 1px solid #202a40; }
        .standings-table th:first-child { width: 5%; }
        .standings-table th:nth-child(2) { width: 45%; }
        .standings-table th:nth-child(n+3) { width: 5.56%; }
        .standings-table th:nth-child(2) { text-align: left; }
        .standings-table td { color: #aeb9ce; text-align: center; padding: 8px 3px; border-bottom: 1px solid #182238; overflow: hidden; }
        .standings-table tr:last-child td { border-bottom: 0; }
        .standings-table td:first-child { color: #71809f; font-weight: 700; width: 28px; }
        .standing-team { text-align: left !important; color: #eef2ff !important; font-weight: 700; white-space: normal; overflow-wrap: anywhere; line-height: 1.2; }
        .standing-points { color: #fff !important; font-weight: 800; }
        .knockout-list { display: grid; gap: 14px; margin-top: 6px; }
        .knockout-card { border: 1px solid #24304a; border-radius: 14px; background: linear-gradient(135deg, #0d1629, #101a2e); overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
        .knockout-card-header, .knockout-card-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; color: #7f8eaa; font-size: 10px; font-weight: 800; letter-spacing: .08em; }
        .knockout-card-header { border-bottom: 1px solid #1e2a42; }
        .knockout-card-header span:first-child { color: #b7c3d9; }
        .knockout-teams { display: grid; grid-template-columns: 1fr 130px 1fr; align-items: center; min-height: 112px; padding: 18px 20px; gap: 18px; }
        .knockout-team { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .knockout-team.away { text-align: right; align-items: flex-end; }
        .knockout-team-position { color: #61708d; font-size: 9px; font-weight: 800; letter-spacing: .08em; }
        .knockout-team strong { color: #e7edf8; font-size: 15px; line-height: 1.25; word-break: break-word; }
        .knockout-team.winner strong { color: #86efac; }
        .knockout-score { text-align: center; padding: 10px 8px; border-left: 1px solid #202d46; border-right: 1px solid #202d46; }
        .knockout-score span { display: block; color: #65738e; font-size: 9px; font-weight: 800; letter-spacing: .08em; margin-bottom: 6px; }
        .penalty-result { display: block; margin-top: 5px; font-size: 10px; color: #7ee2a8; font-weight: 800; }
        .knockout-score strong { color: #fff; font-size: 24px; letter-spacing: .02em; }
        .knockout-card-footer { border-top: 1px solid #1e2a42; font-size: 10px; }
        .knockout-winner { color: #6ee7a0; letter-spacing: 0; }
        .phase-empty { min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; border: 1px dashed #293650; border-radius: 12px; color: #7787a3; }
        .phase-empty-icon { font-size: 25px; }
        .phase-empty strong { color: #b9c5d8; font-size: 13px; }
        .phase-empty span { font-size: 11px; }
        .standings-table tr.amazonas-group-first td {
          background: rgba(249, 115, 22, 0.28) !important;
        }
        .standings-table tr.amazonas-group-first td:first-child {
          box-shadow: inset 4px 0 0 #f97316;
          color: #fb923c !important;
        }
        .standings-table tr.amazonas-group-first .standing-team {
          color: #fdba74 !important;
          font-weight: 700;
        }
        .standings-table tr.amazonas-group-qualified td {
          background: rgba(249, 115, 22, 0.12) !important;
        }
        .standings-table tr.amazonas-group-qualified td:first-child {
          box-shadow: inset 4px 0 0 #fdba74;
          color: #fed7aa !important;
        }
        .standings-table tr.amazonas-group-qualified .standing-team {
          color: #fed7aa !important;
        }
        .standings-table tr.zone-second-phase td { background: rgba(249, 115, 22, 0.16) !important; }
        .standings-table tr.zone-second-phase td:first-child { box-shadow: inset 4px 0 0 #f97316; color: #fdba74 !important; }
        .standings-table tr.zone-second-phase .standing-team { color: #fed7aa !important; }
        .standings-table tr.sergipe-direct-semi td { background: rgba(249, 115, 22, 0.28) !important; }
.standings-table tr.sergipe-direct-semi td:first-child { box-shadow: inset 4px 0 0 #f97316; color: #fdba74 !important; }
.standings-table tr.sergipe-direct-semi .standing-team { color: #fed7aa !important; }
.standings-table tr.sergipe-quarterfinal td { background: rgba(249, 115, 22, 0.12) !important; }
.standings-table tr.sergipe-quarterfinal td:first-child { box-shadow: inset 4px 0 0 #fb923c; color: #fdba74 !important; }
.standings-table tr.sergipe-quarterfinal .standing-team { color: #fed7aa !important; }
.standings-table tr.rn-direct-semi td { background: rgba(249, 115, 22, 0.28) !important; }
        .standings-table tr.rn-direct-semi td:first-child { box-shadow: inset 4px 0 0 #f97316; color: #fdba74 !important; }
        .standings-table tr.rn-direct-semi .standing-team { color: #fed7aa !important; }
        .standings-table tr.rn-quarterfinal td { background: rgba(249, 115, 22, 0.12) !important; }
        .standings-table tr.rn-quarterfinal td:first-child { box-shadow: inset 4px 0 0 #fb923c; color: #fdba74 !important; }
        .standings-table tr.rn-quarterfinal .standing-team { color: #fed7aa !important; }
        .standings-table tr.mato-grosso-do-sul-direct-semi td { background: rgba(249, 115, 22, 0.28) !important; }
.standings-table tr.mato-grosso-do-sul-direct-semi td:first-child { box-shadow: inset 4px 0 0 #f97316; color: #fdba74 !important; }
.standings-table tr.mato-grosso-do-sul-direct-semi .standing-team { color: #fed7aa !important; }
.standings-table tr.mato-grosso-do-sul-quarterfinal td { background: rgba(249, 115, 22, 0.12) !important; }
.standings-table tr.mato-grosso-do-sul-quarterfinal td:first-child { box-shadow: inset 4px 0 0 #fb923c; color: #fdba74 !important; }
.standings-table tr.mato-grosso-do-sul-quarterfinal .standing-team { color: #fed7aa !important; }
.standings-table tr.mato-grosso-direct-semi td { background: rgba(249, 115, 22, 0.28) !important; }
        .standings-table tr.mato-grosso-direct-semi td:first-child { box-shadow: inset 4px 0 0 #f97316; color: #fdba74 !important; }
        .standings-table tr.mato-grosso-direct-semi .standing-team { color: #fed7aa !important; }
        .standings-table tr.mato-grosso-quarterfinal td { background: rgba(249, 115, 22, 0.12) !important; }
        .standings-table tr.mato-grosso-quarterfinal td:first-child { box-shadow: inset 4px 0 0 #fb923c; color: #fdba74 !important; }
        .standings-table tr.mato-grosso-quarterfinal .standing-team { color: #fed7aa !important; }
        .standings-table tr.zone-promotion td { background: rgba(34, 197, 94, 0.16) !important; }
        .standings-table tr.zone-promotion td:first-child { box-shadow: inset 4px 0 0 #22c55e; color: #86efac !important; }
        .standings-table tr.zone-promotion .standing-team { color: #bbf7d0 !important; }
        .standings-table tr.zone-playoff td { background: rgba(234, 179, 8, 0.16) !important; }
        .standings-table tr.zone-playoff td:first-child { box-shadow: inset 4px 0 0 #eab308; color: #fde047 !important; }
        .standings-table tr.zone-playoff .standing-team { color: #fef08a !important; }
        .standings-table tr.zone-relegation td { background: rgba(239, 68, 68, 0.16) !important; }
        .standings-table tr.zone-relegation td:first-child { box-shadow: inset 4px 0 0 #ef4444; color: #fca5a5 !important; }
        .standings-table tr.zone-relegation .standing-team { color: #fecaca !important; }
        .amazonas-groups-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}
.amazonas-group-table {
  min-width: 0;
}
.minas-gerais-groups-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}
.minas-gerais-groups-grid .amazonas-group-table {
  width: 100%;
  min-width: 0;
}
.minas-gerais-groups-grid .standings-wrap {
  width: 100%;
  overflow-x: visible;
}
@media (max-width: 900px) {
  .minas-gerais-groups-grid {
    grid-template-columns: 1fr;
  }
}
.amazonas-group-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #dce5f7;
  margin-bottom: 8px;
}
@media (max-width: 900px) {
  .amazonas-groups-grid {
    grid-template-columns: 1fr;
  }
}

.standings-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; color: #8e9ab4; font-size: 10px; }
        .standings-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .standings-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: 0 0 10px; }
        .standings-legend .legend-second-phase { background: #f97316; }
        .standings-legend .legend-promotion { background: #22c55e; }
        .standings-legend .legend-playoff { background: #eab308; }
        .standings-legend .legend-relegation { background: #ef4444; }

        .national-movement-panel { width: 100%; }
        .movement-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .movement-card { border: 1px solid #26314a; border-radius: 12px; padding: 16px; background: #11192b; min-width: 0; }
        .movement-card-title { font-size: 13px; font-weight: 900; letter-spacing: .04em; margin-bottom: 4px; }
        .movement-access .movement-card-title { color: #86efac; }
        .movement-relegation .movement-card-title { color: #fca5a5; }
        .movement-subtitle { color: #71809f; font-size: 10px; margin-bottom: 14px; }
        .serie-d-next-season-panel { width: 100%; }
        .serie-d-next-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0 0 16px; }
        .serie-d-next-summary > div { background: #11192b; border: 1px solid #26314a; border-radius: 10px; padding: 12px; }
        .serie-d-next-summary span { display: block; color: #71809f; font-size: 9px; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 5px; }
        .serie-d-next-summary strong { color: #eef2ff; font-size: 15px; }
        @media (max-width: 760px) { .serie-d-next-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .championship-history-panel { width: 100%; }
        .history-subtitle { color: #8e9ab4; font-size: 11px; line-height: 1.5; margin: -4px 0 14px; }
        .champion-history-list { border: 1px solid #202a40; border-radius: 10px; overflow: hidden; background: #0b1220; }
        .champion-history-row { display: grid; grid-template-columns: 72px 42px 1fr; align-items: center; min-height: 54px; padding: 0 14px; border-bottom: 1px solid #1c2539; }
        .champion-history-row:last-child { border-bottom: 0; }
        .champion-history-year { color: #71809f; font-size: 12px; font-weight: 900; }
        .champion-history-trophy { font-size: 16px; text-align: center; }
        .champion-history-club { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .champion-history-club strong { color: #eef2ff; font-size: 12px; }
        .champion-history-club span { color: #6ee7b7; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
        @media (max-width: 600px) {
          .champion-history-row { grid-template-columns: 58px 34px 1fr; padding: 0 10px; }
          .champion-history-club { align-items: flex-start; flex-direction: column; gap: 3px; }
        }

        .movement-group-title { color: #cbd5e1; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; margin: 13px 0 7px; }
        .movement-club { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #1c2539; }
        .movement-club strong { color: #eef2ff; font-size: 12px; }
        .movement-club span { color: #8e9ab4; font-size: 10px; text-align: right; }
        .movement-empty { color: #8e9ab4; font-size: 12px; line-height: 1.5; padding: 18px 0; }
        .movement-empty.small { padding: 8px 0; font-size: 11px; }
        @media (max-width: 760px) { .movement-grid { grid-template-columns: 1fr; } .movement-club { align-items: flex-start; flex-direction: column; gap: 4px; } .movement-club span { text-align: left; } }

        .club-link {
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          color: inherit;
          font: inherit;
          font-weight: inherit;
          text-align: left;
          cursor: pointer;
        }
        .club-link:hover {
          color: #8fb0ff !important;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .club-link-strong { color: #eef2ff !important; font-weight: 700; }
        .knockout-club-link { color: #e7edf8 !important; font-size: 15px; line-height: 1.25; font-weight: 800; }
        .club-history-modal { width: min(780px, 100%); max-height: 88vh; overflow-y: auto; }
        .club-history-header { margin-bottom: 10px; }
        .club-history-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 7px 18px;
          margin-bottom: 16px;
          color: #71809f;
          font-size: 10px;
        }
        .club-history-stats span + span::before {
          content: "•";
          margin-right: 18px;
          color: #394661;
        }
        .club-history-simple {
          border: 1px solid #26314a;
          border-radius: 10px;
          overflow: hidden;
          background: #0c1323;
        }
        .club-history-simple-head,
        .club-history-simple-row {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) 118px;
          align-items: center;
          gap: 12px;
        }
        .club-history-simple-head {
          min-height: 34px;
          padding: 0 12px;
          background: #10192c;
          border-bottom: 1px solid #26314a;
          color: #68758f;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .08em;
        }
        .club-history-simple-row {
          min-height: 58px;
          padding: 8px 12px;
          border-bottom: 1px solid #1c2539;
        }
        .club-history-simple-row:last-child { border-bottom: 0; }
        .club-history-simple-row:hover { background: #10192c; }
        .club-history-simple-season {
          color: #9eacc5;
          font-size: 12px;
          font-weight: 900;
        }
        .club-history-simple-competition {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .club-history-simple-competition strong {
          color: #eef2ff;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .club-history-simple-competition span {
          color: #68758f;
          font-size: 9px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .club-history-result-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 26px;
          padding: 4px 7px;
          border-radius: 6px;
          border: 1px solid #2b3650;
          color: #aeb9ce;
          background: #11192b;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .04em;
        }
        .club-history-result-badge.is-champion {
          color: #fcd34d;
          background: rgba(234, 179, 8, .10);
          border-color: rgba(234, 179, 8, .24);
        }
        .club-history-result-badge.is-access {
          color: #86efac;
          background: rgba(34, 197, 94, .10);
          border-color: rgba(34, 197, 94, .22);
        }
        .club-history-result-badge.is-relegated {
          color: #fca5a5;
          background: rgba(239, 68, 68, .10);
          border-color: rgba(239, 68, 68, .22);
        }
        @media (max-width: 620px) {
          .club-history-simple-head,
          .club-history-simple-row {
            grid-template-columns: 54px minmax(0, 1fr);
          }
          .club-history-simple-head span:last-child { display: none; }
          .club-history-simple-row > div:last-child { grid-column: 2; justify-self: start; }
          .club-history-result-badge { width: auto; min-width: 92px; }
        }

        .clubs-panel { width: 100%; }
        .clubs-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
        .clubs-summary > div { background: #11192b; border: 1px solid #26314a; border-radius: 10px; padding: 12px; }
        .clubs-summary span { display: block; color: #71809f; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 5px; }
        .clubs-summary strong { font-size: 14px; color: #eef2ff; }
        .clubs-table-wrap { width: 100%; overflow-x: auto; }
        .clubs-table { width: 100%; border-collapse: collapse; min-width: 920px; }
        .clubs-table th { color: #71809f; font-size: 10px; text-align: left; padding: 10px 9px; border-bottom: 1px solid #26314a; white-space: nowrap; }
        .clubs-table td { color: #aeb9d0; font-size: 12px; padding: 11px 9px; border-bottom: 1px solid #1c2539; vertical-align: middle; }
        .clubs-table tr:hover td { background: rgba(49, 87, 213, .08); }
        .clubs-table .club-name-cell { color: #eef2ff; font-weight: 700; }
        .club-status { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 5px 8px; font-size: 9px; font-weight: 900; white-space: nowrap; letter-spacing: .03em; }
        .club-status-ok { background: rgba(34, 197, 94, .16); color: #86efac; border: 1px solid rgba(34, 197, 94, .25); }
        .club-status-no { background: rgba(239, 68, 68, .13); color: #fca5a5; border: 1px solid rgba(239, 68, 68, .2); }
        .club-status-pending { background: rgba(234, 179, 8, .14); color: #fde047; border: 1px solid rgba(234, 179, 8, .22); }
        .club-status-d { background: rgba(249, 115, 22, .15); color: #fdba74; border: 1px solid rgba(249, 115, 22, .24); }
        .clubs-note { margin-top: 14px; padding: 12px 14px; border: 1px solid #26314a; border-radius: 10px; color: #8e9ab4; font-size: 11px; line-height: 1.5; background: #0f1627; }
        .clubs-note strong { color: #cbd5e1; }
        @media (max-width: 900px) { .clubs-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .clubs-summary { grid-template-columns: 1fr; } }

        .rules-list { display: grid; gap: 10px; }
        .rule-item { color: #b5bfd4; font-size: 13px; line-height: 1.45; }
        .state-empty { color: #5f6b84; font-size: 11px; padding: 9px 10px; }
        .state-link { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 0; background: transparent; color: #9ba8c1; text-align: left; border-radius: 7px; padding: 8px 10px; font-size: 12px; }
        .state-link:hover, .state-link.selected { background: #17213a; color: #fff; }
        .state-link small { color: #68758f; font-size: 10px; }
        .sidebar-bottom { margin-top: auto; display: grid; gap: 8px; }
        .top-action:disabled { opacity: .45; cursor: not-allowed; filter: grayscale(.35); }\n        .new-button, .primary-button, .top-action { border: 0; background: #3157d5; color: white; font-weight: 700; border-radius: 9px; padding: 11px 15px; }
        .new-button:hover, .primary-button:hover, .top-action:hover { background: #3d65ed; }
        .reset-button { border: 1px solid #343d52; background: transparent; color: #8e9ab4; border-radius: 9px; padding: 9px; }
        .main { flex: 1; min-width: 0; padding: 32px 42px; }
        .country-heading { display: flex; align-items: center; gap: 12px; }
        .simulate-season { border: 1px solid #33466f; background: #14213b; color: #dce5ff; border-radius: 8px; padding: 7px 11px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .simulate-season:hover { background: #1b2c4d; border-color: #4b65a0; }
        .reset-season { border: 1px solid #593c45; background: #21151b; color: #f0b5bf; border-radius: 8px; padding: 7px 11px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .reset-season:hover { background: #2c1a22; border-color: #8b4b59; color: #ffd5dc; }
        .topbar { max-width: 1100px; margin: 0 auto 26px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .country-heading { display: flex; align-items: center; gap: 12px; }
        .simulate-season { border: 1px solid #33466f; background: #14213b; color: #dce5ff; border-radius: 8px; padding: 7px 11px; font-size: 11px; font-weight: 800; }
        .simulate-season:hover { background: #1b2c4d; border-color: #4b65a0; }
        h1, h2, h3, p { margin: 0; }
        h1 { font-size: 28px; margin-top: 5px; }
        h2 { font-size: 20px; margin-top: 5px; }
        .card, .welcome { max-width: 1100px; margin: 0 auto; background: #101729; border: 1px solid #222c43; border-radius: 16px; }
        .card { padding: 25px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 22px; border-bottom: 1px solid #222c43; }
        .danger-link { border: 0; background: transparent; color: #ed7180; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 22px 0; }
        .info-grid div { background: #0c1323; border: 1px solid #202a40; border-radius: 11px; padding: 15px; }
        .info-grid span { display: block; color: #71809f; font-size: 11px; }
        .info-grid strong { display: block; margin-top: 6px; }
        .empty-state { text-align: center; padding: 65px 20px 50px; color: #8e9ab4; }
        .empty-icon, .welcome-icon { font-size: 38px; margin-bottom: 14px; }
        .empty-state h3, .welcome h2 { color: #fff; margin-bottom: 8px; }
        .empty-state p, .welcome p { max-width: 580px; margin: 0 auto; line-height: 1.6; font-size: 14px; }
        .welcome { text-align: center; padding: 90px 25px; }
        .welcome-icon { width: 64px; height: 64px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 18px; background: #18233a; }
        .welcome .primary-button { margin-top: 25px; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.68); display: grid; place-items: center; padding: 20px; z-index: 10; }
        .modal { width: min(560px, 100%); background: #11192b; border: 1px solid #2a3550; border-radius: 16px; padding: 24px; box-shadow: 0 25px 80px rgba(0,0,0,.45); }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .close { border: 0; background: transparent; color: #8e9ab4; font-size: 26px; line-height: 1; }
        label { display: block; color: #aab5cc; font-size: 12px; font-weight: 700; margin-bottom: 17px; }
        input, select { display: block; width: 100%; margin-top: 7px; background: #0b1221; border: 1px solid #2b3650; color: #fff; border-radius: 9px; padding: 11px 12px; outline: none; }
        input:focus, select:focus { border-color: #496de4; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; }
        .secondary-button { border: 1px solid #35405a; background: transparent; color: #bac4d9; border-radius: 9px; padding: 11px 15px; }
        .primary-button:disabled { opacity: .45; cursor: not-allowed; }
        @media (max-width: 760px) {
          .sidebar { width: 220px; }
          .main { padding: 25px 18px; }
          .topbar { align-items: flex-start; flex-direction: column; }
          .info-grid, .form-row, .competition-content { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .app { display: block; }
          .sidebar { width: 100%; min-height: auto; border-right: 0; border-bottom: 1px solid #20283b; }
          .sidebar-bottom { margin-top: 10px; }
        }
      `}</style>
    </div>
  );
}

