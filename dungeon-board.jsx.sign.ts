export default function DungeonBoard(props: {
  gameSession: any;
  boardVisibilityMap: any;
  onCellClick: (x: number, y: number) => void;
  onCellHover: (x: number, y: number) => void;
  onMonsterClick: (monsterId: number) => void;
  hoveredPath?: { x: number; y: number }[];
  hoveredPathVariant?: "valid" | "blocked-by-second-wall" | null;
  secretPassages?: { x: number; y: number; img: string }[];
  treasures?: { x: number; y: number; img: string }[];
  triggeredTraps?: { x: number; y: number; tipo: number }[];
  targetingSpell?: any;
  visibilityCalc: {
    calculateVisibleCells: (startX: number, startY: number) => { x: number; y: number }[];
    hasLineOfSight: (startX: number, startY: number, targetX: number, targetY: number) => boolean;
  };
}): React.ReactElement;