import { useEffect, useMemo, useState, type ReactNode } from "react";

type Division = "Série A" | "Série B" | "Série C" | "Série D" | "Estadual";
type Stage = "regular" | "playoff" | "secondPhase" | "knockout" | "final";

type Championship = {
  id: number;
  name: string;
  country: string;
  season: string;
  sport: string;
  category: string;
  division: Division;
  state?: string;
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
};

type Club = { id: number; name: string; championshipId: number; clubKey?: string };

type Match = {
  id: number;
  championshipId: number;
  round: number;
  home: number;
  away: number;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  stage: Stage;
  group?: string;
  knockoutRound?: number;
  penaltyWinner?: number;
};

type TableRow = {
  clubId: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

const DATA_VERSION = "clean-rebuild-cd-2026-09-29-v1";
const LS = {
  version: "sports-data-version",
  championships: "sports-championships",
  clubs: "sports-clubs",
  matches: "sports-matches",
};

const A_CLUBS = [
  "Athletico Paranaense","Atlético Mineiro","Bahia","Botafogo","Chapecoense",
  "Corinthians","Coritiba","Cruzeiro","Flamengo","Fluminense","Grêmio",
  "Internacional","Mirassol","Palmeiras","Red Bull Bragantino","Remo",
  "Santos","São Paulo","Vasco da Gama","Vitória",
];

const B_CLUBS = [
  "América Mineiro","Athletic","Atlético Goianiense","Avaí","Botafogo - SP",
  "Ceará","CRB","Criciúma","Cuiabá","Fortaleza","Goiás","Juventude",
  "Londrina","Náutico","Novorizontino","Operário - PR","Ponte Preta",
  "São Bernardo","Sport","Vila Nova",
];

const C_CLUBS = [
  "Amazonas","Anápolis","Barra - SC","Botafogo - PB","Brusque","Caxias",
  "Confiança","Ferroviária","Figueirense","Floresta","Guarani","Inter de Limeira",
  "Itabaiana","Ituano","Maranhão","Maringá","Paysandu","Santa Cruz",
  "Volta Redonda","Ypiranga de Erechim",
];

const D_CLUBS = [
  "Manauara","Nacional - AM","São Raimundo - RR","Monte Roraima","Manaus","GAS",
  "Guaporé","Gazin Porto Velho","Araguaína","Independência","Galvez","Humaitá",
  "Gama","Luverdense","Brasiliense","Aparecidense","Primavera - MT","Inhumas",
  "Capital - DF","Goiatuba","Ceilândia","Mixto","União Rondonópolis","Operário VG",
  "Trem","Águia de Marabá","Imperatriz","Tuna Luso","Tocantinópolis","Oratório",
  "Iguatu","Maracanã - CE","Parnahyba","Sampaio Corrêa","Moto Club","IAPE",
  "Ferroviário","Piauí","Fluminense - PI","Altos","Tirol","Atlético Cearense",
  "ABC","América de Natal","Maguary","Central","Sousa","Laguna","Treze","Sergipe",
  "Serra Branca","Lagarto","Retrô","Decisão Goiana","CSA","Juazeirense","ASA",
  "Jacuipense","CSE","Atlético de Alagoinhas","Uberlândia","Betim Futebol","CRAC",
  "Ivinhema","ABECAT","Operário - MS","Democrata GV","Tombense","Vitória - ES",
  "RIo Branco - ES","Porto - BA","Real Noroeste","Portuguesa","Água Santa",
  "Portuguesa - RJ","America","Madureira","Pouso Alegre","XV de Piracicaba",
  "Noroeste","Velo Club","Sampaio Corrêa - RJ","Nova Iguaçu","Maricá",
  "Santa Catarina","Cianorte","FC Cascavel","São Luiz","Joinville","Guarany de Bagé",
  "Blumenau","Marcílio Dias","São Joseense","São José - RS","Brasil de Pelotas","Azuriz",
];

const ACRE_1_CLUBS = [
  "Galvez","Humaitá","Santa Cruz - AC","Rio Branco - AC",
  "Independência - AC","Vasco - AC","ADESG","São Francisco - AC",
];

const ALAGOAS_1_CLUBS = [
  "ASA","CSA","CRB","Murici","Cruzeiro - AL","Coruripe","Penedense","CSE",
];

const D_GROUPS = "ABCDEFGHIJKLMNOP".split("");

const D_STATE_SLOTS = [
  { state:"São Paulo", slots:4 },
  { state:"Rio de Janeiro", slots:3 }, { state:"Minas Gerais", slots:3 },
  { state:"Rio Grande do Sul", slots:3 }, { state:"Paraná", slots:3 },
  { state:"Ceará", slots:3 }, { state:"Goiás", slots:3 },
  { state:"Santa Catarina", slots:3 }, { state:"Bahia", slots:3 },
  { state:"Pernambuco", slots:2 }, { state:"Alagoas", slots:2 },
  { state:"Pará", slots:2 }, { state:"Mato Grosso", slots:2 },
  { state:"Amazonas", slots:2 }, { state:"Rio Grande do Norte", slots:2 },
  { state:"Paraíba", slots:2 }, { state:"Maranhão", slots:2 },
  { state:"Sergipe", slots:2 }, { state:"Distrito Federal", slots:2 },
  { state:"Piauí", slots:2 }, { state:"Espírito Santo", slots:2 },
  { state:"Tocantins", slots:2 }, { state:"Acre", slots:2 },
  { state:"Rondônia", slots:2 }, { state:"Roraima", slots:2 },
  { state:"Mato Grosso do Sul", slots:2 }, { state:"Amapá", slots:2 },
];

function makeClubKey(name:string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextId<T extends { id: number }>(items: T[]) {
  return Math.max(0, ...items.map((x) => x.id)) + 1;
}

function roundRobin(teamIds: number[], championshipId: number, startId: number, legs = 2, roundOffset = 0, group?: string): Match[] {
  const teams = [...teamIds];
  if (teams.length % 2) teams.push(-1);
  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const result: Match[] = [];
  let id = startId;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];
      if (a !== -1 && b !== -1) {
        const home = r % 2 === 0 ? a : b;
        const away = r % 2 === 0 ? b : a;
        result.push({
          id: id++,
          championshipId,
          round: roundOffset + r + 1,
          home,
          away,
          homeScore: null,
          awayScore: null,
          played: false,
          stage: "regular",
          ...(group ? { group } : {}),
        });
      }
    }
    const fixed = teams[0];
    const rest = teams.slice(1);
    rest.unshift(rest.pop()!);
    teams.splice(0, teams.length, fixed, ...rest);
  }

  if (legs === 2) {
    const firstLeg = result.map((m) => ({
      ...m,
      id: id++,
      round: m.round + rounds,
      home: m.away,
      away: m.home,
    }));
    result.push(...firstLeg);
  }
  return result;
}

function makeChampionship(
  id: number,
  division: Division,
  season: string,
  name: string,
  format: string,
  regulation: string,
  promotion: string,
  relegation: string,
  teamCount: number,
  rounds: number,
  legs: number,
  state?: string
): Championship {
  return {
    id, name, country: "Brasil", season, sport: "Futebol", category: "Profissional",
    division, state, format, regulation, promotion, relegation, teamCount, rounds, legs,
    pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
  };
}

function buildAcreChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Acreano",
    "Turno único + semifinais + final",
    "8 clubes jogam entre si em turno único. Os 4 primeiros se classificam para as semifinais. As semifinais são disputadas em dois jogos. A final é disputada em jogo único.",
    "O campeão acreano é o vencedor da final.",
    "Não há rebaixamento no Campeonato Acreano, pois não existe 2ª divisão estadual.",
    8,
    7,
    1,
    "Acre"
  );
  const clubs:Club[] = ACRE_1_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildAlagoasChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Alagoano",
    "Turno único + semifinais + final",
    "8 clubes jogam entre si em turno único. Os 4 primeiros se classificam para as semifinais. As semifinais e a final são disputadas em dois jogos.",
    "O campeão alagoano é o vencedor da final.",
    "Não há rebaixamento informado nesta 1ª divisão do Campeonato Alagoano.",
    8,
    7,
    1,
    "Alagoas"
  );
  const clubs:Club[] = ALAGOAS_1_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function tableFor(
  championship: Championship,
  clubIds: number[],
  matches: Match[],
  stage: Stage = "regular",
  group?: string
): TableRow[] {
  const rows = clubIds.map((clubId) => ({
    clubId, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0,
  }));

  const byId = new Map(rows.map((r) => [r.clubId, r]));
  matches
    .filter((m) =>
      m.championshipId === championship.id &&
      m.played &&
      m.stage === stage &&
      (group === undefined || m.group === group)
    )
    .forEach((m) => {
      const home = byId.get(m.home);
      const away = byId.get(m.away);
      if (!home || !away) return;
      const hs = m.homeScore ?? 0;
      const as = m.awayScore ?? 0;
      home.played++; away.played++;
      home.gf += hs; home.ga += as; home.gd += hs - as;
      away.gf += as; away.ga += hs; away.gd += as - hs;
      if (hs > as) { home.wins++; away.losses++; home.points += championship.pointsWin; }
      else if (hs < as) { away.wins++; home.losses++; away.points += championship.pointsWin; }
      else { home.draws++; away.draws++; home.points += championship.pointsDraw; away.points += championship.pointsDraw; }
    });

  return rows.sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf || b.wins - a.wins || a.clubId - b.clubId
  );
}

function score() {
  const r = Math.random();
  if (r < 0.55) return Math.floor(Math.random() * 4);
  if (r < 0.9) return Math.floor(Math.random() * 3);
  return Math.floor(Math.random() * 6);
}

function createDGroups(clubNames: string[]) {
  const shuffled = shuffle(clubNames);
  const groups: Record<string, string[]> = {};
  D_GROUPS.forEach((letter, index) => {
    groups[letter] = shuffled.slice(index * 6, index * 6 + 6);
  });
  return groups;
}

function buildDMatches(championshipId: number, clubs: Club[], startId: number): Match[] {
  const groups = createDGroups(clubs.map((c) => c.name));
  const result: Match[] = [];
  let id = startId;
  for (const group of D_GROUPS) {
    const ids = groups[group]
      .map((name) => clubs.find((c) => c.name === name)?.id)
      .filter((x): x is number => x !== undefined);
    const generated = roundRobin(ids, championshipId, id, 2, 0, group);
    result.push(...generated);
    id = nextId(result);
  }
  return result;
}

function knockoutWinner(matches: Match[], phase: number) {
  const phaseMatches = matches.filter((m) => m.stage === "knockout" && m.knockoutRound === phase);
  if (!phaseMatches.length || !phaseMatches.every((m) => m.played)) return [];
  const map = new Map<string, Match[]>();
  phaseMatches.forEach((m) => {
    const key = [m.home, m.away].sort((a, b) => a - b).join("-");
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  });
  const winners: number[] = [];
  for (const legs of map.values()) {
    if (legs.length !== 2) return [];
    const teams = [...new Set(legs.flatMap((m) => [m.home, m.away]))];
    if (teams.length !== 2) return [];
    const totals = teams.map((clubId) => ({
      clubId,
      goals: legs.reduce((sum, m) =>
        sum + (m.home === clubId ? (m.homeScore ?? 0) : m.away === clubId ? (m.awayScore ?? 0) : 0), 0),
    })).sort((a, b) => b.goals - a.goals || a.clubId - b.clubId);
    if (totals[0].goals > totals[1].goals) winners.push(totals[0].clubId);
    else {
      const second = [...legs].sort((a, b) => b.round - a.round)[0];
      winners.push(second.penaltyWinner ?? second.home);
    }
  }
  return winners;
}

function App() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [section, setSection] = useState("Visão geral");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newResult, setNewResult] = useState<Record<number, [string, string]>>({});
  const [newChamp, setNewChamp] = useState({
    name: "", season: "2026", division: "Série A" as Division, teams: 20,
  });

  const seed = () => {
    let cid = 1;
    let clubId = 1;
    const cs: Championship[] = [
      makeChampionship(1,"Série A","2026","Campeonato Brasileiro Série A","Pontos corridos",
        "20 clubes; dois turnos; todos contra todos; 38 rodadas; campeão pela maior pontuação.",
        "Nenhum acesso: divisão máxima.","Os quatro últimos são rebaixados para a Série B.",20,38,2),
      makeChampionship(2,"Série B","2026","Campeonato Brasileiro Série B","Pontos corridos + playoff",
        "20 clubes; 38 rodadas em ida e volta. 1º e 2º sobem diretamente. 3º x 6º e 4º x 5º fazem playoffs de ida e volta pelas duas vagas restantes.",
        "1º e 2º sobem diretamente; vencedores dos playoffs entre 3º-6º e 4º-5º também sobem.",
        "Os quatro últimos são rebaixados para a Série C.",20,38,2),
      makeChampionship(3,"Série C","2026","Campeonato Brasileiro Série C","Pontos corridos + grupos + final",
        "20 clubes em turno único; os 8 melhores avançam. Segunda fase em dois grupos de 4, com turno e returno. Os dois melhores de cada grupo sobem; líderes fazem a final.",
        "Os dois primeiros de cada grupo da segunda fase sobem para a Série B.",
        "Os quatro últimos da primeira fase são rebaixados para a Série D.",20,19,1),
      makeChampionship(4,"Série D","2026","Campeonato Brasileiro Série D","Grupos + mata-mata",
        "96 equipes; 16 grupos de 6; distribuição geográfica livre; ida e volta; 10 rodadas. Os 4 melhores de cada grupo avançam ao mata-mata. Todas as fases eliminatórias são em ida e volta.",
        "Os quatro semifinalistas, ou seja, os quatro vencedores das quartas de final, garantem acesso à Série C.",
        "Regra de rebaixamento não informada no regulamento enviado.",96,10,2),
    ];

    const allClubs: Club[] = [];
    const lists: [Division,string[]][] = [
      ["Série A",A_CLUBS],["Série B",B_CLUBS],["Série C",C_CLUBS],["Série D",D_CLUBS],
    ];
    for (const [division,names] of lists) {
      const champ = cs.find((x) => x.division === division)!;
      for (const name of names) allClubs.push({ id: clubId++, name, championshipId: champ.id, clubKey: makeClubKey(name) });
    }

    const ms: Match[] = [];
    for (const champ of cs.slice(0,3)) {
      const teamIds = allClubs.filter((c) => c.championshipId === champ.id).map((c) => c.id);
      const generated = roundRobin(teamIds, champ.id, cid, champ.legs);
      ms.push(...generated);
      cid = nextId(ms);
    }
    const d = cs[3];
    const dClubs = allClubs.filter((c) => c.championshipId === d.id);
    ms.push(...buildDMatches(d.id, dClubs, nextId(ms)));

    localStorage.setItem(LS.version, DATA_VERSION);
    localStorage.setItem(LS.championships, JSON.stringify(cs));
    localStorage.setItem(LS.clubs, JSON.stringify(allClubs));
    localStorage.setItem(LS.matches, JSON.stringify(ms));
    setChampionships(cs); setClubs(allClubs); setMatches(ms);
    setSelectedId(1); setSection("Visão geral"); setSelectedClub(null);
  };

  useEffect(() => {
    const version = localStorage.getItem(LS.version);
    if (version !== DATA_VERSION) {
      seed();
      return;
    }
    try {
      const cs = JSON.parse(localStorage.getItem(LS.championships) || "[]") as Championship[];
      const cl = JSON.parse(localStorage.getItem(LS.clubs) || "[]") as Club[];
      const ms = JSON.parse(localStorage.getItem(LS.matches) || "[]") as Match[];
      if (!cs.length || !cl.length) { seed(); return; }

      // Migração incremental: adiciona o primeiro estadual sem apagar
      // qualquer simulação nacional já existente no navegador.
      if (!cs.some((c)=>c.name==="Campeonato Acreano" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const acre = buildAcreChampionship(newChampId,newClubId,newMatchId);
        cs.push(acre.championship);
        cl.push(...acre.clubs);
        ms.push(...acre.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Alagoano" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const alagoas = buildAlagoasChampionship(newChampId,newClubId,newMatchId);
        cs.push(alagoas.championship);
        cl.push(...alagoas.clubs);
        ms.push(...alagoas.matches);
      }

      setChampionships(cs); setClubs(cl); setMatches(ms); setSelectedId(cs[0].id);
    } catch { seed(); }
  }, []);

  useEffect(() => {
    if (championships.length) localStorage.setItem(LS.championships, JSON.stringify(championships));
  }, [championships]);
  useEffect(() => {
    if (clubs.length) localStorage.setItem(LS.clubs, JSON.stringify(clubs));
  }, [clubs]);
  useEffect(() => {
    if (matches.length) localStorage.setItem(LS.matches, JSON.stringify(matches));
  }, [matches]);

  const championship = championships.find((c) => c.id === selectedId) ?? null;
  const myClubs = championship ? clubs.filter((c) => c.championshipId === championship.id) : [];
  const myMatches = championship ? matches.filter((m) => m.championshipId === championship.id) : [];

  const currentTable = useMemo(() => {
    if (!championship) return [];
    return tableFor(championship, myClubs.map((c) => c.id), myMatches);
  }, [championship, myClubs, myMatches]);

  const clubName = (id: number) => clubs.find((c) => c.id === id)?.name ?? "Clube";
  const clubByName = (name: string) => clubs.find((c) => c.name === name);

  const regularComplete = (champ: Championship) => {
    const games = matches.filter((m) => m.championshipId === champ.id && m.stage === "regular");
    return games.length > 0 && games.every((m) => m.played);
  };

  const championClubId = (champ: Championship, allMatches: Match[]) => {
    const games = allMatches.filter((m) => m.championshipId === champ.id);

    if (champ.division === "Estadual") {
      const final=games.filter(m=>m.stage==="final");
      if(final.length===1) {
        if(!final[0].played) return null;
        const m=final[0];
        if((m.homeScore??0)>(m.awayScore??0)) return m.home;
        if((m.awayScore??0)>(m.homeScore??0)) return m.away;
        return m.penaltyWinner ?? null;
      }
      if(final.length===2 && final.every(m=>m.played)) {
        const teams=[...new Set(final.flatMap(m=>[m.home,m.away]))];
        if(teams.length!==2) return null;
        const totals=teams.map(clubId=>({
          clubId,
          goals:final.reduce((sum,m)=>sum+(m.home===clubId?(m.homeScore??0):m.away===clubId?(m.awayScore??0):0),0)
        })).sort((a,b)=>b.goals-a.goals||a.clubId-b.clubId);
        if(totals[0].goals>totals[1].goals) return totals[0].clubId;
        const last=[...final].sort((a,b)=>b.round-a.round)[0];
        return last.penaltyWinner ?? null;
      }
      return null;
    }

    if (champ.division === "Série A") {
      if (!games.some((m) => m.stage === "regular") || !games.filter((m) => m.stage === "regular").every((m) => m.played)) return null;
      return tableFor(champ, clubs.filter((c) => c.championshipId === champ.id).map((c) => c.id), games)[0]?.clubId ?? null;
    }

    if (champ.division === "Série B") {
      const regular = games.filter((m) => m.stage === "regular");
      const playoffs = games.filter((m) => m.stage === "playoff");
      if (!regular.length || !regular.every((m) => m.played) || playoffs.length !== 4 || !playoffs.every((m) => m.played)) return null;
      return tableFor(champ, clubs.filter((c) => c.championshipId === champ.id).map((c) => c.id), games)[0]?.clubId ?? null;
    }

    if (champ.division === "Série C") {
      const final = games.filter((m) => m.stage === "final");
      if (final.length !== 2 || !final.every((m) => m.played)) return null;
      const winners = knockoutWinner(final.map((m) => ({...m, stage: "knockout" as Stage, knockoutRound: 1})), 1);
      return winners[0] ?? null;
    }

    const final = games.filter((m) => m.stage === "knockout" && m.knockoutRound === 2);
    if (final.length !== 2 || !final.every((m) => m.played)) return null;
    return knockoutWinner(games, 2)[0] ?? null;
  };

  const competitionComplete = (champ: Championship, allMatches: Match[]) => championClubId(champ, allMatches) !== null;

  useEffect(() => {
    if (championship && competitionComplete(championship, matches)) {
      setSection("Campeão");
    }
  }, [championship?.id, matches]);

  const prepareNextPhase = () => {
    if (!championship) return;
    let next = [...matches];
    let id = nextId(next);

    if (championship.division === "Estadual" && regularComplete(championship) &&
        !next.some((m)=>m.championshipId===championship.id&&m.stage==="knockout")) {
      const table=tableFor(championship,myClubs.map(c=>c.id),next);
      const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
      pairs.forEach(([home,away])=>{
        next.push({id:id++,championshipId:championship.id,round:8,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        next.push({id:id++,championshipId:championship.id,round:9,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
      });
      setMatches(next);
      alert(`Semifinais do ${championship.name} criadas: 1º x 4º e 2º x 3º, em dois jogos.`);
      return;
    }

    if (championship.division === "Estadual") {
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const finalExists=next.some(m=>m.championshipId===championship.id&&m.stage==="final");
      if (semis.length===4 && semis.every(m=>m.played) && !finalExists) {
        const winners=knockoutWinner(next,4);
        if(winners.length!==2){alert(`Não foi possível identificar os dois finalistas do ${championship.name}.`);return;}
        const finalMatches = [
          {id:id++,championshipId:championship.id,round:10,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
          {id:id++,championshipId:championship.id,round:11,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
        ];
        setMatches([...next,...finalMatches]);
        alert(`Final do ${championship.name} criada em dois jogos.`);
        return;
      }
      if(semis.length===4 && !semis.every(m=>m.played)) {
        alert(`Finalize os 4 jogos das semifinais do ${championship.name}.`);
        return;
      }
      if(finalExists && !next.filter(m=>m.championshipId===championship.id&&m.stage==="final").every(m=>m.played)) {
        alert(`Finalize os 2 jogos da final do ${championship.name} para encerrar a competição.`);
        return;
      }
    }

    if (championship.division === "Série B" && regularComplete(championship) &&
        !next.some((m) => m.championshipId === championship.id && m.stage === "playoff")) {
      const table = tableFor(championship, myClubs.map((c) => c.id), next);
      const pairs = [[table[5].clubId,table[2].clubId],[table[4].clubId,table[3].clubId]];
      pairs.forEach(([home,away]) => {
        next.push({id:id++,championshipId:championship.id,round:39,home,away,homeScore:null,awayScore:null,played:false,stage:"playoff"});
        next.push({id:id++,championshipId:championship.id,round:40,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"playoff"});
      });
      setMatches(next);
      alert("Play-offs da Série B criados: 6º x 3º e 5º x 4º.");
      return;
    }

    if (championship.division === "Série C" && regularComplete(championship) &&
        !next.some((m) => m.championshipId === championship.id && m.stage === "secondPhase")) {
      const table = tableFor(championship, myClubs.map((c) => c.id), next);
      const a = [table[0],table[2],table[4],table[6]].map((r) => r.clubId);
      const b = [table[1],table[3],table[5],table[7]].map((r) => r.clubId);
      const groups = [["A",a],["B",b]] as [string,number[]][];
      for (const [group,ids] of groups) {
        const generated = roundRobin(ids,championship.id,id,2,0,group);
        generated.forEach((m) => next.push({...m,stage:"secondPhase",group}));
        id = nextId(next);
      }
      setMatches(next);
      alert("Segunda fase da Série C criada automaticamente.");
      return;
    }

    if (championship.division === "Série C") {
      const secondPhase = next.filter((m) => m.championshipId === championship.id && m.stage === "secondPhase");
      const finalExists = next.some((m) => m.championshipId === championship.id && m.stage === "final");
      if (secondPhase.length === 24 && secondPhase.every((m) => m.played) && !finalExists) {
        const groupAIds = [...new Set(secondPhase.filter((m) => m.group === "A").flatMap((m) => [m.home, m.away]))];
        const groupBIds = [...new Set(secondPhase.filter((m) => m.group === "B").flatMap((m) => [m.home, m.away]))];
        const tableA = tableFor(championship, groupAIds, next, "secondPhase", "A");
        const tableB = tableFor(championship, groupBIds, next, "secondPhase", "B");
        if (tableA.length !== 4 || tableB.length !== 4) {
          alert("Não foi possível identificar os líderes dos grupos da Série C.");
          return;
        }
        const finalTeams = [tableA[0].clubId, tableB[0].clubId];
        const finalMatches = roundRobin(finalTeams, championship.id, id, 2, 6)
          .map((m) => ({...m, stage:"final" as Stage}));
        setMatches([...next, ...finalMatches]);
        alert("Final da Série C criada: os líderes dos grupos A e B disputarão o título em ida e volta.");
        return;
      }
    }

    if (championship.division === "Série D" && regularComplete(championship) &&
        !next.some((m) => m.championshipId === championship.id && m.stage === "knockout")) {
      const qualified: Record<string,number[]> = {};
      for (const group of D_GROUPS) {
        const ids = myClubs.filter((c) => myMatches.some((m) => m.group === group && (m.home === c.id || m.away === c.id))).map((c) => c.id);
        qualified[group] = tableFor(championship,ids,myMatches,"regular",group).slice(0,4).map((r) => r.clubId);
      }
      const created: Match[] = [];
      const pairs = [["A","B"],["C","D"],["E","F"],["G","H"],["I","J"],["K","L"],["M","N"],["O","P"]];
      for (const [ga,gb] of pairs) {
        const a=qualified[ga], b=qualified[gb];
        if (!a || !b || a.length!==4 || b.length!==4) continue;
        const pairings=[[a[0],b[3]],[b[0],a[3]],[a[1],b[2]],[b[1],a[2]]];
        for (const [home,away] of pairings) {
          created.push({id:id++,championshipId:championship.id,round:11,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:64});
          created.push({id:id++,championshipId:championship.id,round:12,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:64});
        }
      }
      if (created.length===64) {
        setMatches([...next,...created]);
        alert("1ª fase do mata-mata da Série D criada: 64 clubes.");
      }
      return;
    }

    if (championship.division === "Série D") {
      const phases=[64,32,16,8,4,2];
      const existing=phases.filter((p)=>next.some((m)=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===p));

      // Avança somente quando a fase imediatamente anterior estiver 100% concluída.
      // 64 -> 32 -> 16 -> 8 (quartas) -> 4 (semifinais) -> 2 (final).
      for (const completed of phases) {
        if (!existing.includes(completed) || completed===2) continue;

        const phaseMatches=next.filter((m)=>
          m.championshipId===championship.id &&
          m.stage==="knockout" &&
          m.knockoutRound===completed
        );

        if (phaseMatches.length===completed && phaseMatches.every((m)=>m.played)) {
          const nextPhase=completed/2;

          // Se a próxima fase já existe, não a recrie.
          if (existing.includes(nextPhase)) continue;

          const winners=knockoutWinner(next,completed);
          if (winners.length!==nextPhase) {
            alert("Não foi possível identificar todos os vencedores da fase.");
            return;
          }

          const roundStart:Record<number,number>={32:13,16:15,8:17,4:19,2:21};
          const created:Match[]=[];

          for(let i=0;i<winners.length;i+=2){
            const h=winners[i],a=winners[i+1];
            created.push({
              id:id++,championshipId:championship.id,round:roundStart[nextPhase],
              home:h,away:a,homeScore:null,awayScore:null,played:false,
              stage:"knockout",knockoutRound:nextPhase
            });
            created.push({
              id:id++,championshipId:championship.id,round:roundStart[nextPhase]+1,
              home:a,away:h,homeScore:null,awayScore:null,played:false,
              stage:"knockout",knockoutRound:nextPhase
            });
          }

          setMatches([...next,...created]);
          alert(`Série D: próxima fase criada — ${nextPhase} clubes.`);
          return;
        }
      }

      const pending=phases.find((p)=>existing.includes(p) && next.some((m)=>
        m.championshipId===championship.id && m.stage==="knockout" &&
        m.knockoutRound===p && !m.played
      ));
      if (pending) {
        alert(`Finalize os ${pending} jogos da fase Série D · ${pending} antes de avançar.`);
        return;
      }
      if (existing.includes(2)) {
        alert("A Final da Série D já foi criada. Finalize os dois jogos para concluir o campeonato.");
        return;
      }
    }

    alert("Não há uma nova fase pronta para ser criada.");
  };

  const generateResults = (scope: "round"|"remaining"|"phase") => {
    if (!championship) return;
    let target = myMatches.filter((m) => !m.played);
    if (scope==="round") target = target.filter((m)=>m.round===Math.min(...target.map((x)=>x.round)));
    if (scope==="phase" && championship.division==="Série D") {
      const pending=target.filter((m)=>m.stage==="knockout");
      if (pending.length) {
        const phase=Math.min(...pending.map((m)=>m.knockoutRound ?? 0));
        target=pending.filter((m)=>m.knockoutRound===phase);
      }
    }
    if (!target.length) { alert("Não há jogos sem resultado para gerar."); return; }
    setMatches((all)=>all.map((m)=>{
      if(!target.some((x)=>x.id===m.id)) return m;
      const hs=score(),as=score();
      return {...m,homeScore:hs,awayScore:as,played:true};
    }));
  };

  const saveScore = (id:number) => {
    const values=newResult[id];
    if(!values) return;
    const hs=Number(values[0]),as=Number(values[1]);
    if(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0) { alert("Informe placares válidos."); return; }
    setMatches((all)=>all.map((m)=>m.id===id?{...m,homeScore:hs,awayScore:as,played:true}:m));
    setNewResult((x)=>{const copy={...x};delete copy[id];return copy;});
  };

  const createNextSeason = () => {
    const seasons=championships.filter((c)=>c.country==="Brasil"&&["Série A","Série B","Série C","Série D"].includes(c.division)).map((c)=>Number(c.season));
    const currentSeason=Math.max(...seasons);
    const nextSeason=currentSeason+1;
    const get=(d:Division)=>championships.find((c)=>c.division===d&&Number(c.season)===currentSeason);
    const A=get("Série A"),B=get("Série B"),C=get("Série C"),D=get("Série D");
    if(!A||!B||!C||!D){alert("As Séries A, B, C e D precisam existir.");return;}
    if(championships.some((c)=>Number(c.season)===nextSeason&&c.division==="Série A")){alert("A temporada seguinte já existe.");return;}

    if(!regularComplete(A)||!regularComplete(B)||!regularComplete(C)){
      alert("Finalize as fases regulares das Séries A, B e C."); return;
    }

    const bPlayoffs=matches.filter((m)=>m.championshipId===B.id&&m.stage==="playoff");
    if(bPlayoffs.length!==4||!bPlayoffs.every((m)=>m.played)){alert("Finalize os 4 jogos dos play-offs da Série B.");return;}
    const bTable=tableFor(B,clubs.filter((c)=>c.championshipId===B.id).map((c)=>c.id),matches);
    const aTable=tableFor(A,clubs.filter((c)=>c.championshipId===A.id).map((c)=>c.id),matches);
    const cTable=tableFor(C,clubs.filter((c)=>c.championshipId===C.id).map((c)=>c.id),matches);

    const bGroups=new Map<string,Match[]>();
    bPlayoffs.forEach((m)=>{const k=[m.home,m.away].sort((x,y)=>x-y).join("-");const l=bGroups.get(k)||[];l.push(m);bGroups.set(k,l);});
    const bWinners:number[]=[];
    for(const legs of bGroups.values()){
      const teams=[...new Set(legs.flatMap((m)=>[m.home,m.away]))];
      const goals=teams.map((t)=>({t,g:legs.reduce((s,m)=>s+(m.home===t?(m.homeScore??0):(m.away===t?(m.awayScore??0):0)),0)})).sort((x,y)=>y.g-x.g);
      bWinners.push(goals[0].g===goals[1].g?(legs.find((m)=>m.penaltyWinner)?.penaltyWinner??goals[0].t):goals[0].t);
    }

    const cSecond=matches.filter((m)=>m.championshipId===C.id&&m.stage==="secondPhase");
    if(cSecond.length!==24||!cSecond.every((m)=>m.played)){alert("Finalize os 24 jogos da segunda fase da Série C.");return;}
    const cA=tableFor(C,cSecond.filter((m)=>m.group==="A").flatMap((m)=>[m.home,m.away]).filter((x,i,a)=>a.indexOf(x)===i),matches,"secondPhase","A");
    const cB=tableFor(C,cSecond.filter((m)=>m.group==="B").flatMap((m)=>[m.home,m.away]).filter((x,i,a)=>a.indexOf(x)===i),matches,"secondPhase","B");
    const promotedC=[cA[0].clubId,cA[1].clubId,cB[0].clubId,cB[1].clubId];

    // CRITICAL RULE: the 4 Série D semifinalists are the 4 winners of the QUARTER-FINALS (phase 16).
    const dQuarter=matches.filter((m)=>m.championshipId===D.id&&m.stage==="knockout"&&m.knockoutRound===8);
    if(dQuarter.length!==8||!dQuarter.every((m)=>m.played)){alert("Finalize as 8 jogos das quartas de final da Série D. Os 4 vencedores são os semifinalistas e garantem acesso à Série C.");return;}
    const promotedD=knockoutWinner(matches,8);
    if(promotedD.length!==4){alert("Não foi possível identificar os 4 semifinalistas da Série D.");return;}

    const aRelegated=aTable.slice(-4).map((r)=>r.clubId);
    const bRelegated=bTable.slice(-4).map((r)=>r.clubId);
    const cRelegated=cTable.slice(-4).map((r)=>r.clubId);
    const aPromoted=[bTable[0].clubId,bTable[1].clubId,...bWinners];

    const currentIds=(d:Division)=>clubs.filter((c)=>c.championshipId===get(d)!.id).map((c)=>c.id);
    const aid=currentIds("Série A"),bid=currentIds("Série B"),cid=currentIds("Série C"),did=currentIds("Série D");
    const nextA=aid.filter((x)=>!aRelegated.includes(x)).concat(aPromoted);
    const nextB=bid.filter((x)=>!bRelegated.includes(x)&&!aPromoted.includes(x)).concat(aRelegated,promotedC);
    const nextC=cid.filter((x)=>!promotedC.includes(x)&&!cRelegated.includes(x)).concat(bRelegated,promotedD);
    const nextD=did.filter((x)=>!promotedD.includes(x)).concat(cRelegated);

    if(nextA.length!==20||nextB.length!==20||nextC.length!==20||nextD.length!==96){
      alert("A movimentação não fechou: A="+nextA.length+" B="+nextB.length+" C="+nextC.length+" D="+nextD.length);return;
    }

    const base=nextId(championships);
    const newA={...A,id:base,season:String(nextSeason)};
    const newB={...B,id:base+1,season:String(nextSeason)};
    const newC={...C,id:base+2,season:String(nextSeason)};
    const newD={...D,id:base+3,season:String(nextSeason)};
    const newCs=[newA,newB,newC,newD];
    let clubNext=nextId(clubs);
    const newClubRows:Club[]=[];
    const addClubs=(ids:number[],champId:number)=>ids.map((old)=>{const source=clubs.find((c)=>c.id===old)!;return{id:clubNext++,name:source.name,championshipId:champId};});
    newClubRows.push(...addClubs(nextA,newA.id),...addClubs(nextB,newB.id),...addClubs(nextC,newC.id),...addClubs(nextD,newD.id));

    let matchNext=nextId(matches);
    const newMatches:Match[]=[];
    for(const [champ,ids,legs] of [[newA,nextA,2],[newB,nextB,2],[newC,nextC,1]] as [Championship,number[],number][]) {
      const generated=roundRobin(ids,champ.id,matchNext,legs);
      newMatches.push(...generated); matchNext=nextId(newMatches);
    }
    const dNewClubs=newClubRows.filter((c)=>c.championshipId===newD.id);
    newMatches.push(...buildDMatches(newD.id,dNewClubs,matchNext));

    setChampionships([...championships,...newCs]);
    setClubs([...clubs,...newClubRows]);
    setMatches([...matches,...newMatches]);
    setSelectedId(newA.id);setSection("Visão geral");
    alert(
      `Temporada ${nextSeason} criada automaticamente.

A → B: ${aRelegated.length} rebaixados / ${aPromoted.length} promovidos
B → C: ${bRelegated.length} rebaixados / ${promotedC.length} promovidos
C → D: ${cRelegated.length} rebaixados
D → C: ${promotedD.length} promovidos`
    );
  };

  const reset = () => {
    if(confirm("Isso apagará os dados atuais e reconstruirá A, B, C e D de 2026. Continuar?")) seed();
  };

  if (!championship) return <div style={{padding:40,fontFamily:"Arial"}}>Carregando...</div>;

  const displayedMatches = section.startsWith("Série D ·")
    ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===Number(section.replace("Série D · ","")))
    : section==="Segunda fase" ? myMatches.filter((m)=>m.stage==="secondPhase")
    : section==="Final" ? myMatches.filter((m)=>m.stage==="final")
    : section==="Semifinais" ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===4)
    : section==="Play-offs" ? myMatches.filter((m)=>m.stage==="playoff")
    : myMatches.filter((m)=>m.stage==="regular"&&m.round===Math.min(...myMatches.filter((m)=>m.stage==="regular"&&!m.played).map((m)=>m.round).concat([1])));

  const currentDPhase=section.startsWith("Série D ·")?Number(section.replace("Série D · ","")):null;
  const phaseLabel=currentDPhase?({64:"1ª fase do mata-mata",32:"2ª fase do mata-mata",16:"Oitavas de final",8:"Quartas de final",4:"Semifinais",2:"Final"} as Record<number,string>)[currentDPhase]:"";

  const tableZone = (division:Division, position:number) => {
    if (division==="Série A") return position >= 17 ? "relegation" : "";
    if (division==="Série B") {
      if (position <= 2) return "promotion";
      if (position <= 6) return "playoff";
      if (position >= 17) return "relegation";
      return "";
    }
    if (division==="Série C") {
      if (position <= 8) return "qualification";
      if (position >= 17) return "relegation";
      return "";
    }
    if (division==="Série D") return position <= 4 ? "qualification" : "";
    if (division==="Estadual") {
      if (position <= 4) return "qualification";
      return "";
    }

    return "";
  };

  const zoneStyle = (zone:string) => zone==="promotion"
    ? {background:"rgba(34,197,94,.10)",boxShadow:"inset 4px 0 0 #22c55e"}
    : zone==="playoff"
    ? {background:"rgba(245,158,11,.10)",boxShadow:"inset 4px 0 0 #f59e0b"}
    : zone==="relegation"
    ? {background:"rgba(239,68,68,.10)",boxShadow:"inset 4px 0 0 #ef4444"}
    : zone==="qualification"
    ? {background:"rgba(59,130,246,.10)",boxShadow:"inset 4px 0 0 #3b82f6"}
    : {};

  const zoneLegend = (division:Division) => {
    const items = division==="Série A"
      ? [["#ef4444","Rebaixamento"]]
      : division==="Série B"
      ? [["#22c55e","Acesso direto"],["#f59e0b","Play-offs de acesso"],["#ef4444","Rebaixamento"]]
      : division==="Série C"
      ? [["#3b82f6","Classificação para a 2ª fase"],["#ef4444","Rebaixamento"]]
      : division==="Estadual"
      ? [["#3b82f6","Semifinais"]]
      : [["#3b82f6","Classificação para o mata-mata"]];
    return <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:14,fontSize:12,color:"#9eacbc"}}>
      {items.map(([color,label])=><span key={label} style={{display:"inline-flex",alignItems:"center",gap:6}}>
        <span style={{width:10,height:10,borderRadius:2,background:color,display:"inline-block"}} />{label}
      </span>)}
    </div>;
  };

  const panel = (title:string,children:ReactNode)=><section style={{background:"#0c121c",border:"1px solid #1e2b3b",borderRadius:18,padding:24,marginBottom:18}}><h2 style={{marginTop:0}}>{title}</h2>{children}</section>;
  const button=(label:string,onClick:()=>void,primary=false)=><button onClick={onClick} style={{border:0,borderRadius:10,padding:"10px 14px",cursor:"pointer",fontWeight:700,background:primary?"#26d9ff":"#0d1622",color:primary?"#031018":"#aebbc9",marginRight:8,marginBottom:8}}>{label}</button>;

  return (
    <>
      <style>{`
      input, select { background:#070b12; color:#dfe7ef; border:1px solid #304155; border-radius:6px; padding:8px 10px; }
      input::placeholder { color:#65758a; }
      table th { color:#8ea0b5; }
      table td { border-top:1px solid #172331; color:#b9c5d3; }
      table td:nth-child(2) { color:#f4f7fb; }
`}</style>
      <div style={{minHeight:"100vh",background:"#070b12",fontFamily:"Arial, sans-serif",color:"#e8eef7"}}>
      <header style={{background:"#0a1019",color:"#fff",padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><strong style={{fontSize:22}}>Sports Manager</strong><div style={{opacity:.7,fontSize:12}}>Brasil · competições reais</div></div>
        <div>{button("↻ Reconstruir 2026",reset)}</div>
      </header>
      <div style={{display:"grid",gridTemplateColumns:"250px 1fr",minHeight:"calc(100vh - 70px)"}}>
        <aside style={{background:"#0a1019",color:"#fff",padding:18}}>
          <div style={{fontSize:12,opacity:.6,marginBottom:12}}>PAÍSES</div>
          <button onClick={()=>setSelectedId(championships.find((c)=>c.division==="Série A"&&c.season===String(Math.max(...championships.map((x)=>Number(x.season)))))?.id??1)} style={{width:"100%",textAlign:"left",background:"transparent",border:0,color:"#fff",padding:"10px",cursor:"pointer"}}>🇧🇷 Brasil</button>
          <div style={{fontSize:12,opacity:.6,margin:"20px 0 8px"}}>ESTADUAIS</div>
          {championships.filter(c=>c.division==="Estadual").sort((a,b)=>(a.state||"").localeCompare(b.state||"")||Number(b.season)-Number(a.season)).filter((c,i,arr)=>i===arr.findIndex(x=>x.state===c.state)).map(c=>(
            <button key={c.id} onClick={()=>{setSelectedId(c.id);setSection("Visão geral");setSelectedClub(null);}} style={{display:"block",width:"100%",textAlign:"left",border:0,borderRadius:8,padding:"9px 10px",marginBottom:4,background:championship?.id===c.id?"#111c2a":"transparent",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:16}}>
              🇧🇷 {c.state}
            </button>
          ))}
          <div style={{fontSize:12,opacity:.6,margin:"20px 0 8px"}}>CAMPEONATOS</div>
          {(["Série A","Série B","Série C","Série D"] as Division[]).map((d)=>(
            <button
              key={d}
              onClick={()=>{
                const latest = championships
                  .filter((c)=>c.division===d)
                  .sort((a,b)=>Number(b.season)-Number(a.season))[0];
                if (latest) {
                  setSelectedId(latest.id);
                  setSection("Visão geral");
                  setSelectedClub(null);
                }
              }}
              style={{
                display:"block",
                width:"100%",
                textAlign:"left",
                border:0,
                borderRadius:8,
                padding:"9px 10px",
                marginBottom:4,
                background:championship?.division===d ? "#111c2a" : "transparent",
                color:"#fff",
                cursor:"pointer",
                fontWeight:800,
                fontSize:16,
              }}
            >{d}</button>
          ))}
        </aside>

        <main style={{padding:28,maxWidth:1250,width:"100%",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <div><div style={{fontSize:13,color:"#65758a"}}>Brasil / {championship.state ? championship.state+" / " : ""}{championship.division} / {championship.season}</div><h1 style={{margin:"6px 0"}}>{championship.name}</h1></div>
            <div>
              {button("Visão geral",()=>setSection("Visão geral"))}
              {button("Classificação",()=>setSection("Classificação"))}
              {button("Jogos",()=>setSection("Jogos"))}
              {button("Clubes",()=>setSection("Clubes"))}
              {championship.division==="Série B"&&button("Play-offs",()=>setSection("Play-offs"))}
              {championship.division==="Série C"&&button("Segunda fase",()=>setSection("Segunda fase"))}
              {championship.division==="Série C"&&myMatches.some((m)=>m.stage==="final")&&button("Final",()=>setSection("Final"))}
              {championship.division==="Estadual"&&myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===4)&&button("Semifinais",()=>setSection("Semifinais"))}
              {championship.division==="Estadual"&&myMatches.some((m)=>m.stage==="final")&&button("Final",()=>setSection("Final"))}
              {championship.division==="Série D"&&button("Classificados próxima temporada",()=>setSection("Classificados"))}
              {championship.division==="Série D"&&[64,32,16,8,4,2].map((p)=>myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===p)&&button(String(p===2?"Final":p===64?"Série D · 64":"Série D · "+p),()=>setSection("Série D · "+p)))}
              {competitionComplete(championship, matches) && button("🏆 Campeão",()=>setSection("Campeão"),true)}
            </div>
          </div>

          {section==="Campeão" && (() => {
            const winnerId = championClubId(championship, matches);
            const winner = winnerId ? clubName(winnerId) : null;
            if (!winner) return null;
            return panel("🏆 Campeão",<>
              <div style={{textAlign:"center",padding:"34px 20px 40px"}}>
                <div style={{fontSize:64,lineHeight:1,marginBottom:18}}>🏆</div>
                <div style={{fontSize:13,color:"#65758a",textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Campeão</div>
                <h2 style={{fontSize:38,margin:"10px 0 8px",color:"#fff"}}>{winner}</h2>
                <div style={{fontSize:17,color:"#9eacbc"}}>{championship.name} · {championship.season}</div>
                <div style={{marginTop:24,display:"inline-block",padding:"9px 16px",borderRadius:999,background:"rgba(38,217,255,.10)",border:"1px solid rgba(38,217,255,.25)",color:"#26d9ff",fontWeight:800}}>Temporada encerrada</div>
              </div>
            </>);
          })()}

          {section==="Visão geral" && championship.division==="Estadual" && panel("Estrutura do campeonato",<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:14}}>
              <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>8</strong><div style={{fontSize:12,color:"#8291a5"}}>clubes</div></div>
              <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>7</strong><div style={{fontSize:12,color:"#8291a5"}}>rodadas na 1ª fase</div></div>
              <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>4</strong><div style={{fontSize:12,color:"#8291a5"}}>semifinalistas</div></div>
              <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>2</strong><div style={{fontSize:12,color:"#8291a5"}}>vagas para a Série D</div></div>
            </div>
            <p style={{color:"#8291a5"}}>As vagas para a Série D serão identificadas automaticamente conforme a classificação final, respeitando a elegibilidade nacional dos clubes.</p>
          </>)}
          {section==="Visão geral" && panel("Regulamento",<>
            <p>{championship.regulation}</p>
            <p><strong>Acesso:</strong> {championship.promotion}</p>
            <p><strong>Rebaixamento:</strong> {championship.relegation}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {button("⚡ Gerar próxima rodada",()=>generateResults("round"),true)}
              {button("⚡ Gerar todos os jogos restantes",()=>generateResults("remaining"))}
              {button("⚙ Preparar próxima fase",prepareNextPhase)}
              {button("📅 Criar próxima temporada",createNextSeason)}
            </div>
          </>)}

          {section==="Classificados" && championship.division==="Série D" && (() => {
            const currentSeason = Number(championship.season);
            const nextSeason = currentSeason + 1;

            // Rebaixados da Série C: definidos assim que a 1ª fase da C termina.
            const cChamp = championships.find((c)=>c.division==="Série C"&&Number(c.season)===currentSeason);
            const cClubIds = cChamp ? clubs.filter((c)=>c.championshipId===cChamp.id).map((c)=>c.id) : [];
            const cTable = cChamp ? tableFor(cChamp,cClubIds,matches) : [];
            const cComplete = cChamp ? regularComplete(cChamp) : false;
            const relegatedC = cComplete ? cTable.slice(-4).map((r)=>r.clubId) : [];

            // As 28 vagas da Série D anterior são os 32 clubes que avançaram
            // à 2ª fase do mata-mata (vencedores da fase de 64), menos os
            // 4 que conquistaram o acesso nas quartas (fase de 8).
            const dFirstPhase = myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===64);
            const dFirstComplete = dFirstPhase.length===64 && dFirstPhase.every((m)=>m.played);
            const dSecondPhaseIds = dFirstComplete ? knockoutWinner(myMatches,64) : [];
            const dQuarter = myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===8);
            const dAccessComplete = dQuarter.length===8 && dQuarter.every((m)=>m.played);
            const promotedD = dAccessComplete ? knockoutWinner(myMatches,8) : [];
            const dPrior28 = dAccessComplete
              ? dSecondPhaseIds.filter((id)=>!promotedD.includes(id))
              : [];

            const stateSlotCount = D_STATE_SLOTS.reduce((sum,x)=>sum+x.slots,0);
            const totalSlots = 4 + stateSlotCount + 28;
            let slotIndex = 1;

            const slotRow = (clubId:number|null,detail:string,accent=false) => (
              <div style={{display:"grid",gridTemplateColumns:"55px 1fr 240px",gap:12,alignItems:"center",padding:"12px 14px",borderTop:"1px solid #172331"}}>
                <span style={{color:"#65758a",fontWeight:800}}>#{slotIndex++}</span>
                <strong style={{color:clubId?"#f4f7fb":"#65758a"}}>{clubId ? clubName(clubId) : "Aguardando classificação"}</strong>
                <span style={{fontSize:12,color:accent?"#26d9ff":"#8291a5",textAlign:"right"}}>{detail}</span>
              </div>
            );

            return panel("Classificados para a Série D · "+nextSeason,<>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>
                <div style={{padding:"14px 18px",borderRadius:12,background:"#0b131f",border:"1px solid #1e2b3b"}}>
                  <strong style={{fontSize:22}}>{totalSlots}</strong>
                  <div style={{fontSize:12,color:"#8291a5"}}>vagas totais</div>
                </div>
                <div style={{padding:"14px 18px",borderRadius:12,background:"#0b131f",border:"1px solid #1e2b3b"}}>
                  <strong style={{fontSize:22}}>{relegatedC.length}/4</strong>
                  <div style={{fontSize:12,color:"#8291a5"}}>rebaixados da Série C definidos</div>
                </div>
                <div style={{padding:"14px 18px",borderRadius:12,background:"#0b131f",border:"1px solid #1e2b3b"}}>
                  <strong style={{fontSize:22}}>{dPrior28.length}/28</strong>
                  <div style={{fontSize:12,color:"#8291a5"}}>vagas da Série D anterior definidas</div>
                </div>
              </div>

              <h3>1. Rebaixados da Série C · 4 vagas</h3>
              <div style={{border:"1px solid #1e2b3b",borderRadius:12,overflow:"hidden",background:"#0b131f"}}>
                {[0,1,2,3].map((_,i)=>slotRow(
                  relegatedC[i]??null,
                  relegatedC[i] ? "Rebaixado da Série C" : "Aguardando término da 1ª fase da Série C",
                  !!relegatedC[i]
                ))}
              </div>

              <h3 style={{marginTop:24}}>2. Vagas dos estaduais · {stateSlotCount} vagas</h3>
              <p style={{color:"#8291a5",marginTop:0}}>
                Os estaduais serão preenchidos automaticamente conforme suas classificações forem concluídas. Clubes que já possuem vaga na Série A, B ou C não ocupam estas vagas.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
                {D_STATE_SLOTS.map((x)=>(
                  <div key={x.state} style={{border:"1px solid #1e2b3b",borderRadius:12,overflow:"hidden",background:"#0b131f"}}>
                    <div style={{padding:"12px 14px",fontWeight:800,borderBottom:"1px solid #1e2b3b"}}>{x.state} · {x.slots} vagas</div>
                    {Array.from({length:x.slots},(_,i)=>(
                      <div key={i} style={{padding:"10px 14px",borderTop:"1px solid #172331",display:"flex",justifyContent:"space-between",gap:10}}>
                        <span style={{color:"#65758a"}}>Vaga {i+1}</span>
                        <strong style={{color:"#65758a"}}>Aguardando estadual</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <h3 style={{marginTop:24}}>3. Série D anterior · 28 vagas</h3>
              <p style={{color:"#8291a5",marginTop:0}}>
                Estas vagas são atualizadas diretamente pela Série D anterior: os 32 clubes que avançaram da primeira fase do mata-mata para a segunda fase, menos os 4 que conquistaram o acesso nas quartas de final.
              </p>

              {!dFirstComplete && (
                <div style={{padding:"12px 14px",marginBottom:12,borderRadius:10,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)",color:"#f59e0b"}}>
                  Aguardando a conclusão dos 64 jogos da primeira fase do mata-mata da Série D para identificar os 32 clubes da segunda fase.
                </div>
              )}

              {dFirstComplete && !dAccessComplete && (
                <div style={{padding:"12px 14px",marginBottom:12,borderRadius:10,background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.25)",color:"#60a5fa"}}>
                  {dSecondPhaseIds.length} clubes já chegaram à segunda fase. As 28 vagas definitivas serão confirmadas após as quartas de final, quando os 4 acessos à Série C forem conhecidos.
                </div>
              )}

              <div style={{border:"1px solid #1e2b3b",borderRadius:12,overflow:"hidden",background:"#0b131f"}}>
                {dAccessComplete
                  ? dPrior28.map((clubId)=>slotRow(clubId,"Classificado pela Série D anterior",true))
                  : Array.from({length:28},(_,i)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"55px 1fr 240px",gap:12,alignItems:"center",padding:"12px 14px",borderTop:"1px solid #172331"}}>
                        <span style={{color:"#65758a",fontWeight:800}}>#{slotIndex++}</span>
                        <strong style={{color:"#65758a"}}>Aguardando classificação</strong>
                        <span style={{fontSize:12,color:"#8291a5",textAlign:"right"}}>Série D anterior</span>
                      </div>
                    ))
                }
              </div>
            </>);
          })()}

          {section==="Classificação" && panel("Classificação",<>
            {zoneLegend(championship.division)}
            {championship.division==="Série D" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>Série D — 16 grupos de 6 equipes. Os 4 melhores de cada grupo avançam ao mata-mata.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:18}}>
                  {D_GROUPS.map((group) => {
                    const groupClubs = myClubs.filter((c) =>
                      myMatches.some((m) => m.stage==="regular" && m.group===group && (m.home===c.id || m.away===c.id))
                    );
                    const rows = tableFor(championship, groupClubs.map((c)=>c.id), myMatches, "regular", group);
                    return <div key={group} style={{border:"1px solid #1e2b3b",borderRadius:14,overflow:"hidden",background:"#0b131f"}}>
                      <div style={{padding:"12px 14px",fontWeight:800,borderBottom:"1px solid #1e2b3b"}}>Grupo {group}</div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map((x)=><th key={x} style={{textAlign:"left",padding:8,borderBottom:"2px solid #1e2b3b",fontSize:11}}>{x}</th>)}</tr></thead>
                          <tbody>
                            {rows.map((r,i)=><tr key={r.clubId} style={zoneStyle(tableZone(championship.division,i+1))}>
                              <td style={{padding:8,fontWeight:700}}>{i+1}</td>
                              <td style={{padding:8}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",textAlign:"left",display:"flex",alignItems:"center",gap:9}}><span>{clubName(r.clubId)}</span></button></td>
                              <td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td>
                            </tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>;
                  })}
                </div>
              </div>
            ) : (
              <>
                <div style={{marginBottom:18}}>
                  <h3 style={{margin:"0 0 10px"}}>{championship.division==="Série C" ? "1ª fase" : "Classificação geral"}</h3>
                  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map((x)=><th key={x} style={{textAlign:"left",padding:10,borderBottom:"2px solid #1e2b3b"}}>{x}</th>)}</tr></thead><tbody>
                    {currentTable.map((r,i)=><tr key={r.clubId} style={zoneStyle(tableZone(championship.division,i+1))}><td style={{padding:10,fontWeight:700}}>{i+1}</td><td style={{padding:10}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",display:"flex",alignItems:"center",gap:9}}><span>{clubName(r.clubId)}</span></button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                  </tbody></table></div>
                </div>

                {championship.division==="Série C" && myMatches.some((m)=>m.stage==="secondPhase") && (() => {
                  const second = myMatches.filter((m)=>m.stage==="secondPhase");
                  const idsA = [...new Set(second.filter((m)=>m.group==="A").flatMap((m)=>[m.home,m.away]))];
                  const idsB = [...new Set(second.filter((m)=>m.group==="B").flatMap((m)=>[m.home,m.away]))];
                  const groupA = tableFor(championship, idsA, myMatches, "secondPhase", "A");
                  const groupB = tableFor(championship, idsB, myMatches, "secondPhase", "B");
                  const groupTable = (title:string, rows:TableRow[]) => <div style={{marginTop:18}}>
                    <h3 style={{margin:"0 0 10px"}}>{title}</h3>
                    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map((x)=><th key={x} style={{textAlign:"left",padding:10,borderBottom:"2px solid #1e2b3b"}}>{x}</th>)}</tr></thead><tbody>
                      {rows.map((r,i)=><tr key={r.clubId} style={zoneStyle(i < 2 ? "promotion" : "")}><td style={{padding:10,fontWeight:700}}>{i+1}</td><td style={{padding:10}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",display:"flex",alignItems:"center",gap:9}}><span>{clubName(r.clubId)}</span></button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                    </tbody></table></div>
                  </div>;
                  return <div><h2 style={{marginTop:22}}>Segunda fase — grupos</h2>{groupTable("Grupo A",groupA)}{groupTable("Grupo B",groupB)}</div>;
                })()}
              </>
            )}
          </>)}

          {section==="Clubes" && <div style={{fontSize:11,color:"#65758a",marginBottom:8}}></div>}

          {section==="Clubes" && panel("Clubes",<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>{myClubs.map(c=><button key={c.id} onClick={()=>setSelectedClub(c.name)} style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f",textAlign:"left",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:10}}><span>{c.name}</span></button>)}</div>)}

          {section==="Jogos" && panel("Jogos",<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar rodada",()=>generateResults("round"),true)} {button("⚡ Gerar restantes",()=>generateResults("remaining"))} {button("⚙ Preparar fase",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.slice(0,100).map(m=><div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 1fr 110px",alignItems:"center",gap:10,padding:12,border:"1px solid #1e2b3b",borderRadius:10,background:"#0b131f"}}><span style={{textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}><span>{clubName(m.home)}</span></span><input value={newResult[m.id]?.[0]??(m.homeScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[e.target.value,x[m.id]?.[1]??(m.awayScore??"").toString()]}))} style={{width:50}}/><span style={{display:"flex",alignItems:"center",gap:8}}><span>{clubName(m.away)}</span></span><div><input value={newResult[m.id]?.[1]??(m.awayScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[x[m.id]?.[0]??(m.homeScore??"").toString(),e.target.value]}))} style={{width:50}}/> {button(m.played?"Salvar":"Salvar",()=>saveScore(m.id))}</div></div>)}</div>
          </>)}

          {(section==="Play-offs"||section==="Segunda fase"||section==="Final"||currentDPhase!==null) && panel(currentDPhase?phaseLabel:section,<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar resultados desta fase",()=>generateResults("phase"),true)} {button("→ Avançar automaticamente",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.map(m=><div key={m.id} style={{padding:12,border:"1px solid #1e2b3b",borderRadius:10,background:"#0b131f",display:"flex",justifyContent:"space-between",gap:10}}><span style={{display:"flex",alignItems:"center",gap:8}}><span>{clubName(m.home)}</span></span><strong>{m.played?m.homeScore+" × "+m.awayScore:"— × —"}</strong><span style={{display:"flex",alignItems:"center",gap:8}}><span>{clubName(m.away)}</span></span></div>)}</div>
          </>)}

          {selectedClub && panel("Histórico do clube",<>
            <button onClick={()=>setSelectedClub(null)} style={{float:"right"}}>Fechar</button>
            <h3>{selectedClub}</h3>
            <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left"}}>Temporada</th><th>Divisão</th><th>J</th><th>Pts</th><th>SG</th></tr></thead><tbody>
              {championships.filter((c)=>clubs.some((x)=>x.championshipId===c.id&&x.name===selectedClub)).sort((a,b)=>Number(b.season)-Number(a.season)).map(c=>{
                const cl=clubs.find(x=>x.championshipId===c.id&&x.name===selectedClub)!;
                const row=tableFor(c,[cl.id],matches)[0];
                return <tr key={c.id}><td>{c.season}</td><td>{c.division}</td><td>{row?.played??0}</td><td>{row?.points??0}</td><td>{row?.gd??0}</td></tr>;
              })}
            </tbody></table>
          </>)}
        </main>
      </div>
    </div>
    </>
  );
}

export default App;
