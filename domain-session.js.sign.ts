export declare const HeroState: (data?: any) => {
  heroId: number;
  turnOrder: number;
  currentBody: number;
  currentMind: number;
  gold: number;
  inventory: number[];
  equipment: number[];
  equipped: number[];
  availableSpells: number[];
  activeStatus: string[];
  isEscaped: boolean;
  x: number;
  y: number;
  hero: { id: number; classe: string; attacco: number; difesa: number; movimento: number; mente: number; corpo: number; miniature: string; miniatureDeath: string; portrait: string };
};

export declare const MonsterState: (data?: any) => {
  id: number;
  monster: { id: number; nome: string; movimento: number; attacco: number; difesa: number; corpo: number; mente: number; immagine: string; immalarge: string; nonmorto: boolean };
  x: number;
  y: number;
  currentBody: number;
  currentMind: number;
  activeStatus: string[];
};

export declare const ScriptImage: (data?: any) => {
  x: number;
  y: number;
  src: string;
};

export declare const GameSession: (data?: any) => {
  campaignName: string;
  currentMap: { header: { descrizione: string; mostro_uscita: number; tesoro_finale: { x: number; y: number }; oggetto_f: number; arma_f: number; merr: number; nfine: number }; grid: { x: number; y: number; arnt: { antroc: boolean; inv: boolean }; mobili: { num: number | null; img: string }; mostab: { mosid: number; mos: boolean; corpo: number }; tes: { mon: number; ogg: number; arma: number; trp: number }; psgg: { ps: number | null; oriz: boolean }; trpl: { tipo: number; rccadex: number; rccadey: number }; fine: string }[]; eroi_start: { id: number; x: number; y: number }[]; porte: { x: number; y: number; oriz: boolean }[]; scripts: { x: number; y: number; text: string; evento: number; unavolta: boolean; morto: boolean; idmosc: number }[] };
  currentMissionIndex: number;
  heroes: { heroId: number; turnOrder: number; currentBody: number; currentMind: number; gold: number; inventory: number[]; equipment: number[]; equipped: number[]; availableSpells: number[]; activeStatus: string[]; isEscaped: boolean; x: number; y: number; hero: { id: number; classe: string; attacco: number; difesa: number; movimento: number; mente: number; corpo: number; miniature: string; miniatureDeath: string; portrait: string } }[];
  monsters: { id: number; monster: { id: number; nome: string; movimento: number; attacco: number; difesa: number; corpo: number; mente: number; immagine: string; immalarge: string; nonmorto: boolean }; x: number; y: number; currentBody: number; currentMind: number; activeStatus: string[] }[];
  openedDoors: string[];
  spawnedLocations: string[];
  currentTurn: number;
  isHeroOrderConfirmed: boolean;
  lastAttack: { hero: any; monster: any; combatResult: any } | null;
  treasureDeck: { id: number; effetto: string; azione: string; valore: number; immagine: string }[];
  triggeredScripts: string[];
  scriptImages: { x: number; y: number; src: string }[];
};

export declare const TurnPhase: (data?: any) => {
  HasMoved: boolean;
  HasPerformedAction: boolean;
  IsTurnFinished: boolean;
};