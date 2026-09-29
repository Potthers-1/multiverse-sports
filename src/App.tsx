import { useEffect, useMemo, useState } from "react";

type Division = "Série A" | "Série B" | "Série C" | "Série D";
type Stage = "regular" | "playoff" | "secondPhase" | "knockout" | "final";

type Championship = {
  id: number;
  name: string;
  country: string;
  season: string;
  sport: string;
  category: string;
  division: Division;
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

const D_GROUPS = "ABCDEFGHIJKLMNOP".split("");

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
  legs: number
): Championship {
  return {
    id, name, country: "Brasil", season, sport: "Futebol", category: "Profissional",
    division, format, regulation, promotion, relegation, teamCount, rounds, legs,
    pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
  };
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
      for (const name of names) allClubs.push({ id: clubId++, name, championshipId: champ.id });
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

  const prepareNextPhase = () => {
    if (!championship) return;
    let next = [...matches];
    let id = nextId(next);

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
      const current=Math.min(...existing.filter((p)=>next.some((m)=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===p&&!m.played)));
      if (!Number.isFinite(current)) {
        const completed=Math.max(...existing);
        if (completed<=2) return;
        const winners=knockoutWinner(next,completed);
        const nextPhase=completed/2;
        if (winners.length!==nextPhase) { alert("Não foi possível identificar todos os vencedores da fase."); return; }
        const roundStart:Record<number,number>={32:13,16:15,8:17,4:19,2:21};
        const created:Match[]=[];
        for(let i=0;i<winners.length;i+=2){
          const h=winners[i],a=winners[i+1];
          created.push({id:id++,championshipId:championship.id,round:roundStart[nextPhase],home:h,away:a,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:nextPhase});
          created.push({id:id++,championshipId:championship.id,round:roundStart[nextPhase]+1,home:a,away:h,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:nextPhase});
        }
        setMatches([...next,...created]);
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
    const dQuarter=matches.filter((m)=>m.championshipId===D.id&&m.stage==="knockout"&&m.knockoutRound===16);
    if(dQuarter.length!==8||!dQuarter.every((m)=>m.played)){alert("Finalize as 8 jogos das quartas de final da Série D. Os 4 vencedores são os semifinalistas e garantem acesso à Série C.");return;}
    const promotedD=knockoutWinner(matches,16);
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
      "Temporada "+nextSeason+" criada automaticamente.\n\n"+
      "A → B: "+aRelegated.length+" rebaixados / "+aPromoted.length+" promovidos\n"+
      "B → C: "+bRelegated.length+" rebaixados / "+promotedC.length+" promovidos\n"+
      "C → D: "+cRelegated.length+" rebaixados\n"+
      "D → C: "+promotedD.length+" promovidos"
    );
  };

  const reset = () => {
    if(confirm("Isso apagará os dados atuais e reconstruirá A, B, C e D de 2026. Continuar?")) seed();
  };

  if (!championship) return <div style={{padding:40,fontFamily:"Arial"}}>Carregando...</div>;

  const displayedMatches = section.startsWith("Série D ·")
    ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===Number(section.replace("Série D · ","")))
    : section==="Segunda fase" ? myMatches.filter((m)=>m.stage==="secondPhase")
    : section==="Play-offs" ? myMatches.filter((m)=>m.stage==="playoff")
    : myMatches.filter((m)=>m.stage==="regular"&&m.round===Math.min(...myMatches.filter((m)=>m.stage==="regular"&&!m.played).map((m)=>m.round).concat([1])));

  const currentDPhase=section.startsWith("Série D ·")?Number(section.replace("Série D · ","")):null;
  const phaseLabel=currentDPhase?({64:"1ª fase do mata-mata",32:"2ª fase do mata-mata",16:"Quartas de final",8:"Semifinais",4:"??",2:"Final"} as Record<number,string>)[currentDPhase]:"";

  const panel = (title:string,children:React.ReactNode)=><section style={{background:"#fff",border:"1px solid #e6e6e6",borderRadius:18,padding:24,marginBottom:18}}><h2 style={{marginTop:0}}>{title}</h2>{children}</section>;
  const button=(label:string,onClick:()=>void,primary=false)=><button onClick={onClick} style={{border:0,borderRadius:10,padding:"10px 14px",cursor:"pointer",fontWeight:700,background:primary?"#5b2a68":"#eee",color:primary?"#fff":"#222",marginRight:8,marginBottom:8}}>{label}</button>;

  return (
    <div style={{minHeight:"100vh",background:"#f6f3f7",fontFamily:"Arial, sans-serif",color:"#252126"}}>
      <header style={{background:"#211f23",color:"#fff",padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><strong style={{fontSize:22}}>Sports Manager</strong><div style={{opacity:.7,fontSize:12}}>Brasil · competições reais</div></div>
        <div>{button("↻ Reconstruir 2026",reset)}</div>
      </header>
      <div style={{display:"grid",gridTemplateColumns:"250px 1fr",minHeight:"calc(100vh - 70px)"}}>
        <aside style={{background:"#2b2730",color:"#fff",padding:18}}>
          <div style={{fontSize:12,opacity:.6,marginBottom:12}}>PAÍSES</div>
          <button onClick={()=>setSelectedId(championships.find((c)=>c.division==="Série A"&&c.season===String(Math.max(...championships.map((x)=>Number(x.season)))))?.id??1)} style={{width:"100%",textAlign:"left",background:"transparent",border:0,color:"#fff",padding:"10px",cursor:"pointer"}}>🇧🇷 Brasil</button>
          <div style={{fontSize:12,opacity:.6,margin:"20px 0 8px"}}>CAMPEONATOS</div>
          {(["Série A","Série B","Série C","Série D"] as Division[]).map((d)=>(
            <div key={d} style={{marginBottom:8}}>
              <div style={{fontWeight:800,padding:"7px 10px"}}>{d}</div>
              {championships.filter((c)=>c.division===d).sort((a,b)=>Number(b.season)-Number(a.season)).map((c)=>(
                <button key={c.id} onClick={()=>{setSelectedId(c.id);setSection("Visão geral");setSelectedClub(null);}} style={{display:"block",width:"100%",textAlign:"left",border:0,borderRadius:8,padding:"7px 14px",background:selectedId===c.id?"#5b2a68":"transparent",color:"#fff",cursor:"pointer"}}>{c.season}</button>
              ))}
            </div>
          ))}
        </aside>

        <main style={{padding:28,maxWidth:1250,width:"100%",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <div><div style={{fontSize:13,color:"#777"}}>Brasil / {championship.division} / {championship.season}</div><h1 style={{margin:"6px 0"}}>{championship.name}</h1></div>
            <div>
              {button("Visão geral",()=>setSection("Visão geral"))}
              {button("Classificação",()=>setSection("Classificação"))}
              {button("Jogos",()=>setSection("Jogos"))}
              {button("Clubes",()=>setSection("Clubes"))}
              {championship.division==="Série B"&&button("Play-offs",()=>setSection("Play-offs"))}
              {championship.division==="Série C"&&button("Segunda fase",()=>setSection("Segunda fase"))}
              {championship.division==="Série D"&&[64,32,16,8,2].map((p)=>myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===p)&&button(String(p===2?"Final":p===64?"Série D · 64":"Série D · "+p),()=>setSection("Série D · "+p)))}
            </div>
          </div>

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

          {section==="Classificação" && panel("Classificação",<>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map((x)=><th key={x} style={{textAlign:"left",padding:10,borderBottom:"2px solid #eee"}}>{x}</th>)}</tr></thead><tbody>
              {currentTable.map((r,i)=><tr key={r.clubId}><td style={{padding:10}}>{i+1}</td><td style={{padding:10}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:700}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
            </tbody></table></div>
          </>)}

          {section==="Clubes" && panel("Clubes",<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>{myClubs.map(c=><button key={c.id} onClick={()=>setSelectedClub(c.name)} style={{padding:14,border:"1px solid #ddd",borderRadius:12,background:"#fafafa",textAlign:"left",cursor:"pointer",fontWeight:700}}>{c.name}</button>)}</div>)}

          {section==="Jogos" && panel("Jogos",<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar rodada",()=>generateResults("round"),true)} {button("⚡ Gerar restantes",()=>generateResults("remaining"))} {button("⚙ Preparar fase",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.slice(0,100).map(m=><div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 1fr 110px",alignItems:"center",gap:10,padding:12,border:"1px solid #eee",borderRadius:10,background:"#fff"}}><span style={{textAlign:"right"}}>{clubName(m.home)}</span><input value={newResult[m.id]?.[0]??(m.homeScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[e.target.value,x[m.id]?.[1]??(m.awayScore??"").toString()]}))} style={{width:50}}/><span>{clubName(m.away)}</span><div><input value={newResult[m.id]?.[1]??(m.awayScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[x[m.id]?.[0]??(m.homeScore??"").toString(),e.target.value]}))} style={{width:50}}/> {button(m.played?"Salvar":"Salvar",()=>saveScore(m.id))}</div></div>)}</div>
          </>)}

          {(section==="Play-offs"||section==="Segunda fase"||currentDPhase!==null) && panel(currentDPhase?phaseLabel:section,<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar resultados desta fase",()=>generateResults("phase"),true)} {button("→ Avançar automaticamente",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.map(m=><div key={m.id} style={{padding:12,border:"1px solid #eee",borderRadius:10,background:"#fff",display:"flex",justifyContent:"space-between",gap:10}}><span>{clubName(m.home)}</span><strong>{m.played?m.homeScore+" × "+m.awayScore:"— × —"}</strong><span>{clubName(m.away)}</span></div>)}</div>
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
  );
}

export default App;
