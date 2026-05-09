export const MapObjectiveCoordinate: (data?: any) => {
  x: number;
  y: number;
};

export const MapHeader: (data?: any) => {
  descrizione: string;
  mostro_uscita: number;
  tesoro_finale: { x: number; y: number };
  oggetto_f: number;
  arma_f: number;
  merr: number;
  nfine: number;
};

export const BlockCellArea: (data?: any) => {
  antroc: boolean;
  inv: boolean;
};

export const MapCellFurniture: (data?: any) => {
  num: number | null;
  img: string;
};

export const MapCellMonster: (data?: any) => {
  mosid: number;
  mos: boolean;
  corpo: number;
};

export const MapCellTreasure: (data?: any) => {
  ts: number;
  mon: number;
  ogg: number;
  arma: number;
  trp: number;
};

export const MapCellPassage: (data?: any) => {
  ps: number | null;
  oriz: boolean;
};

export const MapCellTrap: (data?: any) => {
  tipo: number;
  rccadex: number;
  rccadey: number;
};

export const MapCell: (data?: any) => {
  x: number;
  y: number;
  arnt: { antroc: boolean; inv: boolean };
  mobili: { num: number | null; img: string };
  mostab: { mosid: number; mos: boolean; corpo: number };
  tes: { ts: number; mon: number; ogg: number; arma: number; trp: number };
  psgg: { ps: number | null; oriz: boolean };
  trpl: { tipo: number; rccadex: number; rccadey: number };
  fine: string;
};

export const MapHeroStart: (data?: any) => {
  id: number;
  x: number;
  y: number;
};

export const MapDoor: (data?: any) => {
  x: number;
  y: number;
  oriz: boolean;
};

export const MapScript: (data?: any) => {
  x: number;
  y: number;
  text: string;
  evento: number;
  unavolta: boolean;
  morto: boolean;
  idmosc: number;
};

export const MapDefinition: (data?: any) => {
  header: {
    descrizione: string;
    mostro_uscita: number;
    tesoro_finale: { x: number; y: number };
    oggetto_f: number;
    arma_f: number;
    merr: number;
    nfine: number;
  };
  grid: Array<{
    x: number;
    y: number;
    arnt: { antroc: boolean; inv: boolean };
    mobili: { num: number | null; img: string };
    mostab: { mosid: number; mos: boolean; corpo: number };
    tes: { ts: number; mon: number; ogg: number; arma: number; trp: number };
    psgg: { ps: number | null; oriz: boolean };
    trpl: { tipo: number; rccadex: number; rccadey: number };
    fine: string;
  }>;
  eroi_start: Array<{ id: number; x: number; y: number }>;
  porte: Array<{ x: number; y: number; oriz: boolean }>;
  scripts: Array<{
    x: number;
    y: number;
    text: string;
    evento: number;
    unavolta: boolean;
    morto: boolean;
    idmosc: number;
  }>;
};

export const Mission: (data?: any) => {
  ordine: number;
  file: string;
  titolo: string;
};

export const Campaign: (data?: any) => {
  nome_campagna: string;
  missioni: Array<{ ordine: number; file: string; titolo: string }>;
};

export const VisibilityCell: (data?: any) => {
  x: number;
  y: number;
  valo: string;
  vis1: string;
  vis2: string;
  fog: boolean;
};

export const VisibilityMap: (data?: any) => {
  source: string;
  image: string;
  data: Array<{
    x: number;
    y: number;
    valo: string;
    vis1: string;
    vis2: string;
    fog: boolean;
  }>;
};

export const GameScript: (data?: any) => {
  command: string;
  params: number;
  isOneTime: boolean;
};