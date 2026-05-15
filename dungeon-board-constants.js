/** Griglia tabellone (allineata a editor-map-model e dungeon-board). */
export const DUNGEON_BOARD_COLS = 26;
export const DUNGEON_BOARD_ROWS = 19;
export const DUNGEON_CELL_SIZE = 34;

export const DUNGEON_BOARD_WIDTH = DUNGEON_BOARD_COLS * DUNGEON_CELL_SIZE;
export const DUNGEON_BOARD_HEIGHT = DUNGEON_BOARD_ROWS * DUNGEON_CELL_SIZE;

/** Padding/bordo cornice in dungeon.jsx (p-1 + border-2). */
export const DUNGEON_CHROME_PAD_X = 12;
export const DUNGEON_CHROME_PAD_Y = 12;
/** Etichetta DUNGEON (absolute -top-4) sopra la griglia. */
export const DUNGEON_CHROME_LABEL_TOP = 22;

export const DUNGEON_BOARD_CHROME_WIDTH =
  DUNGEON_BOARD_WIDTH + DUNGEON_CHROME_PAD_X;
export const DUNGEON_BOARD_CHROME_HEIGHT =
  DUNGEON_BOARD_HEIGHT + DUNGEON_CHROME_PAD_Y + DUNGEON_CHROME_LABEL_TOP;
