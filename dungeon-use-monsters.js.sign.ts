export declare function useDungeonMonsters(config: {
  gameSession: any;
  visibilityMap: any;
  onUpdateSession: (session: any) => void;
  onNotify: (message: string) => void;
  monsterDefinitions: any[];
}): {
  spawnedLocations: string[];
  spawnWanderingMonster: (heroX: number, heroY: number) => {
    id: number;
    monster: {
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
    } | null;
    x: number;
    y: number;
    currentBody: number;
    currentMind: number;
    activeStatus: string[];
  } | null;
};