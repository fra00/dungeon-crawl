export declare function useHeroStats(config?: { staticEquipment?: any[] }): {
  calculateStats: (heroState: any) => {
    attacco: number;
    difesa: number;
    movimento: number;
    mente: number;
    corpo: number;
    canAttackDiagonal: boolean;
    canAttackRanged: boolean;
    canDisarmTraps: boolean;
    hasDoubleAttack: boolean;
  };
  calculateAttackDice: (heroState: any, monster: any) => number;
  canAttackTwice: (heroState: any, monster: any) => boolean;
  getConsumableWeaponId: (heroState: any) => number | null;
};