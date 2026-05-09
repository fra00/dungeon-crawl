/** Allineato a dungeon-board.jsx: celle 34px, immagini in /img/… */

export const EDITOR_CELL_PX = 34;

export function editorTabelloneBackgroundUrl(boardData, headerMatrsf) {
  if (boardData?.image) {
    const f = String(boardData.image).replace(/^.*[\\/]/, "");
    return `/img/tabellone/${f}`;
  }
  if (headerMatrsf && typeof headerMatrsf === "string") {
    const bmp = headerMatrsf.replace(/\.tbl$/i, ".bmp").replace(/^.*[\\/]/, "");
    return `/img/tabellone/${bmp}`;
  }
  return "/img/tabellone/default.bmp";
}

export function editorTrapImage(tipo) {
  const t = Number(tipo);
  if (t === 1) return "/img/cell/caduta.png";
  if (t === 2) return "/img/cell/lancia.png";
  if (t === 3) return "/img/cell/rocciacad.png";
  return null;
}

/**
 * Una cella ha un mostro se il flag `mostab.mos` è esplicitamente true.
 * Non basta `mosid > 0` perché alcuni mostri hanno id = 0 (es. il Goblin
 * in monsters.json). La presenza è quindi codificata nel boolean `mos`.
 */
export function cellHasMonster(cell) {
  return cell?.mostab?.mos === true;
}

export function cellHasTreasureLoot(cell) {
  const tes = cell?.tes;
  if (!tes) return false;
  if (tes.ts === 1) return true;
  return (
    (tes.mon || 0) > 0 ||
    (tes.ogg || 0) > 0 ||
    (tes.arma || 0) > 0 ||
    (tes.trp || 0) > 0
  );
}

export function equipmentImageUrl(equip) {
  if (!equip?.immagine) return null;
  return `/img/equip/${equip.immagine}`;
}

/**
 * Cerca nel catalogo mobili l'entry e la variante che corrispondono a un
 * filename (es. "tavoloo.png").
 * @param {Array} catalog — array di { id, name, variants: [{ key, label, img }] }
 * @param {string} img
 * @returns {{ typeEntry: object, variant: object } | null}
 */
export function findMobileEntryByImg(catalog, img) {
  if (!Array.isArray(catalog) || !img) return null;
  const target = String(img).trim();
  if (!target) return null;
  for (const typeEntry of catalog) {
    const variants = Array.isArray(typeEntry?.variants) ? typeEntry.variants : [];
    for (const variant of variants) {
      if (variant?.img === target) {
        return { typeEntry, variant };
      }
    }
  }
  return null;
}

/**
 * Calcola il prossimo `mobili.num` progressivo per una griglia.
 * Restituisce 1 su griglia vuota; altrimenti `max(num esistenti) + 1`.
 */
export function nextMobiliNum(grid) {
  if (!Array.isArray(grid) || grid.length === 0) return 1;
  let max = 0;
  for (const cell of grid) {
    const n = cell?.mobili?.num;
    if (typeof n === "number" && Number.isFinite(n) && n > max) {
      max = n;
    }
  }
  return max + 1;
}
