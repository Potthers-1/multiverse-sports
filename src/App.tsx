import { useEffect, useState } from "react";

type Matchup = {
  home: string;
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
  amazonasGroups?: { A: string[]; B: string[] };
};

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

const INITIAL_CHAMPIONSHIPS: Championship[] = [
  ...ACRE_CHAMPIONSHIPS,
  ...ALAGOAS_CHAMPIONSHIPS,
  ...AMAPA_CHAMPIONSHIPS,
  ...AMAZONAS_CHAMPIONSHIPS,
  ...BAHIA_CHAMPIONSHIPS,
  ...DISTRITO_FEDERAL_CHAMPIONSHIPS,
  ...ESPIRITO_SANTO_CHAMPIONSHIPS,
];

const STORAGE_KEY = "football-manager-clean-v2";

export default function App() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [estaduaisOpen, setEstaduaisOpen] = useState(false);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [season, setSeason] = useState("2026");
  const [division, setDivision] = useState("Estadual");
  const [selectedPhase, setSelectedPhase] = useState<Record<number, string>>({});
  const [selectedSection, setSelectedSection] = useState<Record<number, "competition" | "rules">>({});

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

        for (const acre of INITIAL_CHAMPIONSHIPS) {
          if (!merged.some((champ) => champ.id === acre.id)) {
            merged.push(acre);
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

  const selected = championships.find((c) => c.id === selectedId) ?? null;
  const estadualChampionships = championships.filter((champ) => champ.state);
  const stateNames = [...new Set(estadualChampionships.map((champ) => champ.state!))];

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

  function getRowClass(championship: Championship, phase: string, index: number) {
    if (
      championship.state === "Amazonas" &&
      championship.division === "1ª Divisão" &&
      (phase === "1º Turno" || phase === "2º Turno")
    ) {
      if (index === 0) return "amazonas-group-first";
      if (index === 1 || index === 2) return "amazonas-group-qualified";
    }

    // Nas primeiras divisões estaduais atuais, os 4 primeiros avançam ao mata-mata.
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

    const updated = championships.map((championship) => {
      if (championship.country !== country) return championship;

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

      return simulateGenericChampionship(championship);
    });

    setChampionships(updated);

    // Após a simulação completa, a primeira fase continua sendo a tela inicial.
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
  }

  function simulateSeason() {
    if (!selected) return;

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

  function goToNextSeason() {
    const country = "Brasil";
    const countryChampionships = championships.filter((c) => c.country === country);

    if (!countryChampionships.length) {
      window.alert("Não há campeonatos cadastrados para avançar.");
      return;
    }

    const currentYear = Math.max(
      ...countryChampionships.map((c) => Number(c.season) || 2026)
    );
    const nextYear = String(currentYear + 1);

    setChampionships((current) =>
      current.map((championship) => {
        if (championship.country !== country) return championship;

        return {
          ...championship,
          season: nextYear,
          standings: undefined,
          phaseStandings: undefined,
          phaseMatches: undefined,
          firstTurnWinner: undefined,
          amazonasGroups: championship.state === "Amazonas" ? undefined : championship.amazonasGroups,
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

    window.alert(`Temporada ${nextYear} criada. A composição dos clubes foi mantida, sem promoção ou rebaixamento.`);
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
                  const stateDivisions = [...new Set(
                    estadualChampionships
                      .filter((champ) => champ.state === stateName)
                      .map((champ) => champ.division)
                  )];

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
                            const divisionSeasons = estadualChampionships
                              .filter(
                                (champ) =>
                                  champ.state === stateName &&
                                  champ.division === divisionName
                              )
                              .sort(
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
          <button className="top-action" onClick={goToNextSeason}>
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
              <div><span>Temporada</span><strong>{selected.season}</strong></div>
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

                {selected.state === "Amazonas" && selected.division === "1ª Divisão" && (
                  <button
                    className="section-tab"
                    onClick={drawAmazonasGroups}
                  >
                    🎲 Sortear grupos
                  </button>
                )}
              </div>

              {(selectedSection[selected.id] ?? "competition") === "competition" ? (
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
                          return currentPhase === "Semi final" || currentPhase === "Final"
                            ? currentPhase.toUpperCase()
                            : `TABELA — ${currentPhase}`;
                        })()}
                      </div>

                      {(() => {
                        const currentPhase = selectedPhase[selected.id] ?? selected.phases?.[0] ?? "CLASSIFICAÇÃO";
                        const matches = selected.phaseMatches?.[currentPhase] ?? [];

                        if (currentPhase.includes("Quartas de final") || currentPhase.includes("Semi final") || currentPhase.includes("Final")) {
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
                                        <span>{currentPhase.includes("Quartas de final") ? "QUARTAS " + (index + 1) : currentPhase.includes("Semi final") ? "SEMIFINAL " + (index + 1) : "FINAL"}</span>
                                        <span>{played ? "ENCERRADO" : "A DEFINIR"}</span>
                                      </div>
                                      <div className="knockout-teams">
                                        <div className={`knockout-team ${homeWinner ? "winner" : ""}`}>
                                          <span className="knockout-team-position">CASA</span>
                                          <strong>{match.home}</strong>
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
                                          <strong>{match.away}</strong>
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
                                            <td className="standing-team">{team}</td>
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
                                      <td className="standing-team">{team}</td>
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

        .rules-list { display: grid; gap: 10px; }
        .rule-item { color: #b5bfd4; font-size: 13px; line-height: 1.45; }
        .state-empty { color: #5f6b84; font-size: 11px; padding: 9px 10px; }
        .state-link { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 0; background: transparent; color: #9ba8c1; text-align: left; border-radius: 7px; padding: 8px 10px; font-size: 12px; }
        .state-link:hover, .state-link.selected { background: #17213a; color: #fff; }
        .state-link small { color: #68758f; font-size: 10px; }
        .sidebar-bottom { margin-top: auto; display: grid; gap: 8px; }
        .new-button, .primary-button, .top-action { border: 0; background: #3157d5; color: white; font-weight: 700; border-radius: 9px; padding: 11px 15px; }
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
