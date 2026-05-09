export declare function useInventoryLogic(config: {
  staticEquipment: any[];
  sessionManager: any;
}): {
  isItemCompatibleWithHero: (hero: any, item: any) => boolean;
  toggleEquipItem: (heroId: number, itemId: number, gameSession: any) => boolean;
};