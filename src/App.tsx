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
};

const seedChampionships: Championship[] = [];
const seedClubs: Club[] = [];
const seedMatches: Match[] = [];

const COUNTRIES = [
  { name: "Espanha", flag: "🇪🇸" },
  { name: "França", flag: "🇫🇷" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Japão", flag: "🇯🇵" },
  { name: "Irã", flag: "🇮🇷" },
  { name: "Marrocos", flag: "🇲🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "México", flag: "🇲🇽" },
  { name: "EUA", flag: "🇺🇸" },
  { name: "Nova Zelândia", flag: "🇳🇿" },
  { name: "Ilhas Salomão", flag: "🇸🇧" },
];

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

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function generateRoundRobin(teamIds: number[], legs: number, championshipId: number, startId: number): Match[] {
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

function App() {
  const [championships, setChampionships] = useState(() => load("sports-championships", seedChampionships));
  const [clubs, setClubs] = useState(() => load("sports-clubs", seedClubs));
  const [matches, setMatches] = useState(() => load("sports-matches", seedMatches));
  const [selectedId, setSelectedId] = useState(0);
  const [section, setSection] = useState("Visão geral");
  const [round, setRound] = useState(1);
  const [modal, setModal] = useState<"club" | "championship" | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("Brasil");

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
      myMatches.filter((match) => match.played && (match.home === club.id || match.away === club.id)).forEach((match) => {
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

  function saveScore(id: number, home: string, away: string) {
    if (home === "" || away === "") return;
    const h = Number(home), a = Number(away);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) return;
    setMatches(matches.map((match) => match.id === id ? { ...match, homeScore: h, awayScore: a, played: true } : match));
  }

  function createNextBrazilSeason() {
    const currentA = championships.find((item) => item.country === "Brasil" && item.division === "Série A" && item.season === "2026");
    const currentB = championships.find((item) => item.country === "Brasil" && item.division === "Série B" && item.season === "2026");
    const currentC = championships.find((item) => item.country === "Brasil" && item.division === "Série C" && item.season === "2026");
    if (!currentA || !currentB || !currentC) {
      window.alert("As Séries A, B e C de 2026 precisam existir para gerar a próxima temporada.");
      return;
    }
    if (championships.some((item) => item.country === "Brasil" && item.season === "2027" && ["Série A", "Série B", "Série C"].includes(item.division))) {
      window.alert("A temporada 2027 das Séries A, B ou C já foi criada.");
      return;
    }

    const tableFor = (champ: Championship) => {
      const teamIds = clubs.filter((club) => club.championshipId === champ.id).map((club) => club.id);
      return teamIds.map((clubId) => {
        let points = 0, gd = 0, gf = 0, played = 0;
        matches.filter((match) => match.championshipId === champ.id && match.played && (match.home === clubId || match.away === clubId)).forEach((match) => {
          const home = match.home === clubId;
          const scored = home ? match.homeScore! : match.awayScore!;
          const conceded = home ? match.awayScore! : match.homeScore!;
          played++; gf += scored; gd += scored - conceded;
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
      window.alert("As três divisões precisam ter os 20 clubes cadastrados antes de gerar 2027.");
      return;
    }

    const bRelegated = bTable.slice(-4).map((row) => row.clubId);
    const directToA = bTable.slice(0, 2).map((row) => row.clubId);
    const playoffCandidates = bTable.slice(2, 6).map((row) => row.clubId);
    const playoffText = playoffCandidates.map((id, index) => (index + 3) + ". " + clubName(id)).join("\n");
    const playoffInput = window.prompt(
      "Série B: informe os 2 clubes que venceram os playoffs de acesso à Série A.\n\nCandidatos:\n" + playoffText + "\n\nDigite os nomes separados por vírgula:"
    );
    if (!playoffInput) return;

    const playoffWinners = playoffInput.split(",").map((name) => name.trim()).filter(Boolean).map((name) => {
      const found = playoffCandidates.find((id) => clubName(id).toLowerCase() === name.toLowerCase());
      return found;
    }).filter((id): id is number => id !== undefined);

    if (playoffWinners.length !== 2 || new Set(playoffWinners).size !== 2) {
      window.alert("Informe exatamente 2 vencedores diferentes entre os 4 clubes dos playoffs.");
      return;
    }

    const cInput = window.prompt(
      "Série C: informe os 4 clubes que conquistaram o acesso à Série B na segunda fase.\n\nDigite os nomes separados por vírgula:"
    );
    if (!cInput) return;
    const cPromoted = cInput.split(",").map((name) => name.trim()).filter(Boolean).map((name) => {
      const found = cTable.find((row) => clubName(row.clubId).toLowerCase() === name.toLowerCase());
      return found?.clubId;
    }).filter((id): id is number => id !== undefined);

    if (cPromoted.length !== 4 || new Set(cPromoted).size !== 4) {
      window.alert("Informe exatamente 4 clubes diferentes da Série C.");
      return;
    }

    const aInput = window.prompt(
      "A regra de rebaixamento da Série A ainda não foi informada. Informe os 4 clubes rebaixados da Série A para a Série B.\n\nDigite os nomes separados por vírgula:"
    );
    if (!aInput) return;
    const relegatedFromA = aInput.split(",").map((name) => name.trim()).filter(Boolean).map((name) => {
      const found = aTable.find((row) => clubName(row.clubId).toLowerCase() === name.toLowerCase());
      return found?.clubId;
    }).filter((id): id is number => id !== undefined);

    if (relegatedFromA.length !== 4 || new Set(relegatedFromA).size !== 4) {
      window.alert("Informe exatamente 4 clubes diferentes da Série A.");
      return;
    }

    const cRelegationInput = window.prompt(
      "A regra de rebaixamento da Série C ainda não foi informada. Informe os 4 clubes rebaixados da Série C para a divisão abaixo.\n\nDigite os nomes separados por vírgula:"
    );
    if (!cRelegationInput) return;
    const relegatedFromC = cRelegationInput.split(",").map((name) => name.trim()).filter(Boolean).map((name) => {
      const found = cTable.find((row) => clubName(row.clubId).toLowerCase() === name.toLowerCase());
      return found?.clubId;
    }).filter((id): id is number => id !== undefined);

    if (relegatedFromC.length !== 4 || new Set(relegatedFromC).size !== 4) {
      window.alert("Informe exatamente 4 clubes diferentes da Série C.");
      return;
    }

    const promotedToA = [...directToA, ...playoffWinners];
    const promotedToB = cPromoted;
    const relegatedFromB = bRelegated;

    const nextBase = Math.max(0, ...championships.map((item) => item.id));
    const nextChampionships: Championship[] = [
      { ...currentA, id: nextBase + 1, season: "2027" },
      { ...currentB, id: nextBase + 2, season: "2027" },
      { ...currentC, id: nextBase + 3, season: "2027" }
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
    const relegatedBToC = new Set(relegatedFromB);
    const promotedCToB = new Set(promotedToB);
    const relegatedCToLower = new Set(relegatedFromC);

    const nextAClubIds = currentAClubIds.filter((id) => !relegatedAToB.has(id)).concat([...promotedBToA]);
    const nextBClubIds = currentBClubIds.filter((id) => !relegatedBToC.has(id) && !promotedBToA.has(id)).concat([...relegatedAToB]).concat([...promotedCToB]);
    const nextCClubIds = currentCClubIds.filter((id) => !promotedCToB.has(id) && !relegatedCToLower.has(id)).concat([...relegatedBToC]);

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
      "Temporada 2027 criada. A temporada 2026 foi preservada.\n\n" +
      "Série A: " + nextAClubIds.length + " clubes\n" +
      "Série B: " + nextBClubIds.length + " clubes\n" +
      "Série C: " + nextCClubIds.length + " clubes"
    );
  }

  if (!championship) {
    return (
      <div className="app">
        <aside className="side">
          <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
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
        <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
        <div className="label lower">PAÍSES</div>
        <div className="countryList">{COUNTRIES.map((country) => <button key={country.name} className={selectedCountry === country.name ? "countryItem active" : "countryItem"} onClick={() => { setSelectedCountry(country.name); setSelectedId(0); setSection("País"); }}><span>{country.flag}</span>{country.name}</button>)}</div>
        <div className="countrySubsection">
          <div className="countrySubhead">{COUNTRIES.find((country) => country.name === selectedCountry)?.flag} {selectedCountry}</div>
          {championships.filter((item) => item.country === selectedCountry).map((item) => <button key={item.id} className={selectedId === item.id ? "champMini active" : "champMini"} onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>{item.name}<small>{item.season}</small></button>)}
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
        {section === "Visão geral" && <Dashboard standings={standings} matches={myMatches} division={championship?.division ?? ""} clubName={clubName} onPartidas={() => setSection("Partidas")} onClub={() => setModal("club")} onChamp={() => setModal("championship")} onRound={addRound} onNextSeason={createNextBrazilSeason} />}
        {section === "Campeonatos" && <Manager title="Meus campeonatos" button="Novo campeonato" onClick={() => setModal("championship")}><div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.country} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><div className="cardActions"><button onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>Abrir →</button><button className="dangerText" onClick={() => deleteChampionship(item.id)}>Excluir</button></div></div>)}</div></Manager>}
        {section === "Clubes" && <Manager title={"Clubes · " + championship?.name} button="Novo clube" onClick={() => setModal("club")}><div className="cards">{myClubs.map((club) => <div className="entityCard" key={club.id}><span>CLUBE</span><h2>{club.name}</h2><p>{championship?.country} · {championship?.season}</p></div>)}</div></Manager>}
        {section === "Partidas" && <Manager title={(championship?.name ?? "") + " · Partidas"} button="Ver rodadas" onClick={() => setSection("Partidas")}>
          <div className="roundBar"><label>RODADA<select value={round} onChange={(event) => setRound(Number(event.target.value))}>{rounds.map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select></label></div>
          <div className="resultList">{myMatches.filter((match) => match.round === round).map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div>
        </Manager>}
      </main>

      {modal && <Modal type={modal} country={selectedCountry} onClose={() => setModal(null)} addChampionship={addChampionship} addClub={addClub} />}
    </div>
  );
}

function CountryPage({ country, flag, championships, clubs, matches, onNew, onOpen, onDelete }: { country: string; flag: string; championships: Championship[]; clubs: Club[]; matches: Match[]; onNew: () => void; onOpen: (id: number) => void; onDelete: (id: number) => void }) {
  return <section className="manager countryPage"><div className="managerHead"><div><span className="eyebrow">{flag} {country.toUpperCase()}</span><h2>Campeonatos de {country}</h2></div><button className="primary" onClick={onNew}>＋ Novo campeonato</button></div>{championships.length === 0 ? <div className="countryEmpty"><h3>Nenhum campeonato cadastrado</h3><p>Use o botão acima para criar uma competição dentro de {country}.</p></div> : <div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.division} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><div className="cardActions"><button onClick={() => onOpen(item.id)}>Abrir →</button><button className="dangerText" onClick={() => onDelete(item.id)}>Excluir</button></div></div>)}</div>}</section>;
}

function Dashboard({ standings, matches, division, clubName, onPartidas, onClub, onChamp, onRound, onNextSeason }: { standings: any[]; matches: Match[]; division: string; clubName: (id: number) => string; onPartidas: () => void; onClub: () => void; onChamp: () => void; onRound: () => void; onNextSeason: () => void }) {
  return <><section className="stats"><div className="stat"><span>CLUBES</span><strong>{standings.length}</strong><small>neste campeonato</small></div><div className="stat"><span>PARTIDAS</span><strong>{matches.length}</strong><small>{matches.filter((m) => m.played).length} com resultado</small></div><div className="stat"><span>RODADAS</span><strong>{new Set(matches.map((m) => m.round)).size}</strong><small>cadastradas</small></div></section>
    <div className="grid"><section className="panel wide"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Classificação</h2></div><button className="textBtn" onClick={onPartidas}>Abrir partidas →</button></div><div className="tableLegend"><span className="legendItem direct"><i /> Acesso direto</span><span className="legendItem playoff"><i /> Play-offs de acesso</span><span className="legendItem secondPhase"><i /> Segunda fase</span><span className="legendItem relegation"><i /> Rebaixamento</span></div><table className="standingsTable"><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{standings.map((row, index) => { const position = index + 1; const rowClass = division === "Série A" ? (position >= 17 ? "zone-relegation" : "zone-neutral") : division === "Série B" ? (position <= 2 ? "zone-direct" : position <= 6 ? "zone-playoff" : position >= 17 ? "zone-relegation" : "zone-neutral") : division === "Série C" ? (position <= 8 ? "zone-second-phase" : "zone-neutral") : "zone-neutral"; return <tr key={row.club.id} className={rowClass}><td>{position}</td><td><b>{row.club.name}</b></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.gf}</td><td>{row.ga}</td><td>{row.gd > 0 ? "+" : ""}{row.gd}</td><td><strong>{row.points}</strong></td></tr>; })}</tbody></table></section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Próximos jogos</h2></div></div>{matches.filter((m) => !m.played).slice(0, 5).map((m) => <div className="match" key={m.id}><div className="date">RODADA {m.round}</div><div className="teams"><span>{clubName(m.home)}</span><b>×</b><span>{clubName(m.away)}</span></div></div>)}</section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Ações rápidas</h2></div></div><div className="quick"><button onClick={onClub}>＋ Cadastrar clube</button><button onClick={onChamp}>＋ Novo campeonato</button><button onClick={onPartidas}>◷ Ver rodadas</button><button onClick={onPartidas}>◷ Lançar resultados</button><button onClick={onNextSeason}>⇄ Gerar próxima temporada</button></div></section></div></>;
}

function Manager({ title, button, onClick, children }: { title: string; button: string; onClick: () => void; children: React.ReactNode }) {
  return <section className="manager"><div className="managerHead"><div><span className="eyebrow">CADASTRO E GESTÃO</span><h2>{title}</h2></div><button className="primary" onClick={onClick}>＋ {button}</button></div>{children}</section>;
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
