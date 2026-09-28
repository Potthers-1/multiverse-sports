import { useEffect, useMemo, useState } from "react";

type Championship = {
  id: number;
  name: string;
  country: string;
  season: string;
  sport: string;
  category: string;
  format: string;
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

const DATA_VERSION = "3";

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

export default function App() {
  const [championships, setChampionships] = useState(() => load("sports-championships", seedChampionships));
  const [clubs, setClubs] = useState(() => load("sports-clubs", seedClubs));
  const [matches, setMatches] = useState(() => load("sports-matches", seedMatches));
  const [selectedId, setSelectedId] = useState(0);
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
      return { club, played, wins, draws, losses, gf, ga, gd: gf - ga, points: wins * (championship?.pointsWin ?? 3) + draws * (championship?.pointsDraw ?? 1) };
    }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }, [myClubs, myMatches, championship]);

  const clubName = (id: number) => clubs.find((club) => club.id === id)?.name ?? "Clube";

  function nextId<T extends { id: number }>(items: T[]) {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  function addChampionship(data: Omit<Championship, "id">) {
    if (!data.name.trim()) return;
    const item: Championship = { ...data, id: nextId(championships), name: data.name.trim(), country: data.country.trim() || "Não informado" };
    setChampionships([...championships, item]);
    setSelectedId(item.id);
    setRound(1);
    setSection("Visão geral");
    setModal(null);
  }

  function addClub(name: string) {
    if (!name.trim() || !championship) return;
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

  if (!championship) {
    return (
      <div className="app">
        <aside className="side">
          <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
          <div className="label">NAVEGAÇÃO</div>
          {nav.map((item) => <button key={item} className={section === item ? "nav active" : "nav"} onClick={() => setSection(item)}>{item}</button>)}
          <div className="label lower">PAÍSES</div>
          <div className="countryList">{COUNTRIES.map((country) => <button key={country.name} className="countryItem" onClick={() => setSection("Campeonatos")}><span>{country.flag}</span>{country.name}</button>)}</div>
          <div className="label lower">CAMPEONATOS</div>
          <div className="emptySide">Nenhum campeonato cadastrado.</div>
        </aside>
        <main className="main emptyState">
          <header><div><div className="crumb">SPORTS TABLE / INÍCIO</div><h1>Comece do zero</h1></div><button className="primary" onClick={() => setModal("championship")}>＋ Novo campeonato</button></header>
          <section className="emptyPanel">
            <span className="eyebrow">SEU GERENCIADOR</span>
            <h2>Nenhum campeonato cadastrado</h2>
            <p>Crie seu primeiro campeonato real para começar a cadastrar clubes, rodadas, partidas e resultados.</p>
            <button className="primary" onClick={() => setModal("championship")}>＋ Criar primeiro campeonato</button>
          </section>
          {modal && <Modal type={modal} onClose={() => setModal(null)} addChampionship={addChampionship} addClub={addClub} />}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
        <div className="label">NAVEGAÇÃO</div>
        {nav.map((item) => <button key={item} className={section === item ? "nav active" : "nav"} onClick={() => setSection(item)}>{item}</button>)}
        <div className="label lower">PAÍSES</div>
        <div className="countryList">{COUNTRIES.map((country) => <button key={country.name} className="countryItem" onClick={() => setSection("Campeonatos")}><span>{country.flag}</span>{country.name}</button>)}</div>
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
        {section === "Campeonatos" && <Manager title="Meus campeonatos" button="Novo campeonato" onClick={() => setModal("championship")}><div className="cards">{championships.map((item) => <div className="entityCard" key={item.id}><span>{item.country} · {item.season}</span><h2>{item.name}</h2><p>{clubs.filter((club) => club.championshipId === item.id).length} clubes · {matches.filter((match) => match.championshipId === item.id).length} partidas</p><div className="cardActions"><button onClick={() => { setSelectedId(item.id); setSection("Visão geral"); }}>Abrir →</button><button className="dangerText" onClick={() => deleteChampionship(item.id)}>Excluir</button></div></div>)}</div></Manager>}
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

function Modal({ type, onClose, addChampionship, addClub }: {
  type: "club" | "championship";
  onClose: () => void;
  addChampionship: (data: Omit<Championship, "id">) => void;
  addClub: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [season, setSeason] = useState("2026");
  const [sport, setSport] = useState("Futebol");
  const [category, setCategory] = useState("Profissional");
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
      name, country, season, sport, category, format,
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
      <label className="field">País<input placeholder="Brasil" value={country} onChange={(e) => setCountry(e.target.value)} /></label>
      <label className="field">Temporada<input placeholder="2026" value={season} onChange={(e) => setSeason(e.target.value)} /></label>
      <label className="field">Esporte<select value={sport} onChange={(e) => setSport(e.target.value)}><option>Futebol</option><option>Futsal</option><option>Basquete</option><option>Vôlei</option><option>Handebol</option><option>Outro</option></select></label>
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
