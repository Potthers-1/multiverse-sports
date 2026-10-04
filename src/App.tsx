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
      "O 7º e o 8º colocados são rebaixados.",
    ],
  },
  {
    id: 1002,
    name: "Acre",
    season: "2026",
    division: "2ª Divisão",
    country: "Brasil",
    state: "Acre",
    teams: [
      "Atlético Acreano - AC",
      "Andirá - AC",
      "Nauás - AC",
      "Plácido de Castro - AC",
    ],
    phases: ["Primeiro turno", "Segundo turno", "Final", "Classificação geral"],
    rules: [
      "1º turno: 4 times disputam entre si em 3 jogos; o melhor vai para a final.",
      "2º turno: 4 times disputam entre si em 3 jogos; o melhor vai para a final.",
      "Final em jogo único entre os vencedores dos turnos.",
      "Se o mesmo time vencer os dois turnos, será campeão automaticamente.",
      "O campeão geral garante o acesso à 1ª Divisão.",
      "O melhor classificado na tabela geral, além do campeão, também garante o acesso à 1ª Divisão."
    ],
  },
];

const STORAGE_KEY = "football-manager-clean-v1";

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
        const parsed = JSON.parse(saved) as Championship[];
        const merged = parsed.map((champ) => {
          const acreDefinition = ACRE_CHAMPIONSHIPS.find((acre) => acre.id === champ.id);
          return acreDefinition
            ? {
                ...champ,
                name: acreDefinition.name,
                country: acreDefinition.country,
                state: acreDefinition.state,
                division: acreDefinition.division,
                teams: champ.teams?.length ? champ.teams : acreDefinition.teams,
                phases: acreDefinition.phases,
                rules: acreDefinition.rules,
              }
            : champ;
        });

        for (const acre of ACRE_CHAMPIONSHIPS) {
          if (!merged.some((champ) => champ.id === acre.id)) {
            merged.push(acre);
          }
        }

        setChampionships(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } else {
        setChampionships(ACRE_CHAMPIONSHIPS);
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
    if (championship.state !== "Acre") return "";
    if (championship.division === "1ª Divisão" && phase === "Primeira fase") {
      if (index < 4) return "zone-next";
      if (index >= (championship.teams?.length ?? 0) - 2) return "zone-relegation";
    }
    if (championship.division === "2ª Divisão" && (phase === "Primeiro turno" || phase === "Segundo turno")) {
      if (index === 0) return "zone-next";
    }
    return "";
  }

  function getSecondDivisionAccessIds(championship: Championship) {
    if (championship.state !== "Acre" || championship.division !== "2ª Divisão") return new Set<string>();

    const firstWinner = championship.firstTurnWinner;
    const secondWinner = championship.secondTurnWinner;
    let champion: string | undefined;

    if (firstWinner && secondWinner) {
      if (firstWinner === secondWinner) {
        champion = firstWinner;
      } else {
        const final = championship.phaseMatches?.["Final"]?.[0];
        if (final?.penaltyWinner) {
          champion = final.penaltyWinner;
        } else if (final?.homeScore !== undefined && final?.awayScore !== undefined && final.homeScore !== final.awayScore) {
          champion = final.homeScore > final.awayScore ? final.home : final.away;
        }
      }
    }

    const general = championship.phaseStandings?.["Classificação geral"] ?? championship.standings ?? {};
    const ordered = Object.keys(general).sort((a, b) => {
      const A = general[a];
      const B = general[b];
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });

    const access = new Set<string>();
    if (champion) access.add(champion);

    const bestNonChampion = ordered.find((team) => team !== champion);
    if (bestNonChampion) access.add(bestNonChampion);

    return access;
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

  function simulateAcreSecondDivision(championship: Championship): Championship {
    const teams = championship.teams ?? [];

    const firstTurn = simulateRoundRobin(teams);
    const firstOrder = [...teams].sort((a, b) => {
      const A = firstTurn[a];
      const B = firstTurn[b];
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });
    const firstWinner = firstOrder[0];

    // O segundo turno começa com uma tabela completamente nova e independente.
    const secondTurn = simulateRoundRobin(teams);
    const secondOrder = [...teams].sort((a, b) => {
      const A = secondTurn[a];
      const B = secondTurn[b];
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });
    const secondWinner = secondOrder[0];

    const phaseStandings = {
      ...(championship.phaseStandings ?? {}),
      "Primeiro turno": firstTurn,
      "Segundo turno": secondTurn,
    };

    // Classificação geral soma os dois turnos.
    const general: Record<string, Standing> = {};
    teams.forEach((team) => {
      const a = firstTurn[team];
      const b = secondTurn[team];
      general[team] = {
        j: a.j + b.j,
        v: a.v + b.v,
        e: a.e + b.e,
        d: a.d + b.d,
        gp: a.gp + b.gp,
        gc: a.gc + b.gc,
        sg: a.sg + b.sg,
        pts: a.pts + b.pts,
      };
    });

    let finalMatches: Matchup[] = [];
    if (firstWinner !== secondWinner) {
      finalMatches = [simulateSingleKnockoutMatch(firstWinner, secondWinner)];
    }

    return {
      ...championship,
      standings: general,
      phaseStandings: {
        ...phaseStandings,
        "Classificação geral": general,
      },
      phaseMatches: {
        ...(championship.phaseMatches ?? {}),
        "Final": finalMatches,
      },
      firstTurnWinner: firstWinner,
      secondTurnWinner: secondWinner,
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

      if (championship.state === "Acre" && championship.division === "2ª Divisão") {
        return simulateAcreSecondDivision(championship);
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
    } else if (selected.state === "Acre" && selected.division === "2ª Divisão") {
      const updated = simulateAcreSecondDivision(selected);
      setChampionships((current) =>
        current.map((championship) =>
          championship.id === selected.id ? updated : championship
        )
      );
      setSelectedPhase((current) => ({
        ...current,
        [selected.id]: "Primeiro turno",
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

  function getAcreSecondDivisionChampion(championship: Championship) {
    const firstWinner = championship.firstTurnWinner;
    const secondWinner = championship.secondTurnWinner;
    if (!firstWinner || !secondWinner) return undefined;
    if (firstWinner === secondWinner) return firstWinner;

    const final = championship.phaseMatches?.["Final"]?.[0];
    if (!final) return undefined;

    // Final empatada: o campeão é definido pelo pênalti automático.
    if (final.penaltyWinner) return final.penaltyWinner;

    if (final.homeScore === undefined || final.awayScore === undefined) return undefined;
    if (final.homeScore === final.awayScore) return undefined;

    return final.homeScore > final.awayScore ? final.home : final.away;
  }

  function getAcreAccessTeams(championship: Championship) {
    const champion = getAcreSecondDivisionChampion(championship);
    const general = championship.phaseStandings?.["Classificação geral"];
    if (!champion || !general) return new Set<string>();

    const ordered = Object.keys(general).sort((a, b) => {
      const A = general[a], B = general[b];
      return B.pts - A.pts || B.v - A.v || B.sg - A.sg || B.gp - A.gp || a.localeCompare(b);
    });

    const bestNonChampion = ordered.find((team) => team !== champion);
    return bestNonChampion ? new Set([champion, bestNonChampion]) : new Set<string>();
  }


  function goToNextSeason() {
    const country = "Brasil";
    const acreFirstId = 1001;
    const acreSecondId = 1002;

    const acreFirst = championships.find((c) => c.id === acreFirstId);
    const acreSecond = championships.find((c) => c.id === acreSecondId);

    if (!acreFirst || !acreSecond) {
      window.alert("As duas divisões do Acre precisam estar cadastradas.");
      return;
    }

    const firstTable =
      acreFirst.phaseStandings?.["Primeira fase"] ??
      acreFirst.standings ??
      {};

    const secondGeneral =
      acreSecond.phaseStandings?.["Classificação geral"] ??
      acreSecond.standings ??
      {};

    const firstTeams = [...(acreFirst.teams ?? [])];
    const secondTeams = [...(acreSecond.teams ?? [])];

    if (
      firstTeams.length !== 8 ||
      secondTeams.length !== 4 ||
      Object.keys(firstTable).length !== 8 ||
      Object.keys(secondGeneral).length !== 4
    ) {
      window.alert("Finalize a temporada completa do Acre antes de avançar.");
      return;
    }

    // ESTA É A MESMA ORDENAÇÃO USADA PELA TABELA NA TELA.
    const firstRanking = sortStandingTeams(firstTeams, firstTable);

    // 7º e 8º da 1ª Divisão descem.
    const relegated = firstRanking.slice(6, 8);

    // O acesso da 2ª Divisão é exatamente o que aparece em VERDE
    // na aba "Classificação geral": campeão + melhor classificado
    // além do campeão. Não recalculamos uma regra diferente aqui.
    const accessIds = getSecondDivisionAccessIds(acreSecond);
    const promoted = secondTeams.filter((team) => accessIds.has(team));

    if (promoted.length !== 2) {
      window.alert(
        "O sistema não conseguiu identificar exatamente os 2 times marcados em verde na Classificação geral. Simule a temporada completa novamente."
      );
      return;
    }

    // Segurança: nenhum clube pode ficar nas duas divisões.
    const nextFirstTeams = [
      ...firstTeams.filter((team) => !relegated.includes(team)),
      ...promoted,
    ];

    const nextSecondTeams = [
      ...secondTeams.filter((team) => !promoted.includes(team)),
      ...relegated,
    ];

    if (
      nextFirstTeams.length !== 8 ||
      nextSecondTeams.length !== 4 ||
      new Set(nextFirstTeams).size !== 8 ||
      new Set(nextSecondTeams).size !== 4 ||
      nextFirstTeams.some((team) => nextSecondTeams.includes(team))
    ) {
      window.alert("A troca de divisões falhou na validação. Nenhuma alteração foi feita.");
      return;
    }

    const countryChampionships = championships.filter((c) => c.country === country);
    const currentYear = Math.max(
      ...countryChampionships.map((c) => Number(c.season) || 2026)
    );
    const nextYear = String(currentYear + 1);

    // Transação única: os dois registros existentes são substituídos juntos.
    setChampionships((current) =>
      current.map((championship) => {
        const reset = {
          ...championship,
          season: championship.country === country ? nextYear : championship.season,
          standings: championship.country === country ? undefined : championship.standings,
          phaseStandings: championship.country === country ? undefined : championship.phaseStandings,
          phaseMatches: championship.country === country ? undefined : championship.phaseMatches,
          firstTurnWinner: championship.country === country ? undefined : championship.firstTurnWinner,
          secondTurnWinner: championship.country === country ? undefined : championship.secondTurnWinner,
        };

        if (championship.id === acreFirstId) {
          return { ...reset, teams: [...nextFirstTeams] };
        }

        if (championship.id === acreSecondId) {
          return { ...reset, teams: [...nextSecondTeams] };
        }

        return reset;
      })
    );

    setSelectedId(acreFirstId);
    setSelectedPhase((current) => ({
      ...current,
      [acreFirstId]: "Primeira fase",
      [acreSecondId]: "Primeiro turno",
    }));
    setSelectedSection((current) => ({
      ...current,
      [acreFirstId]: "competition",
      [acreSecondId]: "competition",
    }));

    window.alert(
      `Temporada ${nextYear} criada!

1ª Divisão — rebaixados: ${relegated.join(", ")}.
2ª Divisão — promovidos: ${promoted.join(", ")}.

A troca foi aplicada nas duas divisões.`
    );
  }

  function resetSeasonTo2026() {
    if (!window.confirm("Zerar todas as simulações e voltar todos os campeonatos para a temporada 2026?")) return;

    const resetChampionships = championships.map((championship) => {
      const acreDefinition = ACRE_CHAMPIONSHIPS.find((acre) => acre.id === championship.id);

      return {
        ...championship,
        season: "2026",
        teams: acreDefinition ? [...(acreDefinition.teams ?? [])] : championship.teams,
        standings: undefined,
        phaseStandings: undefined,
        phaseMatches: undefined,
        firstTurnWinner: undefined,
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

                        if (currentPhase === "Semi final" || currentPhase === "Final") {
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
                                        <span>{currentPhase === "Final" ? "FINAL" : `SEMIFINAL ${index + 1}`}</span>
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
                                  const accessIds = getSecondDivisionAccessIds(selected);
                                  const accessClass = currentPhase === "Classificação geral" && accessIds.has(team) ? "zone-next" : "";
                                  return (
                                    <tr key={team} className={getRowClass(selected, currentPhase, index) || accessClass}>
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
                        <span><i className="legend-next" /> Classificado para a próxima fase</span>
                        {selected.division === "1ª Divisão" &&
                          (selectedPhase[selected.id] ?? selected.phases?.[0]) === "Primeira fase" && (
                            <span><i className="legend-relegation" /> Rebaixado</span>
                          )}
                        {selected.division === "2ª Divisão" &&
                          (selectedPhase[selected.id] ?? selected.phases?.[0]) === "Classificação geral" && (
                            <span><i className="legend-next" /> Acesso à 1ª Divisão</span>
                          )}
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
        .standings-table tr.zone-next td { background: rgba(34, 197, 94, 0.16) !important; }
        .standings-table tr.zone-next td:first-child { box-shadow: inset 4px 0 0 #22c55e; color: #86efac !important; }
        .standings-table tr.zone-next .standing-team { color: #bbf7d0 !important; }
        .standings-table tr.zone-relegation td { background: rgba(239, 68, 68, 0.16) !important; }
        .standings-table tr.zone-relegation td:first-child { box-shadow: inset 4px 0 0 #ef4444; color: #fca5a5 !important; }
        .standings-table tr.zone-relegation .standing-team { color: #fecaca !important; }
        .standings-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; color: #8e9ab4; font-size: 10px; }
        .standings-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .standings-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: 0 0 10px; }
        .standings-legend .legend-next { background: #22c55e; }
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
