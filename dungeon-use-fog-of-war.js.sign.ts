export declare function useFogOfWar(config: { gameSession: any; staticVisibilityMap: any }): {
    fogVisibilityMap: any;
    revealInitialVisibility: () => void;
    revealFromPoint: (x: number, y: number) => void;
};