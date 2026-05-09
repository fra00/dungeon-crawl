/**
 * Regole pure per i passaggi orientati (porte e passaggi segreti).
 * Coordinate 1-based, come nel resto del runtime.
 *
 * Convenzione DIREZIONALE (lato +1):
 *   - Una porta/passaggio occupa una propria CELLA `(x, y)` con un flag `oriz`.
 *     Il flag determina il LATO destinazione, NON un asse simmetrico.
 *   - oriz === true  → lato destinazione `(x, y + 1)` (apertura sull'asse Y verso il basso).
 *   - oriz === false → lato destinazione `(x + 1, y)` (apertura sull'asse X verso destra).
 *
 * In pratica una porta gestisce UNA SOLA coppia: `(x, y) ↔ (x+1, y)` oppure
 * `(x, y) ↔ (x, y+1)`. Per gating bidirezionale al lato opposto serve una
 * SECONDA porta autorata sull'altra cella.
 *
 * NOTA: queste funzioni accettano qualsiasi oggetto con `{x, y, oriz}` (porta
 * da `currentMap.porte` oppure passaggio segreto scoperto da `foundPassages`).
 * Le porte e i passaggi segreti seguono la stessa convenzione direzionale.
 *
 * Storia: una versione precedente ha provato una geometria simmetrica
 * (gating su entrambi i vicini ±1) come "fix" per un bug di passaggio porte.
 * Il bug reale era una race condition tra `moveCurrentHeroTo` e
 * `executeMissionScripts` (ora risolta in `dungeon-use-turn-logic.js`),
 * non la geometria. La geometria è e resta direzionale +1.
 */

/**
 * Coppia gestita dalla porta: `[door, neighbor]` con `neighbor` al lato +1.
 *
 * @param {{x:number, y:number, oriz?:boolean}} door
 * @returns {{x:number, y:number} | null}
 */
export function getDoorGatedNeighbor(door) {
  if (!door) return null;
  const dx = Number(door.x);
  const dy = Number(door.y);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  if (door.oriz) {
    return { x: dx, y: dy + 1 };
  }
  return { x: dx + 1, y: dy };
}

/**
 * @param {{x:number, y:number, oriz?:boolean}} door
 * @returns {[{x:number,y:number}, {x:number,y:number}] | null}
 */
export function getDoorPair(door) {
  const neighbor = getDoorGatedNeighbor(door);
  if (!neighbor) return null;
  return [{ x: Number(door.x), y: Number(door.y) }, neighbor];
}

/**
 * Variante "plurale" per consumer che iterano una lista di vicini gestiti.
 * Per la convenzione direzionale ritorna SEMPRE 0 o 1 elemento.
 *
 * @param {{x:number, y:number, oriz?:boolean}} door
 * @returns {Array<{x:number,y:number}>}
 */
export function getDoorGatedNeighbors(door) {
  const n = getDoorGatedNeighbor(door);
  return n ? [n] : [];
}

/**
 * Variante "plurale" delle coppie gestite. Direzionale → 0 o 1 elemento.
 *
 * @param {{x:number, y:number, oriz?:boolean}} door
 * @returns {Array<[{x:number,y:number}, {x:number,y:number}]>}
 */
export function getDoorGatedPairs(door) {
  const pair = getDoorPair(door);
  return pair ? [pair] : [];
}

/**
 * Verifica se la coppia (sx,sy)→(tx,ty) corrisponde alla coppia direzionale
 * gestita dalla porta indicata, in qualsiasi direzione (door→neighbor o neighbor→door).
 *
 * @returns {boolean}
 */
export function isPairGatedByDoor(door, sx, sy, tx, ty) {
  const pair = getDoorPair(door);
  if (!pair) return false;
  const [a, b] = pair;
  const sxN = Number(sx);
  const syN = Number(sy);
  const txN = Number(tx);
  const tyN = Number(ty);
  if (sxN === a.x && syN === a.y && txN === b.x && tyN === b.y) return true;
  if (sxN === b.x && syN === b.y && txN === a.x && tyN === a.y) return true;
  return false;
}

/**
 * Trova una porta nell'array `porte` che gestisce il passaggio (sx,sy)↔(tx,ty),
 * o null se nessuna porta lo gestisce. Coordinate 1-based.
 *
 * @param {Array<{x:number,y:number,oriz?:boolean}>|null|undefined} porte
 * @returns {{x:number,y:number,oriz?:boolean}|null}
 */
export function findDoorGatingPair(porte, sx, sy, tx, ty) {
  if (!Array.isArray(porte) || porte.length === 0) return null;
  for (const door of porte) {
    if (isPairGatedByDoor(door, sx, sy, tx, ty)) return door;
  }
  return null;
}

/**
 * Restituisce TUTTE le porte la cui geometria gestita include la cella (x,y),
 * sia come cella della porta sia come vicino direzionale (+1).
 *
 * @returns {Array<{x:number,y:number,oriz?:boolean}>}
 */
export function findDoorsTouchingCell(porte, x, y) {
  if (!Array.isArray(porte) || porte.length === 0) return [];
  const xN = Number(x);
  const yN = Number(y);
  const result = [];
  for (const door of porte) {
    const dxN = Number(door.x);
    const dyN = Number(door.y);
    if (dxN === xN && dyN === yN) {
      result.push(door);
      continue;
    }
    const neighbor = getDoorGatedNeighbor(door);
    if (neighbor && neighbor.x === xN && neighbor.y === yN) {
      result.push(door);
    }
  }
  return result;
}
