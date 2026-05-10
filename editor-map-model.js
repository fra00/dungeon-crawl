/**
 * Map editor: build, normalize, validate JSON compatible with public/jsonData/map/*.json
 * Coordinates follow the same convention as existing maps (e.g. DGBase01.json).
 */

export const EDITOR_MAP_WIDTH = 26;
export const EDITOR_MAP_HEIGHT = 19;

/** Flat grid index (row-major): y * W + x */
export function editorCellIndex(x, y) {
  return y * EDITOR_MAP_WIDTH + x;
}

/**
 * True se la cella consente l'uscita dal dungeon (scale / fine missione sul tabellone).
 * Allineato al runtime: `mapCell.fine` truthy e ≠ 0 numerico.
 */
export function cellAllowsMapExit(cell) {
  const f = cell?.fine;
  if (f == null || f === "") return false;
  if (typeof f === "number") return f !== 0;
  const n = Number(f);
  return Number.isFinite(n) ? n !== 0 : true;
}

export function patchGridCell(grid, x, y, patch) {
  const idx = editorCellIndex(x, y);
  const cur = grid[idx];
  const nextCell = {
    ...cur,
    ...patch,
    arnt: { ...cur.arnt, ...(patch.arnt || {}) },
    mobili: { ...cur.mobili, ...(patch.mobili || {}) },
    psgg: { ...cur.psgg, ...(patch.psgg || {}) },
    trpl: { ...cur.trpl, ...(patch.trpl || {}) },
    tes: { ...cur.tes, ...(patch.tes || {}) },
    mostab: { ...cur.mostab, ...(patch.mostab || {}) },
  };
  const next = [...grid];
  next[idx] = nextCell;
  return next;
}

export function toggleWallAt(grid, x, y) {
  const idx = editorCellIndex(x, y);
  const c = { ...grid[idx] };
  c.arnt = { ...c.arnt, antroc: !c.arnt.antroc, inv: false };
  const next = [...grid];
  next[idx] = c;
  return next;
}

export function resetCellAt(grid, x, y) {
  const idx = editorCellIndex(x, y);
  const next = [...grid];
  next[idx] = createEmptyCell(x, y);
  return next;
}

/**
 * Applica una selezione di mobile (tipo + variante) su una cella.
 * - typeId == null  → svuota mobili (num=null, img="").
 * - cella senza mobile → assegna `num` come max+1 dei mobili esistenti.
 * - cella con mobile → conserva `num` esistente, aggiorna solo `img`.
 *
 * @param {Array} grid
 * @param {number} x
 * @param {number} y
 * @param {{ typeId: string|null, variantKey?: string }} payload
 * @param {Array} catalog — output di mobili.json (array di tipi)
 * @returns {Array} nuova grid
 */
export function applyFurnitureSelection(grid, x, y, payload, catalog) {
  const idx = editorCellIndex(x, y);
  const cur = grid[idx];
  if (!cur) return grid;

  const typeId = payload?.typeId ?? null;

  if (typeId == null) {
    return patchGridCell(grid, x, y, {
      mobili: { num: null, img: "", flpo: false, flpv: false },
    });
  }

  const list = Array.isArray(catalog) ? catalog : [];
  const entry = list.find((t) => t?.id === typeId);
  if (!entry) return grid;
  const variants = Array.isArray(entry.variants) ? entry.variants : [];
  if (variants.length === 0) return grid;
  const variant =
    variants.find((v) => v?.key === payload?.variantKey) || variants[0];
  if (!variant?.img) return grid;

  const existingNum = cur.mobili?.num;
  let num;
  if (typeof existingNum === "number" && Number.isFinite(existingNum)) {
    num = existingNum;
  } else {
    let max = 0;
    for (const c of grid) {
      const n = c?.mobili?.num;
      if (typeof n === "number" && Number.isFinite(n) && n > max) {
        max = n;
      }
    }
    num = max + 1;
  }

  return patchGridCell(grid, x, y, {
    mobili: {
      num,
      img: variant.img,
    },
  });
}

export function createEmptyCell(x, y) {
  return {
    x,
    y,
    arnt: { antroc: false, inv: false },
    mobili: { num: null, img: "", flpo: false, flpv: false },
    psgg: { ps: null, oriz: false, flpo: false, flpv: false },
    trpl: { tipo: 0, rccadex: 0, rccadey: 0 },
    tes: { ts: 0, ogg: 0, arma: 0, mon: 0, trp: 0 },
    mostab: { mosid: 0, mos: false, corpo: 0 },
    fine: 0,
  };
}

export function createDefaultHeader() {
  return {
    matrsf: "default.tbl",
    descrizione: "",
    check5: 0,
    mostro_uscita: -1,
    tesoro_finale: { x: 0, y: 0 },
    oggetto_f: -1,
    arma_f: -1,
    merr: 1,
    nfine: 0,
    npr: 0,
    val_text14: 0,
    combo2_index: 0,
    nscript: 0,
  };
}

/** Full editable map state (before JSON export). */
export function createEmptyMapState() {
  const grid = [];
  for (let y = 0; y < EDITOR_MAP_HEIGHT; y++) {
    for (let x = 0; x < EDITOR_MAP_WIDTH; x++) {
      grid.push(createEmptyCell(x, y));
    }
  }
  return {
    header: createDefaultHeader(),
    grid,
    eroi_start: [],
    porte: [],
    scripts: [],
  };
}

function deepMergeCell(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;
  return {
    ...base,
    ...incoming,
    x: base.x,
    y: base.y,
    arnt: { ...base.arnt, ...(incoming.arnt || {}) },
    mobili: { ...base.mobili, ...(incoming.mobili || {}) },
    psgg: { ...base.psgg, ...(incoming.psgg || {}) },
    trpl: { ...base.trpl, ...(incoming.trpl || {}) },
    tes: { ...base.tes, ...(incoming.tes || {}) },
    mostab: { ...base.mostab, ...(incoming.mostab || {}) },
  };
}

/**
 * Import JSON from file / clipboard: merge onto full grid, preserve unknown header keys.
 *
 * Convenzione coordinate griglia:
 * - Sui file JSON di gioco (es. DGBase01.json) le celle della grid sono 1-based
 *   (x da 1 a 26, y da 1 a 19), coerenti con i dati di visibilità e con il
 *   rendering runtime in `dungeon-board.jsx` che fa `(c.x - 1) * 34`.
 * - L'editor in memoria usa una grid 0-based (x da 0 a 25, y da 0 a 18) per
 *   indicizzare l'array piatto e per il rendering del tabellone.
 * Qui in import si traduce 1-based → 0-based; in `toExportableMapDocument` la
 * traduzione opposta. Eventuali celle "padding" a x=0 o y=0 vengono scartate.
 */
export function normalizeImportedMap(raw) {
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!obj || typeof obj !== "object") throw new Error("JSON mappa non valido.");

  const gridByKey = new Map();
  const incomingGrid = Array.isArray(obj.grid) ? obj.grid : [];
  for (const c of incomingGrid) {
    if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    const ex = c.x - 1;
    const ey = c.y - 1;
    if (ex < 0 || ex >= EDITOR_MAP_WIDTH || ey < 0 || ey >= EDITOR_MAP_HEIGHT) continue;
    gridByKey.set(`${ex},${ey}`, { ...c, x: ex, y: ey });
  }

  const grid = [];
  for (let y = 0; y < EDITOR_MAP_HEIGHT; y++) {
    for (let x = 0; x < EDITOR_MAP_WIDTH; x++) {
      const key = `${x},${y}`;
      const base = createEmptyCell(x, y);
      if (gridByKey.has(key)) {
        grid.push(deepMergeCell(base, gridByKey.get(key)));
      } else {
        grid.push(base);
      }
    }
  }

  return {
    header: { ...createDefaultHeader(), ...(obj.header || {}) },
    grid,
    eroi_start: Array.isArray(obj.eroi_start) ? obj.eroi_start.map((e) => ({ ...e })) : [],
    porte: Array.isArray(obj.porte) ? obj.porte.map((d) => ({ ...d })) : [],
    scripts: Array.isArray(obj.scripts) ? obj.scripts.map((s) => ({ ...s })) : [],
  };
}

export function validateMapState(state, options = {}) {
  const { monsterIds = null } = options;
  const errors = [];
  const warnings = [];

  if (!state?.grid || state.grid.length !== EDITOR_MAP_WIDTH * EDITOR_MAP_HEIGHT) {
    errors.push(`La griglia deve avere ${EDITOR_MAP_WIDTH * EDITOR_MAP_HEIGHT} celle.`);
  }

  const badCells = (state.grid || []).filter(
    (c) =>
      c.x < 0 ||
      c.x >= EDITOR_MAP_WIDTH ||
      c.y < 0 ||
      c.y >= EDITOR_MAP_HEIGHT
  );
  if (badCells.length > 0) errors.push("Alcune celle hanno coordinate fuori dal tabellone.");

  // Le entità (eroi_start, porte, scripts) usano coordinate 1-based: range valido x ∈ [1, EDITOR_MAP_WIDTH], y ∈ [1, EDITOR_MAP_HEIGHT].
  for (const start of state.eroi_start || []) {
    if (start.x < 1 || start.x > EDITOR_MAP_WIDTH || start.y < 1 || start.y > EDITOR_MAP_HEIGHT) {
      errors.push(`Punto partenza eroe (${start.id}) fuori mappa.`);
    }
  }
  if (!(state.eroi_start || []).length) {
    warnings.push("Nessun punto di partenza eroe definito: in gioco servono spawn in eroi_start per ogni eroe della campagna.");
  }

  for (const d of state.porte || []) {
    if (d.x < 1 || d.x > EDITOR_MAP_WIDTH || d.y < 1 || d.y > EDITOR_MAP_HEIGHT) {
      errors.push(`Porta (${d.x},${d.y}) fuori mappa.`);
    }
  }

  if (Array.isArray(monsterIds) && monsterIds.length > 0) {
    for (const c of state.grid || []) {
      const id = c.mostab?.mosid;
      if (id > 0 && !monsterIds.includes(id)) {
        warnings.push(`mostab.mosid ${id} non presente in monsters.json.`);
      }
    }
  }

  const exitCells = (state.grid || []).filter(cellAllowsMapExit);
  if (exitCells.length > 4) {
    warnings.push(
      `${exitCells.length} celle di uscita dalla mappa (campo fine): di solito se ne usano al massimo 4 (scale).`
    );
  }

  return { errors, warnings };
}

/**
 * Strip editor-only state; align script count hint.
 * Le celle interne sono 0-based; in export si convertono a 1-based per
 * coerenza con il formato JSON di gioco (vedi nota in `normalizeImportedMap`).
 */
export function toExportableMapDocument(state) {
  const header = { ...state.header };
  header.nscript = Array.isArray(state.scripts) ? state.scripts.length : 0;
  header.nfine = (state.grid || []).filter(cellAllowsMapExit).length;
  return {
    header,
    grid: (state.grid || []).map((c) => ({ ...c, x: c.x + 1, y: c.y + 1 })),
    eroi_start: state.eroi_start,
    porte: state.porte,
    scripts: state.scripts,
  };
}

export function downloadMapJson(state, filename = "missione.json") {
  const doc = toExportableMapDocument(state);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "missione.json";
  a.click();
  URL.revokeObjectURL(url);
}
