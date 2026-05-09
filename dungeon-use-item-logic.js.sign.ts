export declare function useItemLogic(config: {
  staticItems: any[];
  sessionManager: {
    useItem: (heroId: number, itemId: number, staticItems: any[], targetMonsterId?: number | null) => boolean;
    [key: string]: any;
  };
}): {
  useItem: (heroId: number, itemId: number, gameSession: any, targetMonsterId?: number | null) => boolean;
};