export declare function useMapInteraction(config: {
  gameSession: any;
  foundPassages: { x: number; y: number }[];
  sessionManager: any;
}): {
  isFrontOfDoor: (x: number, y: number) => {
    found: boolean;
    destination: { x: number; y: number };
    passageCell: { x: number; y: number };
  } | null;
  openPassage: (passageX: number, passageY: number, destinationX: number, destinationY: number) => boolean;
};