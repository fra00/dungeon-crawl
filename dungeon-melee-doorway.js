import { findDoorGatingPair } from "./dungeon-door-rules.js";
function getValoKey(visibilityMap, x, y) {
  const data = visibilityMap?.data;
  if (!Array.isArray(data)) return null;
  const cell = data.find((c) => Number(c.x) === Number(x) && Number(c.y) === Number(y));
  if (cell?.valo == null) return null;
  const parsed = Number(cell.valo);
  return Number.isNaN(parsed) ? String(cell.valo) : parsed;
}

/**
 * True se il passo attraversa una porta autorata E cambia valo (stanza/area).
 */
export function stepCrossesValoThroughDoor(visibilityMap, porte, fromX, fromY, toX, toY) {
  if (!findDoorGatingPair(porte, fromX, fromY, toX, toY)) return false;
  const fromValo = getValoKey(visibilityMap, fromX, fromY);
  const toValo = getValoKey(visibilityMap, toX, toY);
  if (fromValo == null || toValo == null) return false;
  return fromValo !== toValo;
}

/**
 * Melee across two visibility areas: allowed only if the attacker or defender stands
 * on an open door tile (a cell listed in currentMap.porte and in session.openedDoors).
 */
export function cellIsOpenDoorTile(gameSession, x, y) {
  const xi = Number(x);
  const yi = Number(y);
  if (Number.isNaN(xi) || Number.isNaN(yi)) return false;
  const key = `${xi},${yi}`;
  if (!gameSession?.openedDoors?.includes(key)) return false;
  return Boolean(
    gameSession?.currentMap?.porte?.some((p) => Number(p.x) === xi && Number(p.y) === yi)
  );
}

/**
 * Segna una porta come aperta solo se il passo attraversa la coppia gestita
 * E cambia valo (non basta transitare sulla casella porta nella stessa area).
 *
 * @param {{ visibilityMap?: { data?: Array<{x:number,y:number,valo:unknown}> } } }} [options]
 */
/**
 * Apre le porte attraversate lungo un percorso (un passo per cella adiacente).
 * Necessario per i mostri che si teletrasportano all'ultima casella del path in un solo update.
 */
export function mergeOpenedDoorsAlongPath(session, path, options = {}) {
  if (session == null || !Array.isArray(path) || path.length < 2) return session;
  let next = session;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    next = mergeOpenedDoorsAfterStep(next, a.x, a.y, b.x, b.y, options);
  }
  return next;
}

export function mergeOpenedDoorsAfterStep(session, fromX, fromY, toX, toY, options = {}) {
  if (session == null) return session;
  if (fromX == null || fromY == null || toX == null || toY == null) return session;
  const porte = session.currentMap?.porte;
  if (!porte?.length) return session;

  const visibilityMap = options.visibilityMap ?? null;
  if (!stepCrossesValoThroughDoor(visibilityMap, porte, fromX, fromY, toX, toY)) {
    return session;
  }

  const gatedDoor = findDoorGatingPair(porte, fromX, fromY, toX, toY);
  if (!gatedDoor) return session;

  const k = `${Number(gatedDoor.x)},${Number(gatedDoor.y)}`;
  const keys = new Set(session.openedDoors || []);
  if (keys.has(k)) return session;
  keys.add(k);
  return { ...session, openedDoors: Array.from(keys) };
}

/**
 * @deprecated Kept for tests / callers that used isFrontOfDoor; prefer cellIsOpenDoorTile + dist<=1.
 * @param {{ destination?: { x: number, y: number } } | null} isFrontOfDoorResult
 */
export function isMeleeAttackThroughAdjacentDoorway(heroX, heroY, monsterX, monsterY, isFrontOfDoorResult) {
  const dx = Math.abs(heroX - monsterX);
  const dy = Math.abs(heroY - monsterY);
  const dist = dx + dy;
  if (dist !== 2 || (dx !== 2 && dy !== 2)) return false;
  if (!isFrontOfDoorResult?.destination) return false;
  return isFrontOfDoorResult.destination.x === monsterX && isFrontOfDoorResult.destination.y === monsterY;
}
