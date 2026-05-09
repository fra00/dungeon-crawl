export declare function usePathfinding(config: {
    gameSession: any;
    visibilityMap?: any | null;
    foundPassages?: { x: number; y: number }[];
}): {
    calculatePath: (startX: number, startY: number, targetX: number, targetY: number, maxDepth: number, excludeEntityId: number) => { x: number; y: number }[];
};