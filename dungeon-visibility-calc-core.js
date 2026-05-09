/**
 * Pure visibility / fog logic (no React). Used by dungeon-use-visibility-calc.js and unit tests.
 */

export function normalizeValo(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function isCorridorValo(value) {
  const normalized = normalizeValo(value);
  return normalized === 0 || normalized === 1;
}

/**
 * @param {object|null} gameSession
 * @param {object|null} visibilityMap
 * @param {number} startX
 * @param {number} startY
 * @returns {Array<{ x: number, y: number }>}
 */
export function calculateVisibleCellsCore(gameSession, visibilityMap, startX, startY) {
  const visibleCells = [];
  const visData = visibilityMap?.data || [];
  const grid = gameSession?.currentMap?.grid || [];

  const startVisCell = visData.find((c) => c.x === startX && c.y === startY);
  if (!startVisCell) return visibleCells;

  visibleCells.push({ x: startX, y: startY });

  if (!isCorridorValo(startVisCell.valo)) {
    const startRoomValo = normalizeValo(startVisCell.valo);
    for (let i = 0; i < visData.length; i++) {
      const cell = visData[i];
      if (normalizeValo(cell.valo) === startRoomValo) {
        if (cell.x !== startX || cell.y !== startY) {
          visibleCells.push({ x: cell.x, y: cell.y });
        }
      }
    }
    return visibleCells;
  }

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  for (let i = 0; i < directions.length; i++) {
    const dir = directions[i];
    let currentX = startX;
    let currentY = startY;

    while (true) {
      currentX += dir.x;
      currentY += dir.y;

      const visCell = visData.find((c) => c.x === currentX && c.y === currentY);
      if (!visCell) break;

      if (!isCorridorValo(visCell.valo)) {
        break;
      }

      const mapCell = grid.find((c) => c.x === currentX && c.y === currentY);
      if (mapCell && mapCell.arnt?.antroc === true) {
        visibleCells.push({ x: currentX, y: currentY });
        break;
      }

      visibleCells.push({ x: currentX, y: currentY });
    }
  }

  return visibleCells;
}

/**
 * @param {object|null} gameSession
 * @param {object|null} visibilityMap
 */
export function hasLineOfSightCore(gameSession, visibilityMap, startX, startY, targetX, targetY) {
  const visData = visibilityMap?.data || [];
  const grid = gameSession?.currentMap?.grid || [];
  const openedDoors = gameSession?.openedDoors || [];

  let x0 = startX;
  let y0 = startY;
  const x1 = targetX;
  const y1 = targetY;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 !== startX || y0 !== startY) {
      const currentMapCell = grid.find((c) => c.x === x0 && c.y === y0);
      if (currentMapCell) {
        if (currentMapCell.mobili?.num != null) {
          return false;
        }
        if (currentMapCell.arnt?.antroc === true) {
          return false;
        }
      }
    }

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    let nextX = x0;
    let nextY = y0;

    if (e2 > -dy) {
      err -= dy;
      nextX += sx;
    }
    if (e2 < dx) {
      err += dx;
      nextY += sy;
    }

    const currentVisCell = visData.find((c) => c.x === x0 && c.y === y0);
    const nextVisCell = visData.find((c) => c.x === nextX && c.y === nextY);

    if (currentVisCell && nextVisCell) {
      const currentValo = normalizeValo(currentVisCell.valo);
      const nextValo = normalizeValo(nextVisCell.valo);
      if (currentValo !== nextValo) {
        const currentIsDoor = openedDoors.includes(`${x0},${y0}`);
        const nextIsDoor = openedDoors.includes(`${nextX},${nextY}`);

        if (!currentIsDoor && !nextIsDoor) {
          return false;
        }
      }
    }

    x0 = nextX;
    y0 = nextY;
  }

  return true;
}
