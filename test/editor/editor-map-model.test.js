import { describe, it, expect } from "vitest";
import {
  EDITOR_MAP_WIDTH,
  EDITOR_MAP_HEIGHT,
  createEmptyMapState,
  normalizeImportedMap,
  validateMapState,
  toExportableMapDocument,
  editorCellIndex,
  patchGridCell,
  toggleWallAt,
  applyFurnitureSelection,
} from "../../editor-map-model.js";

const furnitureCatalog = [
  {
    id: "tavolo",
    name: "Tavolo",
    variants: [
      { key: "o", label: "orizzontale", img: "tavoloo.png" },
      { key: "v", label: "verticale", img: "tavolov.png" },
    ],
  },
  {
    id: "altare",
    name: "Altare",
    variants: [
      { key: "o", label: "orizzontale", img: "altareo.png" },
      { key: "v", label: "verticale", img: "altarev.png" },
    ],
  },
];

describe("editor-map-model", () => {
  it("createEmptyMapState has full grid and default header", () => {
    const s = createEmptyMapState();
    expect(s.grid.length).toBe(EDITOR_MAP_WIDTH * EDITOR_MAP_HEIGHT);
    expect(s.header.matrsf).toBe("default.tbl");
    expect(s.eroi_start.length).toBe(4);
  });

  it("normalizeImportedMap maps 1-based grid cells to 0-based and fills missing", () => {
    const partial = {
      header: { descrizione: "Test" },
      // Il formato di gioco usa cell.x/y a base 1 → la cella (1,1) è la prima.
      grid: [
        { x: 1, y: 1, arnt: { antroc: true, inv: false } },
        { x: 0, y: 0, arnt: { antroc: true, inv: false } }, // padding: deve essere scartato
      ],
      eroi_start: [],
      porte: [],
      scripts: [],
    };
    const s = normalizeImportedMap(partial);
    expect(s.grid.length).toBe(EDITOR_MAP_WIDTH * EDITOR_MAP_HEIGHT);
    const c00 = s.grid.find((c) => c.x === 0 && c.y === 0);
    expect(c00.arnt.antroc).toBe(true);
    expect(s.header.descrizione).toBe("Test");
  });

  it("toExportableMapDocument sets nscript and shifts grid to 1-based", () => {
    const s = createEmptyMapState();
    s.scripts = [{ x: 1, y: 1, text: "msg test", evento: 1 }];
    const doc = toExportableMapDocument(s);
    expect(doc.header.nscript).toBe(1);
    const first = doc.grid[0];
    expect(first.x).toBe(1);
    expect(first.y).toBe(1);
    const last = doc.grid[doc.grid.length - 1];
    expect(last.x).toBe(EDITOR_MAP_WIDTH);
    expect(last.y).toBe(EDITOR_MAP_HEIGHT);
  });

  it("export → normalize round-trip preserves grid cell payload", () => {
    const s = createEmptyMapState();
    const idx = editorCellIndex(7, 4);
    s.grid[idx] = {
      ...s.grid[idx],
      mobili: { num: 42, img: "tavoloo.png", flpo: false, flpv: false },
    };
    const doc = toExportableMapDocument(s);
    const back = normalizeImportedMap(doc);
    const roundtrip = back.grid[editorCellIndex(7, 4)];
    expect(roundtrip.x).toBe(7);
    expect(roundtrip.y).toBe(4);
    expect(roundtrip.mobili.num).toBe(42);
    expect(roundtrip.mobili.img).toBe("tavoloo.png");
  });

  it("export → normalize preserves tesoro_finale in header (1-based)", () => {
    const s = createEmptyMapState();
    s.header.tesoro_finale = { x: 8, y: 6 };
    const doc = toExportableMapDocument(s);
    expect(doc.header.tesoro_finale).toEqual({ x: 8, y: 6 });
    const back = normalizeImportedMap(doc);
    expect(back.header.tesoro_finale).toEqual({ x: 8, y: 6 });
  });

  it("validateMapState flags invalid hero spawn", () => {
    const s = createEmptyMapState();
    s.eroi_start[0].x = 99;
    const v = validateMapState(s);
    expect(v.errors.some((e) => e.includes("partenza"))).toBe(true);
  });

  it("validateMapState accepts entities at the 1-based extremes", () => {
    const s = createEmptyMapState();
    // Le entità sono 1-based: x=1..26, y=1..19 valide.
    s.eroi_start = [
      { id: 0, x: 1, y: 1 },
      { id: 1, x: EDITOR_MAP_WIDTH, y: EDITOR_MAP_HEIGHT },
    ];
    s.porte = [
      { x: 1, y: 1, oriz: true },
      { x: EDITOR_MAP_WIDTH, y: EDITOR_MAP_HEIGHT, oriz: false },
    ];
    const v = validateMapState(s);
    expect(v.errors.filter((e) => e.includes("partenza") || e.includes("Porta"))).toHaveLength(0);
  });

  it("validateMapState rejects entities at 0 (out of 1-based range)", () => {
    const s = createEmptyMapState();
    s.eroi_start = [{ id: 0, x: 0, y: 0 }];
    s.porte = [{ x: 0, y: 5, oriz: true }];
    const v = validateMapState(s);
    expect(v.errors.some((e) => e.includes("partenza"))).toBe(true);
    expect(v.errors.some((e) => e.includes("Porta"))).toBe(true);
  });

  it("editorCellIndex and patchGridCell update flat grid immutably", () => {
    const s = createEmptyMapState();
    const x = 3;
    const y = 2;
    const idx = editorCellIndex(x, y);
    expect(s.grid[idx].arnt.antroc).toBe(false);
    const g2 = patchGridCell(s.grid, x, y, { arnt: { antroc: true } });
    expect(g2).not.toBe(s.grid);
    expect(g2[idx].arnt.antroc).toBe(true);
    expect(s.grid[idx].arnt.antroc).toBe(false);
  });

  it("toggleWallAt flips antroc", () => {
    const s = createEmptyMapState();
    const g2 = toggleWallAt(s.grid, 1, 1);
    expect(g2[editorCellIndex(1, 1)].arnt.antroc).toBe(true);
    const g3 = toggleWallAt(g2, 1, 1);
    expect(g3[editorCellIndex(1, 1)].arnt.antroc).toBe(false);
  });

  describe("applyFurnitureSelection", () => {
    it("places furniture on empty cell with progressive num=1", () => {
      const s = createEmptyMapState();
      const g2 = applyFurnitureSelection(
        s.grid,
        2,
        3,
        { typeId: "tavolo", variantKey: "o" },
        furnitureCatalog
      );
      const cell = g2[editorCellIndex(2, 3)];
      expect(cell.mobili.num).toBe(1);
      expect(cell.mobili.img).toBe("tavoloo.png");
    });

    it("assigns max(num)+1 when other furniture already exists", () => {
      const s = createEmptyMapState();
      let grid = patchGridCell(s.grid, 0, 0, {
        mobili: { num: 7, img: "altareo.png" },
      });
      grid = patchGridCell(grid, 0, 1, { mobili: { num: 3, img: "tavolov.png" } });
      const g2 = applyFurnitureSelection(
        grid,
        5,
        5,
        { typeId: "altare", variantKey: "v" },
        furnitureCatalog
      );
      const cell = g2[editorCellIndex(5, 5)];
      expect(cell.mobili.num).toBe(8);
      expect(cell.mobili.img).toBe("altarev.png");
    });

    it("preserves existing num when changing variant on same cell", () => {
      const s = createEmptyMapState();
      let grid = applyFurnitureSelection(
        s.grid,
        4,
        4,
        { typeId: "tavolo", variantKey: "o" },
        furnitureCatalog
      );
      const before = grid[editorCellIndex(4, 4)].mobili.num;
      grid = applyFurnitureSelection(
        grid,
        4,
        4,
        { typeId: "tavolo", variantKey: "v" },
        furnitureCatalog
      );
      const cell = grid[editorCellIndex(4, 4)];
      expect(cell.mobili.num).toBe(before);
      expect(cell.mobili.img).toBe("tavolov.png");
    });

    it("clears furniture when typeId is null", () => {
      const s = createEmptyMapState();
      let grid = applyFurnitureSelection(
        s.grid,
        1,
        1,
        { typeId: "tavolo", variantKey: "o" },
        furnitureCatalog
      );
      grid = applyFurnitureSelection(grid, 1, 1, { typeId: null }, furnitureCatalog);
      const cell = grid[editorCellIndex(1, 1)];
      expect(cell.mobili.num).toBe(null);
      expect(cell.mobili.img).toBe("");
      expect(cell.mobili.flpo).toBe(false);
      expect(cell.mobili.flpv).toBe(false);
    });

    it("falls back to first variant when variantKey unknown", () => {
      const s = createEmptyMapState();
      const g2 = applyFurnitureSelection(
        s.grid,
        2,
        2,
        { typeId: "tavolo", variantKey: "nope" },
        furnitureCatalog
      );
      const cell = g2[editorCellIndex(2, 2)];
      expect(cell.mobili.img).toBe("tavoloo.png");
    });

    it("returns same grid when typeId not in catalog", () => {
      const s = createEmptyMapState();
      const g2 = applyFurnitureSelection(
        s.grid,
        0,
        0,
        { typeId: "unknown", variantKey: "o" },
        furnitureCatalog
      );
      expect(g2).toBe(s.grid);
    });

    it("preserva flpo/flpv quando si cambia variante o tipo del mobile", () => {
      const s = createEmptyMapState();
      let grid = applyFurnitureSelection(
        s.grid,
        7,
        7,
        { typeId: "tavolo", variantKey: "o" },
        furnitureCatalog
      );
      grid = patchGridCell(grid, 7, 7, {
        mobili: { ...grid[editorCellIndex(7, 7)].mobili, flpo: true, flpv: true },
      });
      grid = applyFurnitureSelection(
        grid,
        7,
        7,
        { typeId: "tavolo", variantKey: "v" },
        furnitureCatalog
      );
      const cell = grid[editorCellIndex(7, 7)];
      expect(cell.mobili.img).toBe("tavolov.png");
      expect(cell.mobili.flpo).toBe(true);
      expect(cell.mobili.flpv).toBe(true);
    });

    it("preserva un mostro con id 0 (Goblin) sul round-trip", () => {
      const s = createEmptyMapState();
      const grid = patchGridCell(s.grid, 6, 6, {
        mostab: { mosid: 0, mos: true, corpo: 1 },
      });
      const doc = toExportableMapDocument({ ...s, grid });
      const back = normalizeImportedMap(doc);
      const cell = back.grid[editorCellIndex(6, 6)];
      expect(cell.mostab.mos).toBe(true);
      expect(cell.mostab.mosid).toBe(0);
      expect(cell.mostab.corpo).toBe(1);
    });

    it("export round-trip preserva i flag flpo e flpv", () => {
      const s = createEmptyMapState();
      let grid = applyFurnitureSelection(
        s.grid,
        2,
        2,
        { typeId: "tavolo", variantKey: "o" },
        furnitureCatalog
      );
      grid = patchGridCell(grid, 2, 2, {
        mobili: { ...grid[editorCellIndex(2, 2)].mobili, flpo: true, flpv: false },
      });
      const doc = toExportableMapDocument({ ...s, grid });
      const back = normalizeImportedMap(doc);
      const cell = back.grid[editorCellIndex(2, 2)];
      expect(cell.mobili.flpo).toBe(true);
      expect(cell.mobili.flpv).toBe(false);
      expect(cell.mobili.img).toBe("tavoloo.png");
    });

    it("psgg: round-trip preserva flpo e flpv", () => {
      const s = createEmptyMapState();
      const grid = patchGridCell(s.grid, 4, 5, {
        psgg: { ps: 1, oriz: true, flpo: true, flpv: false },
      });
      const doc = toExportableMapDocument({ ...s, grid });
      const back = normalizeImportedMap(doc);
      const cell = back.grid[editorCellIndex(4, 5)];
      expect(cell.psgg.ps).toBe(1);
      expect(cell.psgg.oriz).toBe(true);
      expect(cell.psgg.flpo).toBe(true);
      expect(cell.psgg.flpv).toBe(false);
    });
  });
});
