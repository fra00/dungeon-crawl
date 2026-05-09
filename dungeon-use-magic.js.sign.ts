export declare function useMagicLogic(config: {
  gameSession: any;
  onUpdateSession: (updater: (prev: any) => any) => void;
  onNotify: (message: string) => void;
  onActionDone: () => void;
  staticSpells: any[];
  combatLogic: any;
  mapInteractionLogic: any;
  fogOfWarLogic: any;
  heroStatsLogic: any;
}): {
  commitSessionUpdate: (updater: (session: any) => any) => boolean;
  castSpell: (spellId: number, targetHeroId: number | null, targetMonsterId: number | null, targetX: number | null, targetY: number | null) => void;
  removeExpiredEffects: (heroId: number | null, monsterId: number | null, effect: string) => void;
};