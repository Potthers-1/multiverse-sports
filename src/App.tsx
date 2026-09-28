pages/_index.tsx — lines 1-122 of 122 (version: 1790615969303)
    1	import React, { useEffect, useMemo, useState } from 'react';
    2	
    3	type Championship={id:number;name:string;country:string;season:string;pointsWin:number;pointsDraw:number;tieBreakers:string[]};
    4	type Club={id:number;name:string;championshipId:number};
    5	type Match={id:number;championshipId:number;round:number;date:string;home:number;away:number;homeScore:number|null;awayScore:number|null;played:boolean};
    6	
    7	const seedChampionships:Championship[]=[
    8	  {id:1,name:'Brasileirão Série A',country:'Brasil',season:'2026',pointsWin:3,pointsDraw:1,tieBreakers:['Pontos','Saldo de gols','Gols pró']},
    9	];
   10	const seedClubs:Club[]=[
   11	  {id:1,name:'Flamengo',championshipId:1},{id:2,name:'Palmeiras',championshipId:1},{id:3,name:'Atlético-MG',championshipId:1},{id:4,name:'Botafogo',championshipId:1},
   12	  {id:5,name:'Fluminense',championshipId:1},{id:6,name:'Cruzeiro',championshipId:1},{id:7,name:'Grêmio',championshipId:1},{id:8,name:'Internacional',championshipId:1},
   13	];
   14	const seedMatches:Match[]=[
   15	  {id:1,championshipId:1,round:1,date:'2026-01-01',home:1,away:2,homeScore:2,awayScore:1,played:true},
   16	  {id:2,championshipId:1,round:1,date:'2026-01-01',home:3,away:6,homeScore:1,awayScore:1,played:true},
   17	  {id:3,championshipId:1,round:1,date:'2026-01-01',home:5,away:4,homeScore:null,awayScore:null,played:false},
   18	  {id:4,championshipId:1,round:1,date:'2026-01-01',home:7,away:8,homeScore:null,awayScore:null,played:false},
   19	];
   20	
   21	const load=<T,>(key:string,fallback:T):T=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}};
   22	const save=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));
   23	
   24	export default function Home(){
   25	  const [championships,setChampionships]=useState<Championship[]>(()=>load('sports-championships',seedChampionships));
   26	  const [clubs,setClubs]=useState<Club[]>(()=>load('sports-clubs',seedClubs));
   27	  const [matches,setMatches]=useState<Match[]>(()=>load('sports-matches',seedMatches));
   28	  const [section,setSection]=useState('Visão geral');
   29	  const [modal,setModal]=useState<string|null>(null);
   30	  const [selected,setSelected]=useState(1);
   31	  const [round,setRound]=useState(1);
   32	
   33	  useEffect(()=>save('sports-championships',championships),[championships]);
   34	  useEffect(()=>save('sports-clubs',clubs),[clubs]);
   35	  useEffect(()=>save('sports-matches',matches),[matches]);
   36	
   37	  const championship=championships.find(c=>c.id===selected)||championships[0];
   38	  const myClubs=clubs.filter(c=>c.championshipId===championship?.id);
   39	  const compMatches=matches.filter(m=>m.championshipId===championship?.id);
   40	  const stats=useMemo(()=>{
   41	    if(!championship)return [];
   42	    return myClubs.map(c=>{let j=0,v=0,e=0,d=0,gp=0,gc=0;
   43	      compMatches.filter(m=>m.played&&(m.home===c.id||m.away===c.id)).forEach(m=>{j++;const h=m.home===c.id,a=h?m.homeScore!:m.awayScore!,b=h?m.awayScore!:m.homeScore!;gp+=a;gc+=b;if(a>b)v++;else if(a===b)e++;else d++});
   44	      return {c,j,v,e,d,gp,gc,sg:gp-gc,pts:v*championship.pointsWin+e*championship.pointsDraw};
   45	    }).sort((a,b)=>b.pts-a.pts||b.sg-a.sg||b.gp-a.gp);
   46	  },[championship,myClubs,compMatches]);
   47	
   48	  const nextId=(items:{id:number}[])=>items.length?Math.max(...items.map(x=>x.id))+1:1;
   49	  const createChampionship=(name:string,country:string,season:string)=>{
   50	    if(!name.trim())return;
   51	    const id=nextId(championships);
   52	    setChampionships([...championships,{id,name:name.trim(),country:country.trim()||'Não informado',season:season||'2026',pointsWin:3,pointsDraw:1,tieBreakers:['Pontos','Saldo de gols','Gols pró']}]);
   53	    setSelected(id);setSection('Campeonatos');setModal(null);
   54	  };
   55	  const createClub=(name:string)=>{
   56	    if(!name.trim()||!championship)return;
   57	    setClubs([...clubs,{id:nextId(clubs),name:name.trim(),championshipId:championship.id}]);setModal(null);
   58	  };
   59	  const addRound=()=>{
   60	    if(!championship||myClubs.length<2)return;
   61	    const nextRound=Math.max(0,...compMatches.map(m=>m.round))+1;
   62	    const created:Match[]=[];
   63	    for(let i=0;i<myClubs.length-1;i+=2)created.push({id:nextId([...matches,...created]),championshipId:championship.id,round:nextRound,date:'',home:myClubs[i].id,away:myClubs[i+1].id,homeScore:null,awayScore:null,played:false});
   64	    setMatches([...matches,...created]);setRound(nextRound);setSection('Partidas');
   65	  };
   66	  const updateScore=(id:number,h:string,a:string)=>{
   67	    const hs=Number(h),as=Number(a);
   68	    if(h===''||a===''||Number.isNaN(hs)||Number.isNaN(as)||hs<0||as<0)return;
   69	    setMatches(matches.map(m=>m.id===id?{...m,homeScore:hs,awayScore:as,played:true}:m));
   70	  };
   71	  const clubName=(id:number)=>clubs.find(c=>c.id===id)?.name||'Clube';
   72	  const rounds=[...new Set(compMatches.map(m=>m.round))].sort((a,b)=>a-b);
   73	
   74	  const nav=['Visão geral','Campeonatos','Clubes','Partidas'];
   75	  return <div className="app">
   76	    <aside className="side">
   77	      <div className="brand"><div className="mark">◈</div><div><b>SPORTS TABLE</b><span>CHAMPIONSHIP MANAGER</span></div></div>
   78	      <div className="label">NAVEGAÇÃO</div>
   79	      {nav.map((x,i)=><button className={section===x?'nav active':'nav'} onClick={()=>setSection(x)} key={x}><span>{['⌂','▦','♙','◷'][i]}</span>{x}</button>)}
   80	      <div className="label lower">CAMPEONATOS</div>
   81	      {championships.map(c=><button className={selected===c.id?'champMini active':'champMini'} onClick={()=>{setSelected(c.id);setSection('Visão geral')}} key={c.id}><i/>{c.name}<small>{c.season}</small></button>)}
   82	      <div className="profile"><div className="avatar">PS</div><div><b>Administrador</b><span>Gerenciador</span></div></div>
   83	    </aside>
   84	
   85	    <main className="main">
   86	      <header><div><div className="crumb">CAMPEONATOS / <strong>{championship?.name.toUpperCase()}</strong></div><h1>{section}</h1></div><div className="actions"><button className="ghost" onClick={()=>setModal('championship')}>＋ Novo campeonato</button></div></header>
   87	      <div className="champBar"><div><span className="liveDot"/><b>{championship?.name}</b><em>{championship?.country} · {championship?.season}</em></div><select value={championship?.id||''} onChange={e=>{setSelected(Number(e.target.value));setRound(1)}}>{championships.map(c=><option value={c.id} key={c.id}>{c.name} · {c.season}</option>)}</select></div>
   88	
   89	      {section==='Visão geral'&&<><section className="stats">
   90	        <div className="stat"><span>CAMPEONATO</span><strong>{championships.length}</strong><small>cadastrados</small></div>
   91	        <div className="stat"><span>CLUBES</span><strong>{myClubs.length}</strong><small>neste campeonato</small></div>
   92	        <div className="stat"><span>PARTIDAS</span><strong>{compMatches.length}</strong><small>{compMatches.filter(m=>m.played).length} com resultado</small></div>
   93	        <div className="stat"><span>RODADAS</span><strong>{rounds.length}</strong><small>cadastradas</small></div>
   94	      </section>
   95	      <div className="grid">
   96	        <section className="panel wide"><PanelHead title="Classificação" action="Abrir partidas →" onClick={()=>setSection('Partidas')}/><Table stats={stats}/></section>
   97	        <section className="panel"><PanelHead title="Próximos jogos"/>{compMatches.filter(m=>!m.played).slice(0,5).map(m=><MatchRow key={m.id} m={m} clubName={clubName}/>)}</section>
   98	        <section className="panel"><PanelHead title="Ações rápidas"/><div className="quick"><button onClick={()=>setModal('club')}>＋ Cadastrar clube</button><button onClick={()=>setModal('championship')}>＋ Novo campeonato</button><button onClick={addRound}>＋ Adicionar rodada</button><button onClick={()=>setSection('Partidas')}>◷ Lançar resultados</button></div></section>
   99	      </div></>}
  100	
  101	      {section==='Campeonatos'&&<Manager title="Meus campeonatos" add="Novo campeonato" onAdd={()=>setModal('championship')}><div className="cards">{championships.map(c=><div className="entityCard" key={c.id}><span>{c.country} · {c.season}</span><h2>{c.name}</h2><p>{clubs.filter(x=>x.championshipId===c.id).length} clubes · {matches.filter(m=>m.championshipId===c.id).length} partidas</p><button onClick={()=>{setSelected(c.id);setSection('Visão geral')}}>Abrir →</button></div>)}</div></Manager>}
  102	
  103	      {section==='Clubes'&&<Manager title={'Clubes · '+championship?.name} add="Novo clube" onAdd={()=>setModal('club')}><div className="cards">{myClubs.map(c=><div className="entityCard" key={c.id}><span>CLUBE</span><h2>{c.name}</h2><p>{championship.country} · {championship.season}</p></div>)}</div></Manager>}
  104	
  105	      {section==='Partidas'&&<Manager title={championship?championship.name+' · Partidas':'Partidas'} add="Adicionar rodada" onAdd={addRound}>
  106	        <div className="roundBar"><label>CAMPEONATO<select value={championship?.id||''} onChange={e=>{setSelected(Number(e.target.value));setRound(1)}}>{championships.map(c=><option value={c.id} key={c.id}>{c.name} · {c.season}</option>)}</select></label><label>RODADA<select value={round} onChange={e=>setRound(Number(e.target.value))}>{rounds.map(r=><option value={r} key={r}>Rodada {r}</option>)}</select></label></div>
  107	        <div className="resultList">{compMatches.filter(m=>m.round===round).map(m=><ResultRow key={m.id} m={m} home={clubName(m.home)} away={clubName(m.away)} onSave={updateScore}/>)}</div>
  108	        {!compMatches.length&&<Empty text="Nenhuma partida cadastrada neste campeonato."/>}
  109	      </Manager>}
  110	    </main>
  111	    {modal&&<Modal type={modal} onClose={()=>setModal(null)} createChampionship={createChampionship} createClub={createClub}/>}
  112	  </div>;
  113	}
  114	
  115	function PanelHead({title,action,onClick}:{title:string;action?:string;onClick?:()=>void}){return <div className="panelHead"><div><span className="eyebrow">GESTÃO</span><h2>{title}</h2></div>{action&&<button className="textBtn" onClick={onClick}>{action}</button>}</div>}
  116	function Table({stats}:{stats:any[]}){return <table><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead><tbody>{stats.map((r,i)=><tr key={r.c.id}><td>{i+1}</td><td><b>{r.c.name}</b></td><td>{r.j}</td><td>{r.v}</td><td>{r.e}</td><td>{r.d}</td><td>{r.gp}</td><td>{r.gc}</td><td>{r.sg>0?'+'+r.sg:r.sg}</td><td><strong>{r.pts}</strong></td></tr>)}</tbody></table>}
  117	function MatchRow({m,clubName}:{m:Match;clubName:(id:number)=>string}){return <div className="match"><div className="date">RODADA {m.round} · A DEFINIR</div><div className="teams"><span>{clubName(m.home)}</span><b>×</b><span>{clubName(m.away)}</span></div></div>}
  118	function ResultRow({m,home,away,onSave}:{m:Match;home:string;away:string;onSave:(id:number,h:string,a:string)=>void}){const[h,setH]=useState(m.homeScore===null?'':String(m.homeScore));const[a,setA]=useState(m.awayScore===null?'':String(m.awayScore));return <div className="resultRow"><div><span className="eyebrow">RODADA {m.round}</span><b>{home}</b><small>vs</small><b>{away}</b></div><div className="scoreEdit"><input value={h} onChange={e=>setH(e.target.value)} inputMode="numeric"/><strong>×</strong><input value={a} onChange={e=>setA(e.target.value)} inputMode="numeric"/><button onClick={()=>onSave(m.id,h,a)}>{m.played?'Atualizar':'Salvar resultado'}</button></div></div>}
  119	function Manager({title,add,onAdd,children}:{title:string;add:string;onAdd:()=>void;children:React.ReactNode}){return <section className="manager"><div className="managerHead"><div><span className="eyebrow">CADASTRO E GESTÃO</span><h2>{title}</h2></div><button className="primary" onClick={onAdd}>＋ {add}</button></div>{children}</section>}
  120	function Empty({text}:{text:string}){return <div className="empty">{text}</div>}
  121	function Modal({type,onClose,createChampionship,createClub}:{type:string;onClose:()=>void;createChampionship:(n:string,c:string,s:string)=>void;createClub:(n:string)=>void}){const[name,setName]=useState('');const[country,setCountry]=useState('Brasil');const[season,setSeason]=useState('2026');return <div className="overlay"><div className="modal"><button className="close" onClick={onClose}>×</button><span className="eyebrow">NOVO REGISTRO</span><h2>{type==='championship'?'Novo campeonato':'Novo clube'}</h2><input autoFocus placeholder={type==='championship'?'Nome do campeonato':'Nome do clube'} value={name} onChange={e=>setName(e.target.value)}/>{type==='championship'&&<><input placeholder="País" value={country} onChange={e=>setCountry(e.target.value)}/><input placeholder="Temporada" value={season} onChange={e=>setSeason(e.target.value)}/></>}<button className="primary full" onClick={()=>type==='championship'?createChampionship(name,country,season):createClub(name)}>Salvar</button></div></div>}
  122	

types: clean (this file)