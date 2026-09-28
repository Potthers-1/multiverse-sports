import { useEffect, useMemo, useState } from "react";

type Championship = {
  id: number;
  name: string;
  country: string;
  season: string;
  pointsWin: number;
  pointsDraw: number;
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

const seedChampionships: Championship[] = [
  { id: 1, name: "Brasileirão Série A", country: "Brasil", season: "2026", pointsWin: 3, pointsDraw: 1 }
];

const seedClubs: Club[] = [
  { id: 1, name: "Flamengo", championshipId: 1 },
  { id: 2, name: "Palmeiras", championshipId: 1 },
  { id: 3, name: "Atlético-MG", championshipId: 1 },
  { id: 4, name: "Botafogo", championshipId: 1 },
  { id: 5, name: "Fluminense", championshipId: 1 },
  { id: 6, name: "Cruzeiro", championshipId: 1 },
  { id: 7, name: "Grêmio", championshipId: 1 },
  { id: 8, name: "Internacional", championshipId: 1 }
];

const seedMatches: Match[] = [
  { id: 1, championshipId: 1, round: 1, home: 1, away: 2, homeScore: 2, awayScore: 1, played: true },
  { id: 2, championshipId: 1, round: 1, home: 3, away: 6, homeScore: 1, awayScore: 1, played: true },
  { id: 3, championshipId: 1, round: 1, home: 5, away: 4, homeScore: null, awayScore: null, played: false },
  { id: 4, championshipId: 1, round: 1, home: 7, away: 8, homeScore: null, awayScore: null, played: false }
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function App() {
  const [championships, setChampionships] = useState(() => load("sports-championships", seedChampionships));
  const [clubs, setClubs] = useState(() => load("sports-clubs", seedClubs));
  const [matches, setMatches] = useState(() => load("sports-matches", seedMatches));
  const [selectedId, setSelectedId] = useState(1);
  const [section, setSection] = useState("Visão geral");
  const [round, setRound] = useState(1);
  const [modal, setModal] = useState<"club" | "championship" | null>(null);

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
      return { club, played, wins, draws, losses, gf, ga, gd: gf - ga, points: wins * championship.pointsWin + draws * championship.pointsDraw };
    }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }, [myClubs, myMatches, championship]);

  const clubName = (id: number) => clubs.find((club) => club.id === id)?.name ?? "Clube";

  function nextId<T extends { id: number }>(items: T[]) {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  function addChampionship(name: string, country: string, season: string) {
    if (!name.trim()) return;
    const item = { id: nextId(championships), name: name.trim(), country: country.trim() || "Não informado", season: season || "2026", pointsWin: 3, pointsDraw: 1 };
    setChampionships([...championships, item]);
    setSelectedId(item.id);
    setModal(null);
  }

  function addClub(name: string) {
    if (!name.trim() || !championship) return;
    setClubs([...clubs, { id: nextId(clubs), name: name.trim(), championshipId: championship.id }]);
    setModal(null);
  }

  function addRound() {
    if (!championship || myClubs.length < 2) return;
    const nextRound = Math.max(0, ...myMatches.map((match) => match.round)) + 1;
    const created: Match[] = [];
    for (let i = 0; i + 1 < myClubs.length; i += 2) {
      created.push({ id: nextId([...matches, ...created]), championshipId: championship.id, round: nextRound, home: myClubs[i].id, away: myClubs[i + 1].id, homeScore: null, awayScore: null, played: false });
    }
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

  const nav = ["Visão geral", "Campeonatos", "Clubes", "Partidas"];

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
        <div className="label">NAVEGAÇÃO</div>
        {nav.map((item) => <button key={item} className={section === item ? "nav active" : "nav"} onClick={() => setSection(item)}>{item}</button>)}
        <div className="label lower">CAMPEONATOS</div>
        {championships.map((item) => <button key={item.id} className={selectedId === item.id ? "champMini active" : "champMini"} onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>{item.name}<small>{item.season}</small></button>)}
      </aside>

      <main className="main">
        <header>
          <div><div className="crumb">CAMPEONATOS / <strong>{championship?.name?.toUpperCase()}</strong></div><h1>{section}</h1></div>
          <button className="ghost" onClick={() => setModal("championship")}>＋ Novo campeonato</button>
        </header>

        <div className="champBar">
          <div><span className="liveDot" /><b>{championship?.name}</b><em>{championship?.country} · {championship?.season}</em></div>
          <select value={selectedId} onChange={(event) => { setSelectedId(Number(event.target.value)); setRound(1); }}>
            {championships.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.season}</option>)}
          </select>
        </div>

        {section === "Visão geral" && <Dashboard standings={standings} matches={myMatches} clubName={clubName} onPartidas={() => setSection("Partidas")} onClub={() => setModal("club")} onChamp={() => setModal("championship")} onRound={addRound} />}
        {section === "Campeonatos" && <Manager title="Meus campeonatos" button="Novo campeonato" onClick={() => setModal("championship")}><div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.country} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><button onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>Abrir →</button></div>)}</div></Manager>}
        {section === "Clubes" && <Manager title={"Clubes · " + championship?.name} button="Novo clube" onClick={() => setModal("club")}><div className="cards">{myClubs.map((club) => <div className="entityCard" key={club.id}><span>CLUBE</span><h2>{club.name}</h2><p>{championship?.country} · {championship?.season}</p></div>)}</div></Manager>}
        {section === "Partidas" && <Manager title={(championship?.name ?? "") + " · Partidas"} button="Adicionar rodada" onClick={addRound}>
          <div className="roundBar"><label>RODADA<select value={round} onChange={(event) => setRound(Number(event.target.value))}>{rounds.map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select></label></div>
          <div className="resultList">{myMatches.filter((match) => match.round === round).map((match) => <ResultRow key={match.id} match={match} home={clubName(match.home)} away={clubName(match.away)} onSave={saveScore} />)}</div>
        </Manager>}
      </main>

      {modal && <Modal type={modal} onClose={() => setModal(null)} addChampionship={addChampionship} addClub={addClub} />}
    </div>
  );
}

function Dashboard({ standings, matches, clubName, onPartidas, onClub, onChamp, onRound }: { standings: any[]; matches: Match[]; clubName: (id: number) => string; onPartidas: () => void; onClub: () => void; onChamp: () => void; onRound: () => void }) {
  return <><section className="stats"><div className="stat"><span>CLUBES</span><strong>{standings.length}</strong><small>neste campeonato</small></div><div className="stat"><span>PARTIDAS</span><strong>{matches.length}</strong><small>{matches.filter((m) => m.played).length} com resultado</small></div><div className="stat"><span>RODADAS</span><strong>{new Set(matches.map((m) => m.round)).size}</strong><small>cadastradas</small></div></section>
    <div className="grid"><section className="panel wide"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Classificação</h2></div><button className="textBtn" onClick={onPartidas}>Abrir partidas →</button></div><table><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{standings.map((row, index) => <tr key={row.club.id}><td>{index + 1}</td><td><b>{row.club.name}</b></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.gf}</td><td>{row.ga}</td><td>{row.gd > 0 ? "+" : ""}{row.gd}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Próximos jogos</h2></div></div>{matches.filter((m) => !m.played).slice(0, 5).map((m) => <div className="match" key={m.id}><div className="date">RODADA {m.round}</div><div className="teams"><span>{clubName(m.home)}</span><b>×</b><span>{clubName(m.away)}</span></div></div>)}</section>
    <section className="panel"><div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>Ações rápidas</h2></div></div><div className="quick"><button onClick={onClub}>＋ Cadastrar clube</button><button onClick={onChamp}>＋ Novo campeonato</button><button onClick={onRound}>＋ Adicionar rodada</button><button onClick={onPartidas}>◷ Lançar resultados</button></div></section></div></>;
}

function Manager({ title, button, onClick, children }: { title: string; button: string; onClick: () => void; children: React.ReactNode }) {
  return <section className="manager"><div className="managerHead"><div><span className="eyebrow">CADASTRO E GESTÃO</span><h2>{title}</h2></div><button className="primary" onClick={onClick}>＋ {button}</button></div>{children}</section>;
}

function ResultRow({ match, home, away, onSave }: { match: Match; home: string; away: string; onSave: (id: number, home: string, away: string) => void }) {
  const [homeScore, setHomeScore] = useState(match.homeScore == null ? "" : String(match.homeScore));
  const [awayScore, setAwayScore] = useState(match.awayScore == null ? "" : String(match.awayScore));
  return <div className="resultRow"><div><span className="eyebrow">RODADA {match.round}</span><b>{home}</b><small>vs</small><b>{away}</b></div><div className="scoreEdit"><input value={homeScore} onChange={(e) => setHomeScore(e.target.value)} inputMode="numeric" /><strong>×</strong><input value={awayScore} onChange={(e) => setAwayScore(e.target.value)} inputMode="numeric" /><button onClick={() => onSave(match.id, homeScore, awayScore)}>{match.played ? "Atualizar" : "Salvar resultado"}</button></div></div>;
}

function Modal({ type, onClose, addChampionship, addClub }: { type: "club" | "championship"; onClose: () => void; addChampionship: (name: string, country: string, season: string) => void; addClub: (name: string) => void }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [season, setSeason] = useState("2026");
  return <div className="overlay"><div className="modal"><button className="close" onClick={onClose}>×</button><span className="eyebrow">NOVO REGISTRO</span><h2>{type === "championship" ? "Novo campeonato" : "Novo clube"}</h2><input autoFocus placeholder={type === "championship" ? "Nome do campeonato" : "Nome do clube"} value={name} onChange={(e) => setName(e.target.value)} />{type === "championship" && <><input placeholder="País" value={country} onChange={(e) => setCountry(e.target.value)} /><input placeholder="Temporada" value={season} onChange={(e) => setSeason(e.target.value)} /></>}<button className="primary full" onClick={() => type === "championship" ? addChampionship(name, country, season) : addClub(name)}>Salvar</button></div></div>;
}
