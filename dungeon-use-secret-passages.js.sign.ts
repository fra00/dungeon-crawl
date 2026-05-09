export declare function useSecretPassages(config: {
  gameSession: any;
  visibilityMap: any;
  onNotify: (message: string) => void;
  onActionDone: () => void;
  onForceTurnEnd: () => void;
  sessionManager: any;
}): {
  searchPassages: () => void;
  getFoundPassages: () => { visiblePassages: { x: number; y: number; img: string }[] };
};