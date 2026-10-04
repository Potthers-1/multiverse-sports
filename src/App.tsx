import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

type Club = { id: number; name: string; championshipId: number; clubKey?: string; stateGroup?: string };

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
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
  tieAdvantageClubId?: number;
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
  cariocaV3: "sports-carioca-1d-v3",
  cariocaV4: "sports-carioca-1d-v4",
  cearaV7: "sports-ceara-v7",
  gauchoV2: "sports-gaucho-v2",
  goiasV1: "sports-goias-v1",
  maranhaoV1: "sports-maranhao-v1",
  matoGrossoV1: "sports-mato-grosso-v1",
  minasGeraisV1: "sports-minas-gerais-v1",
  paraV1: "sports-para-v1",
  paraibaV1: "sports-paraiba-v1",
  paranaV1: "sports-parana-v1",
  saoPauloV1: "sports-sao-paulo-v1",
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

const ALAGOAS_2_CLUBS = [
  "Zumbi","Sporting FC","Miguelense","Aliança","Jaciobá","São Domingos AL",
];

const ACRE_2_CLUBS = [
  "Atlético Acreano","Andirá","Nauás EC","Plácido de Castro",
];

const AMAPA_1_CLUBS = [
  "São José - AP","Oratório","Santos - AP","Independente - AP",
  "Trem","Ypiranga - AP","Macapá","Cristal",
];

const AMAPA_2_CLUBS = [
  "Portuguesa - AP","Cruzeiro - AP","Santana","Latidude Zero","Lagoa","Renovação",
  "Rio Norte","São Paulo - AP","Canario","Mazagão","ADEC","Bare AP",
];

const AMAZONAS_1_CLUBS = [
  "Amazonas","Manaus","Manauara","Nacional","São Raimundo","Princesa do Solimões","Parintins","Itacoatiara",
];

const AMAZONAS_2_CLUBS = [
  "CDC Manicoré","Clipper","Fast Clube","Operário","Penarol","RB do Norte","Unidos do Alvorada",
];

const BAHIA_1_CLUBS = [
  "Bahia","Vitória","Jacuipense","Juazeirense","Jequié","Porto - BA",
  "Barcelona de Ilhéus","Galícia","Bahia de Feira","Atlético de Alagoinhas",
];

const BAHIA_2_CLUBS = [
  "Fluminense de Feira","SSA","Barreiras FC","Feira","Redenção","Leônico",
  "Jacobina","Grapiúna","Vitória da Conquista","Camaçari",
];

const DISTRITO_FEDERAL_1_CLUBS = [
  "Gama","Samambaia","Sobradinho","Ceilândia","Capital","Brasiliense",
  "Real Brasília","Paranoa","Brasília","Aruc",
];

const DISTRITO_FEDERAL_2_CLUBS = [
  "Taguatinga","Planaltina","Canaa EC","Grêmio Valparaíso","Legião","Luziânia","Candango",
];

const ESPIRITO_SANTO_1_CLUBS = [
  "Vitória ES","Serra","Vilavelhense","Rio Branco ES","Porto Vitória",
  "Desportiva Ferroviaria","Real Noroeste","Forte","Capixaba SC","Rio Branco VN",
];

const ESPIRITO_SANTO_2_CLUBS = [
  "Linhares","Audax São Mateus","GEL","Doze","CTE Colatina",
  "Estrela do Norte","Rive","Tupy","Sport ES","Pinheiros",
];

const SANTA_CATARINA_1_CLUBS = [
  "Brusque","Avaí","Camboriú","Concórdia","Marcílio Dias","Joinville","Santa Catarina","Chapecoense",
  "Criciúma","Barra - SC","Figueirense","Carlos Renaux",
];
const SANTA_CATARINA_2_CLUBS = [
  "Hercílio Luz","Metropolitano","Caravaggio","Blumenau","Tubarão","Guarani de Palhoça","Fluminense - SC","Nação Esportes","Juventus de Jaraguá","Jaraguá",
];
const SANTA_CATARINA_3_CLUBS = [
  "Inter de Lages","Manchester Catarinense","Porto - SC","Caçador",
];
const CEARA_1_CLUBS = [
  "Ceará","Ferroviário","Floresta","Fortaleza","Horizonte","Iguatu","Maracanã","Maranguape","Quixadá","Tirol",
];
const CEARA_2_CLUBS = [
  "Icasa","Crato","Cariri FC","Barbalha","Guarani de Juazeiro","Itapipoca","Crateus","Guarany SC","Caucaia","Atlético CE","Ceará",
];
const CEARA_3_CLUBS = [
  "Vila Real","Acopiara","Esporte Limoeiro","Pacatuba","Calouros do Ar","Tiangua EC","Palmacia",
];
const RIO_GRANDE_DO_SUL_1_CLUBS = [
  "Avenida","Caxias","Guarany de Bagé","Grêmio","Internacional","Inter de Santa Maria",
  "Juventude","Monsoon","São José","Novo Hamburgo","São Luiz","Ypiranga",
];
const RIO_GRANDE_DO_SUL_2_CLUBS = [
  "Aimoré","APA FUT","Bagé","Brasil de Pelotas","Brasil de Farroupilha","Esportivo",
  "Gaucho","Glória","Gramadense","Guarani de VN","Lajeadense","Passo Fundo",
  "Pelotas","Santa Cruz","União Frederiquense","Veranópolis",
];
const RIO_GRANDE_DO_SUL_3_CLUBS = [
  "Panambi","Real SC","SC São Paulo","Cruz A.","Futvida","Riograndense",
  "GA Farroupilha","Clube 1992","EC Novo Horizonte","SC Rio Grande",
];
const GOIAS_1_CLUBS = [
  "ABECAT","Anapolina","Anápolis","Aparecidense","Atlético Goianiense","Centro Oeste",
  "CRAC","Goiás","Goiatuba","Inhumas","Jataiense","Vila Nova",
];
const GOIAS_2_CLUBS = [
  "Rio Verde","Bom Jesus","Mineiros","Goianesia","Morrinhos","Goiânia",
  "Tupy FC","São Luis","Trindade","Grêmio Anapolis",
];
const GOIAS_3_CLUBS = [
  "Itumbiara","Novo Horizonte","Rioverdense","America GO","Royal","Atletico Itumbiara","Real Clube",
];
const MARANHAO_1_CLUBS = [
  "Moto Club","Maranhão","Sampaio Correa","IAPE","Luminense","Tuntum","Imperatriz","ITZ Sport",
];
const MARANHAO_2_CLUBS = [
  "Araioses","São Luis","Tupan","Expressinho","Americano Bacabal","São José MA","Lago Verde",
  "Pinheiro","Viana","Timon EC","Cordino EC","Balsas",
];
const MATO_GROSSO_1_CLUBS = [
  "Luverdense","Mixto","Operário VG","Sport Sinnop","Cuiabá","Nova Mutum",
  "Chapada","União Rondonópolis","Primavera AC","Várzea Grande",
];
const MATO_GROSSO_2_CLUBS = [
  "Sinop FC","Sorriso EC","Santa Cruz MT","Grêmio Sorriso","Campo Novo",
  "Uirapuru","Ação","Cacerense","Paulistano FC","Atlético MT",
];

const MINAS_GERAIS_1_CLUBS = [
  "América MG","Athletic","Atlético MG","Betim","Cruzeiro","Democrata GV",
  "Itabirito","North","Pouso Alegre","Tombense","Uberlândia","URT",
];
const MINAS_GERAIS_2_CLUBS = [
  "Aymorés","Boa Esporte","Caldense","Coimbra FC","Democrata SL","Guarani",
  "Ipatinga","Mamoré","Patrocinense","Uberaba","Valeriodoce","Villa Nova",
];
const MINAS_GERAIS_3_CLUBS = [
  "Venda Nova","Nacional de Muriaé","Novo Esporte","Inter de Minas","Nova Lavras",
  "Santarritense","Paracatu","Betim 2","São João del Rei","Funorte","Araxa","Siderurgica",
];

const CARIOCA_1_CLUBS = [
  "Fluminense","Vasco da Gama","Volta Redonda","Bangu","Portuguesa - RJ","Sampaio Corrêa - RJ",
  "Botafogo","Madureira","Boavista - RJ","Flamengo","Nova Iguaçu","Maricá",
];

const CARIOCA_2_FIXED_CLUBS = [
  "Americano","Resende","America","Pérolas Negras","São Gonçalo EC","Bonsucesso",
  "Olaria","Cabofriense","Araruama","Serrano","Audax Rio",
];

const CARIOCA_3_CLUBS = [
  "Duque de Caxias","Niteroiense","Univassouras Artsul","Campo Grande","Goytacaz","Petrópolis",
  "São Cristóvão","Macaé","Carapebus","Audax Rio","Serrano","Nova Cidade",
];

const CARIOCA_4_CLUBS = [
  "Friburguense","Santa Cruz - RJ","7 de Abril","Paduano","Belford Roxo","Serra Macaense",
  "Rio de Janeiro","Paraty","Cardoso Moreira","Búzios","Campos","Barra Mansa",
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
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão do Campeonato Acreano.",
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

function buildAcreSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Acreano - 2ª Divisão",
    "Turno e returno",
    "4 clubes jogam entre si em turno e returno. Os 2 primeiros garantem o acesso para a 1ª divisão estadual. O 1º colocado é declarado campeão.",
    "Os 2 primeiros colocados garantem acesso à 1ª divisão estadual.",
    "Não há rebaixamento informado para a 2ª divisão.",
    4,
    6,
    2,
    "Acre"
  );
  const clubs:Club[] = ACRE_2_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,2);
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
    "O último colocado da 1ª fase é rebaixado para a 2ª Divisão do Campeonato Alagoano.",
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

function buildAlagoasSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Alagoano - 2ª Divisão",
    "Turno único + semifinais + final",
    "6 clubes jogam entre si em turno único. Os 4 primeiros avançam para as semifinais. As semifinais e a final são disputadas em dois jogos.",
    "Somente o campeão garante acesso para a 1ª Divisão do Campeonato Alagoano.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    6,
    5,
    1,
    "Alagoas"
  );
  const clubs:Club[] = ALAGOAS_2_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildAmapaChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Amapaense",
    "Turno único + semifinais + final",
    "8 clubes jogam entre si em turno único. Os 4 primeiros se classificam para as semifinais. As semifinais e a final são disputadas em dois jogos.",
    "O campeão amapaense é o vencedor da final.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão do Campeonato Amapaense.",
    8,
    7,
    1,
    "Amapá"
  );
  const clubs:Club[] = AMAPA_1_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildAmapaSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Amapaense - 2ª Divisão",
    "2 grupos + semifinais + final",
    "12 clubes divididos em dois grupos de 6. Cada grupo joga entre si em turno único. Os 2 primeiros de cada grupo avançam às semifinais. As semifinais e a final são disputadas em dois jogos. Os dois finalistas conquistam o acesso para a 1ª Divisão do Campeonato Amapaense.",
    "Os dois finalistas garantem acesso à 1ª Divisão do Campeonato Amapaense.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    12,
    5,
    1,
    "Amapá"
  );
  const shuffled=shuffle(AMAPA_2_CLUBS);
  const groupA=shuffled.slice(0,6);
  const groupB=shuffled.slice(6,12);
  const clubs:Club[]=shuffled.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const result:Match[]=[];
  const idsFor=(names:string[])=>names.map(name=>clubs.find(c=>c.name===name)!.id);
  result.push(...roundRobin(idsFor(groupA),championshipId,startMatchId,1,0,"A"));
  let next=nextId(result);
  result.push(...roundRobin(idsFor(groupB),championshipId,next,1,0,"B"));
  return {championship,clubs,matches:result};
}

function buildBahiaChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Baiano",
    "Turno único + semifinais + final",
    "As dez equipes disputam a primeira fase em turno único. Os quatro mais bem colocados avançam à semifinal. Os 2 últimos colocados são rebaixados. Semifinal e final são disputadas no sistema mata-mata em jogos apenas de ida. Em caso de empate, o confronto será definido em disputa de pênaltis pelo sistema.",
    "O campeão baiano é o vencedor da final.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão do Campeonato Baiano.",
    10,
    9,
    1,
    "Bahia"
  );
  const clubs:Club[]=BAHIA_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildBahiaSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Baiano - 2ª Divisão",
    "Turno único + semifinais + final",
    "Na primeira fase, os dez participantes se enfrentarão em turno único com pontos corridos. Os quatro primeiros colocados se qualificarão para as semifinais, disputadas em jogos de ida e volta. Os vencedores prosseguirão para a decisão, disputada em duas partidas. O campeão e o vice-campeão garantem o acesso.",
    "O campeão e o vice-campeão garantem acesso à 1ª Divisão do Campeonato Baiano.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    10,
    9,
    1,
    "Bahia"
  );
  const clubs:Club[]=BAHIA_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildDistritoFederalChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,"Estadual","2026","Campeonato Brasiliense",
    "Turno único + semifinais + final",
    "As dez equipes disputam a primeira fase em turno único. Os quatro mais bem colocados avançam à semifinal. Os 2 últimos colocados são rebaixados. A semifinal será disputada em jogos de ida e volta, enquanto a final será disputada em jogo único. Em caso de empate, o confronto será definido em disputa de pênaltis pelo sistema.",
    "O campeão brasiliense é o vencedor da final.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão do Campeonato Brasiliense.",
    10,9,1,"Distrito Federal"
  );
  const clubs:Club[]=DISTRITO_FEDERAL_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildEspiritoSantoChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Capixaba",
    "Turno único + quartas + semifinais + final",
    "10 equipes disputam a primeira fase em turno único. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em jogos de ida e volta. Os 2 últimos colocados da primeira fase são rebaixados.",
    "O campeão capixaba é o vencedor da final.",
    "Os 2 últimos colocados da primeira fase são rebaixados.",
    10,
    9,
    1,
    "Espírito Santo"
  );
  const clubs:Club[]=ESPIRITO_SANTO_1_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildEspiritoSantoSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Capixaba - 2ª Divisão",
    "2 grupos + semifinais + final",
    "10 equipes são divididas em 2 grupos de 5 e jogam em turno e returno dentro de seus próprios grupos. Os 2 primeiros de cada grupo avançam às semifinais, disputadas em ida e volta. A final é disputada em jogo único. Os dois finalistas garantem o acesso.",
    "Os dois finalistas garantem acesso à 1ª Divisão do Campeonato Capixaba.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    10,
    8,
    2,
    "Espírito Santo"
  );
  const shuffled=shuffle(ESPIRITO_SANTO_2_CLUBS);
  const groupA=shuffled.slice(0,5);
  const groupB=shuffled.slice(5,10);
  const clubs:Club[]=shuffled.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const result:Match[]=[];
  const idsFor=(names:string[])=>names.map(name=>clubs.find(c=>c.name===name)!.id);
  result.push(...roundRobin(idsFor(groupA),championshipId,startMatchId,2,0,"A"));
  let next=nextId(result);
  result.push(...roundRobin(idsFor(groupB),championshipId,next,2,0,"B"));
  return {championship,clubs,matches:result};
}

function buildSantaCatarinaFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Catarinense","Turno único + quartas + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas, semifinais e final são disputadas em ida e volta. Os 2 últimos são rebaixados.","O campeão é o vencedor da final.","Os 2 últimos da primeira fase são rebaixados para a 2ª Divisão.",12,11,1,"Santa Catarina");
  const clubs:Club[]=SANTA_CATARINA_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}
function buildSantaCatarinaSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Catarinense - 2ª Divisão","Turno e returno","10 clubes disputam turno e returno. Os 2 primeiros garantem acesso à 1ª Divisão. O último é rebaixado à 3ª Divisão. Não há mata-mata.","Os 2 primeiros garantem acesso à 1ª Divisão.","O último é rebaixado para a 3ª Divisão.",10,18,2,"Santa Catarina");
  const clubs:Club[]=SANTA_CATARINA_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,2)};
}
function buildSantaCatarinaThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Catarinense - 3ª Divisão","Turno e returno + final","4 clubes disputam uma fase única em dois turnos. Os 2 primeiros avançam à final. Apenas o campeão garante o acesso à 2ª Divisão.","Apenas o campeão garante acesso à 2ª Divisão.","Não há rebaixamento informado.",4,6,2,"Santa Catarina");
  const clubs:Club[]=SANTA_CATARINA_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,2)};
}
function buildCearaFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Cearense",
    "Turno único + semifinais + final",
    "10 clubes disputam uma fase única em turno único, todos contra todos, em 9 rodadas (45 jogos). Os 4 primeiros avançam às semifinais. As semifinais são disputadas em ida e volta e a final também em ida e volta. Em qualquer confronto eliminatório empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "O campeão é o vencedor da final.",
    "Os 2 últimos colocados da fase única são rebaixados para a 2ª Divisão.",
    10,
    9,
    1,
    "Ceará"
  );
  const clubs:Club[]=CEARA_1_CLUBS.map((name,i)=>({
    id:startClubId+i,
    name,
    championshipId,
    clubKey:makeClubKey(name)
  }));
  return {
    championship,
    clubs,
    matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)
  };
}

function buildCearaSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Cearense - 2ª Divisão",
    "Turno único + semifinais + final",
    "Os 11 clubes informados disputam uma fase única em turno único, todos contra todos, em 11 rodadas (55 jogos). Os 4 primeiros avançam às semifinais. As semifinais são disputadas em ida e volta e a final também em ida e volta. Em qualquer confronto eliminatório empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "Os dois finalistas garantem acesso à 1ª Divisão.",
    "Os 2 últimos colocados da fase única são rebaixados para a 3ª Divisão.",
    11,
    11,
    1,
    "Ceará"
  );
  const clubs:Club[]=CEARA_2_CLUBS.map((name,i)=>({
    id:startClubId+i,
    name,
    championshipId,
    clubKey:makeClubKey(name)
  }));
  return {
    championship,
    clubs,
    matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)
  };
}

function buildCearaThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Cearense - 3ª Divisão",
    "Turno único + semifinais + final",
    "7 clubes disputam uma fase única em turno único, todos contra todos, em 7 rodadas (21 jogos). Os 4 primeiros avançam às semifinais. As semifinais são disputadas em ida e volta e a final também em ida e volta. Em qualquer confronto eliminatório empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "Os dois finalistas garantem acesso à 2ª Divisão.",
    "Não há rebaixamento informado para a 3ª Divisão.",
    7,
    7,
    1,
    "Ceará"
  );
  const clubs:Club[]=CEARA_3_CLUBS.map((name,i)=>({
    id:startClubId+i,
    name,
    championshipId,
    clubKey:makeClubKey(name)
  }));
  return {
    championship,
    clubs,
    matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)
  };
}


function buildRioGrandeDoSulFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Gaúcho",
    "Turno único + quartas + semifinais + final",
    "Os 12 clubes informados disputam uma fase única em turno único, todos contra todos, em 11 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "O campeão é o vencedor da final do Campeonato Gaúcho.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",
    12,11,1,"Rio Grande do Sul"
  );
  const clubs:Club[]=RIO_GRANDE_DO_SUL_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildRioGrandeDoSulSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Gaúcho - 2ª Divisão",
    "Turno único + quartas + semifinais + final",
    "Os 16 clubes disputam uma primeira fase em turno único, em 15 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em ida e volta.",
    "Os dois finalistas garantem acesso à 1ª Divisão.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 3ª Divisão.",
    16,15,1,"Rio Grande do Sul"
  );
  const clubs:Club[]=RIO_GRANDE_DO_SUL_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildRioGrandeDoSulThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Gaúcho - 3ª Divisão",
    "Turno único + semifinais + final",
    "Os 10 clubes disputam uma primeira fase em turno único, em 9 rodadas. Os 4 primeiros avançam ao mata-mata. As semifinais e a final são disputadas em ida e volta.",
    "Os dois finalistas garantem acesso à 2ª Divisão.",
    "Não há rebaixamento informado para a 3ª Divisão.",
    10,9,1,"Rio Grande do Sul"
  );
  const clubs:Club[]=RIO_GRANDE_DO_SUL_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}


function buildGoiasFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Goiano",
    "Turno único + quartas + semifinais + final",
    "Os 12 clubes disputam uma fase única em turno único, em 11 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "O campeão é o vencedor da final do Campeonato Goiano.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",
    12,11,1,"Goiás"
  );
  const clubs:Club[]=GOIAS_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildGoiasSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Goiano - 2ª Divisão",
    "Turno e returno",
    "Os 10 clubes disputam 18 rodadas em turno e returno. Não há mata-mata. Os 2 primeiros garantem acesso à 1ª Divisão e os 2 últimos são rebaixados para a 3ª Divisão.",
    "Os 2 primeiros colocados garantem acesso à 1ª Divisão.",
    "Os 2 últimos colocados são rebaixados para a 3ª Divisão.",
    10,18,2,"Goiás"
  );
  const clubs:Club[]=GOIAS_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,2)};
}

function buildGoiasThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Goiano - 3ª Divisão",
    "Turno e returno",
    "Os 7 clubes disputam 12 rodadas em turno e returno. Não há mata-mata. Os 2 primeiros garantem acesso à 2ª Divisão.",
    "Os 2 primeiros colocados garantem acesso à 2ª Divisão.",
    "Não há rebaixamento informado para a 3ª Divisão.",
    7,12,2,"Goiás"
  );
  const clubs:Club[]=GOIAS_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,2)};
}

function buildMaranhaoFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Maranhense",
    "Turno único + semifinais + final",
    "Os 8 clubes disputam uma fase única em turno único, em 7 rodadas. Os 4 primeiros avançam ao mata-mata. Semifinais e final são disputadas em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "O campeão é o vencedor da final do Campeonato Maranhense.",
    "Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",
    8,7,1,"Maranhão"
  );
  const clubs:Club[]=MARANHAO_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMaranhaoSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Maranhense - 2ª Divisão",
    "Turno único + quartas + semifinais + final",
    "Os 12 clubes disputam uma fase única em turno único, em 11 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    "Os dois finalistas garantem acesso à 1ª Divisão.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    12,11,1,"Maranhão"
  );
  const clubs:Club[]=MARANHAO_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMatoGrossoFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Mato-Grossense","Turno único + semifinais + final","10 clubes disputam turno único em 9 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","O campeão é o vencedor da final.","Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",10,9,1,"Mato Grosso");
  const clubs:Club[]=MATO_GROSSO_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMatoGrossoSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Mato-Grossense - 2ª Divisão","Turno único + semifinais + final","10 clubes disputam turno único em 9 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 1ª Divisão.","Não há rebaixamento informado para esta divisão.",10,9,1,"Mato Grosso");
  const clubs:Club[]=MATO_GROSSO_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

const PARA_1_CLUBS = [
  "Amazônia","Bragantino-PA","Cametá","Capitão Poço","Castanhal","Paysandu",
  "Remo","Santa Rosa","São Francisco-PA","São Raimundo-PA","Tuna Luso","Águia de Marabá",
];
const PARA_2_CLUBS = [
  "Caeté","Santos PA","Canaã","Urumajo","Paragominas","Marajo",
  "Independente","Izabelense","União Paraense","Carajas","Itupiranga","Atlético Paraense",
];
const PARA_3_CLUBS = [
  "Pedreira","Venus","ESMAC","Pinheirense","Tesla","Paraense SC",
  "Sport Belem","Belenense","CA Vila Rica","Gavião","Paraupebas","Altamira",
];

const PARANA_1_CLUBS = [
  "Londrina","Foz do Iguaçu","Athletico-PR","São Joseense","Maringá FC","Cascavel",
  "Azuriz","Coritiba","Cianorte","Operário-PR","Andraus","Galo Maringá",
];
const PARANA_2_CLUBS = [
  "Paraná","Patriotas","Laranja Mecânica","Arauacaria","Rio Branco-PR","Paranavaí-PR",
  "Nacional-PR","Toledo","Batel","Prudentópolis",
];
const PARANA_3_CLUBS = [
  "AA Iguaçu","Hope Internacional","Iraty","Samas","Parana STC","CA Cambé",
  "City London","Londrinense","Oeste Brasil","União PR","Campo Mourão",
];

function buildParanaFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paranaense","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.","O campeão é o vencedor da final do Campeonato Paranaense.","Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",12,11,1,"Paraná");
  const clubs:Club[]=PARANA_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParanaSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paranaense - 2ª Divisão","Turno único + quartas + semifinais + final","10 clubes disputam turno único em 9 rodadas. Os 8 primeiros avançam ao mata-mata. Quartas de final, semifinais e final são disputadas em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.","Os dois finalistas garantem acesso à 1ª Divisão.","Os 2 últimos colocados da primeira fase são rebaixados para a 3ª Divisão.",10,9,1,"Paraná");
  const clubs:Club[]=PARANA_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParanaThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paranaense - 3ª Divisão","Turno único + semifinais + final","11 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Em qualquer confronto empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.","Os dois finalistas garantem acesso à 2ª Divisão.","Não há rebaixamento informado para a 3ª Divisão.",11,11,1,"Paraná");
  const clubs:Club[]=PARANA_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

const SAO_PAULO_1_CLUBS = [
  "Botafogo-SP","Capivariano","Corinthians","Guarani","Mirassol","Noroeste","Novorizontino","Palmeiras",
  "Ponte Preta","Portuguesa","Primavera","Red Bull Bragantino","Santos","São Bernardo","São Paulo","Velo Clube",
];
const SAO_PAULO_2_CLUBS = [
  "Água Santa","Ferroviária","Ituano","São José-SP","Sertãozinho","Votuporanguense","Juventus-SP","XV de Piracicaba",
  "Osasco Sporting","Santo André","Taubaté","Inter de Limeira","Linense","Monte Azul","Grêmio Prudente","São Bento",
];
const SAO_PAULO_3_CLUBS = [
  "Portuguesa Santista","Marília","Rio Preto","XV de Jaú","Rio Claro","União Barbarense","EC São Bernardo","Paulista",
  "União São João","Catanduva","Bandeirante","Rio Branco SP","Francana","Itapirense","Desportivo Brasil","União Suzano",
];
const SAO_PAULO_4_CLUBS = [
  "Inter de Bebedouro","São Caetano","Penapolense","São Carlense","Barretos EC","Taquaritinga","Jacarei FC","Lemense",
  "ECUS SP","Comercial","Tanabi","Jabaquara","Vocem","Colorado Caieiras","Nacional SP","AEA Araçatuba",
];
const SAO_PAULO_5_CLUBS = [
  "José Bonifacio EC","America SP","Assisense","Tupã","Riopretano","Santa Fé SP","Independente de Limeira","Matonense",
  "São Carlos","Santacruzense","Mogi Mirim","Catanduvense","Flamengo de Guarulhos","Paulinense","Audax-SP","Paulinia FU",
  "Votoraty SP","Guarulhos","Itaqua","Mauá","União Mogi","Manthiqueira","Mauaense","Barcelona SP",
];

function buildSaoPauloDivision(championshipId:number,startClubId:number,startMatchId:number,division:number){
  const lists=[SAO_PAULO_1_CLUBS,SAO_PAULO_2_CLUBS,SAO_PAULO_3_CLUBS,SAO_PAULO_4_CLUBS,SAO_PAULO_5_CLUBS];
  const names=["Campeonato Paulista","Campeonato Paulista - 2ª Divisão","Campeonato Paulista - 3ª Divisão","Campeonato Paulista - 4ª Divisão","Campeonato Paulista - 5ª Divisão"];
  const clubsList=lists[division-1];
  const name=names[division-1];
  const isFifth=division===5;
  const promotion=division===1
    ? "O campeão é o vencedor da final. Não há acesso informado para a 1ª Divisão."
    : "Os dois finalistas garantem acesso à divisão imediatamente superior.";
  const relegation=division===5
    ? "Não há rebaixamento informado para a 5ª Divisão."
    : "Os 2 últimos colocados da primeira fase são rebaixados para a divisão imediatamente inferior.";
  const regulation=isFifth
    ? "24 clubes divididos em 4 grupos de 6. A primeira fase é disputada em turno e returno dentro de cada grupo. Os 4 primeiros de cada grupo avançam ao mata-mata de 16 clubes, disputado em ida e volta."
    : "16 clubes disputam turno único em 15 rodadas. Os 8 melhores avançam ao mata-mata, disputado em ida e volta.";
  const championship=makeChampionship(
    championshipId,"Estadual","2026",name,
    isFifth ? "4 grupos + oitavas + quartas + semifinais + final" : "Turno único + oitavas + quartas + semifinais + final",
    regulation+" Em qualquer confronto eliminatório empatado no agregado, o sistema define automaticamente o vencedor nos pênaltis.",
    promotion,relegation,clubsList.length,isFifth?10:15,1,"São Paulo"
  );
  const clubs:Club[]=clubsList.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  let matches:Match[]=[];
  if(isFifth){
    const groups=["A","B","C","D"];
    for(let g=0;g<4;g++){
      const ids=clubs.slice(g*6,g*6+6).map(c=>c.id);
      matches.push(...roundRobin(ids,championshipId,startMatchId+matches.length,2,0,groups[g]));
    }
  } else {
    matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  }
  return {championship,clubs,matches};
}

const PARAIBA_1_CLUBS = [
  "Atlético PB","Botafogo PB","Campinense","Confiança-PB","Esporte",
  "Nacional de Patos","Pombal","Serra Branca","Sousa","Treze",
];
const PARAIBA_2_CLUBS = [
  "Santa Rita","Auto Esporte","Desportiva Guarabira","São Paulo Crystal","Cruzeiro-PB",
  "Spartax","Serrano-PB","Sport-PB","Picuiense","Femar",
];

function buildParaibaFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paraibano","Turno único + semifinais + final","10 clubes disputam turno único em 9 rodadas. Os 4 primeiros avançam às semifinais, disputadas em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","O campeão é o vencedor da fase final.","Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",10,9,1,"Paraíba");
  const clubs:Club[]=PARAIBA_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParaibaSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paraibano - 2ª Divisão","Turno único + semifinais + final","10 clubes disputam turno único em 9 rodadas. Os 4 primeiros avançam às semifinais, disputadas em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 1ª Divisão.","Não há rebaixamento informado para a 2ª Divisão.",10,9,1,"Paraíba");
  const clubs:Club[]=PARAIBA_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParaFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paraense","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","O campeão é o vencedor da final.","Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",12,11,1,"Pará");
  const clubs:Club[]=PARA_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParaSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paraense - 2ª Divisão","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 1ª Divisão.","Os 2 últimos colocados da primeira fase são rebaixados para a 3ª Divisão.",12,11,1,"Pará");
  const clubs:Club[]=PARA_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildParaThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Paraense - 3ª Divisão","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 2ª Divisão.","Não há rebaixamento informado para a 3ª Divisão.",12,11,1,"Pará");
  const clubs:Club[]=PARA_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMinasGeraisFirstDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Mineiro","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","O campeão é o vencedor da final.","Os 2 últimos colocados da primeira fase são rebaixados para a 2ª Divisão.",12,11,1,"Minas Gerais");
  const clubs:Club[]=MINAS_GERAIS_1_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMinasGeraisSecondDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Mineiro - 2ª Divisão","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 1ª Divisão.","Os 2 últimos colocados da primeira fase são rebaixados para a 3ª Divisão.",12,11,1,"Minas Gerais");
  const clubs:Club[]=MINAS_GERAIS_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildMinasGeraisThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(championshipId,"Estadual","2026","Campeonato Mineiro - 3ª Divisão","Turno único + semifinais + final","12 clubes disputam turno único em 11 rodadas. Os 4 primeiros avançam ao mata-mata, com semifinais e final em ida e volta. Empate no agregado é decidido automaticamente nos pênaltis.","Os dois finalistas garantem acesso à 2ª Divisão.","Não há rebaixamento informado para a 3ª Divisão.",12,11,1,"Minas Gerais");
  const clubs:Club[]=MINAS_GERAIS_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildCariocaFirstDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship=makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Carioca",
    "Turno único + quartas + semifinais + final",
    "Os 12 clubes disputam uma fase única em turno único, todos contra todos, em 11 rodadas. Os 8 primeiros colocados avançam às quartas de final, disputadas em jogo único. As semifinais são disputadas em ida e volta e a final em jogo único. Em qualquer mata-mata, empate no confronto é decidido automaticamente nos pênaltis pelo sistema.",
    "O campeão é o vencedor da final do Campeonato Carioca.",
    "O 12º colocado é rebaixado diretamente para a 2ª Divisão. O 11º colocado disputa um play-off de permanência contra o vice-campeão da 2ª Divisão. O vencedor joga a 1ª Divisão na temporada seguinte e o perdedor joga a 2ª Divisão.",
    12,
    11,
    1,
    "Rio de Janeiro"
  );
  const clubs:Club[]=[
    "Fluminense","Vasco da Gama","Volta Redonda","Bangu","Portuguesa - RJ","Sampaio Corrêa - RJ",
    "Botafogo","Madureira","Boavista - RJ","Flamengo","Nova Iguaçu","Maricá"
  ].map((name,i)=>({
    id:startClubId+i,
    name,
    championshipId,
    clubKey:makeClubKey(name)
  }));
  return {
    championship,
    clubs,
    matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)
  };
}
function buildCariocaSecondDivision(championshipId:number,startClubId:number,startMatchId:number,relegatedClub:string){
  const names=[...CARIOCA_2_FIXED_CLUBS,relegatedClub];
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Carioca - 2ª Divisão",
    "Taça Santos Dumont + semifinais + final + play-off de permanência",
    "A Taça Santos Dumont é disputada por 12 clubes em grupo único, em turno único de 11 rodadas. Os 4 melhores avançam às semifinais. Os vencedores disputam a final. O campeão sobe diretamente. Depois da final, o vice disputa um play-off de permanência contra o 11º colocado da 1ª Divisão. O vencedor joga a 1ª Divisão na temporada seguinte e o perdedor joga a 2ª Divisão. Os dois últimos da Taça Santos Dumont são rebaixados.",
    "O campeão é promovido diretamente. O vice-campeão disputa, após a final, um play-off de permanência contra o 11º colocado da 1ª Divisão; o vencedor disputará a 1ª Divisão na temporada seguinte e o perdedor disputará a 2ª Divisão.",
    "Os dois últimos colocados da Taça Santos Dumont são rebaixados.",
    12,11,1,"Rio de Janeiro"
  );
  const clubs:Club[]=names.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildCariocaThirdDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Carioca - 3ª Divisão",
    "Taça Corcovado + semifinais + final",
    "A Taça Corcovado é disputada por 12 clubes em grupo único, em turno único de 11 rodadas. Os 4 melhores avançam às semifinais e os vencedores disputam a final.",
    "O campeão e o vice-campeão são promovidos à 2ª Divisão.",
    "Os dois últimos colocados da Taça Corcovado são rebaixados.",
    12,11,1,"Rio de Janeiro"
  );
  const clubs:Club[]=CARIOCA_3_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildCariocaFourthDivision(championshipId:number,startClubId:number,startMatchId:number){
  const championship=makeChampionship(
    championshipId,"Estadual","2026","Campeonato Carioca - 4ª Divisão",
    "Taça Maracanã + semifinais + final",
    "As 12 equipes disputam a Taça Maracanã em grupo único, em turno único. As 4 melhores avançam às semifinais. A disputa segue com o mata-mata até a final; os finalistas garantem acesso.",
    "Os dois finalistas garantem acesso à 3ª Divisão.",
    "Não há rebaixamento na 4ª Divisão.",
    12,11,1,"Rio de Janeiro"
  );
  const clubs:Club[]=CARIOCA_4_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildDistritoFederalSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,"Estadual","2026","Campeonato Brasiliense - 2ª Divisão",
    "Turno único",
    "Fase única com 7 clubes em turno único. Os 2 primeiros colocados garantem o acesso à 1ª Divisão do Campeonato Brasiliense. O 1º colocado é declarado campeão.",
    "Os dois primeiros colocados garantem acesso à 1ª Divisão; o 1º colocado é o campeão.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    7,7,1,"Distrito Federal"
  );
  const clubs:Club[]=DISTRITO_FEDERAL_2_CLUBS.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  return {championship,clubs,matches:roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1)};
}

function buildAmazonasChampionship(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Amazonense",
    "Turno único + semifinais + final",
    "Os 8 clubes jogam entre si em turno único. Os 4 primeiros colocados avançam às semifinais, em sistema de cruzamento olímpico: 1º x 4º e 2º x 3º. As semifinais e a final são disputadas em jogo único. Em caso de empate, a decisão será definida nos pênaltis pelo sistema.",
    "O campeão é o vencedor da final.",
    "O pior time da classificação geral será rebaixado para a 2ª Divisão do Campeonato Amazonense.",
    8,
    7,
    1,
    "Amazonas"
  );
  const clubs:Club[]=AMAZONAS_1_CLUBS.map((name,i)=>({
    id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)
  }));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function buildAmazonasSecondDivision(championshipId:number, startClubId:number, startMatchId:number) {
  const championship = makeChampionship(
    championshipId,
    "Estadual",
    "2026",
    "Campeonato Amazonense - 2ª Divisão",
    "Turno único + semifinais + final",
    "Na primeira fase, as equipes participantes jogarão apenas um turno entre si. As (4) quatro equipes melhores colocadas avançarão direto para a segunda fase. Na fase seguinte, as disputas dos dois jogos serão realizadas em confrontos de jogo único. As semifinais serão da seguinte maneira: 1º lugar x 4ª lugar e 2º lugar x 3º lugar. Ao final do tempo regulamentar dos jogos das semifinais, o placar estando empatado, a decisão ocorrerá em cobranças de penalidades. Na final, os clubes vencedores dos confrontos das semifinais se enfrentarão em jogo único. O campeão garante o acesso.",
    "Somente o campeão garante acesso à 1ª Divisão do Campeonato Amazonense.",
    "Não há rebaixamento informado para a 2ª Divisão.",
    7,
    6,
    1,
    "Amazonas"
  );
  const shuffled=shuffle(AMAZONAS_2_CLUBS);
  const clubs:Club[]=shuffled.map((name,i)=>({id:startClubId+i,name,championshipId,clubKey:makeClubKey(name)}));
  const matches=roundRobin(clubs.map(c=>c.id),championshipId,startMatchId,1);
  return {championship,clubs,matches};
}

function tableFor(
  championship: Championship,
  clubIds: number[],
  matches: Match[],
  stage: Stage = "regular",
  group?: string,
  roundFrom?: number,
  roundTo?: number
): TableRow[] {
  const rows = clubIds.map((clubId) => ({
    clubId, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0,
  }));

  const byId = new Map(rows.map((r) => [r.clubId, r]));
  matches
    .filter((m) =>
      m.championshipId === championship.id &&
      (m.played || (m.homeScore !== null && m.awayScore !== null)) &&
      m.stage === stage &&
      (group === undefined || m.group === group) &&
      (roundFrom === undefined || m.round >= roundFrom) &&
      (roundTo === undefined || m.round <= roundTo)
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

function penaltyShootout() {
  const winnerHome = Math.random() < 0.5;
  const winnerScore = 3 + Math.floor(Math.random() * 3);
  const loserScore = Math.floor(Math.random() * winnerScore);
  return winnerHome
    ? { home: winnerScore, away: loserScore }
    : { home: loserScore, away: winnerScore };
}

function resolveAutomaticPenalties(allMatches: Match[]) {
  const updated = allMatches.map((m) => ({ ...m }));
  for (const m of updated) {
    if (!m.played || m.penaltyWinner) continue;
    if (!(m.stage === "knockout" || m.stage === "final" || m.stage === "playoff")) continue;

    const teams = [m.home, m.away].sort((a,b)=>a-b);
    const related = updated.filter((x) => {
      if (!x.played || x.championshipId !== m.championshipId || x.stage !== m.stage) return false;
      if (m.stage === "knockout" && x.knockoutRound !== m.knockoutRound) return false;
      const pair = [x.home, x.away].sort((a,b)=>a-b);
      return pair[0] === teams[0] && pair[1] === teams[1];
    });

    if (!related.length || related.length > 2 || !related.every((x)=>x.played)) continue;
    const homeId = m.home;
    const awayId = m.away;
    const homeGoals = related.reduce((sum,x)=>sum + (x.home===homeId ? (x.homeScore??0) : x.away===homeId ? (x.awayScore??0) : 0),0);
    const awayGoals = related.reduce((sum,x)=>sum + (x.home===awayId ? (x.homeScore??0) : x.away===awayId ? (x.awayScore??0) : 0),0);

    if (homeGoals !== awayGoals || related.some((x)=>x.tieAdvantageClubId)) continue;

    const shootout = penaltyShootout();
    const winner = shootout.home > shootout.away ? homeId : awayId;
    const last = [...related].sort((a,b)=>b.round-a.round)[0];
    const target = updated.find((x)=>x.id===last.id);
    if (target) {
      target.penaltyWinner = winner;
      target.penaltyHomeScore = shootout.home;
      target.penaltyAwayScore = shootout.away;
    }
  }
  return updated;
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

function knockoutWinner(matches: Match[], phase: number, championshipId?: number) {
  const phaseMatches = matches.filter((m) =>
    m.stage === "knockout" &&
    m.knockoutRound === phase &&
    (championshipId === undefined || m.championshipId === championshipId)
  );
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
      if (!second.penaltyWinner) return [];
      winners.push(second.penaltyWinner);
    }
  }
  return winners;
}

function isCearaChampionship(name:string) {
  return name==="Campeonato Cearense" ||
    name==="Campeonato Cearense - 2ª Divisão" ||
    name==="Campeonato Cearense - 3ª Divisão";
}

function cearaRegularMatchCount(championshipName:string) {
  if(championshipName==="Campeonato Cearense") return 45;
  if(championshipName==="Campeonato Cearense - 2ª Divisão") return 55;
  if(championshipName==="Campeonato Cearense - 3ª Divisão") return 21;
  return 0;
}

function twoLegTieWinner(matches:Match[], championshipId:number, stage:"knockout"|"final", round?:number) {
  const phase=matches.filter(m =>
    m.championshipId===championshipId &&
    m.stage===stage &&
    (round===undefined || m.knockoutRound===round)
  );
  if(phase.length!==2 || !phase.every(m=>m.played)) return null;

  const teams=[...new Set(phase.flatMap(m=>[m.home,m.away]))];
  if(teams.length!==2) return null;

  const totals=teams.map(clubId=>({
    clubId,
    goals:phase.reduce((sum,m)=>{
      if(m.home===clubId) return sum+(m.homeScore??0);
      if(m.away===clubId) return sum+(m.awayScore??0);
      return sum;
    },0)
  }));

  if(totals[0].goals>totals[1].goals) return totals[0].clubId;
  if(totals[1].goals>totals[0].goals) return totals[1].clubId;

  const last=[...phase].sort((a,b)=>b.round-a.round)[0];
  return last.penaltyWinner ?? null;
}

function createCearaPhase(
  championship:Championship,
  clubs:Club[],
  currentMatches:Match[]
): {matches:Match[]; section:string; message:string} | null {
  if(championship.division!=="Estadual" || !isCearaChampionship(championship.name)) return null;

  const own=currentMatches.filter(m=>m.championshipId===championship.id);
  const regular=own.filter(m=>m.stage==="regular");
  const semis=own.filter(m=>m.stage==="knockout" && m.knockoutRound===4);
  const final=own.filter(m=>m.stage==="final");
  const expected=cearaRegularMatchCount(championship.name);

  if(final.length>0) return null;

  if(regular.length===expected && regular.every(m=>m.played) && semis.length===0) {
    const table=tableFor(
      championship,
      clubs.filter(c=>c.championshipId===championship.id).map(c=>c.id),
      currentMatches,
      "regular"
    );
    if(table.length<4) return null;

    const pairs=[
      [table[0].clubId,table[3].clubId],
      [table[1].clubId,table[2].clubId]
    ];
    const next=[...currentMatches];
    let id=nextId(next);
    const baseRound=championship.rounds+1;

    pairs.forEach(([home,away])=>{
      next.push({
        id:id++,
        championshipId:championship.id,
        round:baseRound,
        home,
        away,
        homeScore:null,
        awayScore:null,
        played:false,
        stage:"knockout",
        knockoutRound:4,
        group:"ida"
      });
      next.push({
        id:id++,
        championshipId:championship.id,
        round:baseRound+1,
        home:away,
        away:home,
        homeScore:null,
        awayScore:null,
        played:false,
        stage:"knockout",
        knockoutRound:4,
        group:"volta"
      });
    });

    return {
      matches:next,
      section:"Semifinais",
      message:`Semifinais do ${championship.name} criadas em ida e volta.`
    };
  }

  if(semis.length===4 && semis.every(m=>m.played) && final.length===0) {
    const semifinalWinners=knockoutWinner(currentMatches,4,championship.id);
    if(semifinalWinners.length!==2) return null;

    const next=[...currentMatches];
    let id=nextId(next);
    const baseRound=championship.rounds+3;

    next.push({
      id:id++,
      championshipId:championship.id,
      round:baseRound,
      home:semifinalWinners[0],
      away:semifinalWinners[1],
      homeScore:null,
      awayScore:null,
      played:false,
      stage:"final",
      group:"ida"
    });
    next.push({
      id:id++,
      championshipId:championship.id,
      round:baseRound+1,
      home:semifinalWinners[1],
      away:semifinalWinners[0],
      homeScore:null,
      awayScore:null,
      played:false,
      stage:"final",
      group:"volta"
    });

    return {
      matches:next,
      section:"Final",
      message:`Final do ${championship.name} criada em ida e volta.`
    };
  }

  return null;
}

function App() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [section, setSection] = useState("Visão geral");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);
  const [autoSeasonCountry, setAutoSeasonCountry] = useState<string | null>(null);
  const autoSimulationRef = useRef(false);
  const autoLastStepRef = useRef<string>("");
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

      // Recria somente o Ceará após a troca completa do motor da competição.
      // As demais competições e simulações do navegador são preservadas.
      if (localStorage.getItem(LS.cearaV7) !== "1") {
        const oldCearaIds=new Set(
          cs.filter(c=>c.state==="Ceará" || isCearaChampionship(c.name)).map(c=>c.id)
        );

        for (let i=ms.length-1;i>=0;i--) {
          if (oldCearaIds.has(ms[i].championshipId)) ms.splice(i,1);
        }
        for (let i=cl.length-1;i>=0;i--) {
          if (oldCearaIds.has(cl[i].championshipId)) cl.splice(i,1);
        }
        for (let i=cs.length-1;i>=0;i--) {
          if (oldCearaIds.has(cs[i].id)) cs.splice(i,1);
        }

        const addCeara=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const newChampId=Math.max(...cs.map(c=>c.id),0)+1;
          const newClubId=Math.max(...cl.map(c=>c.id),0)+1;
          const newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(newChampId,newClubId,newMatchId);
          cs.push(built.championship);
          cl.push(...built.clubs);
          ms.push(...built.matches);
        };

        addCeara(buildCearaFirstDivision);
        addCeara(buildCearaSecondDivision);
        addCeara(buildCearaThirdDivision);
        localStorage.setItem(LS.cearaV7,"1");
      }


      // Recria somente o Rio Grande do Sul após a correção do fluxo da 3ª Divisão.
      if (localStorage.getItem(LS.gauchoV2) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Rio Grande do Sul" || c.name==="Campeonato Gaúcho" || c.name==="Campeonato Gaúcho - 2ª Divisão" || c.name==="Campeonato Gaúcho - 3ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);

        const addGaucho=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addGaucho(buildRioGrandeDoSulFirstDivision);
        addGaucho(buildRioGrandeDoSulSecondDivision);
        addGaucho(buildRioGrandeDoSulThirdDivision);
        localStorage.setItem(LS.gauchoV2,"1");
      }

      if (localStorage.getItem(LS.goiasV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Goiás" || c.name==="Campeonato Goiano" || c.name==="Campeonato Goiano - 2ª Divisão" || c.name==="Campeonato Goiano - 3ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);

        const addGoias=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addGoias(buildGoiasFirstDivision);
        addGoias(buildGoiasSecondDivision);
        addGoias(buildGoiasThirdDivision);
        localStorage.setItem(LS.goiasV1,"1");
      }

      if (localStorage.getItem(LS.maranhaoV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Maranhão" || c.name==="Campeonato Maranhense" || c.name==="Campeonato Maranhense - 2ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addMaranhao=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addMaranhao(buildMaranhaoFirstDivision);
        addMaranhao(buildMaranhaoSecondDivision);
        localStorage.setItem(LS.maranhaoV1,"1");
      }

      if (localStorage.getItem(LS.matoGrossoV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Mato Grosso" || c.name==="Campeonato Mato-Grossense" || c.name==="Campeonato Mato-Grossense - 2ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addMatoGrosso=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addMatoGrosso(buildMatoGrossoFirstDivision);
        addMatoGrosso(buildMatoGrossoSecondDivision);
        localStorage.setItem(LS.matoGrossoV1,"1");
      }

      // Garantia de integridade: se um estadual estiver ausente do armazenamento local,
      // ele é recriado mesmo que a flag de migração já esteja marcada.
      const ensureMaranhao = (name:string, builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
        if (cs.some(c=>c.name===name && c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=builder(cid,uid,mid);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      ensureMaranhao("Campeonato Maranhense", buildMaranhaoFirstDivision);
      ensureMaranhao("Campeonato Maranhense - 2ª Divisão", buildMaranhaoSecondDivision);

      if (localStorage.getItem(LS.minasGeraisV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Minas Gerais" || c.name==="Campeonato Mineiro" || c.name==="Campeonato Mineiro - 2ª Divisão" || c.name==="Campeonato Mineiro - 3ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addMinas=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addMinas(buildMinasGeraisFirstDivision);
        addMinas(buildMinasGeraisSecondDivision);
        addMinas(buildMinasGeraisThirdDivision);
        localStorage.setItem(LS.minasGeraisV1,"1");
      }

      const ensureMinas = (name:string, builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
        if (cs.some(c=>c.name===name && c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=builder(cid,uid,mid);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      ensureMinas("Campeonato Mineiro", buildMinasGeraisFirstDivision);
      ensureMinas("Campeonato Mineiro - 2ª Divisão", buildMinasGeraisSecondDivision);
      ensureMinas("Campeonato Mineiro - 3ª Divisão", buildMinasGeraisThirdDivision);

      if (localStorage.getItem(LS.paraV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Pará" || c.name==="Campeonato Paraense" || c.name==="Campeonato Paraense - 2ª Divisão" || c.name==="Campeonato Paraense - 3ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addPara=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addPara(buildParaFirstDivision);
        addPara(buildParaSecondDivision);
        addPara(buildParaThirdDivision);
        localStorage.setItem(LS.paraV1,"1");
      }

      const ensurePara = (name:string, builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
        if (cs.some(c=>c.name===name && c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=builder(cid,uid,mid);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      ensurePara("Campeonato Paraense", buildParaFirstDivision);
      ensurePara("Campeonato Paraense - 2ª Divisão", buildParaSecondDivision);
      ensurePara("Campeonato Paraense - 3ª Divisão", buildParaThirdDivision);

      if (localStorage.getItem(LS.paraibaV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Paraíba" || c.name==="Campeonato Paraibano" || c.name==="Campeonato Paraibano - 2ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addParaiba=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addParaiba(buildParaibaFirstDivision);
        addParaiba(buildParaibaSecondDivision);
        localStorage.setItem(LS.paraibaV1,"1");
      }

      const ensureParaiba = (name:string, builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
        if (cs.some(c=>c.name===name && c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=builder(cid,uid,mid);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      ensureParaiba("Campeonato Paraibano", buildParaibaFirstDivision);
      ensureParaiba("Campeonato Paraibano - 2ª Divisão", buildParaibaSecondDivision);

      if (localStorage.getItem(LS.paranaV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="Paraná" || c.name==="Campeonato Paranaense" || c.name==="Campeonato Paranaense - 2ª Divisão" || c.name==="Campeonato Paranaense - 3ª Divisão").map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addParana=(builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]})=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=builder(cid,uid,mid);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        addParana(buildParanaFirstDivision);
        addParana(buildParanaSecondDivision);
        addParana(buildParanaThirdDivision);
        localStorage.setItem(LS.paranaV1,"1");
      }

      if (localStorage.getItem(LS.saoPauloV1) !== "1") {
        const oldIds=new Set(cs.filter(c=>c.state==="São Paulo" || c.name.startsWith("Campeonato Paulista")).map(c=>c.id));
        for(let i=ms.length-1;i>=0;i--) if(oldIds.has(ms[i].championshipId)) ms.splice(i,1);
        for(let i=cl.length-1;i>=0;i--) if(oldIds.has(cl[i].championshipId)) cl.splice(i,1);
        for(let i=cs.length-1;i>=0;i--) if(oldIds.has(cs[i].id)) cs.splice(i,1);
        const addSaoPaulo=(division:number)=>{
          const cid=Math.max(...cs.map(c=>c.id),0)+1;
          const uid=Math.max(...cl.map(c=>c.id),0)+1;
          const mid=Math.max(...ms.map(m=>m.id),0)+1;
          const built=buildSaoPauloDivision(cid,uid,mid,division);
          cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
        };
        [1,2,3,4,5].forEach(addSaoPaulo);
        localStorage.setItem(LS.saoPauloV1,"1");
      }
      const ensureSaoPaulo=(division:number)=>{
        const name=["Campeonato Paulista","Campeonato Paulista - 2ª Divisão","Campeonato Paulista - 3ª Divisão","Campeonato Paulista - 4ª Divisão","Campeonato Paulista - 5ª Divisão"][division-1];
        if(cs.some(c=>c.name===name&&c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=buildSaoPauloDivision(cid,uid,mid,division);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      [1,2,3,4,5].forEach(ensureSaoPaulo);

      const ensureParana = (name:string, builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
        if (cs.some(c=>c.name===name && c.season==="2026")) return;
        const cid=Math.max(...cs.map(c=>c.id),0)+1;
        const uid=Math.max(...cl.map(c=>c.id),0)+1;
        const mid=Math.max(...ms.map(m=>m.id),0)+1;
        const built=builder(cid,uid,mid);
        cs.push(built.championship); cl.push(...built.clubs); ms.push(...built.matches);
      };
      ensureParana("Campeonato Paranaense", buildParanaFirstDivision);
      ensureParana("Campeonato Paranaense - 2ª Divisão", buildParanaSecondDivision);
      ensureParana("Campeonato Paranaense - 3ª Divisão", buildParanaThirdDivision);

      if (!cs.length || !cl.length)      if (!cs.length || !cl.length) { seed(); return; }

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

      if (!cs.some((c)=>c.name==="Campeonato Acreano - 2ª Divisão" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const acre2 = buildAcreSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(acre2.championship);
        cl.push(...acre2.clubs);
        ms.push(...acre2.matches);
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

      if (!cs.some((c)=>c.name==="Campeonato Alagoano - 2ª Divisão" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const alagoas2 = buildAlagoasSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(alagoas2.championship);
        cl.push(...alagoas2.clubs);
        ms.push(...alagoas2.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Amazonense" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const amazonas = buildAmazonasChampionship(newChampId,newClubId,newMatchId);
        cs.push(amazonas.championship);
        cl.push(...amazonas.clubs);
        ms.push(...amazonas.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Baiano" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const bahia = buildBahiaChampionship(newChampId,newClubId,newMatchId);
        cs.push(bahia.championship);
        cl.push(...bahia.clubs);
        ms.push(...bahia.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Baiano - 2ª Divisão" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const bahia2 = buildBahiaSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(bahia2.championship);
        cl.push(...bahia2.clubs);
        ms.push(...bahia2.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Brasiliense" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1;
        const newClubId=Math.max(...cl.map(c=>c.id),0)+1;
        const newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const brasiliense=buildDistritoFederalChampionship(newChampId,newClubId,newMatchId);
        cs.push(brasiliense.championship); cl.push(...brasiliense.clubs); ms.push(...brasiliense.matches);
      }
      const brasiliense2Existing = cs.find((c)=>c.name==="Campeonato Brasiliense - 2ª Divisão" && c.season==="2026");
      if (!brasiliense2Existing) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1;
        const newClubId=Math.max(...cl.map(c=>c.id),0)+1;
        const newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const brasiliense2=buildDistritoFederalSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(brasiliense2.championship); cl.push(...brasiliense2.clubs); ms.push(...brasiliense2.matches);
      } else {
        // Corrige a versão anterior da 2ª Divisão sem apagar uma temporada já disputada.
        brasiliense2Existing.format="Turno único";
        brasiliense2Existing.regulation="Fase única com 7 clubes em turno único. Os 2 primeiros colocados garantem o acesso à 1ª Divisão do Campeonato Brasiliense. O 1º colocado é declarado campeão.";
        brasiliense2Existing.promotion="Os dois primeiros colocados garantem acesso à 1ª Divisão; o 1º colocado é o campeão.";
        brasiliense2Existing.relegation="Não há rebaixamento informado para a 2ª Divisão.";
        brasiliense2Existing.teamCount=7;
        brasiliense2Existing.rounds=7;
        brasiliense2Existing.legs=1;
        const existingMatches=ms.filter((m)=>m.championshipId===brasiliense2Existing.id);
        const regularMatches=existingMatches.filter((m)=>m.stage==="regular");
        const nonRegularMatches=existingMatches.filter((m)=>m.stage!=="regular");
        if (nonRegularMatches.length>0) {
          // A 2ª Divisão não possui mata-mata: remove semifinais/final incorretamente criadas.
          const cleaned=ms.filter((m)=>m.championshipId!==brasiliense2Existing.id);
          ms.splice(0,ms.length,...cleaned,...regularMatches);
        }
        if (regularMatches.length!==21) {
          const remaining=ms.filter((m)=>m.championshipId!==brasiliense2Existing.id);
          const teamIds=cl.filter((x)=>x.championshipId===brasiliense2Existing.id).map((x)=>x.id);
          ms.splice(0,ms.length,...remaining,...roundRobin(teamIds,brasiliense2Existing.id,nextId(remaining),1));
        }
      }

      {
        const carioca=cs.find((c)=>c.name==="Campeonato Carioca" && c.season==="2026");
        if(carioca){
          const cariocaClubs=cl.filter(c=>c.championshipId===carioca.id);
          const regular=ms.filter(m=>m.championshipId===carioca.id&&m.stage==="regular");
          if(regular.length!==66 && regular.every(m=>!m.played)){
            const kept=ms.filter(m=>m.championshipId!==carioca.id);
            const rebuilt=buildCariocaFirstDivision(carioca.id,cariocaClubs[0]?.id??0,nextId(kept)).matches;
            ms.splice(0,ms.length,...kept,...rebuilt);
          }
        }
      }

      if (!cs.some((c)=>c.name==="Campeonato Carioca" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCariocaFirstDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship);cl.push(...x.clubs);ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Carioca - 3ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCariocaThirdDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship);cl.push(...x.clubs);ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Carioca - 4ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCariocaFourthDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship);cl.push(...x.clubs);ms.push(...x.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Capixaba" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1;
        const newClubId=Math.max(...cl.map(c=>c.id),0)+1;
        const newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const espirito=buildEspiritoSantoChampionship(newChampId,newClubId,newMatchId);
        cs.push(espirito.championship); cl.push(...espirito.clubs); ms.push(...espirito.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Capixaba - 2ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1;
        const newClubId=Math.max(...cl.map(c=>c.id),0)+1;
        const newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const espirito2=buildEspiritoSantoSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(espirito2.championship); cl.push(...espirito2.clubs); ms.push(...espirito2.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Catarinense" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildSantaCatarinaFirstDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Catarinense - 2ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildSantaCatarinaSecondDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Catarinense - 3ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildSantaCatarinaThirdDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Cearense" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCearaFirstDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Cearense - 2ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCearaSecondDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Cearense - 3ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildCearaThirdDivision(newChampId,newClubId,newMatchId); cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }


      if (!cs.some((c)=>c.name==="Campeonato Gaúcho" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildRioGrandeDoSulFirstDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Gaúcho - 2ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildRioGrandeDoSulSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }
      if (!cs.some((c)=>c.name==="Campeonato Gaúcho - 3ª Divisão" && c.season==="2026")) {
        const newChampId=Math.max(...cs.map(c=>c.id),0)+1, newClubId=Math.max(...cl.map(c=>c.id),0)+1, newMatchId=Math.max(...ms.map(m=>m.id),0)+1;
        const x=buildRioGrandeDoSulThirdDivision(newChampId,newClubId,newMatchId);
        cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Amapaense" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const amapa = buildAmapaChampionship(newChampId,newClubId,newMatchId);
        cs.push(amapa.championship);
        cl.push(...amapa.clubs);
        ms.push(...amapa.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Amapaense - 2ª Divisão" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const amapa2 = buildAmapaSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(amapa2.championship);
        cl.push(...amapa2.clubs);
        ms.push(...amapa2.matches);
      }

      if (!cs.some((c)=>c.name==="Campeonato Amazonense - 2ª Divisão" && c.season==="2026")) {
        const newChampId = Math.max(...cs.map((c)=>c.id),0)+1;
        const newClubId = Math.max(...cl.map((c)=>c.id),0)+1;
        const newMatchId = Math.max(...ms.map((m)=>m.id),0)+1;
        const amazonas2 = buildAmazonasSecondDivision(newChampId,newClubId,newMatchId);
        cs.push(amazonas2.championship);
        cl.push(...amazonas2.clubs);
        ms.push(...amazonas2.matches);
      }

      // Corrige instalações anteriores do Amazonas 2026 sem apagar os demais campeonatos.
      const amazonas2026 = cs.find((c)=>c.name==="Campeonato Amazonense" && c.season==="2026");
      const amazonas2_2026 = cs.find((c)=>c.name==="Campeonato Amazonense - 2ª Divisão" && c.season==="2026");
      const expectedAmazonas1 = new Set(AMAZONAS_1_CLUBS);
      const expectedAmazonas2 = new Set(AMAZONAS_2_CLUBS);

      if (amazonas2026) {
        const existing = cl.filter((c)=>c.championshipId===amazonas2026.id);
        const played = ms.some((m)=>m.championshipId===amazonas2026.id && m.played);
        const names = new Set(existing.map((c)=>c.name));
        if (!played && (amazonas2026.format!=="Turno único + semifinais + final" || existing.length!==AMAZONAS_1_CLUBS.length || names.size!==expectedAmazonas1.size || [...expectedAmazonas1].some(n=>!names.has(n)))) {
          for (let i=cl.length-1;i>=0;i--) if (cl[i].championshipId===amazonas2026.id) cl.splice(i,1);
          for (let i=ms.length-1;i>=0;i--) if (ms[i].championshipId===amazonas2026.id) ms.splice(i,1);
          const rebuilt=buildAmazonasChampionship(amazonas2026.id,Math.max(...cl.map(c=>c.id),0)+1,Math.max(...ms.map(m=>m.id),0)+1);
          const idx=cs.findIndex((c)=>c.id===amazonas2026.id);
          if(idx>=0) cs[idx]=rebuilt.championship;
          cl.push(...rebuilt.clubs);
          ms.push(...rebuilt.matches);
        } else {
          amazonas2026.regulation = "Primeiro turno: Os clubes do Grupo A enfrentam os do Grupo B. Segundo turno: os confrontos acontecem dentro de cada grupo. Em cada turno, os quatro melhores de cada grupo avançam aos playoffs, que serão disputadas em sistema de cruzamento olímpico (1º x 4º e 2º x 3º). Nas playoffs de final, o time de melhor campanha terá a vantagem do empate. Já em semifinais e finais, a vantagem será apenas de mando de campo. Em caso de igualdade, a classificação será definida nos pênaltis. A grande final será disputada entre os campeões dos dois turnos. Caso um mesmo clube conquiste os dois, será declarado campeão amazonense direto, sem necessidade de decisão. O pior time da classificação geral será rebaixado";
          amazonas2026.promotion = "O campeão é o vencedor da grande final entre os campeões dos turnos, salvo se o mesmo clube conquistar os dois turnos, quando será campeão direto.";
          amazonas2026.relegation = "O pior time da classificação geral será rebaixado para a 2ª Divisão do Campeonato Amazonense.";
        }
      }

      if (amazonas2_2026) {
        const existing = cl.filter((c)=>c.championshipId===amazonas2_2026.id);
        const played = ms.some((m)=>m.championshipId===amazonas2_2026.id && m.played);
        const names = new Set(existing.map((c)=>c.name));
        if (!played && (existing.length!==AMAZONAS_2_CLUBS.length || names.size!==expectedAmazonas2.size || [...expectedAmazonas2].some(n=>!names.has(n)))) {
          for (let i=cl.length-1;i>=0;i--) if (cl[i].championshipId===amazonas2_2026.id) cl.splice(i,1);
          for (let i=ms.length-1;i>=0;i--) if (ms[i].championshipId===amazonas2_2026.id) ms.splice(i,1);
          const rebuilt=buildAmazonasSecondDivision(amazonas2_2026.id,Math.max(...cl.map(c=>c.id),0)+1,Math.max(...ms.map(m=>m.id),0)+1);
          const idx=cs.findIndex((c)=>c.id===amazonas2_2026.id);
          if(idx>=0) cs[idx]=rebuilt.championship;
          cl.push(...rebuilt.clubs);
          ms.push(...rebuilt.matches);
        } else {
          amazonas2_2026.regulation = "Na primeira fase, as equipes participantes jogarão apenas um turno entre si. As (4) quatro equipes melhores colocadas avançarão direto para a segunda fase. Na fase seguinte, as disputas dos dois jogos serão realizadas em confrontos de jogo único. As semifinais serão da seguinte maneira: 1º lugar x 4ª lugar e 2º lugar x 3º lugar. Ao final do tempo regulamentar dos jogos das semifinais, o placar estando empatado, a decisão ocorrerá em cobranças de penalidades. Na final, os clubes vencedores dos confrontos das semifinais se enfrentarão em jogo único. O campeão garante o acesso.";
          amazonas2_2026.promotion = "O campeão garante o acesso para a 1ª Divisão do Campeonato Amazonense.";
          amazonas2_2026.relegation = "Não há rebaixamento informado para a 2ª Divisão.";
        }
      }

      const alagoas2026 = cs.find((c)=>c.name==="Campeonato Alagoano" && c.season==="2026");
      if (alagoas2026) {
        alagoas2026.relegation = "O último colocado da 1ª fase é rebaixado para a 2ª Divisão do Campeonato Alagoano.";
      }

      // MIGRAÇÃO V3 DO CARIOCA: novo formato em grupo único.
      // Remove a estrutura antiga (grupos, Taça Rio e Grupo de rebaixamento) e cria 66 jogos
      // de turno único. Resultados da antiga fase regular são preservados quando
      // o mesmo confronto e rodada continuam existindo.
      if (localStorage.getItem(LS.cariocaV3) !== "1") {
        const carioca2026 = cs.find((c)=>c.name==="Campeonato Carioca" && c.season==="2026");
        if (carioca2026) {
          const cariocaClubs=cl.filter(c=>c.championshipId===carioca2026.id);
          const rebuilt=buildCariocaFirstDivision(
            carioca2026.id,
            Math.min(...cariocaClubs.map(c=>c.id)),
            Math.max(...ms.map(m=>m.id),0)+1
          );

          const oldCarioca=ms.filter(m=>m.championshipId===carioca2026.id);
          const oldByPair=new Map<string,Match>();
          oldCarioca.filter(m=>m.stage==="regular").forEach(m=>{
            const key=[Math.min(m.home,m.away),Math.max(m.home,m.away)].join("-");
            if(!oldByPair.has(key)) oldByPair.set(key,m);
          });

          rebuilt.matches=rebuilt.matches.map(m=>{
            const old=oldByPair.get([Math.min(m.home,m.away),Math.max(m.home,m.away)].join("-"));
            return old ? {
              ...m,
              homeScore:old.homeScore,
              awayScore:old.awayScore,
              played:old.played,
              penaltyWinner:old.penaltyWinner,
              penaltyHomeScore:old.penaltyHomeScore,
              penaltyAwayScore:old.penaltyAwayScore,
              tieAdvantageClubId:old.tieAdvantageClubId
            } : m;
          });

          const other=ms.filter(m=>m.championshipId!==carioca2026.id);
          ms.splice(0,ms.length,...other,...rebuilt.matches);
          cariocaClubs.forEach(c=>delete c.stateGroup);
          localStorage.setItem(LS.cariocaV3,"1");
        }
      }

      // MIGRAÇÃO V4 DO CARIOCA: garante que o mata-mata da 1ª Divisão
      // sempre comece nas quartas de final. Preserva a fase regular e
      // remove somente fases eliminatórias antigas/incompatíveis.
      if (localStorage.getItem(LS.cariocaV4) !== "1") {
        const carioca2026 = cs.find((c)=>c.name==="Campeonato Carioca" && c.season==="2026");
        if (carioca2026) {
          const cariocaMatches=ms.filter(m=>m.championshipId===carioca2026.id);
          const regular=cariocaMatches.filter(m=>m.stage==="regular");
          const nonRegular=cariocaMatches.filter(m=>m.stage!=="regular");
          if (nonRegular.length) {
            ms.splice(
              0,
              ms.length,
              ...ms.filter(m=>m.championshipId!==carioca2026.id),
              ...regular
            );
          }
          carioca2026.format="Turno único + quartas + semifinais + final";
          carioca2026.regulation="Os 12 clubes disputam uma fase única em turno único, todos contra todos, em 11 rodadas. Os 8 primeiros colocados avançam às quartas de final, disputadas em jogo único. As semifinais são disputadas em ida e volta e a final em jogo único. Em qualquer mata-mata, empate no confronto é decidido automaticamente nos pênaltis pelo sistema.";
          localStorage.setItem(LS.cariocaV4,"1");
        }
      }

      setChampionships(cs); setClubs(cl); setMatches(ms); setSelectedId(cs[0].id);
    } catch { seed(); }
  }, []);

  // Garantia de instalação do Cearense: se o navegador já tinha dados antigos ou
  // uma migração anterior falhou, instala as três divisões sem apagar nenhuma simulação.
  useEffect(() => {
    if (!championships.length) return;
    const missing = [
      "Campeonato Cearense",
      "Campeonato Cearense - 2ª Divisão",
      "Campeonato Cearense - 3ª Divisão",
    ].some(name => !championships.some(c => c.name === name && c.season === "2026"));
    if (!missing) return;

    const cs = [...championships];
    const cl = [...clubs];
    const ms = [...matches];
    const add = (builder:(championshipId:number,clubId:number,matchId:number)=>{championship:Championship;clubs:Club[];matches:Match[]}) => {
      const newChampId = Math.max(...cs.map(c=>c.id),0)+1;
      const newClubId = Math.max(...cl.map(c=>c.id),0)+1;
      const newMatchId = Math.max(...ms.map(m=>m.id),0)+1;
      const x = builder(newChampId,newClubId,newMatchId);
      cs.push(x.championship); cl.push(...x.clubs); ms.push(...x.matches);
    };
    if (!cs.some(c=>c.name === "Campeonato Cearense" && c.season === "2026")) add(buildCearaFirstDivision);
    if (!cs.some(c=>c.name === "Campeonato Cearense - 2ª Divisão" && c.season === "2026")) add(buildCearaSecondDivision);
    if (!cs.some(c=>c.name === "Campeonato Cearense - 3ª Divisão" && c.season === "2026")) add(buildCearaThirdDivision);
    setChampionships(cs); setClubs(cl); setMatches(ms);
  }, [championships.length, clubs.length, matches.length]);

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

    if (champ.division === "Estadual" && isCearaChampionship(champ.name)) {
      return twoLegTieWinner(games,champ.id,"final") ?? null;
    }
    if (champ.division === "Estadual" && champ.name==="Campeonato Amazonense") {
      const semis=games.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=games.filter(m=>m.stage==="final");
      const winner=(m:Match)=>{
        if(!m.played) return null;
        if((m.homeScore??0)>(m.awayScore??0)) return m.home;
        if((m.awayScore??0)>(m.homeScore??0)) return m.away;
        return m.penaltyWinner ?? null;
      };
      if(semis.length!==2 || !semis.every(m=>m.played)) return null;
      const semifinalWinners=semis.map(winner);
      if(semifinalWinners.some(w=>w===null)) return null;
      if(final.length!==1 || !final[0].played) return null;
      return winner(final[0]);
    }

    if (champ.division === "Estadual" && champ.name==="Campeonato Amazonense - 2ª Divisão") {
      const semis=games.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=games.filter(m=>m.stage==="final");
      const winner=(m:Match)=>{
        if(!m.played) return null;
        if((m.homeScore??0)>(m.awayScore??0)) return m.home;
        if((m.awayScore??0)>(m.homeScore??0)) return m.away;
        return m.penaltyWinner ?? null;
      };
      if(semis.length!==2 || !semis.every(m=>m.played)) return null;
      const semifinalWinners=semis.map(winner).filter((x):x is number=>x!==null);
      if(semifinalWinners.length!==2) return null;
      if(final.length!==1 || !final[0].played) return null;
      return winner(final[0]);
    }

    if (champ.division === "Estadual" && champ.name==="Campeonato Amapaense - 2ª Divisão") {
      const final=games.filter(m=>m.stage==="final");
      if(final.length!==2 || !final.every(m=>m.played)) return null;
      const winners=knockoutWinner(final.map(m=>({...m,stage:"knockout" as Stage,knockoutRound:1})),1,champ.id);
      return winners[0] ?? null;
    }

    if (champ.division === "Estadual" && champ.name==="Campeonato Brasiliense - 2ª Divisão") {
      const regular=games.filter(m=>m.stage==="regular");
      if(!regular.length || !regular.every(m=>m.played)) return null;
      return tableFor(champ, clubs.filter(c=>c.championshipId===champ.id).map(c=>c.id), regular)[0]?.clubId ?? null;
    }

    if (champ.division === "Estadual" && champ.name==="Campeonato Acreano - 2ª Divisão") {
      const regular=games.filter(m=>m.stage==="regular");
      if(!regular.length || !regular.every(m=>m.played)) return null;
      return tableFor(champ, clubs.filter(c=>c.championshipId===champ.id).map(c=>c.id), regular)[0]?.clubId ?? null;
    }

    if (champ.division === "Estadual" && champ.name==="Campeonato Catarinense - 2ª Divisão") {
      const regular=games.filter(m=>m.stage==="regular");
      if(!regular.length || !regular.every(m=>m.played)) return null;
      return tableFor(champ,clubs.filter(c=>c.championshipId===champ.id).map(c=>c.id),games,"regular")[0]?.clubId ?? null;
    }
    if (champ.division === "Estadual" && champ.name==="Campeonato Catarinense - 3ª Divisão") {
      const final=games.filter(m=>m.stage==="final");
      if(final.length!==1 || !final[0].played) return null;
      const m=final[0];
      return (m.homeScore??0)>(m.awayScore??0)?m.home:(m.awayScore??0)>(m.homeScore??0)?m.away:m.penaltyWinner??null;
    }
    if (champ.division === "Estadual" && (
      champ.name==="Campeonato Goiano - 2ª Divisão" ||
      champ.name==="Campeonato Goiano - 3ª Divisão"
    )) {
      const regular=games.filter(m=>m.stage==="regular");
      if(!regular.length || !regular.every(m=>m.played)) return null;
      return tableFor(champ,clubs.filter(c=>c.championshipId===champ.id).map(c=>c.id),games,"regular")[0]?.clubId ?? null;
    }
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
      const winners = knockoutWinner(final.map((m) => ({...m, stage: "knockout" as Stage, knockoutRound: 1})), 1, champ.id);
      return winners[0] ?? null;
    }

    const final = games.filter((m) => m.stage === "knockout" && m.knockoutRound === 2);
    if (final.length !== 2 || !final.every((m) => m.played)) return null;
    return knockoutWinner(games, 2, champ.id)[0] ?? null;
  };

  const competitionComplete = (champ: Championship, allMatches: Match[]) => championClubId(champ, allMatches) !== null;

  useEffect(() => {
    if (championship && competitionComplete(championship, matches)) {
      setSection("Campeão");
    }
  }, [championship?.id, matches]);

  const phaseAlert = (message: string) => { if (!autoSimulationRef.current) alert(message); };

  const prepareNextPhase = () => {
    if (!championship) return;
    let next = resolveAutomaticPenalties(matches);
    let id = nextId(next);


    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Maranhense" ||
      championship.name==="Campeonato Maranhense - 2ª Divisão"
    )) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const quarters=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const isFirst=championship.name==="Campeonato Maranhense";
      const expected=isFirst?28:66;

      if(isFirst && regular.length===expected && regular.every(m=>m.played) && semis.length===0 && final.length===0) {
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Maranhense criadas em ida e volta.");return;
      }

      if(!isFirst && regular.length===expected && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0) {
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<8) return;
        [[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        });
        setMatches(next);setSection("Quartas de final");phaseAlert("Quartas de final do Campeonato Maranhense - 2ª Divisão criadas em ida e volta.");return;
      }

      if(!isFirst && quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0) {
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4){phaseAlert("Não foi possível identificar os vencedores das quartas do Campeonato Maranhense.");return;}
        [[winners[0],winners[3]],[winners[1],winners[2]]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Maranhense - 2ª Divisão criadas em ida e volta.");return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0) {
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os finalistas do Campeonato Maranhense.");return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+(isFirst?3:5),home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+(isFirst?4:6),home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Paraibano" ||
      championship.name==="Campeonato Paraibano - 2ª Divisão"
    )) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===45 && regular.every(m=>m.played) && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert(`Não foi possível identificar os finalistas do ${championship.name}.`);return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Paraense" ||
      championship.name==="Campeonato Paraense - 2ª Divisão" ||
      championship.name==="Campeonato Paraense - 3ª Divisão"
    )) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===66 && regular.every(m=>m.played) && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert(`Não foi possível identificar os finalistas do ${championship.name}.`);return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Mineiro" ||
      championship.name==="Campeonato Mineiro - 2ª Divisão" ||
      championship.name==="Campeonato Mineiro - 3ª Divisão"
    )) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const expected=66;
      if(regular.length===expected && regular.every(m=>m.played) && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert(`Não foi possível identificar os finalistas do ${championship.name}.`);return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Paranaense" ||
      championship.name==="Campeonato Paranaense - 2ª Divisão" ||
      championship.name==="Campeonato Paranaense - 3ª Divisão"
    )) {
      const own=next.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const quarters=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===8);
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      const isSecond=championship.name==="Campeonato Paranaense - 2ª Divisão";
      const expected=championship.name==="Campeonato Paranaense - 3ª Divisão" ? 55 : isSecond ? 45 : 66;

      if(!isSecond && regular.length===expected && regular.every(m=>m.played) && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Paranaense criadas em ida e volta.");return;
      }

      if(isSecond && regular.length===expected && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<8) return;
        [[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        });
        setMatches(next);setSection("Quartas de final");phaseAlert("Quartas de final do Campeonato Paranaense - 2ª Divisão criadas em ida e volta.");return;
      }

      if(quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0){
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4) return;
        for(let i=0;i<4;i+=2){
          const home=winners[i],away=winners[i+1];
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        }
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Paranaense - 2ª Divisão criadas em ida e volta.");return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2) return;
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+5,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+6,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert("Final de "+championship.name+" criada em ida e volta.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Mato-Grossense" ||
      championship.name==="Campeonato Mato-Grossense - 2ª Divisão"
    )) {
      const isFirst=championship.name==="Campeonato Mato-Grossense";
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const expected=45;
      if(regular.length===expected && regular.every(m=>m.played) && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert(`Não foi possível identificar os finalistas do ${championship.name}.`);return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Goiano" ||
      championship.name==="Campeonato Goiano - 2ª Divisão" ||
      championship.name==="Campeonato Goiano - 3ª Divisão"
    )) {
      if(championship.name!=="Campeonato Goiano") return;
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const quarters=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");

      if(regular.length===66 && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        const pairs=[[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]];
        const base=championship.rounds+1;
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:base,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:base+1,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        });
        setMatches(next);setSection("Quartas de final");phaseAlert("Quartas de final do Campeonato Goiano criadas em ida e volta.");return;
      }
      if(quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0){
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4){phaseAlert("Não foi possível identificar os vencedores das quartas do Campeonato Goiano.");return;}
        [[winners[0],winners[3]],[winners[1],winners[2]]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Goiano criadas em ida e volta.");return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os finalistas do Campeonato Goiano.");return;}
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+5,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+6,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Goiano criada em ida e volta.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && (
      championship.name==="Campeonato Gaúcho" ||
      championship.name==="Campeonato Gaúcho - 2ª Divisão" ||
      championship.name==="Campeonato Gaúcho - 3ª Divisão"
    )) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const quarters=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const isThird=championship.name==="Campeonato Gaúcho - 3ª Divisão";
      const expectedRegular=isThird ? 45 : championship.name==="Campeonato Gaúcho" ? 66 : 120;

      // 3ª Divisão: 4 classificados -> semifinais diretamente.
      if(isThird && regular.length===expectedRegular && regular.every(m=>m.played) && semis.length===0 && final.length===0) {
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<4) return;
        const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
        const baseRound=championship.rounds+1;
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:baseRound,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:baseRound+1,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");
        phaseAlert("Semifinais do Campeonato Gaúcho - 3ª Divisão criadas em ida e volta.");
        return;
      }

      // 1ª e 2ª Divisões: 8 classificados -> quartas.
      if(!isThird && regular.length===expectedRegular && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0) {
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length<8) return;
        const pairs=[[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]];
        const baseRound=championship.rounds+1;
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:baseRound,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:baseRound+1,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        });
        setMatches(next);setSection("Quartas de final");
        phaseAlert(`Quartas de final do ${championship.name} criadas em ida e volta.`);
        return;
      }

      if(!isThird && quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0) {
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4) {
          phaseAlert(`Não foi possível identificar os vencedores das quartas do ${championship.name}.`);
          return;
        }
        [[winners[0],winners[3]],[winners[1],winners[2]]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");
        phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);
        return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0) {
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2) {
          phaseAlert(`Não foi possível identificar os finalistas do ${championship.name}.`);
          return;
        }
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+5,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+6,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");
        phaseAlert(`Final do ${championship.name} criada em ida e volta.`);
        return;
      }
      return;
    }

    if (championship.division === "Estadual" && isCearaChampionship(championship.name)) {
      const resolved=resolveAutomaticPenalties(matches);
      const created=createCearaPhase(championship,myClubs,resolved);
      if(created){
        setMatches(created.matches);
        setSection(created.section);
        phaseAlert(created.message);
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Catarinense") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const q=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===66 && regular.every(m=>m.played) && q.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        const pairs=[[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]];
        pairs.forEach(([a,b])=>{ next.push({id:id++,championshipId:championship.id,round:12,home:a,away:b,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8}); next.push({id:id++,championshipId:championship.id,round:13,home:b,away:a,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8}); });
        setMatches(next);setSection("Quartas de final");phaseAlert("Quartas de final do Campeonato Catarinense criadas em ida e volta.");return;
      }
      if(q.length===8 && q.every(m=>m.played) && semis.length===0){
        const winners=knockoutWinner(next,8,championship.id); if(winners.length!==4){phaseAlert("Não foi possível identificar os vencedores das quartas do Catarinense.");return;}
        [[winners[0],winners[3]],[winners[1],winners[2]]].forEach(([a,b])=>{ next.push({id:id++,championshipId:championship.id,round:14,home:a,away:b,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4}); next.push({id:id++,championshipId:championship.id,round:15,home:b,away:a,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4}); });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Catarinense criadas em ida e volta.");return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id); if(winners.length!==2){phaseAlert("Não foi possível identificar os finalistas do Catarinense.");return;}
        next.push({id:id++,championshipId:championship.id,round:16,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Catarinense criada em jogo único.");return;
      }
      return;
    }
    if (championship.division === "Estadual" && championship.name==="Campeonato Catarinense - 3ª Divisão") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===12 && regular.every(m=>m.played) && final.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length>=2) next.push({id:id++,championshipId:championship.id,round:7,home:table[0].clubId,away:table[1].clubId,homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final da 3ª Divisão do Campeonato Catarinense criada.");return;
      }
      return;
    }
    if (championship.division === "Estadual" && championship.name==="Campeonato Catarinense - 2ª Divisão") return;

    if (championship.division === "Estadual" && championship.name==="Campeonato Brasiliense") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===45 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([a,b])=>{
          next.push({id:id++,championshipId:championship.id,round:10,home:a,away:b,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:11,home:b,away:a,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Brasiliense criadas em ida e volta.");return;
      }
      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=Array.from(new Set(semis.map(m=>m.group==="ida"?null:null))).filter(Boolean);
        const pairings=[[semis[0],semis[1]],[semis[2],semis[3]]].map(pair=>{
          const [a,b]=pair;
          const aggA=(a.homeScore??0)+(b.awayScore??0), aggB=(a.awayScore??0)+(b.homeScore??0);
          return aggA>aggB?a.home:aggB>aggA?a.away:(b.penaltyWinner??null);
        });
        if(pairings.some(w=>w===null)){phaseAlert("Não foi possível identificar os vencedores das semifinais.");return;}
        next.push({id:id++,championshipId:championship.id,round:12,home:pairings[0]!,away:pairings[1]!,homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Brasiliense criada em jogo único.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Baiano") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");

      if(regular.length===45 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:10,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        });
        setMatches(next);setSection("Semifinais");
        phaseAlert("Semifinais do Campeonato Baiano criadas em jogo único.");
        return;
      }

      if(semis.length===2 && semis.every(m=>m.played) && final.length===0){
        const winner=(m:Match)=>{
          if((m.homeScore??0)>(m.awayScore??0)) return m.home;
          if((m.awayScore??0)>(m.homeScore??0)) return m.away;
          return m.penaltyWinner ?? null;
        };
        const winners=semis.map(winner);
        if(winners.some(w=>w===null)){
          phaseAlert("Não foi possível identificar os vencedores das semifinais do Campeonato Baiano.");
          return;
        }
        next.push({id:id++,championshipId:championship.id,round:11,home:winners[0]!,away:winners[1]!,homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");
        phaseAlert("Final do Campeonato Baiano criada em jogo único.");
        return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Amazonense") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const ids=myClubs.map(c=>c.id);

      if(regular.length===28 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,ids,next);
        const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
        const created:Match[]=pairs.map(([home,away],idx)=>({
          id:id++,championshipId:championship.id,round:8+idx,home,away,
          homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4
        }));
        next.push(...created);
        setMatches(next);setSection("Semifinais");
        phaseAlert("Semifinais do Campeonato Amazonense criadas.");
        return;
      }

      if(semis.length===2 && semis.every(m=>m.played) && final.length===0){
        const winner=(m:Match)=>{
          if((m.homeScore??0)>(m.awayScore??0)) return m.home;
          if((m.awayScore??0)>(m.homeScore??0)) return m.away;
          return m.penaltyWinner ?? null;
        };
        const winners=semis.map(winner);
        if(winners.some(w=>w===null)){
          phaseAlert("Não foi possível identificar os vencedores das semifinais do Campeonato Amazonense.");
          return;
        }
        next.push({
          id:id++,championshipId:championship.id,round:10,
          home:winners[0]!,away:winners[1]!,homeScore:null,awayScore:null,
          played:false,stage:"final"
        });
        setMatches(next);setSection("Final");
        phaseAlert("Final do Campeonato Amazonense criada.");
        return;
      }

      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Amazonense - 2ª Divisão") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===21 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:7,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais da 2ª Divisão do Amazonas criadas em jogo único.");return;
      }
      if(semis.length===2 && semis.every(m=>m.played) && final.length===0){
        const winners=semis.map((m)=>((m.homeScore??0)>(m.awayScore??0)?m.home:(m.awayScore??0)>(m.homeScore??0)?m.away:m.penaltyWinner)).filter((x):x is number=>x!==undefined);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os finalistas da 2ª Divisão do Amazonas.");return;}
        next.push({id:id++,championshipId:championship.id,round:8,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final da 2ª Divisão do Amazonas criada em jogo único. O campeão garante o acesso.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Amapaense - 2ª Divisão") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const hasSemifinals=next.some(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const finalExists=next.some(m=>m.championshipId===championship.id&&m.stage==="final");

      if (regular.length===10 && regular.every(m=>m.played) && !hasSemifinals) {
        const idsA=[...new Set(regular.filter(m=>m.group==="A").flatMap(m=>[m.home,m.away]))];
        const idsB=[...new Set(regular.filter(m=>m.group==="B").flatMap(m=>[m.home,m.away]))];
        const a=tableFor(championship,idsA,next,"regular","A");
        const b=tableFor(championship,idsB,next,"regular","B");
        if(a.length!==6 || b.length!==6){phaseAlert("Não foi possível montar os grupos do Amapá.");return;}
        const pairs=[[a[0].clubId,b[1].clubId],[b[0].clubId,a[1].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:6,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
          next.push({id:id++,championshipId:championship.id,round:7,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        });
        setMatches(next);
        setSection("Semifinais");
        phaseAlert("Semifinais da 2ª Divisão do Amapá criadas: 1º do Grupo A x 2º do Grupo B e 1º do Grupo B x 2º do Grupo A.");
        return;
      }

      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      if(semis.length===4 && semis.every(m=>m.played) && !finalExists){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os dois finalistas do Amapá.");return;}
        const finalMatches=[
          {id:id++,championshipId:championship.id,round:8,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
          {id:id++,championshipId:championship.id,round:9,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
        ];
        setMatches([...next,...finalMatches]);
        setSection("Final");
        phaseAlert("Final da 2ª Divisão do Amapá criada em dois jogos. Os dois finalistas garantem acesso.");
        return;
      }

      if(semis.length===4 && !semis.every(m=>m.played)){
        phaseAlert("Finalize os 4 jogos das semifinais do Amapá.");
        return;
      }
      if(finalExists && !next.filter(m=>m.championshipId===championship.id&&m.stage==="final").every(m=>m.played)){
        phaseAlert("Finalize os 2 jogos da final do Amapá.");
        return;
      }
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Carioca") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const quarters=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");

      if(regular.length===66 && regular.every(m=>m.played) && quarters.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
        if(table.length!==12){
          phaseAlert("Não foi possível montar a classificação da 1ª Divisão do Carioca.");
          return;
        }

        // Quartas em jogo único: 1º x 8º, 4º x 5º, 2º x 7º e 3º x 6º.
        const pairs=[
          [table[0].clubId,table[7].clubId],
          [table[3].clubId,table[4].clubId],
          [table[1].clubId,table[6].clubId],
          [table[2].clubId,table[5].clubId]
        ];
        pairs.forEach(([home,away],idx)=>{
          next.push({
            id:id++,
            championshipId:championship.id,
            round:12+idx,
            home,
            away,
            homeScore:null,
            awayScore:null,
            played:false,
            stage:"knockout",
            knockoutRound:8
          });
        });

        // A 2ª Divisão passa a existir assim que a classificação da 1ª fase
        // define o rebaixado direto (12º). O play-off de permanência só será
        // criado depois da final da 2ª Divisão.
        const alreadySecond=championships.some(c=>c.name==="Campeonato Carioca - 2ª Divisão"&&c.season==="2026");
        if(!alreadySecond){
          const relegated=table[11]?.clubId;
          if(relegated){
            const newChampId=Math.max(...championships.map(c=>c.id),0)+1;
            const newClubId=Math.max(...clubs.map(c=>c.id),0)+1;
            const newMatchId=Math.max(...next.map(m=>m.id),...matches.map(m=>m.id),0)+1;
            const x=buildCariocaSecondDivision(newChampId,newClubId,newMatchId,clubName(relegated));
            setChampionships([...championships,x.championship]);
            setClubs([...clubs,...x.clubs]);
            next.push(...x.matches);
          }
        }

        setMatches(next);
        setSection("Quartas de final");
        phaseAlert("1ª fase do Campeonato Carioca concluída. Quartas de final criadas e 2ª Divisão liberada.");
        return;
      }

      if(quarters.length===4 && quarters.every(m=>m.played) && semis.length===0){
        const winner=(m:Match)=>{
          if((m.homeScore??0)>(m.awayScore??0)) return m.home;
          if((m.awayScore??0)>(m.homeScore??0)) return m.away;
          return m.penaltyWinner ?? null;
        };
        const winners=quarters.map(winner);
        if(winners.some(w=>w===null)){
          phaseAlert("Não foi possível identificar os classificados das quartas do Carioca.");
          return;
        }
        const shuffled=shuffle(winners as number[]);
        next.push(
          {id:id++,championshipId:championship.id,round:17,home:shuffled[0],away:shuffled[1],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"},
          {id:id++,championshipId:championship.id,round:18,home:shuffled[1],away:shuffled[0],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"},
          {id:id++,championshipId:championship.id,round:17,home:shuffled[2],away:shuffled[3],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"},
          {id:id++,championshipId:championship.id,round:18,home:shuffled[3],away:shuffled[2],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"}
        );
        setMatches(next);
        setSection("Semifinais");
        phaseAlert("Semifinais do Campeonato Carioca criadas em ida e volta.");
        return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){
          phaseAlert("Não foi possível identificar os finalistas do Carioca.");
          return;
        }
        next.push({
          id:id++,
          championshipId:championship.id,
          round:20,
          home:winners[0],
          away:winners[1],
          homeScore:null,
          awayScore:null,
          played:false,
          stage:"final"
        });
        setMatches(next);
        setSection("Final");
        phaseAlert("Final do Campeonato Carioca criada em jogo único.");
        return;
      }

      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Carioca - 2ª Divisão") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      const playoff=next.filter(m=>m.championshipId===championship.id&&m.stage==="playoff");

      if(regular.length===66 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:12,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        });
        setMatches(next);
        setSection("Semifinais");
        phaseAlert("Semifinais da 2ª Divisão do Carioca criadas.");
        return;
      }

      if(semis.length===2 && semis.every(m=>m.played) && final.length===0){
        const winners=semis.map((m)=>(
          (m.homeScore??0)>(m.awayScore??0)
            ?m.home
            :(m.awayScore??0)>(m.homeScore??0)
              ?m.away
              :m.penaltyWinner
        )).filter((x):x is number=>x!==undefined);
        if(winners.length!==2){
          phaseAlert("Não foi possível identificar os finalistas da 2ª Divisão do Carioca.");
          return;
        }
        next.push({
          id:id++,
          championshipId:championship.id,
          round:13,
          home:winners[0],
          away:winners[1],
          homeScore:null,
          awayScore:null,
          played:false,
          stage:"final"
        });
        setMatches(next);
        setSection("Final");
        phaseAlert("Final da 2ª Divisão do Carioca criada.");
        return;
      }

      // O play-off só nasce depois da final da 2ª Divisão.
      if(final.length===1 && final[0].played && playoff.length===0){
        const a1=championships.find(c=>c.name==="Campeonato Carioca"&&c.season==="2026");
        if(!a1){
          phaseAlert("A 1ª Divisão do Carioca não foi encontrada.");
          return;
        }
        const f=final[0];
        const vice=(f.homeScore??0)>(f.awayScore??0)?f.away:(f.awayScore??0)>(f.homeScore??0)?f.home:f.penaltyWinner===f.home?f.away:f.home;
        const a1Clubs=clubs.filter(c=>c.championshipId===a1.id);
        const a1Regular=matches.filter(m=>m.championshipId===a1.id&&m.stage==="regular");
        const a1Table=tableFor(a1,a1Clubs.map(c=>c.id),a1Regular,"regular");
        const penultimate=a1Table[10]?.clubId;

        if(vice===undefined || penultimate===undefined){
          phaseAlert("Não foi possível identificar o 11º colocado da 1ª Divisão e o vice da 2ª Divisão.");
          return;
        }

        next.push({
          id:id++,
          championshipId:championship.id,
          round:14,
          home:penultimate,
          away:vice,
          homeScore:null,
          awayScore:null,
          played:false,
          stage:"playoff"
        });
        setMatches(next);
        setSection("Play-off de acesso");
        phaseAlert("Play-off de permanência criado: 11º da 1ª Divisão x vice da 2ª Divisão.");
        return;
      }
      return;
    }

    if (championship.division === "Estadual" && (championship.name==="Campeonato Carioca - 3ª Divisão" || championship.name==="Campeonato Carioca - 4ª Divisão")) {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===66 && regular.every(m=>m.played) && semis.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        [[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]].forEach(([home,away])=>next.push({id:id++,championshipId:championship.id,round:12,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4}));
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Carioca criadas em jogo único.");return;
      }
      if(semis.length===2 && semis.every(m=>m.played) && final.length===0){
        const winners=semis.map(m=>((m.homeScore??0)>(m.awayScore??0)?m.home:(m.awayScore??0)>(m.homeScore??0)?m.away:m.penaltyWinner)).filter((x):x is number=>x!==undefined);
        if(winners.length!==2)return;
        next.push({id:id++,championshipId:championship.id,round:13,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Carioca criada em jogo único.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Capixaba") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const quarters=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");

      if(regular.length===45 && regular.every(m=>m.played) && quarters.length===0){
        const table=tableFor(championship,myClubs.map(c=>c.id),next);
        const pairs=[[table[0].clubId,table[7].clubId],[table[1].clubId,table[6].clubId],[table[2].clubId,table[5].clubId],[table[3].clubId,table[4].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:10,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:11,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        });
        setMatches(next);setSection("Quartas de final");phaseAlert("Quartas de final do Campeonato Capixaba criadas em ida e volta.");return;
      }

      if(quarters.length===8 && quarters.every(m=>m.played) && semis.length===0){
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4){phaseAlert("Não foi possível identificar os 4 vencedores das quartas de final do Campeonato Capixaba.");return;}
        [[winners[0],winners[3]],[winners[1],winners[2]]].forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:12,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:13,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Capixaba criadas em ida e volta.");return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os 2 finalistas do Campeonato Capixaba.");return;}
        next.push({id:id++,championshipId:championship.id,round:14,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Capixaba criada em jogo único.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name==="Campeonato Capixaba - 2ª Divisão") {
      const regular=next.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=next.filter(m=>m.championshipId===championship.id&&m.stage==="final");

      if(regular.length===40 && regular.every(m=>m.played) && semis.length===0){
        const tableA=tableFor(championship,myClubs.map(c=>c.id).filter(id=>next.some(m=>m.championshipId===championship.id&&m.group==="A"&&(m.home===id||m.away===id))),next,"regular","A");
        const tableB=tableFor(championship,myClubs.map(c=>c.id).filter(id=>next.some(m=>m.championshipId===championship.id&&m.group==="B"&&(m.home===id||m.away===id))),next,"regular","B");
        if(tableA.length<2||tableB.length<2){phaseAlert("Não foi possível identificar os 2 classificados de cada grupo do Capixaba.");return;}
        const pairs=[[tableA[0].clubId,tableB[1].clubId],[tableB[0].clubId,tableA[1].clubId]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:9,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:10,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        });
        setMatches(next);setSection("Semifinais");phaseAlert("Semifinais do Campeonato Capixaba - 2ª Divisão criadas em ida e volta.");return;
      }

      if(semis.length===4 && semis.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert("Não foi possível identificar os 2 finalistas do Capixaba.");return;}
        next.push({id:id++,championshipId:championship.id,round:11,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final"});
        setMatches(next);setSection("Final");phaseAlert("Final do Campeonato Capixaba - 2ª Divisão criada em jogo único.");return;
      }
      return;
    }

    if (championship.division === "Estadual" && championship.name!=="Campeonato Acreano - 2ª Divisão" && championship.name!=="Campeonato Brasiliense - 2ª Divisão" && championship.name!=="Campeonato Amazonense" && championship.name!=="Campeonato Amazonense - 2ª Divisão" && championship.name!=="Campeonato Catarinense" && championship.name!=="Campeonato Catarinense - 2ª Divisão" && championship.name!=="Campeonato Catarinense - 3ª Divisão" && championship.name!=="Campeonato Cearense" && championship.name!=="Campeonato Cearense - 2ª Divisão" && championship.name!=="Campeonato Cearense - 3ª Divisão" && regularComplete(championship) &&
        !next.some((m)=>m.championshipId===championship.id&&m.stage==="knockout")) {
      const table=tableFor(championship,myClubs.map(c=>c.id),next);
      const pairs=[[table[0].clubId,table[3].clubId],[table[1].clubId,table[2].clubId]];
      pairs.forEach(([home,away])=>{
        next.push({id:id++,championshipId:championship.id,round:8,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
        next.push({id:id++,championshipId:championship.id,round:9,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4});
      });
      setMatches(next);
      setSection("Semifinais");
      phaseAlert(`Semifinais do ${championship.name} criadas: 1º x 4º e 2º x 3º, em dois jogos.`);
      return;
    }

    if (championship.division === "Estadual" && championship.state==="São Paulo" && championship.name.startsWith("Campeonato Paulista")) {
      const own=next.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const r16=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===16);
      const r8=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===8);
      const r4=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      const isFifth=championship.name==="Campeonato Paulista - 5ª Divisão";
      const expected=isFifth?60:120;
      const regularDone=regular.length===expected && regular.every(m=>m.played);

      if(regularDone && r16.length===0 && r8.length===0 && r4.length===0 && final.length===0){
        const qualified:number[]=[];
        if(isFifth){
          for(const g of ["A","B","C","D"]){
            const ids=[...new Set(regular.filter(m=>m.group===g).flatMap(m=>[m.home,m.away]))];
            const table=tableFor(championship,ids,next,"regular",g);
            if(table.length!==6) return;
            qualified.push(...table.slice(0,4).map(x=>x.clubId));
          }
        } else {
          const table=tableFor(championship,myClubs.map(c=>c.id),next,"regular");
          if(table.length!==16) return;
          qualified.push(...table.slice(0,8).map(x=>x.clubId));
        }
        const pairs=isFifth
          ? [[qualified[0],qualified[7]],[qualified[1],qualified[6]],[qualified[2],qualified[5]],[qualified[3],qualified[4]],
             [qualified[8],qualified[15]],[qualified[9],qualified[14]],[qualified[10],qualified[13]],[qualified[11],qualified[12]]]
          : [[qualified[0],qualified[7]],[qualified[1],qualified[6]],[qualified[2],qualified[5]],[qualified[3],qualified[4]]];
        pairs.forEach(([home,away])=>{
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+1,home,away,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:16,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+2,home:away,away:home,homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:16,group:"volta"});
        });
        setMatches(next);setSection("Oitavas de final");phaseAlert(`Oitavas de final do ${championship.name} criadas em ida e volta.`);return;
      }

      if(r16.length===16 && r16.every(m=>m.played) && r8.length===0 && r4.length===0 && final.length===0){
        const winners=knockoutWinner(next,16,championship.id);
        if(winners.length!==8) return;
        for(let i=0;i<8;i+=2){
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+3,home:winners[i],away:winners[i+1],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+4,home:winners[i+1],away:winners[i],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:8,group:"volta"});
        }
        setMatches(next);setSection("Quartas de final");phaseAlert(`Quartas de final do ${championship.name} criadas em ida e volta.`);return;
      }

      if(r8.length===8 && r8.every(m=>m.played) && r4.length===0 && final.length===0){
        const winners=knockoutWinner(next,8,championship.id);
        if(winners.length!==4) return;
        for(let i=0;i<4;i+=2){
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+5,home:winners[i],away:winners[i+1],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"ida"});
          next.push({id:id++,championshipId:championship.id,round:championship.rounds+6,home:winners[i+1],away:winners[i],homeScore:null,awayScore:null,played:false,stage:"knockout",knockoutRound:4,group:"volta"});
        }
        setMatches(next);setSection("Semifinais");phaseAlert(`Semifinais do ${championship.name} criadas em ida e volta.`);return;
      }

      if(r4.length===4 && r4.every(m=>m.played) && final.length===0){
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2) return;
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+7,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final",group:"ida"});
        next.push({id:id++,championshipId:championship.id,round:championship.rounds+8,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final",group:"volta"});
        setMatches(next);setSection("Final");phaseAlert(`Final do ${championship.name} criada em ida e volta.`);return;
      }
      return;
    }

    if (championship.division === "Estadual") {
      const semis=next.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const finalExists=next.some(m=>m.championshipId===championship.id&&m.stage==="final");
      if (semis.length===4 && semis.every(m=>m.played) && !finalExists) {
        const winners=knockoutWinner(next,4,championship.id);
        if(winners.length!==2){phaseAlert(`Não foi possível identificar os dois finalistas do ${championship.name}.`);return;}
        const finalMatches = [
          {id:id++,championshipId:championship.id,round:10,home:winners[0],away:winners[1],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
          {id:id++,championshipId:championship.id,round:11,home:winners[1],away:winners[0],homeScore:null,awayScore:null,played:false,stage:"final" as Stage},
        ];
        setMatches([...next,...finalMatches]);
        setSection("Final");
        phaseAlert(`Final do ${championship.name} criada em dois jogos.`);
        return;
      }
      if(semis.length===4 && !semis.every(m=>m.played)) {
        phaseAlert(`Finalize os 4 jogos das semifinais do ${championship.name}.`);
        return;
      }
      if(finalExists && !next.filter(m=>m.championshipId===championship.id&&m.stage==="final").every(m=>m.played)) {
        phaseAlert(`Finalize os 2 jogos da final do ${championship.name} para encerrar a competição.`);
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
      phaseAlert("Play-offs da Série B criados: 6º x 3º e 5º x 4º.");
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
      phaseAlert("Segunda fase da Série C criada automaticamente.");
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
          phaseAlert("Não foi possível identificar os líderes dos grupos da Série C.");
          return;
        }
        const finalTeams = [tableA[0].clubId, tableB[0].clubId];
        const finalMatches = roundRobin(finalTeams, championship.id, id, 2, 6)
          .map((m) => ({...m, stage:"final" as Stage}));
        setMatches([...next, ...finalMatches]);
        phaseAlert("Final da Série C criada: os líderes dos grupos A e B disputarão o título em ida e volta.");
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
        phaseAlert("1ª fase do mata-mata da Série D criada: 64 clubes.");
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

          const winners=knockoutWinner(next,completed,championship.id);
          if (winners.length!==nextPhase) {
            phaseAlert("Não foi possível identificar todos os vencedores da fase.");
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
          phaseAlert(`Série D: próxima fase criada — ${nextPhase} clubes.`);
          return;
        }
      }

      const pending=phases.find((p)=>existing.includes(p) && next.some((m)=>
        m.championshipId===championship.id && m.stage==="knockout" &&
        m.knockoutRound===p && !m.played
      ));
      if (pending) {
        phaseAlert(`Finalize os ${pending} jogos da fase Série D · ${pending} antes de avançar.`);
        return;
      }
      if (existing.includes(2)) {
        phaseAlert("A Final da Série D já foi criada. Finalize os dois jogos para concluir o campeonato.");
        return;
      }
    }

    phaseAlert("Não há uma nova fase pronta para ser criada.");
  };

  const simulateCountrySeason = (country: string) => {
    if (autoSimulationRef.current) return;
    const countryChamps=championships.filter(c=>c.country===country);
    if (!countryChamps.length) {
      alert("Não há campeonatos registrados neste país.");
      return;
    }
    autoSimulationRef.current=true;
    autoLastStepRef.current="";
    setAutoSeasonCountry(country);
    setSection("Visão geral");
  };

  const isCountryChampComplete = (champ: Championship) => {
    const games=matches.filter(m=>m.championshipId===champ.id);
    if (champ.name==="Campeonato Carioca - 2ª Divisão") {
      const playoff=games.filter(m=>m.stage==="playoff");
      const final=games.filter(m=>m.stage==="final");
      if (final.length===1 && final[0].played) {
        return playoff.length===1 && playoff[0].played;
      }
    }
    return competitionComplete(champ,matches);
  };

  useEffect(() => {
    if (!autoSeasonCountry) return;

    const season=Math.max(
      ...championships
        .filter(c=>c.country===autoSeasonCountry)
        .map(c=>Number(c.season))
    );

    const countryChamps=championships
      .filter(c=>c.country===autoSeasonCountry && Number(c.season)===season)
      .sort((a,b)=>a.id-b.id);

    const pending=countryChamps.find(c=>!isCountryChampComplete(c));

    if (!pending) {
      autoSimulationRef.current=false;
      autoLastStepRef.current="";
      setAutoSeasonCountry(null);
      setSection("Visão geral");
      alert(`Temporada ${season} de ${autoSeasonCountry} simulada por completo. Todos os campeonatos registrados foram concluídos.`);
      return;
    }

    if (selectedId!==pending.id) {
      setSelectedId(pending.id);
      setSection("Visão geral");
      return;
    }

    const pendingMatches=matches.filter(m=>m.championshipId===pending.id);
    const unplayed=pendingMatches.filter(m=>!m.played);

    if (unplayed.length) {
      setMatches(all=>{
        const updated=all.map(m=>{
          if(!unplayed.some(x=>x.id===m.id)) return m;
          return {...m,homeScore:score(),awayScore:score(),played:true};
        });
        return resolveAutomaticPenalties(updated);
      });
      return;
    }

    const phaseSignature=[
      pending.id,
      pendingMatches.length,
      pendingMatches.map(m=>`${m.id}:${m.stage}:${m.knockoutRound??""}:${m.played?"1":"0"}`).join(",")
    ].join("|");

    if (autoLastStepRef.current===phaseSignature) {
      autoSimulationRef.current=false;
      autoLastStepRef.current="";
      setAutoSeasonCountry(null);
      alert(`A simulação automática foi interrompida porque o campeonato "${pending.name}" não conseguiu criar a próxima fase automaticamente.`);
      return;
    }

    autoLastStepRef.current=phaseSignature;
    prepareNextPhase();
  }, [autoSeasonCountry, championships, matches, selectedId]);

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
    setMatches((all)=>{
      const updated = all.map((m)=>{
        if(!target.some((x)=>x.id===m.id)) return m;
        const hs=score(),as=score();
        return {...m,homeScore:hs,awayScore:as,played:true};
      });
      return resolveAutomaticPenalties(updated);
    });
  };

  const simulateCariocaFirstPhase = () => {
    if (!championship || championship.name !== "Campeonato Carioca") return;
    const regular = matches.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
    if(regular.length!==66){
      alert("A 1ª Divisão do Carioca precisa ter exatamente 66 jogos.");
      return;
    }
    setMatches(all=>{
      const updated=all.map(m=>{
        if(m.championshipId!==championship.id || m.stage!=="regular" || m.played) return m;
        return {...m,homeScore:score(),awayScore:score(),played:true};
      });
      return resolveAutomaticPenalties(updated);
    });
    setSection("Classificação");
  };

  const saveScore = (id:number) => {
    const values=newResult[id];
    if(!values) return;
    const hs=Number(values[0]),as=Number(values[1]);
    if(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0) { alert("Informe placares válidos."); return; }
    setMatches((all)=>{
      const updated = all.map((m)=>m.id===id?{...m,homeScore:hs,awayScore:as,played:true}:m);
      return resolveAutomaticPenalties(updated);
    });
    setNewResult((x)=>{const copy={...x};delete copy[id];return copy;});
  };

  const setPenaltyWinner = (matchId:number, clubId:number) => {
    setMatches((all)=>all.map((m)=>m.id===matchId ? {...m, penaltyWinner:clubId} : m));
  };

  const aggregateTieForMatch = (m:Match) => {
    if (!m.played || m.stage!=="knockout" && m.stage!=="playoff" && m.stage!=="final") return false;
    const related = matches.filter((x)=>
      x.championshipId===m.championshipId &&
      x.stage===m.stage &&
      (x.knockoutRound===m.knockoutRound || x.stage==="playoff" || x.stage==="final") &&
      x.played &&
      [x.home,x.away].some(id=>id===m.home || id===m.away)
    );
    const teams=[...new Set(related.flatMap(x=>[x.home,x.away]))];
    if(teams.length!==2) return false;
    const totals=teams.map(id=>related.reduce((sum,x)=>sum+(x.home===id?(x.homeScore??0):x.away===id?(x.awayScore??0):0),0));
    return totals.length===2 && totals[0]===totals[1];
  };

  // Nos estaduais, a semifinal é criada automaticamente assim que a 1ª fase termina.
  // Isso evita que a competição fique parada apenas porque o usuário não abriu "Preparar próxima fase".
  useEffect(() => {
    if (!championship || championship.division !== "Estadual" || championship.name==="Campeonato Acreano - 2ª Divisão") return;
    if (championship.name==="Campeonato Carioca") {
      const regular=matches.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      if(regular.length===66 && regular.every(m=>m.played)) prepareNextPhase();
      return;
    }
    if (!regularComplete(championship)) return;

    if (championship.name==="Campeonato Carioca" || championship.name==="Campeonato Carioca - 2ª Divisão" || championship.name==="Campeonato Carioca - 3ª Divisão" || championship.name==="Campeonato Carioca - 4ª Divisão") {
      const regular=matches.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const hasMainKnockout=matches.some(m=>m.championshipId===championship.id&&m.stage==="knockout");
      const finals=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(championship.name==="Campeonato Carioca"){
        const main=regular;
        const q=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
        const s=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
        const finals=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
        if(main.length===66 && main.every(m=>m.played) && q.length===0) prepareNextPhase();
        else if(q.length===4 && q.every(m=>m.played) && s.length===0) prepareNextPhase();
        else if(s.length===4 && s.every(m=>m.played) && finals.length===0) prepareNextPhase();
        return;
      }
            if(regular.length===66 && regular.every(m=>m.played) && !hasMainKnockout) prepareNextPhase();
      else if(matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4).length===2 &&
              matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4).every(m=>m.played) &&
              finals.length===0) prepareNextPhase();
      else if(championship.name==="Campeonato Carioca - 2ª Divisão" && finals.length===1 && finals[0].played &&
              !matches.some(m=>m.championshipId===championship.id&&m.stage==="playoff")) prepareNextPhase();
      return;
    }


    if (championship.name==="Campeonato Maranhense" || championship.name==="Campeonato Maranhense - 2ª Divisão") {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const quarters=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===8);
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      const isFirst=championship.name==="Campeonato Maranhense";
      const expected=isFirst?28:66;
      const ready=
        (isFirst && regular.length===expected && regular.every(m=>m.played) && semis.length===0 && final.length===0) ||
        (!isFirst && regular.length===expected && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0) ||
        (!isFirst && quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0) ||
        (semis.length===4 && semis.every(m=>m.played) && final.length===0);
      if(ready) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Mineiro" || championship.name==="Campeonato Mineiro - 2ª Divisão" || championship.name==="Campeonato Mineiro - 3ª Divisão") {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      if(
        (regular.length===66 && regular.every(m=>m.played) && semis.length===0 && final.length===0) ||
        (semis.length===4 && semis.every(m=>m.played) && final.length===0)
      ) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Mato-Grossense" || championship.name==="Campeonato Mato-Grossense - 2ª Divisão") {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      if(
        (regular.length===45 && regular.every(m=>m.played) && semis.length===0 && final.length===0) ||
        (semis.length===4 && semis.every(m=>m.played) && final.length===0)
      ) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Goiano") {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const quarters=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===8);
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      if(
        (regular.length===66 && regular.every(m=>m.played) && quarters.length===0 && semis.length===0 && final.length===0) ||
        (quarters.length===8 && quarters.every(m=>m.played) && semis.length===0 && final.length===0) ||
        (semis.length===4 && semis.every(m=>m.played) && final.length===0)
      ) prepareNextPhase();
      return;
    }
    if (championship.name==="Campeonato Goiano - 2ª Divisão" || championship.name==="Campeonato Goiano - 3ª Divisão") {
      return;
    }

    if (championship.name==="Campeonato Gaúcho" ||
        championship.name==="Campeonato Gaúcho - 2ª Divisão" ||
        championship.name==="Campeonato Gaúcho - 3ª Divisão") {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const quarters=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===8);
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      const isThird=championship.name==="Campeonato Gaúcho - 3ª Divisão";
      const expected=isThird ? 45 : championship.name==="Campeonato Gaúcho" ? 66 : 120;

      const needsThirdSemis=isThird &&
        regular.length===expected && regular.every(m=>m.played) &&
        semis.length===0 && final.length===0;

      const needsQuarters=!isThird &&
        regular.length===expected && regular.every(m=>m.played) &&
        quarters.length===0 && semis.length===0 && final.length===0;

      const needsQuarterWinners=!isThird &&
        quarters.length===8 && quarters.every(m=>m.played) &&
        semis.length===0 && final.length===0;

      const needsFinal=semis.length===4 && semis.every(m=>m.played) && final.length===0;

      if(needsThirdSemis || needsQuarters || needsQuarterWinners || needsFinal) prepareNextPhase();
      return;
    }

    if (isCearaChampionship(championship.name)) {
      const own=matches.filter(m=>m.championshipId===championship.id);
      const regular=own.filter(m=>m.stage==="regular");
      const semis=own.filter(m=>m.stage==="knockout"&&m.knockoutRound===4);
      const final=own.filter(m=>m.stage==="final");
      const expected=cearaRegularMatchCount(championship.name);

      const needsSemifinals=
        regular.length===expected &&
        regular.every(m=>m.played) &&
        semis.length===0 &&
        final.length===0;

      const needsFinal=
        semis.length===4 &&
        semis.every(m=>m.played) &&
        final.length===0;

      if(needsSemifinals || needsFinal) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Catarinense") {
      const q=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(q.length===0 || (q.length===8 && q.every(m=>m.played) && semis.length===0) || (semis.length===4 && semis.every(m=>m.played) && final.length===0)) prepareNextPhase();
      return;
    }
    if (championship.name==="Campeonato Catarinense - 3ª Divisão") {
      const regular=matches.filter(m=>m.championshipId===championship.id&&m.stage==="regular");
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(regular.length===12 && regular.every(m=>m.played) && final.length===0) prepareNextPhase();
      return;
    }
    if (championship.name==="Campeonato Catarinense - 2ª Divisão") return;

    if (championship.name==="Campeonato Capixaba") {
      const quarters=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===8);
      const semis=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(quarters.length===0 || (quarters.length===8 && quarters.every(m=>m.played) && semis.length===0) || (semis.length===4 && semis.every(m=>m.played) && final.length===0)) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Capixaba - 2ª Divisão") {
      const semis=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(semis.length===0 || (semis.length===4 && semis.every(m=>m.played) && final.length===0)) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Amazonense") {
      const semis=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if(semis.length===0 || (semis.length===2 && semis.every(m=>m.played) && final.length===0)) prepareNextPhase();
      return;
    }

    if (championship.name==="Campeonato Amazonense - 2ª Divisão") {
      const semis=matches.filter(m=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
      const final=matches.filter(m=>m.championshipId===championship.id&&m.stage==="final");
      if (semis.length===0 || (semis.length===2 && semis.every(m=>m.played) && final.length===0)) prepareNextPhase();
      return;
    }

    const hasSemifinals = matches.some((m)=>m.championshipId===championship.id&&m.stage==="knockout"&&m.knockoutRound===4);
    if (!hasSemifinals) prepareNextPhase();
  }, [championship?.id, matches]);

  const getStateDQualifiers = (season:number, excludedKeys:Set<string>) => {
    const used = new Set<string>();
    const result: {state:string; slot:number; clubId:number|null; clubName:string|null}[] = [];

    for (const stateRule of D_STATE_SLOTS) {
      const stateChamp = championships.find((c) =>
        c.division==="Estadual" &&
        c.state===stateRule.state &&
        Number(c.season)===season &&
        !c.name.includes("2ª Divisão")
      );
      const stateClubIds = stateChamp ? clubs.filter((c)=>c.championshipId===stateChamp.id).map((c)=>c.id) : [];
      const stateComplete = stateChamp ? regularComplete(stateChamp) : false;
      const table = stateChamp && stateComplete ? tableFor(stateChamp,stateClubIds,matches) : [];
      let cursor = 0;

      for (let slot=1; slot<=stateRule.slots; slot++) {
        let chosen: TableRow|undefined;
        while (cursor<table.length) {
          const candidate = table[cursor++];
          const key = makeClubKey(clubName(candidate.clubId));
          if (excludedKeys.has(key) || used.has(key)) continue;
          chosen = candidate;
          break;
        }
        const chosenName = chosen ? clubName(chosen.clubId) : null;
        if (chosenName) used.add(makeClubKey(chosenName));
        result.push({state:stateRule.state,slot,clubId:chosen?.clubId??null,clubName:chosenName});
      }
    }
    return result;
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
      if(goals[0].g===goals[1].g){
        const last=[...legs].sort((a,b)=>b.round-a.round)[0];
        if(!last.penaltyWinner){alert("Defina o vencedor nos pênaltis de cada play-off empatado da Série B.");return;}
        bWinners.push(last.penaltyWinner);
      } else bWinners.push(goals[0].t);
    }

    const cSecond=matches.filter((m)=>m.championshipId===C.id&&m.stage==="secondPhase");
    if(cSecond.length!==24||!cSecond.every((m)=>m.played)){alert("Finalize os 24 jogos da segunda fase da Série C.");return;}
    const cA=tableFor(C,cSecond.filter((m)=>m.group==="A").flatMap((m)=>[m.home,m.away]).filter((x,i,a)=>a.indexOf(x)===i),matches,"secondPhase","A");
    const cB=tableFor(C,cSecond.filter((m)=>m.group==="B").flatMap((m)=>[m.home,m.away]).filter((x,i,a)=>a.indexOf(x)===i),matches,"secondPhase","B");
    const promotedC=[cA[0].clubId,cA[1].clubId,cB[0].clubId,cB[1].clubId];

    // CRITICAL RULE: the 4 Série D semifinalists are the 4 winners of the QUARTER-FINALS (phase 16).
    const dQuarter=matches.filter((m)=>m.championshipId===D.id&&m.stage==="knockout"&&m.knockoutRound===8);
    if(dQuarter.length!==8||!dQuarter.every((m)=>m.played)){alert("Finalize as 8 jogos das quartas de final da Série D. Os 4 vencedores são os semifinalistas e garantem acesso à Série C.");return;}
    const promotedD=knockoutWinner(matches,8,D.id);
    if(promotedD.length!==4){alert("Não foi possível identificar os 4 semifinalistas da Série D.");return;}

    const dSecondPhaseMatches=matches.filter((m)=>m.championshipId===D.id&&m.stage==="knockout"&&m.knockoutRound===64);
    if(dSecondPhaseMatches.length!==64||!dSecondPhaseMatches.every((m)=>m.played)){
      alert("Finalize os 64 jogos da primeira fase do mata-mata da Série D.");return;
    }
    const dSecondPhaseIds=knockoutWinner(matches,64,D.id);
    const dPrior28Ids=dSecondPhaseIds.filter((id)=>!promotedD.includes(id));
    if(dPrior28Ids.length!==28){
      alert("Não foi possível identificar as 28 vagas da Série D anterior.");return;
    }

    const nationalIds=new Set(
      [A,B,C].flatMap((champ)=>clubs.filter((c)=>c.championshipId===champ.id).map((c)=>makeClubKey(c.name)))
    );
    const prior28Keys=new Set(dPrior28Ids.map((id)=>makeClubKey(clubName(id))));
    const stateDSlots=getStateDQualifiers(currentSeason,new Set([...nationalIds,...prior28Keys]));
    const stateDNames=stateDSlots.filter((x)=>x.clubName).map((x)=>x.clubName!);
    if(stateDNames.length!==64){
      alert("As vagas estaduais da Série D ainda não estão completas. Faltam "+(64-stateDNames.length)+" vaga(s). Finalize os estaduais necessários.");return;
    }

    const aRelegated=aTable.slice(-4).map((r)=>r.clubId);
    const bRelegated=bTable.slice(-4).map((r)=>r.clubId);
    const cRelegated=cTable.slice(-4).map((r)=>r.clubId);
    const aPromoted=[bTable[0].clubId,bTable[1].clubId,...bWinners];

    const currentIds=(d:Division)=>clubs.filter((c)=>c.championshipId===get(d)!.id).map((c)=>c.id);
    const aid=currentIds("Série A"),bid=currentIds("Série B"),cid=currentIds("Série C"),did=currentIds("Série D");
    const nextA=aid.filter((x)=>!aRelegated.includes(x)).concat(aPromoted);
    const nextB=bid.filter((x)=>!bRelegated.includes(x)&&!aPromoted.includes(x)).concat(aRelegated,promotedC);
    const nextC=cid.filter((x)=>!promotedC.includes(x)&&!cRelegated.includes(x)).concat(bRelegated,promotedD);
    const cRelegatedNames=cRelegated.map((id)=>clubName(id));
    const dPrior28Names=dPrior28Ids.map((id)=>clubName(id));
    const nextDNames=[...new Set([...cRelegatedNames,...stateDNames,...dPrior28Names])];

    if(nextA.length!==20||nextB.length!==20||nextC.length!==20||nextDNames.length!==96){
      alert("A movimentação não fechou: A="+nextA.length+" B="+nextB.length+" C="+nextC.length+" D="+nextDNames.length);return;
    }

    const base=nextId(championships);
    const newA={...A,id:base,season:String(nextSeason)};
    const newB={...B,id:base+1,season:String(nextSeason)};
    const newC={...C,id:base+2,season:String(nextSeason)};
    const newD={...D,id:base+3,season:String(nextSeason)};
    const newCs=[newA,newB,newC,newD];
    let clubNext=nextId(clubs);
    const newClubRows:Club[]=[];
    const addClubs=(ids:number[],champId:number)=>ids.map((old)=>{const source=clubs.find((c)=>c.id===old)!;return{id:clubNext++,name:source.name,championshipId:champId,clubKey:makeClubKey(source.name)};});
    const addNamedClubs=(names:string[],champId:number)=>names.map((name)=>{
      const source=clubs.find((c)=>makeClubKey(c.name)===makeClubKey(name));
      return {id:clubNext++,name:source?.name??name,championshipId:champId,clubKey:makeClubKey(source?.name??name)};
    });
    newClubRows.push(...addClubs(nextA,newA.id),...addClubs(nextB,newB.id),...addClubs(nextC,newC.id),...addNamedClubs(nextDNames,newD.id));

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
    : section==="Oitavas de final" ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===16)
    : section==="Quartas de final" ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===8)
    : section==="Semifinais" ? myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===4)
    : section==="Play-offs" || section==="Play-off de acesso" ? myMatches.filter((m)=>m.stage==="playoff")
    : myMatches.filter((m)=>m.stage==="regular"&&m.round===Math.min(...myMatches.filter((m)=>m.stage==="regular"&&!m.played).map((m)=>m.round).concat([1])));

  const currentDPhase=section.startsWith("Série D ·")?Number(section.replace("Série D · ","")):null;
  const phaseLabel=currentDPhase?({64:"1ª fase do mata-mata",32:"2ª fase do mata-mata",16:"Oitavas de final",8:"Quartas de final",4:"Semifinais",2:"Final"} as Record<number,string>)[currentDPhase]:"";

  const tableZone = (division:Division, position:number, state?:string, name?:string) => {
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
    if (division==="Estadual" && name==="Campeonato Carioca") { if(position<=8) return "qualification"; if(position===11) return "playoff"; if(position===12) return "relegation"; return ""; }
    if (division==="Estadual" && name==="Campeonato Capixaba") {
      if(position<=8) return "qualification";
      if(position>=9) return "relegation";
      return "";
    }
    if (division==="Estadual" && name==="Campeonato Capixaba - 2ª Divisão") return position<=2 ? "qualification" : "";
    if (division==="Estadual" && name==="Campeonato Catarinense") { if(position<=8) return "qualification"; if(position>=11) return "relegation"; return ""; }
    if (division==="Estadual" && name==="Campeonato Catarinense - 2ª Divisão") { if(position<=2) return "promotion"; if(position===10) return "relegation"; return ""; }
    if (division==="Estadual" && name==="Campeonato Catarinense - 3ª Divisão") return position<=2 ? "qualification" : "";
    if (division==="Estadual") {
      if (state==="Acre" && name==="Campeonato Acreano") {
        if (position >= 7) return "relegation";
        if (position <= 4) return "qualification";
        return "";
      }
      if (state==="Acre" && name==="Campeonato Acreano - 2ª Divisão") {
        return position <= 2 ? "promotion" : "";
      }
      if (state==="Alagoas" && name==="Campeonato Alagoano") {
        if (position === 8) return "relegation";
        if (position <= 4) return "qualification";
        return "";
      }
      if (state==="Alagoas" && name==="Campeonato Alagoano - 2ª Divisão") {
        return position <= 4 ? "qualification" : "";
      }
      if (state==="Amapá" && name==="Campeonato Amapaense") {
        if (position >= 7) return "relegation";
        if (position <= 4) return "qualification";
        return "";
      }
      if (state==="Amapá" && name==="Campeonato Amapaense - 2ª Divisão") return "";
      if (state==="Distrito Federal" && name==="Campeonato Brasiliense - 2ª Divisão") return position <= 2 ? "promotion" : "";
      if (state==="Amazonas" && name==="Campeonato Amazonense") {
        if (position === 8) return "relegation";
        return "";
      }
      if (state==="Amazonas" && name==="Campeonato Amazonense - 2ª Divisão") return position <= 4 ? "qualification" : "";
      if (state==="Goiás" && name==="Campeonato Goiano") {
        if(position>=11) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="Goiás" && name==="Campeonato Goiano - 2ª Divisão") {
        if(position>=9) return "relegation";
        if(position<=2) return "promotion";
        return "";
      }
      if (state==="Goiás" && name==="Campeonato Goiano - 3ª Divisão") {
        return position<=2 ? "promotion" : "";
      }
      if (state==="Paraíba" && name==="Campeonato Paraibano") {
        if(position>=9) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Paraíba" && name==="Campeonato Paraibano - 2ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Paraná" && name==="Campeonato Paranaense") {
        if(position>=11) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Paraná" && name==="Campeonato Paranaense - 2ª Divisão") {
        if(position>=9) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="Paraná" && name==="Campeonato Paranaense - 3ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="São Paulo" && name==="Campeonato Paulista") {
        if(position>=15) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="São Paulo" && name==="Campeonato Paulista - 2ª Divisão") {
        if(position>=15) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="São Paulo" && name==="Campeonato Paulista - 3ª Divisão") {
        if(position>=15) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="São Paulo" && name==="Campeonato Paulista - 4ª Divisão") {
        if(position>=15) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="São Paulo" && name==="Campeonato Paulista - 5ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Pará" && name==="Campeonato Paraense") {
        if(position>=11) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Pará" && name==="Campeonato Paraense - 2ª Divisão") {
        if(position>=11) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Pará" && name==="Campeonato Paraense - 3ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Minas Gerais" && name==="Campeonato Mineiro") {
        if(position>=11) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Minas Gerais" && name==="Campeonato Mineiro - 2ª Divisão") {
        if(position>=11) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Minas Gerais" && name==="Campeonato Mineiro - 3ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Mato Grosso" && name==="Campeonato Mato-Grossense") {
        if(position>=9) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Mato Grosso" && name==="Campeonato Mato-Grossense - 2ª Divisão") {
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Maranhão" && name==="Campeonato Maranhense") {
        if(position>=7) return "relegation";
        if(position<=4) return "qualification";
        return "";
      }
      if (state==="Maranhão" && name==="Campeonato Maranhense - 2ª Divisão") {
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="Rio Grande do Sul" && name==="Campeonato Gaúcho") {
        if(position>=11) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="Rio Grande do Sul" && name==="Campeonato Gaúcho - 2ª Divisão") {
        if(position>=15) return "relegation";
        if(position<=8) return "qualification";
        return "";
      }
      if (state==="Rio Grande do Sul" && name==="Campeonato Gaúcho - 3ª Divisão") {
        return position<=4 ? "qualification" : "";
      }
      if (state==="Ceará" && name==="Campeonato Cearense") {
        if (position >= 9) return "relegation";
        if (position <= 4) return "qualification";
        return "";
      }
      if (state==="Ceará" && name==="Campeonato Cearense - 2ª Divisão") {
        if (position >= 10) return "relegation";
        if (position <= 4) return "qualification";
        return "";
      }
      if (state==="Ceará" && name==="Campeonato Cearense - 3ª Divisão") {
        return position <= 4 ? "qualification" : "";
      }
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
          <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
            <button
              onClick={()=>setSelectedId(championships.find((c)=>c.division==="Série A"&&c.season===String(Math.max(...championships.map((x)=>Number(x.season)))))?.id??1)}
              style={{flex:1,minWidth:0,textAlign:"left",background:"transparent",border:0,color:"#fff",padding:"10px",cursor:"pointer",borderRadius:8}}
            >🇧🇷 Brasil</button>
            <button
              onClick={()=>simulateCountrySeason("Brasil")}
              title="Simular temporada completa de todos os campeonatos do Brasil"
              style={{border:"1px solid #1e4050",borderRadius:8,background:"#0d1b25",color:"#26d9ff",padding:"0 9px",cursor:"pointer",fontWeight:900,fontSize:16}}
            >⚡</button>
          </div>
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
          <button
            onClick={()=>setStatesOpen(v=>!v)}
            style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              width:"100%",
              textAlign:"left",
              border:0,
              borderRadius:8,
              padding:"9px 10px",
              marginTop:4,
              marginBottom:4,
              background:championship?.division==="Estadual" ? "#111c2a" : "transparent",
              color:"#fff",
              cursor:"pointer",
              fontWeight:800,
              fontSize:16,
            }}
          >
            <span>Estaduais</span><span style={{fontSize:13,opacity:.75}}>{statesOpen?"▾":"▸"}</span>
          </button>
          {statesOpen && (
            <div style={{paddingLeft:10,borderLeft:"1px solid #1e2b3b",margin:"2px 0 8px 6px"}}>
              {championships
                .filter(c=>c.division==="Estadual")
                .sort((a,b)=>(a.state||"").localeCompare(b.state||"")||(a.name||"").localeCompare(b.name)||Number(b.season)-Number(a.season))
                .filter((c,i,arr)=>i===arr.findIndex(x=>x.state===c.state))
                .map(c=>(
                  <button
                    key={c.id}
                    onClick={()=>{setSelectedId(c.id);setSection("Visão geral");setSelectedClub(null);}}
                    style={{
                      display:"block",
                      width:"100%",
                      textAlign:"left",
                      border:0,
                      borderRadius:7,
                      padding:"8px 8px",
                      marginBottom:3,
                      background:championship?.id===c.id?"#111c2a":"transparent",
                      color:"#fff",
                      cursor:"pointer",
                      fontWeight:800,
                      fontSize:15,
                    }}
                  >
                    🇧🇷 {c.state}
                  </button>
                ))}
            </div>
          )}
        </aside>

        <main style={{padding:28,maxWidth:1250,width:"100%",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <div><div style={{fontSize:13,color:"#65758a"}}>Brasil / {championship.state ? championship.state+" / " : ""}{championship.division} / {championship.season}</div><h1 style={{margin:"6px 0"}}>{championship.name}</h1></div>
            <div>
              {button("Visão geral",()=>setSection("Visão geral"))}
              {button("Classificação",()=>setSection("Classificação"))}
              {button("Jogos",()=>setSection("Jogos"))}
              {button("Clubes",()=>setSection("Clubes"))}
              {championship.state && (() => {
                const stateDivisions = championships
                  .filter(c=>c.state===championship.state && c.season===championship.season)
                  .sort((a,b)=>a.name.localeCompare(b.name));
                return stateDivisions.length>1 ? stateDivisions.map(c=>button(
                  c.name.includes("4ª Divisão") ? "4ª Divisão" :
                  c.name.includes("5ª Divisão") ? "5ª Divisão" :
                  c.name.includes("4ª Divisão") ? "4ª Divisão" :
                  c.name.includes("3ª Divisão") ? "3ª Divisão" :
                  c.name.includes("2ª Divisão") ? "2ª Divisão" : "1ª Divisão",
                  ()=>{setSelectedId(c.id);setSection("Visão geral");setSelectedClub(null);}
                )) : null;
              })()}
              {championship.division==="Série B"&&button("Play-offs",()=>setSection("Play-offs"))}
              {championship.division==="Série C"&&button("Segunda fase",()=>setSection("Segunda fase"))}
              {championship.division==="Série C"&&myMatches.some((m)=>m.stage==="final")&&button("Final",()=>setSection("Final"))}
              {championship.division==="Estadual"&&championship.name==="Campeonato Carioca - 2ª Divisão"&&myMatches.some((m)=>m.stage==="playoff")&&button("Play-off de permanência",()=>setSection("Play-off de permanência"))}
              {championship.division==="Estadual"&&championship.name==="Campeonato Capixaba"&&myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===8)&&button("Quartas de final",()=>setSection("Quartas de final"))}
              {championship.state==="São Paulo"&&myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===16)&&button("Oitavas de final",()=>setSection("Oitavas de final"))}
              {championship.division==="Estadual"&&championship.name!=="Campeonato Brasiliense - 2ª Divisão"&&myMatches.some((m)=>m.stage==="knockout"&&m.knockoutRound===4)&&button("Semifinais",()=>setSection("Semifinais"))}
              {championship.division==="Estadual"&&championship.name!=="Campeonato Brasiliense - 2ª Divisão"&&myMatches.some((m)=>m.stage==="final")&&button("Final",()=>setSection("Final"))}
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

          {section==="Visão geral" && championship.division==="Estadual" && panel("Estrutura do campeonato",(()=>{
            const isAcre2 = championship.name==="Campeonato Acreano - 2ª Divisão";
            const isAlagoas2 = championship.name==="Campeonato Alagoano - 2ª Divisão";
            const isDistritoFederal2 = championship.name==="Campeonato Brasiliense - 2ª Divisão";
            const isEspiritoSanto1 = championship.name==="Campeonato Capixaba";
            const isEspiritoSanto2 = championship.name==="Campeonato Capixaba - 2ª Divisão";
            const isStateSecond = isAcre2 || isAlagoas2 || isDistritoFederal2 || isEspiritoSanto2;
            return <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:14}}>
                <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>{isAcre2?4:isAlagoas2?6:isDistritoFederal2?7:isEspiritoSanto1||isEspiritoSanto2?10:8}</strong><div style={{fontSize:12,color:"#8291a5"}}>clubes</div></div>
                <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>{isAcre2?6:isAlagoas2?5:isDistritoFederal2?6:isEspiritoSanto1?9:isEspiritoSanto2?8:7}</strong><div style={{fontSize:12,color:"#8291a5"}}>rodadas na 1ª fase</div></div>
                <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>{isDistritoFederal2?0:isEspiritoSanto1?8:isEspiritoSanto2?4:isAcre2?2:isAlagoas2?4:4}</strong><div style={{fontSize:12,color:"#8291a5"}}>{isDistritoFederal2||isEspiritoSanto1?"classificados ao mata-mata":"semifinalistas"}</div></div>
                <div style={{padding:14,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}><strong>{isEspiritoSanto1?0:isEspiritoSanto2?2:isStateSecond?0:2}</strong><div style={{fontSize:12,color:"#8291a5"}}>{isEspiritoSanto2?"vagas de acesso":"vagas para a Série D"}</div></div>
              </div>
              <p style={{color:"#8291a5"}}>{isAcre2 ? "Os 2 primeiros colocados garantem acesso à 1ª Divisão do Acre. O 1º colocado é o campeão." : isAlagoas2 ? "Os 4 primeiros avançam para as semifinais. O campeão garante o acesso à 1ª Divisão de Alagoas." : isDistritoFederal2 ? "Fase única em turno único. Os 2 primeiros colocados garantem acesso à 1ª Divisão do Distrito Federal; o 1º colocado é o campeão." : isEspiritoSanto1 ? "10 clubes jogam em turno único. Os 8 primeiros avançam às quartas de final; quartas, semifinais e final são em ida e volta. Os 2 últimos são rebaixados." : isEspiritoSanto2 ? "Dois grupos de 5 em turno e returno. Os 2 primeiros de cada grupo avançam às semifinais em ida e volta; a final é em jogo único. Os dois finalistas sobem." : "As vagas para a Série D serão identificadas automaticamente conforme a classificação final, respeitando a elegibilidade nacional dos clubes."}</p>
            </>;
          })())}
          {section==="Visão geral" && panel("Regulamento",<>
            <p>{championship.regulation}</p>
            <p><strong>Acesso:</strong> {championship.promotion}</p>
            <p><strong>Rebaixamento:</strong> {championship.relegation}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {championship.name==="Campeonato Carioca" && button("⚡ Simular 1ª fase",simulateCariocaFirstPhase,true)}
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
            const dSecondPhaseIds = dFirstComplete ? knockoutWinner(myMatches,64,championship.id) : [];
            const dQuarter = myMatches.filter((m)=>m.stage==="knockout"&&m.knockoutRound===8);
            const dAccessComplete = dQuarter.length===8 && dQuarter.every((m)=>m.played);
            const promotedD = dAccessComplete ? knockoutWinner(myMatches,8,championship.id) : [];
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
              {(() => {
                const nationalKeys=new Set(
                  championships
                    .filter((c)=>["Série A","Série B","Série C"].includes(c.division)&&Number(c.season)===currentSeason)
                    .flatMap((c)=>clubs.filter((cl)=>cl.championshipId===c.id).map((cl)=>makeClubKey(cl.name)))
                );
                const priorKeys=new Set<string>(dPrior28.map((id)=>makeClubKey(clubName(id))));
                const stateSlots=getStateDQualifiers(currentSeason,new Set([...nationalKeys,...priorKeys]));
                const defined=stateSlots.filter((x)=>x.clubName).length;
                return <>
                  <div style={{padding:"10px 14px",marginBottom:12,borderRadius:10,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.22)",color:"#86efac"}}>
                    {defined}/{stateSlotCount} vagas estaduais identificadas.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
                    {D_STATE_SLOTS.map((x)=>(
                      <div key={x.state} style={{border:"1px solid #1e2b3b",borderRadius:12,overflow:"hidden",background:"#0b131f"}}>
                        <div style={{padding:"12px 14px",fontWeight:800,borderBottom:"1px solid #1e2b3b"}}>{x.state} · {x.slots} vagas</div>
                        {stateSlots.filter((s)=>s.state===x.state).map((s)=>(
                          <div key={s.slot} style={{padding:"10px 14px",borderTop:"1px solid #172331",display:"flex",justifyContent:"space-between",gap:10}}>
                            <span style={{color:"#65758a"}}>Vaga {s.slot}</span>
                            <strong style={{color:s.clubName?"#f4f7fb":"#65758a"}}>{s.clubName??"Aguardando estadual"}</strong>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>;
              })()}

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
            {championship.name==="Campeonato Carioca" && myMatches.filter(m=>m.stage==="regular"&&(m.group==="A"||m.group==="B")).some(m=>!m.played) && (
              <div style={{marginBottom:14}}>
                {button("⚡ Simular 1ª fase da 1ª fase",simulateCariocaFirstPhase,true)}
              </div>
            )}
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
                            {rows.map((r,i)=><tr key={r.clubId} style={zoneStyle(tableZone(championship.division,i+1,championship.state,championship.name))}>
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
            ) : championship.name==="Campeonato Carioca" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>
                  1ª Divisão — 12 clubes em grupo único, turno único. Os 8 primeiros avançam às quartas de final. O 12º é rebaixado diretamente e o 11º disputa o play-off de permanência contra o vice da 2ª Divisão.
                </p>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(h=><th key={h} style={{padding:9,textAlign:"left",borderBottom:"2px solid #1e2b3b"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {currentTable.map((r,i)=>
                        <tr key={r.clubId} style={zoneStyle(tableZone(championship.division,i+1,championship.state,championship.name))}>
                          <td style={{padding:9,fontWeight:800}}>{i+1}</td>
                          <td style={{padding:9}}>
                            <button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb"}}>{clubName(r.clubId)}</button>
                          </td>
                          <td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : championship.name==="Campeonato Carioca - 2ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>Taça Santos Dumont — 12 clubes em turno único. Os 4 primeiros avançam às semifinais. O play-off de permanência só é criado após a final.</p>
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(h=><th key={h} style={{padding:9,textAlign:"left",borderBottom:"2px solid #1e2b3b"}}>{h}</th>)}</tr></thead><tbody>
                  {currentTable.map((r,i)=><tr key={r.clubId} style={zoneStyle(i<4?"qualification":i>=10?"relegation":"")}><td style={{padding:9}}>{i+1}</td><td style={{padding:9}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",fontWeight:800,color:"#f4f7fb"}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                </tbody></table></div>
              </div>
            ) : championship.name==="Campeonato Carioca - 3ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>Fase principal — turno único. Os 4 primeiros avançam às semifinais.</p>
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(h=><th key={h} style={{padding:9,textAlign:"left",borderBottom:"2px solid #1e2b3b"}}>{h}</th>)}</tr></thead><tbody>
                  {currentTable.map((r,i)=><tr key={r.clubId} style={zoneStyle(i<4?"qualification":i>=10?"relegation":"")}><td style={{padding:9}}>{i+1}</td><td style={{padding:9}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",fontWeight:800,color:"#f4f7fb"}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                </tbody></table></div>
              </div>
            ) : championship.name==="Campeonato Carioca - 4ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>Fase principal — turno único. Os 4 primeiros avançam às semifinais. Não há rebaixamento.</p>
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(h=><th key={h} style={{padding:9,textAlign:"left",borderBottom:"2px solid #1e2b3b"}}>{h}</th>)}</tr></thead><tbody>
                  {currentTable.map((r,i)=><tr key={r.clubId} style={zoneStyle(i<4?"qualification":"")}><td style={{padding:9}}>{i+1}</td><td style={{padding:9}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",fontWeight:800,color:"#f4f7fb"}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                </tbody></table></div>
              </div>
                        ) : championship.name==="Campeonato Capixaba - 2ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>2ª Divisão do Espírito Santo — 2 grupos de 5 clubes, com turno e returno. Os 2 primeiros de cada grupo avançam às semifinais.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:18}}>
                  {["A","B"].map((group) => {
                    const groupClubs=myClubs.filter(c=>myMatches.some(m=>m.stage==="regular"&&m.group===group&&(m.home===c.id||m.away===c.id)));
                    const rows=tableFor(championship,groupClubs.map(c=>c.id),myMatches,"regular",group);
                    return <div key={group} style={{border:"1px solid #1e2b3b",borderRadius:14,overflow:"hidden",background:"#0b131f"}}>
                      <div style={{padding:"12px 14px",fontWeight:800,borderBottom:"1px solid #1e2b3b"}}>Grupo {group}</div>
                      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(x=><th key={x} style={{textAlign:"left",padding:8,borderBottom:"2px solid #1e2b3b",fontSize:11}}>{x}</th>)}</tr></thead><tbody>
                        {rows.map((r,i)=><tr key={r.clubId} style={zoneStyle(i<2?"qualification":"")}><td style={{padding:8,fontWeight:700}}>{i+1}</td><td style={{padding:8}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",textAlign:"left"}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                      </tbody></table></div>
                    </div>;
                  })}
                </div>
              </div>
            ) : championship.name==="Campeonato Amazonense - 2ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>2ª Divisão do Amazonas — turno único. Os 4 primeiros da primeira fase avançam às semifinais.</p>
                <div style={{overflowX:"auto",border:"1px solid #1e2b3b",borderRadius:14}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}>
                    <thead>
                      <tr style={{background:"#101a29",color:"#aebdce",fontSize:12}}>
                        {["#","Clube","J","V","E","D","GP","GC","SG","PTS"].map(h=><th key={h} style={{padding:"12px 10px",textAlign:h==="Clube"?"left":"center",borderBottom:"1px solid #1e2b3b"}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {currentTable.map((r,i)=>{
                        const zone=tableZone(championship.division,i+1,championship.state,championship.name);
                        return <tr key={r.clubId} style={{...zoneStyle(zone),borderBottom:"1px solid #1e2b3b"}}>
                          <td style={{padding:"11px 10px",fontWeight:800,textAlign:"center"}}>{i+1}</td>
                          <td style={{padding:"11px 10px"}}>
                            <button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",textAlign:"left"}}>{clubName(r.clubId)}</button>
                          </td>
                          <td style={{textAlign:"center"}}>{r.played}</td>
                          <td style={{textAlign:"center"}}>{r.wins}</td>
                          <td style={{textAlign:"center"}}>{r.draws}</td>
                          <td style={{textAlign:"center"}}>{r.losses}</td>
                          <td style={{textAlign:"center"}}>{r.gf}</td>
                          <td style={{textAlign:"center"}}>{r.ga}</td>
                          <td style={{textAlign:"center"}}>{r.gd}</td>
                          <td style={{textAlign:"center",fontWeight:900}}>{r.points}</td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : championship.name==="Campeonato Amapaense - 2ª Divisão" ? (
              <div>
                <p style={{color:"#8291a5",marginTop:0}}>2ª Divisão do Amapá — dois grupos de 6 clubes. Os 2 melhores de cada grupo avançam às semifinais.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:18}}>
                  {["A","B"].map((group) => {
                    const groupClubs = myClubs.filter((c)=>myMatches.some((m)=>m.stage==="regular"&&m.group===group&&(m.home===c.id||m.away===c.id)));
                    const rows=tableFor(championship,groupClubs.map(c=>c.id),myMatches,"regular",group);
                    return <div key={group} style={{border:"1px solid #1e2b3b",borderRadius:14,overflow:"hidden",background:"#0b131f"}}>
                      <div style={{padding:"12px 14px",fontWeight:800,borderBottom:"1px solid #1e2b3b"}}>Grupo {group}</div>
                      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map(x=><th key={x} style={{textAlign:"left",padding:8,borderBottom:"2px solid #1e2b3b",fontSize:11}}>{x}</th>)}</tr></thead><tbody>
                        {rows.map((r,i)=><tr key={r.clubId} style={zoneStyle(i<2?"qualification":"")}><td style={{padding:8,fontWeight:700}}>{i+1}</td><td style={{padding:8}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",textAlign:"left"}}>{clubName(r.clubId)}</button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
                      </tbody></table></div>
                    </div>;
                  })}
                </div>
              </div>
            ) : (
              <>
                <div style={{marginBottom:18}}>
                  <h3 style={{margin:"0 0 10px"}}>{championship.division==="Série C" ? "1ª fase" : "Classificação geral"}</h3>
                  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Clube","J","V","E","D","GP","GC","SG","Pts"].map((x)=><th key={x} style={{textAlign:"left",padding:10,borderBottom:"2px solid #1e2b3b"}}>{x}</th>)}</tr></thead><tbody>
                    {currentTable.map((r,i)=><tr key={r.clubId} style={zoneStyle(tableZone(championship.division,i+1,championship.state,championship.name))}><td style={{padding:10,fontWeight:700}}>{i+1}</td><td style={{padding:10}}><button onClick={()=>setSelectedClub(clubName(r.clubId))} style={{border:0,background:"none",padding:0,cursor:"pointer",fontWeight:800,color:"#f4f7fb",display:"flex",alignItems:"center",gap:9}}><span>{clubName(r.clubId)}</span></button></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><strong>{r.points}</strong></td></tr>)}
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

          {section==="Play-off de permanência" && championship.name==="Campeonato Carioca - 2ª Divisão" && panel("Play-off de permanência",<>
            {(() => {
              const p=myMatches.find(m=>m.stage==="playoff");
              if(!p) return <p style={{color:"#65758a"}}>O play-off ainda não foi criado. Ele será criado automaticamente após a final da 2ª Divisão.</p>;
              const winner=p.played ? ((p.homeScore??0)>(p.awayScore??0)?p.home:(p.awayScore??0)>(p.homeScore??0)?p.away:p.penaltyWinner??null) : null;
              const loser=winner===p.home?p.away:winner===p.away?p.home:null;
              return <>
                <p style={{color:"#8291a5",marginTop:0}}>
                  11º colocado da 1ª Divisão × vice-campeão da 2ª Divisão. Jogo único; empate é decidido automaticamente nos pênaltis.
                </p>
                <div style={{padding:16,border:"1px solid #1e2b3b",borderRadius:12,background:"#0b131f"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 55px 20px 55px 1fr",alignItems:"center",gap:10}}>
                    <strong style={{textAlign:"right"}}>{clubName(p.home)}</strong>
                    <input value={newResult[p.id]?.[0]??(p.homeScore??"")} onChange={e=>setNewResult(x=>({...x,[p.id]:[e.target.value,x[p.id]?.[1]??(p.awayScore??"").toString()]}))} style={{width:45}}/>
                    <strong>×</strong>
                    <input value={newResult[p.id]?.[1]??(p.awayScore??"")} onChange={e=>setNewResult(x=>({...x,[p.id]:[x[p.id]?.[0]??(p.homeScore??"").toString(),e.target.value]}))} style={{width:45}}/>
                    <strong>{clubName(p.away)}</strong>
                  </div>
                  <div style={{marginTop:12,textAlign:"center"}}>{button("Salvar",()=>saveScore(p.id),true)} {button("⚡ Gerar resultado",()=>generateResults("phase"))}</div>
                  {p.played && p.penaltyWinner && <div style={{marginTop:10,textAlign:"center",color:"#26d9ff"}}>⚽ Pênaltis: {clubName(p.penaltyWinner)} venceu {p.penaltyHomeScore} × {p.penaltyAwayScore}</div>}
                </div>
                {winner && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
                  <div style={{padding:14,borderRadius:12,background:"rgba(34,197,94,.10)",boxShadow:"inset 4px 0 0 #22c55e"}}><strong>1ª Divisão em 2027</strong><div style={{marginTop:5}}>{clubName(winner)}</div></div>
                  <div style={{padding:14,borderRadius:12,background:"rgba(239,68,68,.10)",boxShadow:"inset 4px 0 0 #ef4444"}}><strong>2ª Divisão em 2027</strong><div style={{marginTop:5}}>{loser ? clubName(loser) : "—"}</div></div>
                </div>}
              </>;
            })()}
          </>)}

          {section==="Jogos" && panel("Jogos",<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar rodada",()=>generateResults("round"),true)} {button("⚡ Gerar restantes",()=>generateResults("remaining"))} {button("⚙ Preparar fase",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.slice(0,100).map(m=><div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 1fr 110px",alignItems:"center",gap:10,padding:12,border:"1px solid #1e2b3b",borderRadius:10,background:"#0b131f"}}><span style={{textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}><span>{clubName(m.home)}</span></span><input value={newResult[m.id]?.[0]??(m.homeScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[e.target.value,x[m.id]?.[1]??(m.awayScore??"").toString()]}))} style={{width:50}}/><span style={{display:"flex",alignItems:"center",gap:8}}><span>{clubName(m.away)}</span></span><div><input value={newResult[m.id]?.[1]??(m.awayScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[x[m.id]?.[0]??(m.homeScore??"").toString(),e.target.value]}))} style={{width:50}}/> {button(m.played?"Salvar":"Salvar",()=>saveScore(m.id))}</div></div>)}</div>
          </>)}

          {(section==="Play-offs"||section==="Play-off de acesso"||section==="Segunda fase"||section==="Quartas de final"||section==="Semifinais"||section==="Final"||currentDPhase!==null) && panel(currentDPhase?phaseLabel:section,<>
            <div style={{marginBottom:14}}>{button("⚡ Gerar resultados desta fase",()=>generateResults("phase"),true)} {button("→ Avançar automaticamente",prepareNextPhase)}</div>
            <div style={{display:"grid",gap:8}}>{displayedMatches.map(m=>{
              const tie=aggregateTieForMatch(m);
              const phaseLegs=displayedMatches.filter(x=>x.stage===m.stage && x.knockoutRound===m.knockoutRound && x.championshipId===m.championshipId);
              const isLastLeg=phaseLegs.length<=1 || m.round===Math.max(...phaseLegs.map(x=>x.round));
              return <div key={m.id} style={{padding:12,border:"1px solid #1e2b3b",borderRadius:10,background:"#0b131f"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 55px 20px 55px 1fr 100px",alignItems:"center",gap:10}}>
                  <span style={{textAlign:"right"}}>{clubName(m.home)}</span>
                  <input value={newResult[m.id]?.[0]??(m.homeScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[e.target.value,x[m.id]?.[1]??(m.awayScore??"").toString()]}))} style={{width:45}}/>
                  <strong>×</strong>
                  <input value={newResult[m.id]?.[1]??(m.awayScore??"")} onChange={e=>setNewResult(x=>({...x,[m.id]:[x[m.id]?.[0]??(m.homeScore??"").toString(),e.target.value]}))} style={{width:45}}/>
                  <span>{clubName(m.away)}</span>
                  {button("Salvar",()=>saveScore(m.id))}
                </div>
                {tie && isLastLeg && m.penaltyWinner && <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #1e2b3b",textAlign:"center"}}>
                  <strong style={{fontSize:13}}>⚽ Pênaltis: {clubName(m.penaltyWinner)} venceu {m.penaltyHomeScore ?? ""} × {m.penaltyAwayScore ?? ""}</strong>
                </div>}
              </div>
            })}</div>
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
