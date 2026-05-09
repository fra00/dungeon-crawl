export function Hero(data?: any): {
  id: number;
  classe: string;
  attacco: number;
  difesa: number;
  movimento: number;
  mente: number;
  corpo: number;
  miniature: string;
  miniatureDeath: string;
  portrait: string;
};

export function Monster(data?: any): {
  id: number;
  nome: string;
  movimento: number;
  attacco: number;
  difesa: number;
  corpo: number;
  mente: number;
  immagine: string;
  immalarge: string;
  nonmorto: boolean;
};

export function Equipment(data?: any): {
  id: number;
  nome: string;
  dadatt: number;
  daddif: number;
  daddifex: number;
  numdadicontr: number;
  targetMonster: number | string;
  doppioatt: boolean;
  mosdoppio: number;
  puntimente: number;
  doppiamag: boolean;
  movim: number;
  noogg: number;
  diago: boolean;
  tiro: boolean;
  tirounavo: boolean;
  disinnesc: boolean;
  nopsg: boolean;
  nopsgid: number;
  solopsg: boolean;
  solopsgid: number;
  prezzo: number;
  immagine: string;
};

export function Item(data?: any): {
  id: number;
  nome: string;
  hp: number;
  mp: number;
  targetType: string;
  movimento: number;
  attacco: number;
  difesa: number;
  natt: number;
  acqua: boolean;
  danni: number;
};

export function Spell(data?: any): {
  id: number;
  nome: string;
  elemento: string;
  descrizione: string;
  immagine: string;
  dorso: string;
  targetType: string;
  effetto: string;
  valore: number;
};

export function TreasureCard(data?: any): {
  id: number;
  effetto: string;
  azione: string;
  valore: number;
  immagine: string;
};