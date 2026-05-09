export declare function useTraps(config: {
  gameSession: any;
  visibilityMap: any;
  areMonstersVisible: boolean;
  onNotify: (message: string) => void;
  onActionDone: () => void;
  onForceTurnEnd: () => void;
  sessionManager: any;
}): {
  triggeredTraps: { x: number; y: number; tipo: number; status: string }[];
  checkTrapActivation: (trap: any, x: number, y: number) => boolean;
  isTrapVisible: (x: number, y: number) => boolean;
  registerTriggeredTrap: (x: number, y: number, tipo: number) => void;
  attemptDisarmTrap: (x: number, y: number, canDisarm: boolean, onFail: (trap?: any) => void) => void;
  getAdjacentDisarmableTrap: (heroX: number, heroY: number) => { x: number; y: number; tipo: number; status: string } | null;
  disarmAdjacentTrap: (heroX: number, heroY: number, canDisarm: boolean, onFail: (trap?: any) => void) => void;
  getTriggeredTraps: () => { x: number; y: number; tipo: number; status: string }[];
  searchTraps: () => void;
};