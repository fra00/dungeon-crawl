export declare function loadShopData(): Promise<{ heroes: Array<Record<string, any>>; items: Array<Record<string, any>> }>;
export declare function validatePurchase(heroState: Record<string, any>, item: Record<string, any>): { allowed: boolean; reason: string };
export declare function executePurchase(session: Record<string, any>, heroIndex: number, item: Record<string, any>): Record<string, any>;