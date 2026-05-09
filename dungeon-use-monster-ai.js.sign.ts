export declare function useMonsterAI(config: {
  gameSession: any;
  visibilityMap: any;
  onNotify: (message: string) => void;
  pathfinding: any;
  combatLogic: any;
  heroStatsLogic: any;
  sessionManager: any;
}): {
  isMonsterTurnInProgress: boolean;
  runMonsterTurn: () => Promise<void>;
  performInstantAttack: (monster: any, hero: any) => Promise<void>;
  findNearestHero: (monster: any) => any;
};