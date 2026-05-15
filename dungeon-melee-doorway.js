import { findDoorGatingPair } from "./dungeon-door-rules.js";

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
 * Segna una porta come aperta quando un passo la attraversa (coppia direzionale gestita)
 * oppure quando l'eroe lascia la cella della porta verso una direzione non gestita.
 *
 * Esempio (porta a (5,2), oriz=false → gata `(5,2) ↔ (6,2)`):
 *   - Step (4,2) → (5,2): non è la coppia gestita → resta chiusa (pulsante "Apri porta").
 *   - Step (6,2) → (5,2): attraversa la coppia → "5,2" in openedDoors subito.
 *   - Step (5,2) → (6,2): idem.
 *   - Step (5,2) → (4,2): esce dalla cella porta (lato non gestito) → si apre comunque.
 *
 * Chiamare dopo lo spostamento dell’eroe. I mostri non usano questa funzione.
 */
export function mergeOpenedDoorsAfterStep(session, fromX, fromY, toX, toY) {
  if (session == null) return session;
  if (fromX == null || fromY == null || toX == null || toY == null) return session;
  const porte = session.currentMap?.porte;
  if (!porte?.length) return session;
  const keys = new Set(session.openedDoors || []);
  let changed = false;

  const gatedDoor = findDoorGatingPair(porte, fromX, fromY, toX, toY);
  if (gatedDoor) {
    const k = `${Number(gatedDoor.x)},${Number(gatedDoor.y)}`;
    if (!keys.has(k)) {
      keys.add(k);
      changed = true;
    }
  } else {
    for (const p of porte) {
      const px = Number(p.x);
      const py = Number(p.y);
      const leftDoorCell = px === Number(fromX) && py === Number(fromY);
      if (leftDoorCell) {
        const k = `${px},${py}`;
        if (!keys.has(k)) {
          keys.add(k);
          changed = true;
        }
      }
    }
  }

  if (!changed) return session;
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
