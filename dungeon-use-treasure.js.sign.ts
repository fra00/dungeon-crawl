export declare function useTreasureSearch(config: {
  gameSession: any;
  visibilityMap: any;
  onNotify: (message: string) => void;
  onActionDone: () => void;
  onForceTurnEnd: () => void;
  sessionManager: any;
  onTreasureCardDrawn: (card: any) => void;
  onWanderingMonster: (x: number, y: number) => void;
}): {
  foundTreasures: { x: number; y: number; img: string }[];
  searchTreasure: () => void;
  getFoundTreasures: () => { x: number; y: number; img: string }[];
  applyTreasureEffect: (card: any) => void;
};