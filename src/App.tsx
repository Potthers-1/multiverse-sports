import { useEffect, useMemo, useState } from "react";

type Championship = {
  id: number;
  name: string;
  country: string;
  season: string;
  sport: string;
  category: string;
  division: string;
  format: string;
  regulation: string;
  promotion: string;
  relegation: string;
  teamCount: number;
  legs: number;
  rounds: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tieBreakers: string[];
  startDate: string;
  endDate: string;
};

type Club = { id: number; name: string; championshipId: number };
type Match = {
  id: number;
  championshipId: number;
  round: number;
  home: number;
  away: number;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  stage?: "regular" | "playoff" | "secondPhase" | "final";
  group?: "A" | "B";
  penaltyWinner?: number;
  knockoutRound?: number;
};

const seedChampionships: Championship[] = [];
const seedClubs: Club[] = [];
const seedMatches: Match[] = [];

const COUNTRIES = [
  { name: "Brasil", flag: "🇧🇷" },
];

const SERIE_D_GROUPS: Record<string, string[]> = {"A":["Noroeste","RIo Branco - ES","Sergipe","São Luiz","Real Noroeste","Humaitá"],"B":["Luverdense","Sampaio Corrêa - RJ","São Joseense","Inhumas","ABC","Galvez"],"C":["Goiatuba","XV de Piracicaba","Trem","IAPE","Fluminense - PI","Ceilândia"],"D":["Brasiliense","Monte Roraima","Atlético Cearense","Águia de Marabá","FC Cascavel","Joinville"],"E":["Manaus","São José - RS","GAS","Marcílio Dias","Guaporé","Vitória - ES"],"F":["União Rondonópolis","Maracanã - CE","Lagarto","Mixto","Aparecidense","Sampaio Corrêa"],"G":["Tombense","Imperatriz","Nova Iguaçu","Azuriz","Ferroviário","São Raimundo - RR"],"H":["Serra Branca","Pouso Alegre","Tuna Luso","Gama","Blumenau","Laguna"],"I":["Brasil de Pelotas","América de Natal","Central","Maguary","Oratório","Decisão Goiana"],"J":["Tocantinópolis","Moto Club","Uberlândia","Operário - MS","Santa Catarina","Manauara"],"K":["Retrô","Independência","Água Santa","Ivinhema","Tirol","Parnahyba"],"L":["Porto - BA","Portuguesa","Guarany de Bagé","CRAC","Operário VG","Gazin Porto Velho"],"M":["Primavera - MT","Jacuipense","Velo Club","ASA","CSE","CSA"],"N":["America","Portuguesa - RJ","Maricá","Altos","Nacional - AM","ABECAT"],"O":["Araguaína","Betim Futebol","Sousa","Madureira","Iguatu","Juazeirense"],"P":["Capital - DF","Atlético de Alagoinhas","Cianorte","Piauí","Democrata GV","Treze"]};

const DATA_VERSION = "6";

function load<T>(key: string, fallback: T): T {
  try {
    if (localStorage.getItem("sports-data-version") !== DATA_VERSION) {
      localStorage.removeItem("sports-championships");
      localStorage.removeItem("sports-clubs");
      localStorage.removeItem("sports-matches");
      localStorage.setItem("sports-data-version", DATA_VERSION);
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function resetSimulation() {
  const confirmed = window.confirm(
    "Zerar todas as simulações de teste?\n\nIsso apagará campeonatos, clubes, resultados e fases criadas durante os testes e restaurará o estado inicial do sistema."
  );
  if (!confirmed) return;

  [
    "sports-championships",
    "sports-clubs",
    "sports-matches",
    "sports-data-version",
    "sports-brazil-regulations-v1",
    "sports-serie-a-calendar-v1",
    "sports-simulation-reset-v1",
  ].forEach((key) => localStorage.removeItem(key));

  window.location.reload();
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateRoundRobin(teamIds: number[], legs: number, championshipId: number, startId: number): Match[] {
  if (teamIds.length < 2 || legs < 1) return [];

  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push(-1);

  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const generated: Match[] = [];
  let id = startId;

  for (let leg = 0; leg < legs; leg++) {
    let rotation = [...teams];

    for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex++) {
      const round = leg * roundsPerLeg + roundIndex + 1;

      for (let i = 0; i < matchesPerRound; i++) {
        const first = rotation[i];
        const second = rotation[rotation.length - 1 - i];
        if (first === -1 || second === -1) continue;

        const home = leg % 2 === 0 ? first : second;
        const away = leg % 2 === 0 ? second : first;

        generated.push({
          id: id++,
          championshipId,
          round,
          home,
          away,
          homeScore: null,
          awayScore: null,
          played: false,
          stage: "regular",
        });
      }

      const fixed = rotation[0];
      const rest = rotation.slice(1);
      rest.unshift(rest.pop()!);
      rotation = [fixed, ...rest];
    }
  }

  return generated;
}

export default function App() {
  const [championships, setChampionships] = useState(() => load("sports-championships", seedChampionships));
  const [clubs, setClubs] = useState(() => load("sports-clubs", seedClubs));
  const [matches, setMatches] = useState(() => load("sports-matches", seedMatches));
  const [selectedId, setSelectedId] = useState(0);
  const [section, setSection] = useState("Visão geral");
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [modal, setModal] = useState<"club" | "championship" | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("Brasil");

  // Reset único da simulação atual: mantém campeonatos, clubes e calendários regulares,
  // mas remove resultados e fases eliminatórias geradas durante os testes.
  useEffect(() => {
    if (localStorage.getItem("sports-simulation-reset-v1") === "1") return;

    setMatches((current) =>
      current
        .filter((match) => !match.stage || match.stage === "regular")
        .map((match) => ({
          ...match,
          homeScore: null,
          awayScore: null,
          played: false,
          stage: "regular" as const,
          group: undefined,
        }))
    );
    localStorage.setItem("sports-simulation-reset-v1", "1");
  }, []);

  useEffect(() => {
    if (championships.some((item) => item.country === "Brasil")) return;
    const base = Math.max(0, ...championships.map((item) => item.id));
    const brazil: Championship[] = [
      { id: base + 1, name: "Campeonato Brasileiro Série A", country: "Brasil", season: "2026", sport: "Futebol", category: "Profissional", division: "Série A", format: "Pontos corridos", regulation: "20 clubes; dois turnos; todos contra todos em cada turno; 38 rodadas; segundo turno com mando invertido; campeão definido pela maior pontuação após 38 rodadas.", promotion: "Nenhum acesso: divisão máxima.", relegation: "Regra de rebaixamento ainda não informada neste regulamento enviado.", teamCount: 20, legs: 2, rounds: 38, pointsWin: 3, pointsDraw: 1, pointsLoss: 0, tieBreakers: ["Pontos", "Saldo de gols", "Gols pró"], startDate: "", endDate: "" },
      { id: base + 2, name: "Campeonato Brasileiro Série B", country: "Brasil", season: "2026", sport: "Futebol", category: "Profissional", division: "Série B", format: "Pontos corridos + playoff", regulation: "20 clubes; 38 rodadas em ida e volta. Após a fase regular, 1º e 2º sobem diretamente. 3º x 6º e 4º x 5º fazem playoffs de ida e volta pelas duas vagas restantes.", promotion: "1º e 2º sobem diretamente para a Série A; vencedores dos playoffs entre 3º-6º e 4º-5º também sobem.", relegation: "Os quatro últimos são rebaixados para a Série C.", teamCount: 20, legs: 2, rounds: 38, pointsWin: 3, pointsDraw: 1, pointsLoss: 0, tieBreakers: ["Pontos", "Saldo de gols", "Gols pró"], startDate: "", endDate: "" },
      { id: base + 3, name: "Campeonato Brasileiro Série C", country: "Brasil", season: "2026", sport: "Futebol", category: "Profissional", division: "Série C", format: "Pontos corridos + grupos + final", regulation: "20 clubes em turno único na primeira fase; os 8 melhores avançam. Segunda fase em dois grupos de 4, definidos pelas posições 1-4-5-8 e 2-3-6-7. Cada grupo joga em turno e returno por 6 rodadas. Os dois melhores de cada grupo sobem; os líderes fazem a final em ida e volta.", promotion: "Os dois primeiros de cada grupo da segunda fase sobem para a Série B; os líderes dos grupos disputam a final.", relegation: "Regra de rebaixamento não informada no regulamento enviado.", teamCount: 20, legs: 1, rounds: 19, pointsWin: 3, pointsDraw: 1, pointsLoss: 0, tieBreakers: ["Pontos", "Saldo de gols", "Gols pró"], startDate: "", endDate: "" }
    ];
    setChampionships(brazil);
    localStorage.setItem("sports-brazil-regulations-v1", "1");
  }, []);

  useEffect(() => {
    if (clubs.length > 0) return;
    const seriesA = championships.find((item) => item.country === "Brasil" && item.division === "Série A");
    const seriesB = championships.find((item) => item.country === "Brasil" && item.division === "Série B");
    const seriesC = championships.find((item) => item.country === "Brasil" && item.division === "Série C");
    if (!seriesA || !seriesB || !seriesC) return;

    const teamsByDivision = [
      { championshipId: seriesA.id, names: ["Athletico Paranaense","Atlético Mineiro","Bahia","Botafogo","Chapecoense","Corinthians","Coritiba","Cruzeiro","Flamengo","Fluminense","Grêmio","Internacional","Mirassol","Palmeiras","Red Bull Bragantino","Remo","Santos","São Paulo","Vasco da Gama","Vitória"] },
      { championshipId: seriesB.id, names: ["América Mineiro","Athletic","Atlético Goianiense","Avaí","Botafogo - SP","Ceará","CRB","Criciúma","Cuiabá","Fortaleza","Goiás","Juventude","Londrina","Náutico","Novorizontino","Operário - PR","Ponte Preta","São Bernardo","Sport","Vila Nova"] },
      { championshipId: seriesC.id, names: ["Amazonas","Anápolis","Barra - SC","Botafogo - PB","Brusque","Caxias","Confiança","Ferroviária","Figueirense","Floresta","Guarani","Inter de Limeira","Itabaiana","Ituano","Maranhão","Maringá","Paysandu","Santa Cruz","Volta Redonda","Ypiranga de Erechim"] }
    ];

    let id = 1;
    const initialClubs: Club[] = teamsByDivision.flatMap((group) =>
      group.names.map((name) => ({ id: id++, name, championshipId: group.championshipId }))
    );
    setClubs(initialClubs);
  }, [championships, clubs.length]);


  useEffect(() => {
    const seriesA = championships.find((item) => item.country === "Brasil" && item.division === "Série A");
    const seriesB = championships.find((item) => item.country === "Brasil" && item.division === "Série B");
    const seriesC = championships.find((item) => item.country === "Brasil" && item.division === "Série C");
    const seriesD = championships.find((item) => item.country === "Brasil" && item.division === "Série D");
    const baseReady = seriesA && seriesB && seriesC &&
      clubs.filter((club) => club.championshipId === seriesA.id).length === 20 &&
      clubs.filter((club) => club.championshipId === seriesB.id).length === 20 &&
      clubs.filter((club) => club.championshipId === seriesC.id).length === 20;
    if (!baseReady || seriesD) return;
    const base = Math.max(0, ...championships.map((item) => item.id));
    const d: Championship = {
      id: base + 1, name: "Campeonato Brasileiro Série D", country: "Brasil", season: "2026",
      sport: "Futebol", category: "Profissional", division: "Série D", format: "Grupos + mata-mata",
      regulation: "96 equipes divididas em 16 grupos de 6 clubes. Primeira fase em turno e returno, totalizando 10 rodadas. Os quatro primeiros de cada grupo avançam. Da segunda fase em diante, todas as fases são disputadas em mata-mata de ida e volta. Os quatro semifinalistas garantem acesso à Série C.",
      promotion: "Os quatro semifinalistas garantem acesso à Série C.",
      relegation: "Regra de rebaixamento não informada no regulamento enviado.",
      teamCount: 96, legs: 2, rounds: 10, pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
      tieBreakers: ["Pontos", "Vitórias", "Saldo de gols", "Gols pró"], startDate: "", endDate: ""
    };
    let clubId = nextId(clubs);
    const dClubs: Club[] = Object.values(SERIE_D_GROUPS).flatMap((names) =>
      names.map((name) => ({ id: clubId++, name, championshipId: d.id }))
    );
    setChampionships([...championships, d]);
    setClubs([...clubs, ...dClubs]);
  }, [championships, clubs]);

  useEffect(() => {
    const completed = championships.filter((champ) => {
      const teamCount = clubs.filter((club) => club.championshipId === champ.id).length;
      return teamCount >= champ.teamCount && champ.teamCount >= 2 && champ.rounds > 0 && champ.legs >= 1 &&
        (champ.format === "Pontos corridos" || champ.format === "Pontos corridos + playoff" || champ.format === "Pontos corridos + grupos + final");
    });

    if (!completed.length) return;

    let changed = false;
    let nextMatches = [...matches];

    completed.forEach((champ) => {
      const teamIds = clubs.filter((club) => club.championshipId === champ.id).map((club) => club.id);
      const existing = nextMatches.filter((match) => match.championshipId === champ.id);
      if (existing.length > 0 || teamIds.length !== champ.teamCount) return;

      const generated = generateRoundRobin(teamIds, champ.legs, champ.id, nextId(nextMatches));
      if (generated.length > 0) {
        nextMatches = [...nextMatches, ...generated];
        changed = true;
      }
    });

    if (changed) setMatches(nextMatches);
  }, [clubs, championships]);


  useEffect(() => {
    const seriesD = championships.find((champ) => champ.country === "Brasil" && champ.division === "Série D" && champ.season === "2026");
    if (!seriesD || matches.some((match) => match.championshipId === seriesD.id)) return;
    const created: Match[] = [];
    let id = nextId(matches);
    Object.entries(SERIE_D_GROUPS).forEach(([group, names]) => {
      const ids = names.map((name) => clubs.find((club) => club.championshipId === seriesD.id && club.name === name)?.id).filter((value): value is number => value !== undefined);
      if (ids.length !== 6) return;
      const generated = generateRoundRobin(ids, 2, seriesD.id, id);
      generated.forEach((match) => created.push({ ...match, group }));
      id = nextId([...matches, ...created]);
    });
    if (created.length === 480) setMatches([...matches, ...created]);
  }, [clubs, championships, matches]);

  useEffect(() => {
    const seriesA = championships.find((champ) =>
      champ.country === "Brasil" && champ.division === "Série A" && champ.season === "2026"
    );
    if (!seriesA || localStorage.getItem("sports-serie-a-calendar-v1") === "1") return;

    const teamIds = clubs
      .filter((club) => club.championshipId === seriesA.id)
      .map((club) => club.id);

    if (teamIds.length !== seriesA.teamCount) return;

    const current = matches.filter((match) => match.championshipId === seriesA.id);
    const expected = (teamIds.length / 2) * seriesA.rounds;
    const seen = new Set<string>();
    const hasDuplicate = current.some((match) => {
      const key = [match.home, match.away].sort((a, b) => a - b).join("-");
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });

    if (current.length === expected && !hasDuplicate) {
      localStorage.setItem("sports-serie-a-calendar-v1", "1");
      return;
    }

    const generated = generateRoundRobin(teamIds, seriesA.legs, seriesA.id, nextId(matches));
    const oldResults = new Map<string, Match[]>();

    current.filter((match) => match.played && match.round > 6).forEach((match) => {
      const key = [match.home, match.away].sort((a, b) => a - b).join("-");
      const list = oldResults.get(key) ?? [];
      list.push(match);
      oldResults.set(key, list);
    });

    const repaired = generated.map((match) => {
      const key = [match.home, match.away].sort((a, b) => a - b).join("-");
      const list = oldResults.get(key);
      const previous = list?.shift();
      return previous
        ? { ...match, homeScore: previous.homeScore, awayScore: previous.awayScore, played: true }
        : match;
    });

    setMatches([...matches.filter((match) => match.championshipId !== seriesA.id), ...repaired]);
    localStorage.setItem("sports-serie-a-calendar-v1", "1");
  }, [clubs, championships, matches]);

  useEffect(() => save("sports-championships", championships), [championships]);
  useEffect(() => save("sports-clubs", clubs), [clubs]);
  useEffect(() => save("sports-matches", matches), [matches]);

  const championship = championships.find((item) => item.id === selectedId) ?? championships[0];
  const myClubs = clubs.filter((club) => club.championshipId === championship?.id);
  const myMatches = matches.filter((match) => match.championshipId === championship?.id);
  const rounds = [...new Set(myMatches.map((match) => match.round))].sort((a, b) => a - b);

  const standings = useMemo(() => {
    return myClubs.map((club) => {
      let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
      myMatches.filter((match) => match.played && (match.stage ?? "regular") === "regular" && (match.home === club.id || match.away === club.id)).forEach((match) => {
        const home = match.home === club.id;
        const scored = home ? match.homeScore! : match.awayScore!;
        const conceded = home ? match.awayScore! : match.homeScore!;
        played++; gf += scored; ga += conceded;
        if (scored > conceded) wins++;
        else if (scored === conceded) draws++;
        else losses++;
      });
      return { club, played, wins, draws, losses, gf, ga, gd: gf - ga, points: wins * (championship?.pointsWin ?? 3) + draws * (championship?.pointsDraw ?? 1) };
    }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }, [myClubs, myMatches, championship]);

  const clubName = (id: number) => clubs.find((club) => club.id === id)?.name ?? "Clube";

  function openClubHistory(name: string) {
    setSelectedClubName(name);
    setSection("Clube");
  }

  function nextId<T extends { id: number }>(items: T[]) {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  function addChampionship(data: Omit<Championship, "id">) {
    if (!data.name.trim()) return;
    const item: Championship = { ...data, id: nextId(championships), name: data.name.trim(), country: selectedCountry };
    setChampionships([...championships, item]);
    setSelectedId(item.id);
    setRound(1);
    setSection("Visão geral");
    setModal(null);
  }

  function addClub(name: string) {
    if (!name.trim() || !championship) return;
    const alreadyExists = clubs.some((club) => club.championshipId === championship.id && club.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (alreadyExists) return;
    setClubs([...clubs, { id: nextId(clubs), name: name.trim(), championshipId: championship.id }]);
    setModal(null);
  }

  function deleteChampionship(id: number) {
    const target = championships.find((item) => item.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Excluir o campeonato "${target.name}"? Isso também removerá todos os clubes, partidas e resultados vinculados a ele.`);
    if (!confirmed) return;
    setChampionships(championships.filter((item) => item.id !== id));
    setClubs(clubs.filter((club) => club.championshipId !== id));
    setMatches(matches.filter((match) => match.championshipId !== id));
    setSelectedId(0);
    setSection("Visão geral");
  }

  function addRound() {
    if (!championship || myClubs.length < 2) return;
    const nextRound = Math.max(0, ...myMatches.map((match) => match.round)) + 1;
    if (nextRound > championship.rounds) return;
    const created: Match[] = [];
    for (let i = 0; i + 1 < myClubs.length; i += 2) {
      const home = myClubs[i].id;
      const away = myClubs[i + 1].id;
      const duplicate = myMatches.some((match) =>
        (match.home === home && match.away === away) || (match.home === away && match.away === home)
      );
      if (!duplicate) {
        created.push({ id: nextId([...matches, ...created]), championshipId: championship.id, round: nextRound, home, away, homeScore: null, awayScore: null, played: false });
      }
    }
    if (!created.length) return;
    setMatches([...matches, ...created]);
    setRound(nextRound);
    setSection("Partidas");
  }

  function generateNextStage() {
    if (!championship) return;

    if (championship.division === "Série B") {
      const regular = myMatches.filter((match) => (match.stage ?? "regular") === "regular");
      const playoff = myMatches.filter((match) => match.stage === "playoff");
      if (playoff.length > 0) {
        window.alert("Os play-offs da Série B já foram gerados.");
        return;
      }
      if (regular.length === 0 || regular.some((match) => !match.played)) {
        window.alert("Finalize os 38 jogos da fase regular da Série B antes de gerar os play-offs.");
        return;
      }

      const regularTable = standings;
      if (regularTable.length < 6) return;
      // Ida: 6º x 3º e 5º x 4º. Volta com mando invertido.
      const pairs = [
        [regularTable[5].club.id, regularTable[2].club.id],
        [regularTable[4].club.id, regularTable[3].club.id],
      ];
      const start = nextId(matches);
      const created: Match[] = [];
      let id = start;
      pairs.forEach(([home, away]) => {
        created.push({ id: id++, championshipId: championship.id, round: 39, home, away, homeScore: null, awayScore: null, played: false, stage: "playoff" });
        created.push({ id: id++, championshipId: championship.id, round: 40, home: away, away: home, homeScore: null, awayScore: null, played: false, stage: "playoff" });
      });
      setMatches([...matches, ...created]);
      setRound(39);
      setSection("Partidas");
      return;
    }


    if (championship.division === "Série D") {
      const regular = myMatches.filter((match) => (match.stage ?? "regular") === "regular");
      const knockout = myMatches.filter((match) => match.stage === "knockout");

      const groupTable = (group: string) => {
        const ids = [...new Set(regular.filter((match) => match.group === group).flatMap((match) => [match.home, match.away]))];
        return ids.map((clubId) => {
          let points = 0, wins = 0, gd = 0, gf = 0;
          regular.filter((match) => match.group === group && match.played && (match.home === clubId || match.away === clubId)).forEach((match) => {
            const home = match.home === clubId;
            const scored = home ? match.homeScore! : match.awayScore!;
            const conceded = home ? match.awayScore! : match.homeScore!;
            gf += scored; gd += scored - conceded;
            if (scored > conceded) { wins++; points += championship.pointsWin; }
            else if (scored === conceded) points += championship.pointsDraw;
          });
          return { clubId, points, wins, gd, gf };
        }).sort((a, b) => b.points - a.points || b.wins - a.wins || b.gd - a.gd || b.gf - a.gf);
      };

      if (knockout.length === 0) {
        if (regular.length !== 480 || regular.some((match) => !match.played)) {
          window.alert("Finalize as 480 partidas da primeira fase da Série D antes de gerar a segunda fase.");
          return;
        }
        const pairings: Array<[number, number]> = [];
        const letters = Object.keys(SERIE_D_GROUPS);
        for (let i = 0; i < letters.length; i += 2) {
          const a = groupTable(letters[i]);
          const b = groupTable(letters[i + 1]);
          if (a.length !== 6 || b.length !== 6) return;
          pairings.push([a[0].clubId, b[3].clubId], [b[0].clubId, a[3].clubId], [a[1].clubId, b[2].clubId], [b[1].clubId, a[2].clubId]);
        }
        let id = nextId(matches);
        const created: Match[] = [];
        pairings.forEach(([home, away]) => {
          created.push({ id: id++, championshipId: championship.id, round: 11, home, away, homeScore: null, awayScore: null, played: false, stage: "knockout", knockoutRound: 64 });
          created.push({ id: id++, championshipId: championship.id, round: 12, home: away, away: home, homeScore: null, awayScore: null, played: false, stage: "knockout", knockoutRound: 64 });
        });
        setMatches([...matches, ...created]);
        setRound(11);
        setSection("Partidas");
        return;
      }

      const currentStage = Math.max(...knockout.map((match) => match.knockoutRound ?? 0));
      const currentMatches = knockout.filter((match) => match.knockoutRound === currentStage);
      if (currentStage === 2) {
        window.alert("A final da Série D já foi gerada. Finalize os dois jogos para definir o campeão.");
        return;
      }
      if (!currentStage || currentMatches.length !== currentStage || currentMatches.some((match) => !match.played)) {
        window.alert("Finalize todos os jogos da fase eliminatória atual antes de avançar.");
        return;
      }

      const winners: number[] = [];
      const confrontations = new Map<string, Match[]>();
      currentMatches.forEach((match) => {
        const key = [match.home, match.away].sort((x, y) => x - y).join("-");
        const list = confrontations.get(key) ?? [];
        list.push(match);
        confrontations.set(key, list);
      });

      for (const legs of confrontations.values()) {
        const teams = [...new Set(legs.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: legs.reduce((sum, match) => sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        })).sort((a, b) => b.goals - a.goals);
        const penaltyWinner = legs.map((match) => match.penaltyWinner).find((id): id is number => id !== undefined);
        if (teams.length !== 2 || legs.length !== 2 || (totals[0].goals === totals[1].goals && !penaltyWinner)) {
          window.alert("Há um confronto empatado no agregado e sem vencedor nos pênaltis.");
          return;
        }
        winners.push(penaltyWinner ?? totals[0].clubId);
      }

      const nextStage = currentStage / 2;
      const roundStart: Record<number, number> = { 32: 13, 16: 15, 8: 17, 4: 19, 2: 21 };
      let id = nextId(matches);
      const created: Match[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        created.push({ id: id++, championshipId: championship.id, round: roundStart[nextStage], home: winners[i], away: winners[i + 1], homeScore: null, awayScore: null, played: false, stage: "knockout", knockoutRound: nextStage });
        created.push({ id: id++, championshipId: championship.id, round: roundStart[nextStage] + 1, home: winners[i + 1], away: winners[i], homeScore: null, awayScore: null, played: false, stage: "knockout", knockoutRound: nextStage });
      }
      setMatches([...matches, ...created]);
      setRound(roundStart[nextStage]);
      setSection("Partidas");
      return;
    }

    if (championship.division === "Série C") {
      const regular = myMatches.filter((match) => (match.stage ?? "regular") === "regular");
      const secondPhase = myMatches.filter((match) => match.stage === "secondPhase");
      const final = myMatches.filter((match) => match.stage === "final");

      if (regular.length > 0 && regular.every((match) => match.played) && secondPhase.length === 0) {
        const table = standings;
        if (table.length < 8) return;

        const groups = [
          { name: "A" as const, ids: [table[0].club.id, table[2].club.id, table[4].club.id, table[6].club.id] },
          { name: "B" as const, ids: [table[1].club.id, table[3].club.id, table[5].club.id, table[7].club.id] },
        ];

        let id = nextId(matches);
        const created: Match[] = [];
        groups.forEach((group) => {
          const generated = generateRoundRobin(group.ids, 2, championship.id, id);
          generated.forEach((match) => created.push({ ...match, round: match.round, stage: "secondPhase", group: group.name }));
          id = nextId([...matches, ...created]);
        });

        setMatches([...matches, ...created]);
        setRound(1);
        setSection("Partidas");
        return;
      }

      if (secondPhase.length > 0 && secondPhase.every((match) => match.played) && final.length === 0) {
        const groupTable = (group: "A" | "B") => {
          const ids = [...new Set(secondPhase.filter((match) => match.group === group).flatMap((match) => [match.home, match.away]))];
          return ids.map((clubId) => {
            let points = 0, gd = 0, gf = 0;
            secondPhase.filter((match) => match.group === group && match.played && (match.home === clubId || match.away === clubId)).forEach((match) => {
              const home = match.home === clubId;
              const scored = home ? match.homeScore! : match.awayScore!;
              const conceded = home ? match.awayScore! : match.homeScore!;
              gf += scored; gd += scored - conceded;
              points += scored > conceded ? championship.pointsWin : scored === conceded ? championship.pointsDraw : championship.pointsLoss;
            });
            return { clubId, points, gd, gf };
          }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        };

        const winnerA = groupTable("A")[0];
        const winnerB = groupTable("B")[0];
        if (!winnerA || !winnerB) return;

        const id = nextId(matches);
        const created: Match[] = [
          { id, championshipId: championship.id, round: 1, home: winnerA.clubId, away: winnerB.clubId, homeScore: null, awayScore: null, played: false, stage: "final" },
          { id: id + 1, championshipId: championship.id, round: 2, home: winnerB.clubId, away: winnerA.clubId, homeScore: null, awayScore: null, played: false, stage: "final" },
        ];
        setMatches([...matches, ...created]);
        setRound(1);
        setSection("Partidas");
        return;
      }

      window.alert("Não há uma próxima fase disponível agora. Finalize a fase atual primeiro.");
      return;
    }

    window.alert("A geração automática de fases está disponível para as Séries B e C do Brasil.");
  }

  function saveScore(id: number, home: string, away: string) {
    if (home === "" || away === "") return;
    const h = Number(home), a = Number(away);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) return;

    const target = matches.find((match) => match.id === id);
    if (!target) return;

    const updated = matches.map((match) =>
      match.id === id
        ? { ...match, homeScore: h, awayScore: a, played: true, penaltyWinner: undefined }
        : match
    );

    if (target.stage === "final") {
      const finalMatches = updated.filter((match) => match.stage === "final");
      if (finalMatches.length === 2 && finalMatches.every((match) => match.played)) {
        const teams = [...new Set(finalMatches.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: finalMatches.reduce((sum, match) =>
            sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        }));
        if (totals.length === 2 && totals[0].goals === totals[1].goals) {
          const secondLeg = finalMatches.find((match) => match.round === 2) ?? finalMatches[1];
          const winnerInput = window.prompt(
            "Empate no agregado após o jogo de volta. A decisão do campeão será por pênaltis.\n\nDigite exatamente o nome do clube vencedor nos pênaltis:\n" +
            clubName(secondLeg.home) + " ou " + clubName(secondLeg.away)
          );
          if (winnerInput) {
            const winner = teams.find((clubId) => clubName(clubId).toLowerCase() === winnerInput.trim().toLowerCase());
            if (winner) {
              setMatches(updated.map((match) => match.id === secondLeg.id ? { ...match, penaltyWinner: winner } : match));
              return;
            }
          }
        }
      }
    }


    if (target.stage === "knockout") {
      const confrontation = updated.filter((match) =>
        match.stage === "knockout" &&
        match.knockoutRound === target.knockoutRound &&
        [match.home, match.away].sort((x, y) => x - y).join("-") === [target.home, target.away].sort((x, y) => x - y).join("-")
      );
      if (confrontation.length === 2 && confrontation.every((match) => match.played)) {
        const teams = [...new Set(confrontation.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: confrontation.reduce((sum, match) => sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        }));
        if (totals.length === 2 && totals[0].goals === totals[1].goals) {
          const secondLeg = confrontation.sort((a, b) => b.round - a.round)[0];
          const winnerInput = window.prompt("Empate no agregado. A decisão será por pênaltis.\n\nDigite exatamente o nome do clube vencedor:\n" + clubName(secondLeg.home) + " ou " + clubName(secondLeg.away));
          if (winnerInput) {
            const winner = [secondLeg.home, secondLeg.away].find((clubId) => clubName(clubId).toLowerCase() === winnerInput.trim().toLowerCase());
            if (winner) {
              setMatches(updated.map((match) => match.id === secondLeg.id ? { ...match, penaltyWinner: winner } : match));
              return;
            }
          }
        }
      }
    }

    if (target.stage === "playoff") {
      const confrontation = updated.filter((match) =>
        match.stage === "playoff" &&
        [match.home, match.away].sort((x, y) => x - y).join("-") === [target.home, target.away].sort((x, y) => x - y).join("-")
      );
      if (confrontation.length === 2 && confrontation.every((match) => match.played)) {
        const totalHome = confrontation.reduce((sum, match) => sum + (match.home === target.home ? (match.homeScore ?? 0) : (match.awayScore ?? 0)), 0);
        const totalAway = confrontation.reduce((sum, match) => sum + (match.away === target.home ? (match.awayScore ?? 0) : (match.homeScore ?? 0)), 0);
        if (totalHome === totalAway) {
          const secondLeg = confrontation.find((match) => match.round === 40) ?? confrontation[1];
          const winnerName = clubName(secondLeg.home) + " ou " + clubName(secondLeg.away);
          const winnerInput = window.prompt(
            "Empate no agregado após o jogo de volta. A decisão será por pênaltis.\n\nDigite exatamente o nome do clube vencedor nos pênaltis:\n" + winnerName
          );
          if (winnerInput) {
            const winner = [secondLeg.home, secondLeg.away].find((clubId) => clubName(clubId).toLowerCase() === winnerInput.trim().toLowerCase());
            if (winner) {
              const next = updated.map((match) => match.id === secondLeg.id ? { ...match, penaltyWinner: winner } : match);
              setMatches(next);
              return;
            }
          }
        }
      }
    }

    setMatches(updated);
  }

  function generateScore() {
    const roll = Math.random();
    if (roll < 0.58) return Math.floor(Math.random() * 4);
    if (roll < 0.90) return Math.floor(Math.random() * 3);
    return Math.floor(Math.random() * 6);
  }

  function generateResults(scope: "round" | "remaining" | "playoff" | "secondPhase" | "final" | "knockout") {
    if (!championship) return;

    const targets = myMatches.filter((match) => {
      if (match.played) return false;
      if (scope === "round") return (match.stage ?? "regular") === "regular" && match.round === round;
      if (scope === "playoff") return match.stage === "playoff";
      if (scope === "secondPhase") return match.stage === "secondPhase";
      if (scope === "final") return match.stage === "final";
      if (scope === "knockout") return match.stage === "knockout";
      return true;
    });

    if (!targets.length) {
      const messages = {
        round: "Não há jogos sem resultado nesta rodada.",
        remaining: "Não há jogos sem resultado neste campeonato.",
        playoff: "Não há jogos sem resultado nos play-offs.",
        secondPhase: "Não há jogos sem resultado na segunda fase.",
        final: "Não há jogos sem resultado na final.",
        knockout: "Não há jogos sem resultado no mata-mata da Série D.",
      };
      window.alert(messages[scope]);
      return;
    }

    const labels = {
      round: `a rodada ${round}`,
      remaining: "todas as rodadas restantes",
      playoff: "os 4 jogos dos play-offs",
      secondPhase: "todos os jogos da segunda fase",
      final: "os 2 jogos da final",
      knockout: "a fase eliminatória da Série D",
    };
    const confirmed = window.confirm(
      `Gerar resultados aleatórios para ${labels[scope]}?\\n\\nOs jogos que já possuem resultado não serão alterados.`
    );
    if (!confirmed) return;

    const generated = new Map<number, { homeScore: number; awayScore: number }>();
    targets.forEach((match) => {
      let homeScore = generateScore();
      let awayScore = generateScore();
      if (homeScore === awayScore && Math.random() < 0.18) {
        homeScore = Math.min(6, homeScore + (Math.random() < 0.5 ? 1 : 0));
      }
      generated.set(match.id, { homeScore, awayScore });
    });

    let nextMatches = matches.map((match) => {
      const result = generated.get(match.id);
      return result ? { ...match, ...result, played: true, penaltyWinner: undefined } : match;
    });


    if (scope === "knockout") {
      const knockoutMatches = nextMatches.filter((match) => match.stage === "knockout" && match.played);
      const confrontations = new Map<string, Match[]>();
      knockoutMatches.forEach((match) => {
        const key = [match.home, match.away].sort((x, y) => x - y).join("-");
        const list = confrontations.get(key) ?? [];
        list.push(match);
        confrontations.set(key, list);
      });
      confrontations.forEach((legs) => {
        if (legs.length !== 2) return;
        const teams = [...new Set(legs.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: legs.reduce((sum, match) => sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        }));
        if (teams.length === 2 && totals[0].goals === totals[1].goals) {
          const secondLeg = legs.sort((a, b) => b.round - a.round)[0];
          const penaltyWinner = teams[Math.floor(Math.random() * teams.length)];
          nextMatches = nextMatches.map((match) => match.id === secondLeg.id ? { ...match, penaltyWinner } : match);
        }
      });
    }

    if (scope === "playoff") {
      const playoffMatches = nextMatches.filter((match) => match.stage === "playoff" && match.played);
      const confrontations = new Map<string, Match[]>();
      playoffMatches.forEach((match) => {
        const key = [match.home, match.away].sort((x, y) => x - y).join("-");
        const list = confrontations.get(key) ?? [];
        list.push(match);
        confrontations.set(key, list);
      });

      confrontations.forEach((legs) => {
        if (legs.length !== 2) return;
        const teams = [...new Set(legs.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: legs.reduce((sum, match) =>
            sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        }));
        if (totals.length === 2 && totals[0].goals === totals[1].goals) {
          const secondLeg = legs.find((match) => match.round === 40) ?? legs[1];
          const penaltyWinner = teams[Math.floor(Math.random() * teams.length)];
          nextMatches = nextMatches.map((match) =>
            match.id === secondLeg.id ? { ...match, penaltyWinner } : match
          );
        }
      });
    }

    if (scope === "final") {
      const finalMatches = nextMatches.filter((match) => match.stage === "final" && match.played);
      if (finalMatches.length === 2) {
        const teams = [...new Set(finalMatches.flatMap((match) => [match.home, match.away]))];
        const totals = teams.map((clubId) => ({
          clubId,
          goals: finalMatches.reduce((sum, match) =>
            sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
        }));
        if (totals.length === 2 && totals[0].goals === totals[1].goals) {
          const secondLeg = finalMatches.find((match) => match.round === 2) ?? finalMatches[1];
          const penaltyWinner = teams[Math.floor(Math.random() * teams.length)];
          nextMatches = nextMatches.map((match) =>
            match.id === secondLeg.id ? { ...match, penaltyWinner } : match
          );
        }
      }
    }

    setMatches(nextMatches);
    setSection("Partidas");
  }

  function createNextBrazilSeason() {
    const brazilSeasons = championships
      .filter((item) => item.country === "Brasil" && ["Série A", "Série B", "Série C"].includes(item.division))
      .map((item) => Number(item.season))
      .filter((season) => Number.isFinite(season));
    const currentSeason = Math.max(...brazilSeasons);
    const nextSeason = currentSeason + 1;
    const currentA = championships.find((item) => item.country === "Brasil" && item.division === "Série A" && Number(item.season) === currentSeason);
    const currentB = championships.find((item) => item.country === "Brasil" && item.division === "Série B" && Number(item.season) === currentSeason);
    const currentC = championships.find((item) => item.country === "Brasil" && item.division === "Série C" && Number(item.season) === currentSeason);
    if (!currentA || !currentB || !currentC) {
      window.alert("As Séries A, B e C da temporada mais recente precisam existir para gerar a próxima temporada.");
      return;
    }
    if (championships.some((item) => item.country === "Brasil" && Number(item.season) === nextSeason && ["Série A", "Série B", "Série C"].includes(item.division))) {
      window.alert("A próxima temporada já foi criada.");
      return;
    }

    const tableFor = (champ: Championship) => {
      const teamIds = clubs.filter((club) => club.championshipId === champ.id).map((club) => club.id);
      return teamIds.map((clubId) => {
        let points = 0, gd = 0, gf = 0, played = 0;
        matches.filter((match) => match.championshipId === champ.id && match.played && (match.stage ?? "regular") === "regular" && (match.home === clubId || match.away === clubId)).forEach((match) => {
          const home = match.home === clubId;
          const scored = home ? match.homeScore! : match.awayScore!;
          const conceded = home ? match.awayScore! : match.homeScore!;
          played++;
          gf += scored;
          gd += scored - conceded;
          if (scored > conceded) points += champ.pointsWin;
          else if (scored === conceded) points += champ.pointsDraw;
          else points += champ.pointsLoss;
        });
        return { clubId, played, points, gd, gf };
      }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    };

    const aTable = tableFor(currentA);
    const bTable = tableFor(currentB);
    const cTable = tableFor(currentC);

    if (aTable.length < 20 || bTable.length < 20 || cTable.length < 20) {
      window.alert("As três divisões precisam ter os 20 clubes cadastrados antes de gerar a próxima temporada.");
      return;
    }

    const regularComplete = (champ: Championship) => {
      const regular = matches.filter((match) => match.championshipId === champ.id && (match.stage ?? "regular") === "regular");
      return regular.length > 0 && regular.every((match) => match.played);
    };

    if (!regularComplete(currentA) || !regularComplete(currentB) || !regularComplete(currentC)) {
      window.alert("Finalize todas as partidas da fase regular das Séries A, B e C antes de gerar a próxima temporada.");
      return;
    }

    // Série A: os 4 últimos da classificação regular são rebaixados para a Série B.
    const relegatedFromA = aTable.slice(-4).map((row) => row.clubId);

    // Série B: 1º e 2º sobem diretamente. 3º x 6º e 4º x 5º definem as outras 2 vagas.
    const directToA = bTable.slice(0, 2).map((row) => row.clubId);
    const playoffMatches = matches.filter((match) => match.championshipId === currentB.id && match.stage === "playoff");
    const confrontations = new Map<string, Match[]>();
    playoffMatches.forEach((match) => {
      const key = [match.home, match.away].sort((x, y) => x - y).join("-");
      const list = confrontations.get(key) ?? [];
      list.push(match);
      confrontations.set(key, list);
    });

    if (confrontations.size !== 2 || [...confrontations.values()].some((legs) => legs.length !== 2 || !legs.every((match) => match.played))) {
      window.alert("Finalize os 4 jogos dos play-offs da Série B antes de gerar a próxima temporada.");
      return;
    }

    const playoffWinners: number[] = [];
    for (const legs of confrontations.values()) {
      const teams = [...new Set(legs.flatMap((match) => [match.home, match.away]))];
      const totals = teams.map((clubId) => ({
        clubId,
        goals: legs.reduce((sum, match) =>
          sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0),
      }));
      const penaltyWinner = legs.map((match) => match.penaltyWinner).find((id): id is number => id !== undefined);
      if (teams.length !== 2) {
        window.alert("Não foi possível identificar um dos confrontos dos play-offs da Série B.");
        return;
      }
      if (totals[0].goals === totals[1].goals && !penaltyWinner) {
        window.alert("Um dos play-offs da Série B terminou empatado no agregado e ainda não possui vencedor nos pênaltis.");
        return;
      }
      playoffWinners.push(penaltyWinner ?? (totals[0].goals > totals[1].goals ? totals[0].clubId : totals[1].clubId));
    }

    // Série C: os 2 primeiros de cada grupo da segunda fase sobem para a Série B.
    const secondPhase = matches.filter((match) => match.championshipId === currentC.id && match.stage === "secondPhase");
    if (secondPhase.length === 0 || !secondPhase.every((match) => match.played)) {
      window.alert("Finalize todos os jogos da segunda fase da Série C antes de gerar a próxima temporada.");
      return;
    }

    const groupTable = (group: "A" | "B") => {
      const ids = [...new Set(secondPhase.filter((match) => match.group === group).flatMap((match) => [match.home, match.away]))];
      return ids.map((clubId) => {
        let points = 0, gd = 0, gf = 0;
        secondPhase.filter((match) => match.group === group && (match.home === clubId || match.away === clubId)).forEach((match) => {
          const home = match.home === clubId;
          const scored = home ? match.homeScore! : match.awayScore!;
          const conceded = home ? match.awayScore! : match.homeScore!;
          gf += scored;
          gd += scored - conceded;
          if (scored > conceded) points += currentC.pointsWin;
          else if (scored === conceded) points += currentC.pointsDraw;
          else points += currentC.pointsLoss;
        });
        return { clubId, points, gd, gf };
      }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    };

    const cGroupA = groupTable("A");
    const cGroupB = groupTable("B");
    if (cGroupA.length !== 4 || cGroupB.length !== 4) {
      window.alert("A segunda fase da Série C precisa ter 2 grupos completos de 4 clubes.");
      return;
    }

    const promotedToB = [cGroupA[0].clubId, cGroupA[1].clubId, cGroupB[0].clubId, cGroupB[1].clubId];

    // A regra de rebaixamento da Série C para uma divisão inferior ainda não foi definida.
    // Portanto, nenhum clube é removido da Série C por rebaixamento neste momento.
    const bRelegated = bTable.slice(-4).map((row) => row.clubId);
    const promotedToA = [...directToA, ...playoffWinners];

    const nextBase = Math.max(0, ...championships.map((item) => item.id));
    const nextChampionships: Championship[] = [
      { ...currentA, id: nextBase + 1, season: String(nextSeason) },
      { ...currentB, id: nextBase + 2, season: String(nextSeason) },
      { ...currentC, id: nextBase + 3, season: String(nextSeason) }
    ];

    const nextAId = nextBase + 1;
    const nextBId = nextBase + 2;
    const nextCId = nextBase + 3;

    const idsFor = (champ: Championship) => clubs.filter((club) => club.championshipId === champ.id).map((club) => club.id);
    const currentAClubIds = idsFor(currentA);
    const currentBClubIds = idsFor(currentB);
    const currentCClubIds = idsFor(currentC);

    const promotedBToA = new Set(promotedToA);
    const relegatedAToB = new Set(relegatedFromA);
    const relegatedBToC = new Set(bRelegated);
    const promotedCToB = new Set(promotedToB);

    const nextAClubIds = currentAClubIds.filter((id) => !relegatedAToB.has(id)).concat([...promotedBToA]);
    const nextBClubIds = currentBClubIds.filter((id) => !relegatedBToC.has(id) && !promotedBToA.has(id)).concat([...relegatedAToB]).concat([...promotedCToB]);
    const nextCClubIds = currentCClubIds.filter((id) => !promotedCToB.has(id)).concat([...relegatedBToC]);

    if (nextAClubIds.length !== 20 || nextBClubIds.length !== 20 || nextCClubIds.length !== 20) {
      window.alert("A movimentação não fechou os números esperados. A temporada 2027 não foi criada.");
      return;
    }

    let nextClubId = nextId(clubs);
    const createClubs = (clubIds: number[], championshipId: number): Club[] =>
      clubIds.map((oldId) => {
        const source = clubs.find((club) => club.id === oldId)!;
        return { id: nextClubId++, name: source.name, championshipId };
      });

    const newClubs = [
      ...createClubs(nextAClubIds, nextAId),
      ...createClubs(nextBClubIds, nextBId),
      ...createClubs(nextCClubIds, nextCId)
    ];

    setChampionships([...championships, ...nextChampionships]);
    setClubs([...clubs, ...newClubs]);
    setSelectedCountry("Brasil");
    setSelectedId(nextAId);
    setSection("Visão geral");
    setRound(1);

    window.alert(
      "Temporada " + nextSeason + " criada automaticamente com base nos resultados de " + currentSeason + ".\n\n" +
      "A → B: " + relegatedFromA.length + " rebaixados / " + promotedToA.length + " promovidos\n" +
      "B → C: " + bRelegated.length + " rebaixados / " + promotedToB.length + " promovidos\n" +
      "C → B: " + promotedToB.length + " promovidos"
    );
  }
  if (!championship) {
    return (
      <div className="app">
        <aside className="side">
          <div className="brand"><div className="mark">◈</div><div className="brandInfo"><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div><button className="resetTestBtn" onClick={resetSimulation} title="Zerar simulações de teste" aria-label="Zerar simulações de teste">↺</button></div>
          <div className="label lower">PAÍSES</div>
          <div className="countryList">{COUNTRIES.map((country) => <button key={country.name} className={selectedCountry === country.name ? "countryItem active" : "countryItem"} onClick={() => { setSelectedCountry(country.name); setSelectedId(0); setSection("País"); }}><span>{country.flag}</span>{country.name}</button>)}</div>
          <div className="countrySubsection">
            <div className="countrySubhead">{COUNTRIES.find((country) => country.name === selectedCountry)?.flag} {selectedCountry}</div>
            <div className="emptySide">Nenhum campeonato cadastrado.</div>
          </div>
        </aside>
        <main className="main emptyState">
          <header><div><div className="crumb">PAÍSES / <strong>{selectedCountry.toUpperCase()}</strong></div><h1>{selectedCountry}</h1></div><button className="primary" onClick={() => setModal("championship")}>＋ Novo campeonato</button></header>
          <section className="emptyPanel">
            <span className="eyebrow">PAÍS</span>
            <h2>Nenhum campeonato cadastrado</h2>
            <p>Crie o primeiro campeonato de {selectedCountry}. Ele ficará vinculado a este país.</p>
            <button className="primary" onClick={() => setModal("championship")}>＋ Criar campeonato</button>
          </section>
          {modal && <Modal type={modal} country={selectedCountry} onClose={() => setModal(null)} addChampionship={addChampionship} addClub={addClub} />}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="mark">◈</div><div className="brandInfo"><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div><button className="resetTestBtn" onClick={resetSimulation} title="Zerar simulações de teste" aria-label="Zerar simulações de teste">↺</button></div>
        <div className="label lower">PAÍSES</div>
        <div className="countryList">{COUNTRIES.map((country) => <button key={country.name} className={selectedCountry === country.name ? "countryItem active" : "countryItem"} onClick={() => { setSelectedCountry(country.name); setSelectedId(0); setSection("País"); }}><span>{country.flag}</span>{country.name}</button>)}</div>
        <div className="countrySubsection">
          <div className="countrySubhead">{COUNTRIES.find((country) => country.name === selectedCountry)?.flag} {selectedCountry}</div>
          {Array.from(new Map(championships.filter((item) => item.country === selectedCountry).map((item) => [item.name, item])).values()).map((item) => {
            const seasons = championships.filter((candidate) => candidate.country === selectedCountry && candidate.name === item.name);
            const latest = seasons.reduce((current, candidate) => Number(candidate.season) > Number(current.season) ? candidate : current, seasons[0]);
            return <button key={item.name} className={seasons.some((candidate) => candidate.id === selectedId) ? "champMini active" : "champMini"} onClick={() => { setSelectedId(latest.id); setSection("Visão geral"); }}>{item.name}<small>{latest.season}</small></button>;
          })}
          {!championships.some((item) => item.country === selectedCountry) && <div className="emptySide">Nenhum campeonato cadastrado.</div>}
        </div>
</aside>

      <main className="main">
        <header>
          <div><div className="crumb">{section === "País" ? "PAÍSES / " + selectedCountry.toUpperCase() : "CAMPEONATOS / " + (championship?.name?.toUpperCase() ?? "")}</div><h1>{section === "País" ? selectedCountry : section}</h1></div>
          {section === "País" ? <button className="primary" onClick={() => setModal("championship")}>＋ Novo campeonato</button> : <button className="ghost" onClick={() => setSection("País")}>← Voltar para {selectedCountry}</button>}
        </header>

        {section !== "País" && <div className="champBar">
          <div><span className="liveDot" /><b>{championship?.name}</b><em>{championship?.country} · {championship?.season}</em></div>
          <select value={selectedId} onChange={(event) => { setSelectedId(Number(event.target.value)); setRound(1); }}>
            {championships.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.season}</option>)}
          </select>
        </div>}

        {section === "País" && <CountryPage country={selectedCountry} flag={COUNTRIES.find((item) => item.name === selectedCountry)?.flag ?? ""} championships={championships.filter((item) => item.country === selectedCountry)} clubs={clubs} matches={matches} onNew={() => setModal("championship")} onOpen={(id) => { setSelectedId(id); setSection("Visão geral"); }} onDelete={deleteChampionship} />}
        {section === "Visão geral" && <Dashboard standings={standings} matches={myMatches} division={championship?.division ?? ""} clubName={clubName} onPartidas={() => setSection("Partidas")} onClub={() => setModal("club")} onChamp={() => setModal("championship")} onRound={addRound} onNextSeason={createNextBrazilSeason} onGenerateRound={() => generateResults("round")} onGenerateRemaining={() => generateResults("remaining")} onGenerateNextStage={generateNextStage} onHistory={() => setSection("Histórico")} onClubHistory={openClubHistory} />}
        {section === "Histórico" && championship && <ChampionshipHistory championship={championship} championships={championships} clubs={clubs} matches={matches} />}
        {section === "Clube" && selectedClubName && <ClubHistory clubName={selectedClubName} championships={championships} clubs={clubs} matches={matches} onBack={() => setSection("Visão geral")} />}
        {section === "Campeonatos" && <Manager title="Meus campeonatos" button="Novo campeonato" onClick={() => setModal("championship")}><div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.country} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><div className="cardActions"><button onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>Abrir →</button><button className="dangerText" onClick={() => deleteChampionship(item.id)}>Excluir</button></div></div>)}</div></Manager>}
        {section === "Clubes" && <Manager title={"Clubes · " + championship?.name} button="Novo clube" onClick={() => setModal("club")}><div className="cards">{myClubs.map((club) => <button className="entityCard clubEntityCard" key={club.id} onClick={() => openClubHistory(club.name)}><span>CLUBE</span><h2>{club.name}</h2><p>{championship?.country} · {championship?.season}</p><small>Ver histórico →</small></button>)}</div></Manager>}
        {section === "Partidas" && <Manager title={(championship?.name ?? "") + " · Partidas"} button="Ver rodadas" onClick={() => setSection("Partidas")}>
          {championship?.division === "Série B" && myMatches.some((match) => match.stage === "playoff") ? (
            <div className="phasePage">
              <div className="phaseIntro">
                <div><span className="eyebrow">PLAY-OFFS DE ACESSO</span><h2>4 jogos · 2 confrontos</h2><p>Ida: 6º x 3º e 5º x 4º. Volta: 3º x 6º e 4º x 5º. Os vencedores dos confrontos garantem o acesso à Série A.</p></div>
                <button className="generateBtn phaseGenerate" onClick={() => generateResults("playoff")}>⚡ Gerar resultados dos play-offs</button>
              </div>
              <PlayoffAccessSummary matches={myMatches.filter((match) => match.stage === "playoff")} clubName={clubName} />
              <div className="playoffGrid">{myMatches.filter((match) => match.stage === "playoff").sort((a, b) => a.round - b.round || a.id - b.id).map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div>
            </div>
          ) : championship?.division === "Série C" && myMatches.some((match) => match.stage === "final") ? (
            <div className="phasePage">
              <div className="phaseIntro">
                <div><span className="eyebrow">FINAL DA SÉRIE C</span><h2>2 jogos · campeão</h2><p>Os dois primeiros dos grupos já garantiram o acesso. Os líderes disputam a final em ida e volta.</p></div>
                <button className="generateBtn phaseGenerate" onClick={() => generateResults("final")}>⚡ Gerar resultados da final</button>
              </div>
              <FinalChampionSummary matches={myMatches.filter((match) => match.stage === "final")} clubName={clubName} />
              <div className="playoffGrid">{myMatches.filter((match) => match.stage === "final").sort((a, b) => a.round - b.round).map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div>
            </div>
          ) : championship?.division === "Série C" && myMatches.some((match) => match.stage === "secondPhase") ? (
            <div className="phasePage">
              <div className="phaseIntro">
                <div><span className="eyebrow">SEGUNDA FASE</span><h2>Grupo A · Grupo B</h2><p>Os dois primeiros de cada grupo garantem o acesso à Série B. Os líderes disputam a final em 2 jogos.</p></div>
                <div className="phaseActions">
                  <button className="generateBtn phaseGenerate" onClick={() => generateResults("secondPhase")}>⚡ Gerar resultados da segunda fase</button>
                  {myMatches.some((match) => match.stage === "secondPhase") && myMatches.filter((match) => match.stage === "secondPhase").every((match) => match.played) && <button className="primary phaseGenerate" onClick={generateNextStage}>→ Ir para a final</button>}
                </div>
              </div>
              <div className="groupBoards">
                {(["A", "B"] as const).map((group) => {
                  const groupMatches = myMatches.filter((match) => match.stage === "secondPhase" && match.group === group);
                  const ids = [...new Set(groupMatches.flatMap((match) => [match.home, match.away]))];
                  const groupRows = ids.map((clubId) => {
                    let points = 0, played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
                    groupMatches.filter((match) => match.played && (match.home === clubId || match.away === clubId)).forEach((match) => {
                      const home = match.home === clubId;
                      const scored = home ? match.homeScore! : match.awayScore!;
                      const conceded = home ? match.awayScore! : match.homeScore!;
                      played++; gf += scored; ga += conceded;
                      if (scored > conceded) { wins++; points += championship?.pointsWin ?? 3; }
                      else if (scored === conceded) { draws++; points += championship?.pointsDraw ?? 1; }
                      else losses++;
                    });
                    return { clubId, played, wins, draws, losses, gf, ga, gd: gf - ga, points };
                  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
                  return <section className="groupBoard" key={group}><div className="groupBoardHead"><b>GRUPO {group}</b><span>2 primeiros = acesso</span></div><table className="standingsTable"><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>{groupRows.map((row, index) => <tr key={row.clubId} className={index < 2 ? "zone-direct" : "zone-neutral"}><td>{index + 1}</td><td><b>{clubName(row.clubId)}</b></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.gd > 0 ? "+" : ""}{row.gd}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></section>;
                })}
              </div>
              <div className="phaseMatches"><h3>Jogos da segunda fase</h3><div className="playoffGrid">{myMatches.filter((match) => match.stage === "secondPhase").map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div></div>
            </div>
          ) : (
            <>
              <div className="roundBar"><label>RODADA<select value={round} onChange={(event) => setRound(Number(event.target.value))}>{rounds.map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select></label></div>
              <div className="resultList">{myMatches.filter((match) => match.round === round).map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div>
            </>
          )}
        </Manager>}
      </main>

      {modal && <Modal type={modal} country={selectedCountry} onClose={() => setModal(null)} addChampionship={addChampionship} addClub={addClub} />}
    </div>
  );
}

function CountryPage({ country, flag, championships, clubs, matches, onNew, onOpen, onDelete }: { country: string; flag: string; championships: Championship[]; clubs: Club[]; matches: Match[]; onNew: () => void; onOpen: (id: number) => void; onDelete: (id: number) => void }) {
  return <section className="manager countryPage"><div className="managerHead"><div><span className="eyebrow">{flag} {country.toUpperCase()}</span><h2>Campeonatos de {country}</h2></div><button className="primary" onClick={onNew}>＋ Novo campeonato</button></div>{championships.length === 0 ? <div className="countryEmpty"><h3>Nenhum campeonato cadastrado</h3><p>Use o botão acima para criar uma competição dentro de {country}.</p></div> : <div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.division} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><div className="cardActions"><button onClick={() => onOpen(item.id)}>Abrir →</button><button className="dangerText" onClick={() => onDelete(item.id)}>Excluir</button></div></div>)}</div>}</section>;
}

function ClubHistory({ clubName, championships, clubs, matches, onBack }: { clubName: string; championships: Championship[]; clubs: Club[]; matches: Match[]; onBack: () => void }) {
  const seasons = clubs
    .filter((club) => club.name === clubName)
    .map((club) => {
      const championship = championships.find((item) => item.id === club.championshipId);
      if (!championship) return null;

      const allRegular = matches.filter((match) => match.championshipId === championship.id && (match.stage ?? "regular") === "regular");
      const clubMatches = allRegular.filter((match) => match.home === club.id || match.away === club.id);
      const playedMatches = clubMatches.filter((match) => match.played);

      let points = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
      playedMatches.forEach((match) => {
        const home = match.home === club.id;
        const scored = home ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
        const conceded = home ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
        gf += scored;
        ga += conceded;
        if (scored > conceded) { wins++; points += championship.pointsWin; }
        else if (scored === conceded) { draws++; points += championship.pointsDraw; }
        else { losses++; points += championship.pointsLoss; }
      });

      const table = clubs.filter((item) => item.championshipId === championship.id).map((item) => {
        const itemMatches = allRegular.filter((match) => match.played && (match.home === item.id || match.away === item.id));
        let itemPoints = 0, itemGf = 0, itemGa = 0;
        itemMatches.forEach((match) => {
          const home = match.home === item.id;
          const scored = home ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
          const conceded = home ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
          itemGf += scored;
          itemGa += conceded;
          itemPoints += scored > conceded ? championship.pointsWin : scored === conceded ? championship.pointsDraw : championship.pointsLoss;
        });
        return { id: item.id, points: itemPoints, gd: itemGf - itemGa, gf: itemGf };
      }).sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf);

      const position = table.findIndex((row) => row.id === club.id) + 1;
      const complete = allRegular.length > 0 && allRegular.every((match) => match.played);

      let champion = complete && position === 1;
      if (complete && championship.division === "Série C") {
        const final = matches.filter((match) => match.championshipId === championship.id && match.stage === "final").sort((x, y) => x.round - y.round);
        if (final.length === 2 && final.every((match) => match.played)) {
          const teams = [...new Set(final.flatMap((match) => [match.home, match.away]))];
          const totals = teams.map((id) => ({
            id,
            goals: final.reduce((sum, match) => sum + (match.home === id ? (match.homeScore ?? 0) : match.away === id ? (match.awayScore ?? 0) : 0), 0),
          })).sort((x, y) => y.goals - x.goals);
          const penaltyWinner = final.find((match) => match.penaltyWinner)?.penaltyWinner;
          champion = penaltyWinner === club.id || (!penaltyWinner && totals[0]?.id === club.id && totals[0]?.goals !== totals[1]?.goals);
        } else {
          champion = false;
        }
      }

      return {
        id: club.id,
        championship,
        position,
        played: playedMatches.length,
        wins,
        draws,
        losses,
        gf,
        ga,
        gd: gf - ga,
        points,
        champion,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => Number(b.championship.season) - Number(a.championship.season) || a.championship.name.localeCompare(b.championship.name));

  const titles = seasons.filter((item) => item.champion);

  return <div className="clubHistoryPage">
    <div className="clubHistoryHero">
      <button className="ghost" onClick={onBack}>← Voltar</button>
      <span className="eyebrow">HISTÓRICO DO CLUBE</span>
      <h2>{clubName}</h2>
      <p>{seasons.length} temporadas registradas · {titles.length} {titles.length === 1 ? "título" : "títulos"}</p>
    </div>

    <section className="historyPanel">
      <div className="panelHead"><div><span className="eyebrow">TEMPORADA POR TEMPORADA</span><h2>Histórico do clube</h2></div></div>
      {seasons.length > 0 ? <div className="clubSeasonList">
        {seasons.map((item) => <div className="clubSeasonRow" key={item.id}>
          <div className="clubSeasonMain">
            <strong>{item.championship.season}</strong>
            <div><b>{item.championship.name}</b><small>{item.championship.division}{item.position > 0 ? " · " + item.position + "º lugar" : ""}</small></div>
            {item.champion && <em>🏆 CAMPEÃO</em>}
          </div>
          <div className="clubSeasonStats">
            <span><b>{item.played}</b> J</span>
            <span><b>{item.wins}</b> V</span>
            <span><b>{item.draws}</b> E</span>
            <span><b>{item.losses}</b> D</span>
            <span><b>{item.gf}</b> GP</span>
            <span><b>{item.ga}</b> GC</span>
            <span><b>{item.gd > 0 ? "+" : ""}{item.gd}</b> SG</span>
            <span><b>{item.points}</b> PTS</span>
          </div>
        </div>)}
      </div> : <div className="emptySide">Nenhum registro encontrado para este clube.</div>}
    </section>
  </div>;
}

function ChampionshipHistory({ championship, championships, clubs, matches }: { championship: Championship; championships: Championship[]; clubs: Club[]; matches: Match[] }) {
  const seasons = championships
    .filter((item) => item.country === championship.country && item.name === championship.name)
    .sort((a, b) => Number(b.season) - Number(a.season));

  const getClubName = (id: number) => clubs.find((club) => club.id === id)?.name ?? "Clube";

  const seasonData = seasons.map((season) => {
    const seasonMatches = matches.filter((match) => match.championshipId === season.id);
    const regular = seasonMatches.filter((match) => (match.stage ?? "regular") === "regular");
    if (!regular.length || !regular.every((match) => match.played)) return null;

    const rows = clubs.filter((club) => club.championshipId === season.id).map((club) => {
      let points = 0, gd = 0, gf = 0, games = 0;
      regular.filter((match) => match.home === club.id || match.away === club.id).forEach((match) => {
        const home = match.home === club.id;
        const scored = home ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
        const conceded = home ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
        games++; gf += scored; gd += scored - conceded;
        points += scored > conceded ? season.pointsWin : scored === conceded ? season.pointsDraw : season.pointsLoss;
      });
      return { clubId: club.id, name: club.name, games, points, gd, gf };
    }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    let championId = rows[0]?.clubId;
    let championPoints = rows[0]?.points ?? 0;
    let championGd = rows[0]?.gd ?? 0;
    if (season.division === "Série C") {
      const final = seasonMatches.filter((match) => match.stage === "final").sort((a, b) => a.round - b.round);
      if (final.length !== 2 || !final.every((match) => match.played)) return null;
      const teams = [...new Set(final.flatMap((match) => [match.home, match.away]))];
      const totals = teams.map((clubId) => ({
        clubId,
        goals: final.reduce((sum, match) => sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0), 0)
      })).sort((a, b) => b.goals - a.goals);
      const penaltyWinner = final.find((match) => match.penaltyWinner)?.penaltyWinner;
      if (totals.length !== 2 || (totals[0].goals === totals[1].goals && !penaltyWinner)) return null;
      championId = penaltyWinner ?? totals[0].clubId;
      championPoints = rows.find((r) => r.clubId === championId)?.points ?? 0;
      championGd = rows.find((r) => r.clubId === championId)?.gd ?? 0;
    }

    return { season, rows, championId: championId!, championPoints, championGd };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item?.championId));

  const titleCounts = new Map<string, { count: number; seasons: string[] }>();
  seasonData.forEach((item) => {
    const name = getClubName(item.championId);
    const current = titleCounts.get(name) ?? { count: 0, seasons: [] };
    current.count++; current.seasons.push(item.season.season);
    titleCounts.set(name, current);
  });
  const ranking = [...titleCounts.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));

  const longestStreak = (() => {
    let best = { name: "", count: 0, seasons: [] as string[] };
    const byClub = new Map<string, string[]>();
    seasonData.sort((a, b) => Number(a.season.season) - Number(b.season.season)).forEach((item) => {
      const name = getClubName(item.championId);
      const list = byClub.get(name) ?? [];
      list.push(item.season.season); byClub.set(name, list);
    });
    byClub.forEach((years, name) => {
      let run: string[] = [];
      let previous = -Infinity;
      years.forEach((year) => {
        if (Number(year) === previous + 1) run.push(year);
        else run = [year];
        previous = Number(year);
        if (run.length > best.count) best = { name, count: run.length, seasons: [...run] };
      });
    });
    return best;
  })();

  const latestChampion = seasonData.sort((a, b) => Number(b.season.season) - Number(a.season.season))[0];
  const championPointsRecord = [...seasonData].sort((a, b) => b.championPoints - a.championPoints)[0];
  const championGdRecord = [...seasonData].sort((a, b) => b.championGd - a.championGd)[0];

  const movements = seasonData.slice().sort((a, b) => Number(a.season.season) - Number(b.season.season)).flatMap((current, index, all) => {
    const next = all[index + 1];
    if (!next) return [];

    const currentNames = new Set(current.rows.map((r) => r.name));
    const nextNames = new Set(next.rows.map((r) => r.name));
    const entered = [...nextNames].filter((name) => !currentNames.has(name));
    const left = [...currentNames].filter((name) => !nextNames.has(name));

    const findDivision = (season: string, name: string) => {
      const championshipIds = championships
        .filter((item) => item.country === championship.country && item.season === season)
        .filter((item) => clubs.some((club) => club.championshipId === item.id && club.name === name))
        .map((item) => item.division);
      return championshipIds[0] ?? "outra divisão";
    };

    const divisionLevel = (division: string) => {
      if (division === "Série A") return 1;
      if (division === "Série B") return 2;
      if (division === "Série C") return 3;
      const number = Number(division.match(/\d+/)?.[0]);
      return Number.isFinite(number) ? number : 999;
    };

    const currentLevel = divisionLevel(current.season.division);
    const incomingFromLower = entered.filter((name) => divisionLevel(findDivision(current.season.season, name)) > currentLevel);
    const incomingFromHigher = entered.filter((name) => divisionLevel(findDivision(current.season.season, name)) < currentLevel);
    const outgoingToHigher = left.filter((name) => divisionLevel(findDivision(next.season.season, name)) < currentLevel);
    const outgoingToLower = left.filter((name) => divisionLevel(findDivision(next.season.season, name)) > currentLevel);

    return [{
      from: current.season.season,
      to: next.season.season,
      incomingFromLower,
      incomingFromHigher,
      outgoingToHigher,
      outgoingToLower,
    }];
  });

  return <div className="historyPage">
    <div className="historyHero"><div><span className="eyebrow">HISTÓRICO</span><h2>{championship.name}</h2><p>{seasons.length} temporadas cadastradas · {seasonData.length} com campeão definido</p></div></div>

    {ranking.length > 0 && <section className="historyPanel">
      <div className="panelHead"><div><span className="eyebrow">PALMARÉS</span><h2>Maiores campeões</h2></div></div>
      <div className="historyCards">{ranking.map(([name, data], index) => <div className="historyCard" key={name}><span>#{index + 1}</span><div><strong>{name}</strong><small>{data.count} {data.count === 1 ? "título" : "títulos"}</small></div><em>{data.seasons.join(" · ")}</em></div>)}</div>
    </section>}

    <section className="historyPanel">
      <div className="panelHead"><div><span className="eyebrow">RECORDES</span><h2>Marcas históricas</h2></div></div>
      <div className="recordGrid">
        <div className="recordCard"><span>🏆 MAIOR CAMPEÃO</span><strong>{ranking[0]?.[0] ?? "—"}</strong><small>{ranking[0] ? ranking[0][1].count + " títulos" : "—"}</small></div>
        <div className="recordCard"><span>🔥 MAIOR SEQUÊNCIA</span><strong>{longestStreak.name || "—"}</strong><small>{longestStreak.count ? longestStreak.count + " consecutivos · " + longestStreak.seasons.join(", ") : "—"}</small></div>
        <div className="recordCard"><span>📅 CAMPEÃO MAIS RECENTE</span><strong>{latestChampion ? getClubName(latestChampion.championId) : "—"}</strong><small>{latestChampion?.season.season ?? "—"}</small></div>
        <div className="recordCard"><span>📊 MAIOR PONTUAÇÃO DO CAMPEÃO</span><strong>{championPointsRecord ? getClubName(championPointsRecord.championId) : "—"}</strong><small>{championPointsRecord ? championPointsRecord.championPoints + " pontos · " + championPointsRecord.season.season : "—"}</small></div>
        <div className="recordCard"><span>⚽ MAIOR SALDO DO CAMPEÃO</span><strong>{championGdRecord ? getClubName(championGdRecord.championId) : "—"}</strong><small>{championGdRecord ? (championGdRecord.championGd > 0 ? "+" : "") + championGdRecord.championGd + " · " + championGdRecord.season.season : "—"}</small></div>
        <div className="recordCard"><span>👑 CAMPEÕES DIFERENTES</span><strong>{ranking.length}</strong><small>clubes já campeões</small></div>
      </div>
    </section>

    <section className="historyPanel">
      <div className="panelHead"><div><span className="eyebrow">LINHA DO TEMPO</span><h2>Campeões por ano</h2></div></div>
      {seasonData.length > 0 ? <div className="seasonHistory">{seasonData.map((item) => <div className="seasonHistoryRow" key={item.season.id}><span>{item.season.season}</span><strong>🏆 {getClubName(item.championId)}</strong></div>)}</div> : <div className="emptySide">Nenhum campeão registrado ainda.</div>}
    </section>


  </div>;
}


function Dashboard({ standings, matches, division, clubName, onPartidas, onClub, onChamp, onRound, onNextSeason, onGenerateRound, onGenerateRemaining, onGenerateNextStage, onHistory, onClubHistory }: { standings: any[]; matches: Match[]; division: string; clubName: (id: number) => string; onPartidas: () => void; onClub: () => void; onChamp: () => void; onRound: () => void; onNextSeason: () => void; onGenerateRound: () => void; onGenerateRemaining: () => void; onGenerateNextStage: () => void; onHistory: () => void; onClubHistory: (name: string) => void }) {
  return <><section className="stats"><div className="stat"><span>CLUBES</span><strong>{standings.length}</strong><small>neste campeonato</small></div><div className="stat"><span>PARTIDAS</span><strong>{matches.length}</strong><small>{matches.filter((m) => m.played).length} com resultado</small></div><div className="stat"><span>RODADAS</span><strong>{new Set(matches.map((m) => m.round)).size}</strong><small>cadastradas</small></div></section>
    <div className="grid"><section className="panel wide"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Classificação</h2></div><button className="textBtn" onClick={onPartidas}>Abrir partidas →</button></div><div className="tableLegend"><span className="legendItem direct"><i /> Acesso direto</span><span className="legendItem playoff"><i /> Play-offs de acesso</span><span className="legendItem secondPhase"><i /> Segunda fase</span><span className="legendItem relegation"><i /> Rebaixamento</span></div><table className="standingsTable"><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{standings.map((row, index) => { const position = index + 1; const rowClass = division === "Série A" ? (position >= 17 ? "zone-relegation" : "zone-neutral") : division === "Série B" ? (position <= 2 ? "zone-direct" : position <= 6 ? "zone-playoff" : position >= 17 ? "zone-relegation" : "zone-neutral") : division === "Série C" ? (position <= 8 ? "zone-second-phase" : "zone-neutral") : "zone-neutral"; return <tr key={row.club.id} className={rowClass}><td>{position}</td><td><button className="clubLink" onClick={() => onClubHistory(row.club.name)}>{row.club.name}</button></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.gf}</td><td>{row.ga}</td><td>{row.gd > 0 ? "+" : ""}{row.gd}</td><td><strong>{row.points}</strong></td></tr>; })}</tbody></table></section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Próximos jogos</h2></div></div>{matches.filter((m) => !m.played).slice(0, 5).map((m) => <div className="match" key={m.id}><div className="date">RODADA {m.round}</div><div className="teams"><span>{clubName(m.home)}</span><b>×</b><span>{clubName(m.away)}</span></div></div>)}</section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Ações rápidas</h2></div></div><div className="quick"><button onClick={onClub}>＋ Cadastrar clube</button><button onClick={onChamp}>＋ Novo campeonato</button><button onClick={onPartidas}>◷ Ver rodadas</button><button onClick={onPartidas}>◷ Lançar resultados</button><button onClick={onHistory}>🏆 Histórico</button><button className="generateBtn" onClick={onGenerateRound}>⚡ Gerar rodada</button><button className="generateBtn" onClick={onGenerateRemaining}>⚡ Gerar restantes</button>{(division === "Série B" || division === "Série C") && <button className="generateBtn" onClick={onGenerateNextStage}>⇢ Gerar próxima fase</button>}<button onClick={onNextSeason}>⇄ Gerar próxima temporada</button></div></section></div></>;
}

function Manager({ title, button, onClick, children }: { title: string; button: string; onClick: () => void; children: React.ReactNode }) {
  return <section className="manager"><div className="managerHead"><div><span className="eyebrow">CADASTRO E GESTÃO</span><h2>{title}</h2></div><button className="primary" onClick={onClick}>＋ {button}</button></div>{children}</section>;
}

function FinalChampionSummary({ matches, clubName }: { matches: Match[]; clubName: (id: number) => string }) {
  const complete = matches.length === 2 && matches.every((match) => match.played);
  if (!complete) {
    return <div className="championPending">🏆 Campeão: aguardando os 2 jogos da final</div>;
  }

  const teams = [...new Set(matches.flatMap((match) => [match.home, match.away]))];
  const totals = teams.map((clubId) => ({
    clubId,
    goals: matches.reduce((sum, match) => {
      if (match.home === clubId) return sum + (match.homeScore ?? 0);
      if (match.away === clubId) return sum + (match.awayScore ?? 0);
      return sum;
    }, 0),
  })).sort((a, b) => b.goals - a.goals);

  const tied = totals.length === 2 && totals[0].goals === totals[1].goals;
  const penaltyWinner = matches.find((match) => match.penaltyWinner)?.penaltyWinner;
  if (tied && !penaltyWinner) {
    return <div className="championPending">🏆 Final empatada no agregado — decisão por pênaltis.</div>;
  }

  const champion = penaltyWinner ? { clubId: penaltyWinner, goals: totals.find((item) => item.clubId === penaltyWinner)?.goals ?? 0 } : totals[0];
  return <div className="championCard">
    <span>🏆 CAMPEÃO DA SÉRIE C</span>
    <strong>{clubName(champion.clubId)}</strong>
    <small>Placar agregado: {champion.goals} × {totals[1].goals}</small>
  </div>;
}

function PlayoffAccessSummary({ matches, clubName }: { matches: Match[]; clubName: (id: number) => string }) {
  const confrontations = new Map<string, Match[]>();
  matches.forEach((match) => {
    const key = [match.home, match.away].sort((a, b) => a - b).join("-");
    const list = confrontations.get(key) ?? [];
    list.push(match);
    confrontations.set(key, list);
  });

  return <div className="accessSummary">
    {[...confrontations.values()].map((legs, index) => {
      const teams = [...new Set(legs.flatMap((match) => [match.home, match.away]))];
      const complete = legs.length === 2 && legs.every((match) => match.played);
      const totals = teams.map((clubId) => ({
        clubId,
        goals: legs.reduce((sum, match) => {
          if (!match.played) return sum;
          return sum + (match.home === clubId ? (match.homeScore ?? 0) : match.away === clubId ? (match.awayScore ?? 0) : 0);
        }, 0),
      })).sort((a, b) => b.goals - a.goals);

      const secondLeg = legs.find((match) => match.round === 40) ?? legs[1];
      const penaltyWinner = secondLeg?.penaltyWinner;
      const winner = complete
        ? penaltyWinner ?? (totals.length === 2 && totals[0].goals !== totals[1].goals ? totals[0].clubId : null)
        : null;
      const tied = complete && totals.length === 2 && totals[0].goals === totals[1].goals && !penaltyWinner;

      return <div className="accessCard" key={index}>
        <div className="accessCardHead"><b>CONFRONTO {index + 1}</b><span>{complete ? (tied ? "Pênaltis necessários" : "Classificado") : "Aguardando os 2 jogos"}</span></div>
        <div className="accessTeams">
          {teams.map((clubId) => <div key={clubId} className={winner === clubId ? "accessTeam qualified" : "accessTeam"}>
            <b>{clubName(clubId)}</b>
            {complete && <strong>{totals.find((item) => item.clubId === clubId)?.goals ?? 0}</strong>}
            {winner === clubId && <em>{penaltyWinner === clubId ? "ACESSO · PÊNALTIS" : "ACESSO"}</em>}
          </div>)}
        </div>
      </div>;
    })}
  </div>;
}

function ResultRow({ match, home, away, onSave }: { match: Match; home: string; away: string; onSave: (id: number, home: string, away: string) => void }) {
  const [homeScore, setHomeScore] = useState(match.homeScore == null ? "" : String(match.homeScore));
  const [awayScore, setAwayScore] = useState(match.awayScore == null ? "" : String(match.awayScore));
  return <div className="resultRow"><div><span className="eyebrow">RODADA {match.round}</span><b>{home}</b><small>vs</small><b>{away}</b></div><div className="scoreEdit"><input value={homeScore} onChange={(e) => setHomeScore(e.target.value)} inputMode="numeric" /><strong>×</strong><input value={awayScore} onChange={(e) => setAwayScore(e.target.value)} inputMode="numeric" /><button onClick={() => onSave(match.id, homeScore, awayScore)}>{match.played ? "Atualizar" : "Salvar resultado"}</button></div></div>;
}

function Modal({ type, country, onClose, addChampionship, addClub }: {
  type: "club" | "championship";
  country: string;
  onClose: () => void;
  addChampionship: (data: Omit<Championship, "id">) => void;
  addClub: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const fixedCountry = country;
  const [season, setSeason] = useState("2026");
  const [sport, setSport] = useState("Futebol");
  const [category, setCategory] = useState("Profissional");
  const [division, setDivision] = useState("Divisão não definida");
  const [format, setFormat] = useState("Pontos corridos");
  const [teamCount, setTeamCount] = useState("20");
  const [legs, setLegs] = useState("2");
  const [rounds, setRounds] = useState("38");
  const [pointsWin, setPointsWin] = useState("3");
  const [pointsDraw, setPointsDraw] = useState("1");
  const [pointsLoss, setPointsLoss] = useState("0");
  const [tieBreakers, setTieBreakers] = useState<string[]>(["Pontos", "Saldo de gols", "Gols pró"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const toggleTieBreaker = (value: string) => {
    setTieBreakers((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const saveChampionship = () => {
    if (!name.trim()) return;
    addChampionship({
      name, country: fixedCountry, season, sport, category, division, format,
      regulation: "Regulamento cadastrado manualmente.",
      promotion: "",
      relegation: "",
      teamCount: Math.max(0, Number(teamCount) || 0),
      legs: Math.max(1, Number(legs) || 1),
      rounds: Math.max(0, Number(rounds) || 0),
      pointsWin: Math.max(0, Number(pointsWin) || 0),
      pointsDraw: Math.max(0, Number(pointsDraw) || 0),
      pointsLoss: Math.max(0, Number(pointsLoss) || 0),
      tieBreakers, startDate, endDate
    });
  };

  if (type === "club") {
    return <div className="overlay"><div className="modal modalSmall"><button className="close" onClick={onClose}>×</button><span className="eyebrow">NOVO REGISTRO</span><h2>Novo clube</h2><input autoFocus placeholder="Nome do clube" value={name} onChange={(e) => setName(e.target.value)} /><button className="primary full" onClick={() => addClub(name)}>Salvar clube</button></div></div>;
  }

  return <div className="overlay"><div className="modal modalLarge">
    <button className="close" onClick={onClose}>×</button>
    <span className="eyebrow">CONFIGURAÇÃO DA COMPETIÇÃO</span>
    <h2>Novo campeonato</h2>
    <p className="modalIntro">Cadastre as regras da competição. Elas ficam salvas junto ao campeonato.</p>

    <div className="formSection"><h3>1 · Identificação</h3><div className="formGrid">
      <label className="field wideField">Nome da competição<input autoFocus placeholder="Ex.: Campeonato Brasileiro Série A" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field">País<input value={fixedCountry} readOnly /></label>
      <label className="field">Temporada<input placeholder="2026" value={season} onChange={(e) => setSeason(e.target.value)} /></label>
      <label className="field">Esporte<select value={sport} onChange={(e) => setSport(e.target.value)}><option>Futebol</option><option>Futsal</option><option>Basquete</option><option>Vôlei</option><option>Handebol</option><option>Outro</option></select></label>
      <label className="field">Divisão<input placeholder="Ex.: Série A" value={division} onChange={(e) => setDivision(e.target.value)} /></label>
      <label className="field">Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Profissional</option><option>Feminino</option><option>Masculino</option><option>Base / Juvenil</option><option>Sub-20</option><option>Sub-17</option><option>Amador</option><option>Outro</option></select></label>
    </div></div>

    <div className="formSection"><h3>2 · Formato</h3><div className="formGrid">
      <label className="field wideField">Modelo da competição<select value={format} onChange={(e) => setFormat(e.target.value)}><option>Pontos corridos</option><option>Grupos</option><option>Mata-mata</option><option>Grupos + mata-mata</option><option>Outro</option></select></label>
      <label className="field">Número de equipes<input type="number" min="0" value={teamCount} onChange={(e) => setTeamCount(e.target.value)} /></label>
      <label className="field">Turnos<input type="number" min="1" value={legs} onChange={(e) => setLegs(e.target.value)} /></label>
      <label className="field">Número de rodadas<input type="number" min="0" value={rounds} onChange={(e) => setRounds(e.target.value)} /></label>
    </div></div>

    <div className="formSection"><h3>3 · Pontuação</h3><div className="formGrid pointsGrid">
      <label className="field">Vitória<input type="number" min="0" value={pointsWin} onChange={(e) => setPointsWin(e.target.value)} /></label>
      <label className="field">Empate<input type="number" min="0" value={pointsDraw} onChange={(e) => setPointsDraw(e.target.value)} /></label>
      <label className="field">Derrota<input type="number" min="0" value={pointsLoss} onChange={(e) => setPointsLoss(e.target.value)} /></label>
    </div></div>

    <div className="formSection"><h3>4 · Desempates</h3><div className="checks">
      {["Pontos", "Saldo de gols", "Gols pró", "Confronto direto", "Vitórias", "Fair play"].map((item) => <label className="check" key={item}><input type="checkbox" checked={tieBreakers.includes(item)} onChange={() => toggleTieBreaker(item)} />{item}</label>)}
    </div></div>

    <div className="formSection"><h3>5 · Calendário</h3><div className="formGrid">
      <label className="field">Início<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
      <label className="field">Fim<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
    </div></div>

    <div className="modalActions"><button className="ghost" onClick={onClose}>Cancelar</button><button className="primary" onClick={saveChampionship}>Criar campeonato</button></div>
  </div></div>;
}
