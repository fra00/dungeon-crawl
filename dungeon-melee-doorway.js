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
 * Marks a door as opened when a figure LEAVES its cell (`atFrom`). Arriving on
 * a door cell (`atTo`) does NOT auto-open it — the figure is on the door but
 * has not yet "crossed" it, and the player should be able to use the
 * "Apri porta" button (or any other explicit action).
 *
 * Esempio (porta a (5,2), oriz=false → gata `(5,2) ↔ (6,2)`):
 *   - Step (4,2) → (5,2): atFrom=false, atTo=true.
 *     openedDoors NON cambia. L'eroe è sulla porta: il pulsante "Apri porta"
 *     è disponibile. (vedi `dungeon-use-map-interaction.isFrontOfDoor`).
 *   - Step (5,2) → (6,2): atFrom=true, atTo=false.
 *     openedDoors aggiunge "5,2". L'eroe ha attraversato la porta, che resta
 *     aperta per future azioni (melee attraverso porta, fog reveal, ecc.).
 *
 * Call after hero/monster position updates.
 */
export function mergeOpenedDoorsAfterStep(session, fromX, fromY, toX, toY) {
  if (session == null) return session;
  if (fromX == null || fromY == null || toX == null || toY == null) return session;
  const porte = session.currentMap?.porte;
  if (!porte?.length) return session;
  const keys = new Set(session.openedDoors || []);
  let changed = false;
  for (const p of porte) {
    const px = Number(p.x);
    const py = Number(p.y);
    const atFrom = px === Number(fromX) && py === Number(fromY);
    if (atFrom) {
      const k = `${px},${py}`;
      if (!keys.has(k)) {
        keys.add(k);
        changed = true;
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
