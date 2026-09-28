import { useState } from "react";

const universes = [
  { name: "Mundo Real", tag: "PRINCIPAL", competitions: 4, clubs: 48 },
  { name: "Europa 2030", tag: "ALTERNATIVO", competitions: 3, clubs: 36 },
  { name: "Linha do Caos", tag: "SIMULAÇÃO", competitions: 2, clubs: 24 },
];

const table = [
  ["1", "Flamengo", "12", "8", "3", "1", "27"],
  ["2", "Palmeiras", "12", "7", "3", "2", "24"],
  ["3", "Atlético-MG", "12", "6", "4", "2", "22"],
  ["4", "Botafogo", "12", "6", "2", "4", "20"],
  ["5", "Fluminense", "12", "5", "4", "3", "19"],
  ["6", "Cruzeiro", "12", "4", "3", "5", "15"],
];

const matches = [
  ["Flamengo", "Palmeiras", "2", "1", "FINALIZADO"],
  ["Atlético-MG", "Cruzeiro", "1", "1", "FINALIZADO"],
  ["Fluminense", "Botafogo", "—", "—", "HOJE"],
  ["Grêmio", "Internacional", "—", "—", "AMANHÃ"],
];

const nav = ["Visão geral", "Universos", "Campeonatos", "Clubes", "Partidas", "Simulações", "Comparar universos"];

export default function App() {
  const [universe, setUniverse] = useState("Mundo Real");
  const [section, setSection] = useState("Visão geral");
  const current = universes.find((u) => u.name === universe)!;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="mark">✦</div><div><b>MULTIVERSE</b><span>SPORTS ENGINE</span></div></div>
        <div className="label">NAVEGAÇÃO</div>
        {nav.map((x, i) => (
          <button className={section === x ? "nav active" : "nav"} onClick={() => setSection(x)} key={x}>
            <span>{["⌂", "◎", "▦", "♙", "◷", "⟳", "⇄"][i]}</span>{x}
          </button>
        ))}
        <div className="label lower">UNIVERSOS ATIVOS</div>
        {universes.map((u) => (
          <button className="universeMini" onClick={() => { setUniverse(u.name); setSection("Visão geral"); }} key={u.name}>
            <i />{u.name}<small>{u.tag}</small>
          </button>
        ))}
        <div className="profile"><div className="avatar">PS</div><div><b>President Sim</b><span>Administrador</span></div><span>⋮</span></div>
      </aside>

      <main className="main">
        <header>
          <div><div className="crumb">UNIVERSO / <strong>{universe.toUpperCase()}</strong></div><h1>{section}</h1></div>
          <div className="actions"><button className="ghost">⌕ Pesquisar</button><button className="primary">＋ Novo universo</button></div>
        </header>

        <div className="universeBar">
          <div><span className="liveDot" /><b>{universe}</b><em>{current.tag}</em></div>
          <select value={universe} onChange={(e) => setUniverse(e.target.value)}>
            {universes.map((u) => <option key={u.name}>{u.name}</option>)}
          </select>
        </div>

        <section className="stats">
          <div className="stat"><span>CAMPEONATOS</span><strong>{current.competitions}</strong><small>+1 esta semana</small></div>
          <div className="stat"><span>CLUBES</span><strong>{current.clubs}</strong><small>12 com partidas hoje</small></div>
          <div className="stat"><span>PARTIDAS</span><strong>186</strong><small>24 em andamento</small></div>
          <div className="stat"><span>RAMIFICAÇÕES</span><strong>7</strong><small>3 criadas hoje</small></div>
        </section>

        <div className="grid">
          <section className="panel wide">
            <div className="panelHead"><div><span className="eyebrow">CAMPEONATO PRINCIPAL</span><h2>Brasileirão · 2026</h2></div><button className="textBtn">Abrir campeonato →</button></div>
            <div className="tabs"><span className="tab on">Classificação</span><span className="tab">Próximas</span><span className="tab">Resultados</span></div>
            <table><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>PTS</th></tr></thead>
              <tbody>{table.map((r) => <tr key={r[0]}>{r.map((v, i) => <td key={i}>{i === 1 ? <b>{v}</b> : i === 6 ? <strong>{v}</strong> : v}</td>)}</tr>)}</tbody>
            </table>
          </section>

          <section className="panel">
            <div className="panelHead"><div><span className="eyebrow">AGENDA</span><h2>Próximas partidas</h2></div><button className="iconBtn">•••</button></div>
            <div className="matches">{matches.map((m, i) => <div className="match" key={i}><div className="date">{m[4]}</div><div className="teams"><span>{m[0]}</span><b>{m[2]}</b><small>×</small><b>{m[3]}</b><span>{m[1]}</span></div></div>)}</div>
          </section>

          <section className="panel">
            <div className="panelHead"><div><span className="eyebrow">MULTIVERSO</span><h2>Linhas do tempo</h2></div><button className="textBtn">Comparar →</button></div>
            <div className="branches">
              <div className="branch mainB"><i /><div><b>Mundo Real</b><span>Rodada 12 · estado atual</span></div><strong>●</strong></div>
              <div className="branch"><i /><div><b>Europa 2030</b><span>Rodada 9 · 3 alterações</span></div><strong>↗</strong></div>
              <div className="branch"><i /><div><b>Linha do Caos</b><span>Rodada 6 · simulação</span></div><strong>↗</strong></div>
            </div>
            <button className="fork">＋ Criar realidade alternativa a partir da rodada atual</button>
          </section>
        </div>
      </main>
    </div>
  );
}
