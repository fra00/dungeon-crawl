export declare function useDungeonMovementRules(config: {
    mapQuery: any;
    foundPassages?: { x: number; y: number }[];
}): {
    isValidDestination: (x: number, y: number, excludeEntityId: number) => boolean;
    isWalkable: (sourceX: number, sourceY: number, targetX: number, targetY: number, excludeEntityId: number, foundPassages?: { x: number; y: number }[]) => boolean;
};