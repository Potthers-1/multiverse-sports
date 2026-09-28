import React, { useEffect, useMemo, useState } from 'react';

type Universe={id:number;name:string;tag:string};
type Club={id:number;name:string;universeId:number};
type Competition={id:number;name:string;season:string;universeId:number;clubIds:number[]};
type Match={id:number;competitionId:number;round:number;home:number;away:number;homeScore:number|null;awayScore:number|null;played:boolean};

const seedUniverses:Universe[]=[
  {id:1,name:'Mundo Real',tag:'PRINCIPAL'},
  {id:2,name:'Europa 2030',tag:'ALTERNATIVO'},
  {id:3,name:'Linha do Caos',tag:'SIMULAÇÃO'},
];
const seedClubs:Club[]=[
  {id:1,name:'Flamengo',universeId:1},{id:2,name:'Palmeiras',universeId:1},{id:3,name:'Atlético-MG',universeId:1},{id:4,name:'Botafogo',universeId:1},
  {id:5,name:'Fluminense',universeId:1},{id:6,name:'Cruzeiro',universeId:1},{id:7,name:'Grêmio',universeId:1},{id:8,name:'Internacional',universeId:1},
];
const seedCompetitions:Competition[]=[{id:1,name:'Brasileirão',season:'2026',universeId:1,clubIds:[1,2,3,4,5,6,7,8]}];
const seedMatches:Match[]=[
  {id:1,competitionId:1,round:1,home:1,away:2,homeScore:2,awayScore:1,played:true},
  {id:2,competitionId:1,round:1,home:3,away:6,homeScore:1,awayScore:1,played:true},
  {id:3,competitionId:1,round:1,home:5,away:4,homeScore:null,awayScore:null,played:false},
  {id:4,competitionId:1,round:1,home:7,away:8,homeScore:null,awayScore:null,played:false},
];

const load=<T,>(key:string,fallback:T):T=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}};
const save=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));

export default function Home(){
  const [universes,setUniverses]=useState<Universe[]>(()=>load('mv-universes',seedUniverses));
  const [clubs,setClubs]=useState<Club[]>(()=>load('mv-clubs',seedClubs));
  const [competitions,setCompetitions]=useState<Competition[]>(()=>load('mv-competitions',seedCompetitions));
  const [matches,setMatches]=useState<Match[]>(()=>load('mv-matches',seedMatches));
  const [universeId,setUniverseId]=useState(1);
  const [section,setSection]=useState('Visão geral');
  const [modal,setModal]=useState<string|null>(null);
  const [selectedCompetition,setSelectedCompetition]=useState(1);
  const [round,setRound]=useState(1);

  useEffect(()=>save('mv-universes',universes),[universes]);
  useEffect(()=>save('mv-clubs',clubs),[clubs]);
  useEffect(()=>save('mv-competitions',competitions),[competitions]);
  useEffect(()=>save('mv-matches',matches),[matches]);

  const universe=universes.find(u=>u.id===universeId)!;
  const myClubs=clubs.filter(c=>c.universeId===universeId);
  const myComps=competitions.filter(c=>c.universeId===universeId);
  const competition=competitions.find(c=>c.id===selectedCompetition)||myComps[0];
  const compMatches=matches.filter(m=>m.competitionId===competition?.id);
  const stats=useMemo(()=>{
    if(!competition)return [];
    return competition.clubIds.map(id=>{const c=clubs.find(x=>x.id===id)!;let j=0,v=0,e=0,d=0,gp=0,gc=0;
      compMatches.filter(m=>m.played&&(m.home===id||m.away===id)).forEach(m=>{j++;const h=m.home===id,a=h?m.homeScore!:m.awayScore!,b=h?m.awayScore!:m.homeScore!;gp+=a;gc+=b;if(a>b)v++;else if(a===b)e++;else d++});
      return {c,j,v,e,d,gp,gc,sg:gp-gc,pts:v*3+e};
    }).sort((a,b)=>b.pts-a.pts||b.sg-a.sg||b.gp-a.gp);
  },[competition,compMatches,clubs]);

  const nextId=(items:{id:number}[])=>items.length?Math.max(...items.map(x=>x.id))+1:1;
  const createUniverse=(name:string)=>{if(!name.trim())return;setUniverses([...universes,{id:nextId(universes),name:name.trim(),tag:'ALTERNATIVO'}]);setModal(null)};
  const createClub=(name:string)=>{if(!name.trim())return;setClubs([...clubs,{id:nextId(clubs),name:name.trim(),universeId}]);setModal(null)};
  const createCompetition=(name:string,season:string)=>{if(!name.trim())return;const id=nextId(competitions);setCompetitions([...competitions,{id,name:name.trim(),season:season||'2026',universeId,clubIds:myClubs.map(c=>c.id)}]);setSelectedCompetition(id);setModal(null)};
  const addRound=()=>{if(!competition||competition.clubIds.length<2)return;const ids=[...competition.clubIds];const existingRounds=compMatches.map(m=>m.round);const nextRound=(existingRounds.length?Math.max(...existingRounds):0)+1;const created:Match[]=[];for(let i=0;i<ids.length-1;i+=2)created.push({id:nextId([...matches,...created]),competitionId:competition.id,round:nextRound,home:ids[i],away:ids[i+1],homeScore:null,awayScore:null,played:false});setMatches([...matches,...created]);setRound(nextRound)};
  const updateScore=(id:number,h:string,a:string)=>{const hs=Number(h),as=Number(a);if(Number.isNaN(hs)||Number.isNaN(as))return;setMatches(matches.map(m=>m.id===id?{...m,homeScore:hs,awayScore:as,played:true}:m))};
  const clubName=(id:number)=>clubs.find(c=>c.id===id)?.name||'Clube';

  const nav=['Visão geral','Universos','Campeonatos','Clubes','Partidas'];
  return <div className="app">
    <aside className="side"><div className="brand"><div className="mark">✦</div><div><b>MULTIVERSE</b><span>SPORTS ENGINE</span></div></div>
      <div className="label">NAVEGAÇÃO</div>{nav.map((x,i)=><button className={section===x?'nav active':'nav'} onClick={()=>setSection(x)} key={x}><span>{['⌂','◎','▦','♙','◷'][i]}</span>{x}</button>)}
      <div className="label lower">UNIVERSOS ATIVOS</div>{universes.map(u=><button className="universeMini" onClick={()=>{setUniverseId(u.id);setSection('Visão geral')}} key={u.id}><i/>{u.name}<small>{u.tag}</small></button>)}
      <div className="profile"><div className="avatar">PS</div><div><b>President Sim</b><span>Administrador</span></div></div>
    </aside>
    <main className="main"><header><div><div className="crumb">UNIVERSO / <strong>{universe.name.toUpperCase()}</strong></div><h1>{section}</h1></div><div className="actions"><button className="ghost" onClick={()=>setModal('universe')}>＋ Novo universo</button></div></header>
      <div className="universeBar"><div><span className="liveDot"/><b>{universe.name}</b><em>{universe.tag}</em></div><select value={universeId} onChange={e=>setUniverseId(Number(e.target.value))}>{universes.map(u=><option value={u.id} key={u.id}>{u.name}</option>)}</select></div>
      {section==='Visão geral'&&<><section className="stats"><div className="stat"><span>CAMPEONATOS</span><strong>{myComps.length}</strong><small>neste universo</small></div><div className="stat"><span>CLUBES</span><strong>{myClubs.length}</strong><small>cadastrados</small></div><div className="stat"><span>PARTIDAS</span><strong>{matches.filter(m=>myComps.some(c=>c.id===m.competitionId)).length}</strong><small>{compMatches.filter(m=>!m.played).length} pendentes</small></div><div className="stat"><span>RODADA ATUAL</span><strong>{Math.max(1,...compMatches.map(m=>m.round))}</strong><small>do campeonato</small></div></section>
      <div className="grid"><section className="panel wide"><PanelHead title={competition?competition.name+' · '+competition.season:'Nenhum campeonato'} action={myComps.length?'Abrir campeonato →':'+ Criar campeonato'} onClick={()=>myComps.length?setSection('Partidas'):setModal('competition')}/>{competition&&<Table stats={stats}/>}</section>
      <section className="panel"><PanelHead title="Próximas partidas"/>{compMatches.filter(m=>!m.played).slice(0,5).map(m=><MatchRow key={m.id} m={m} clubName={clubName}/>)}</section>
      <section className="panel"><PanelHead title="Ações rápidas"/><div className="quick"><button onClick={()=>setModal('club')}>＋ Cadastrar clube</button><button onClick={()=>setModal('competition')}>＋ Novo campeonato</button><button onClick={addRound}>＋ Gerar próxima rodada</button><button onClick={()=>setSection('Partidas')}>◷ Lançar resultados</button></div></section></div></>}

      {section==='Universos'&&<Manager title="Universos" add="Novo universo" onAdd={()=>setModal('universe')}><div className="cards">{universes.map(u=><div className="entityCard" key={u.id}><span>{u.tag}</span><h2>{u.name}</h2><p>{competitions.filter(c=>c.universeId===u.id).length} campeonatos · {clubs.filter(c=>c.universeId===u.id).length} clubes</p><button onClick={()=>{setUniverseId(u.id);setSection('Visão geral')}}>Entrar →</button></div>)}</div></Manager>}
      {section==='Clubes'&&<Manager title={'Clubes · '+universe.name} add="Novo clube" onAdd={()=>setModal('club')}><div className="cards">{myClubs.map(c=><div className="entityCard" key={c.id}><span>CLUBE</span><h2>{c.name}</h2><p>Universo: {universe.name}</p></div>)}</div></Manager>}
      {section==='Campeonatos'&&<Manager title={'Campeonatos · '+universe.name} add="Novo campeonato" onAdd={()=>setModal('competition')}><div className="cards">{myComps.map(c=><div className="entityCard" key={c.id}><span>{c.season}</span><h2>{c.name}</h2><p>{c.clubIds.length} clubes · {matches.filter(m=>m.competitionId===c.id).length} partidas</p><button onClick={()=>{setSelectedCompetition(c.id);setSection('Partidas')}}>Gerenciar →</button></div>)}</div></Manager>}
      {section==='Partidas'&&<Manager title={competition?competition.name+' · Partidas':'Partidas'} add="Gerar rodada" onAdd={addRound}><div className="roundBar"><label>CAMPEONATO<select value={competition?.id||''} onChange={e=>setSelectedCompetition(Number(e.target.value))}>{myComps.map(c=><option value={c.id} key={c.id}>{c.name} · {c.season}</option>)}</select></label><label>RODADA<select value={round} onChange={e=>setRound(Number(e.target.value))}>{[...new Set(compMatches.map(m=>m.round))].sort((a,b)=>a-b).map(r=><option value={r} key={r}>Rodada {r}</option>)}</select></label></div>
      <div className="resultList">{compMatches.filter(m=>m.round===round).map(m=><ResultRow key={m.id} m={m} home={clubName(m.home)} away={clubName(m.away)} onSave={updateScore}/>)}</div></Manager>}
    </main>
    {modal&&<Modal type={modal} onClose={()=>setModal(null)} createUniverse={createUniverse} createClub={createClub} createCompetition={createCompetition}/>}
  </div>;
}

function PanelHead({title,action,onClick}:{title:string;action?:string;onClick?:()=>void}){return <div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>{title}</h2></div>{action&&<button className="textBtn" onClick={onClick}>{action}</button>}</div>}
function Table({stats}:{stats:any[]}){return <table><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>{stats.map((r,i)=><tr key={r.c.id}><td>{i+1}</td><td><b>{r.c.name}</b></td><td>{r.j}</td><td>{r.v}</td><td>{r.e}</td><td>{r.d}</td><td>{r.sg}</td><td><strong>{r.pts}</strong></td></tr>)}</tbody></table>}
function MatchRow({m,clubName}:{m:Match;clubName:(id:number)=>string}){return <div className="match"><div className="date">RODADA {m.round} · PENDENTE</div><div className="teams"><span>{clubName(m.home)}</span><b>×</b><span>{clubName(m.away)}</span></div></div>}
function ResultRow({m,home,away,onSave}:{m:Match;home:string;away:string;onSave:(id:number,h:string,a:string)=>void}){const[h,setH]=useState(m.homeScore??'');const[a,setA]=useState(m.awayScore??'');return <div className="resultRow"><div><span className="eyebrow">RODADA {m.round}</span><b>{home}</b><small>vs</small><b>{away}</b></div><div className="scoreEdit"><input value={h} onChange={e=>setH(e.target.value)} inputMode="numeric"/><strong>×</strong><input value={a} onChange={e=>setA(e.target.value)} inputMode="numeric"/><button onClick={()=>onSave(m.id,String(h),String(a))}>{m.played?'Atualizar':'Salvar resultado'}</button></div></div>}
function Manager({title,add,onAdd,children}:{title:string;add:string;onAdd:()=>void;children:React.ReactNode}){return <section className="manager"><div className="managerHead"><div><span className="eyebrow">CADASTRO E GESTÃO</span><h2>{title}</h2></div><button className="primary" onClick={onAdd}>＋ {add}</button></div>{children}</section>}
function Modal({type,onClose,createUniverse,createClub,createCompetition}:{type:string;onClose:()=>void;createUniverse:(n:string)=>void;createClub:(n:string)=>void;createCompetition:(n:string,s:string)=>void}){const[name,setName]=useState('');const[season,setSeason]=useState('2026');return <div className="overlay"><div className="modal"><button className="close" onClick={onClose}>×</button><span className="eyebrow">NOVO REGISTRO</span><h2>{type==='universe'?'Criar universo':type==='club'?'Cadastrar clube':'Criar campeonato'}</h2><input autoFocus placeholder={type==='universe'?'Nome do universo':type==='club'?'Nome do clube':'Nome do campeonato'} value={name} onChange={e=>setName(e.target.value)}/>{type==='competition'&&<input placeholder="Temporada" value={season} onChange={e=>setSeason(e.target.value)}/>}<button className="primary full" onClick={()=>type==='universe'?createUniverse(name):type==='club'?createClub(name):createCompetition(name,season)}>Criar</button></div></div>}