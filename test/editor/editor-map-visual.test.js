import { describe, it, expect } from "vitest";
import {
  editorTabelloneBackgroundUrl,
  cellHasMonster,
  cellHasTreasureLoot,
  editorTrapImage,
  findMobileEntryByImg,
  nextMobiliNum,
} from "../../editor/editor-map-visual.js";

const sampleCatalog = [
  {
    id: "tavolo",
    name: "Tavolo",
    variants: [
      { key: "o", label: "orizzontale", img: "tavoloo.png" },
      { key: "v", label: "verticale", img: "tavolov.png" },
    ],
  },
  {
    id: "trono",
    name: "Trono",
    variants: [{ key: "single", label: "unico", img: "trono.png" }],
  },
];

describe("editor-map-visual", () => {
  it("editorTabelloneBackgroundUrl uses boardData.image basename", () => {
    expect(editorTabelloneBackgroundUrl({ image: "default.bmp" })).toBe("/img/tabellone/default.bmp");
    expect(editorTabelloneBackgroundUrl({ image: "path/to/foo.bmp" })).toBe("/img/tabellone/foo.bmp");
  });

  it("editorTabelloneBackgroundUrl maps .tbl to .bmp from header", () => {
    expect(editorTabelloneBackgroundUrl(null, "caserma.tbl")).toBe("/img/tabellone/caserma.bmp");
  });

  it("cellHasTreasureLoot", () => {
    expect(cellHasTreasureLoot({ tes: { mon: 0, ogg: 0, arma: 0, trp: 0, ts: 0 } })).toBe(false);
    expect(cellHasTreasureLoot({ tes: { mon: 1, ogg: 0, arma: 0, trp: 0, ts: 0 } })).toBe(true);
    expect(cellHasTreasureLoot({ tes: { ts: 1 } })).toBe(true);
  });

  it("editorTrapImage", () => {
    expect(editorTrapImage(1)).toContain("caduta");
    expect(editorTrapImage(0)).toBe(null);
  });

  it("findMobileEntryByImg matches a known variant", () => {
    const m = findMobileEntryByImg(sampleCatalog, "tavoloo.png");
    expect(m?.typeEntry?.id).toBe("tavolo");
    expect(m?.variant?.key).toBe("o");
  });

  it("findMobileEntryByImg matches singleton variant", () => {
    const m = findMobileEntryByImg(sampleCatalog, "trono.png");
    expect(m?.typeEntry?.id).toBe("trono");
    expect(m?.variant?.key).toBe("single");
  });

  it("findMobileEntryByImg returns null for unknown / empty img", () => {
    expect(findMobileEntryByImg(sampleCatalog, "ghost.png")).toBe(null);
    expect(findMobileEntryByImg(sampleCatalog, "")).toBe(null);
    expect(findMobileEntryByImg(sampleCatalog, null)).toBe(null);
    expect(findMobileEntryByImg(null, "tavoloo.png")).toBe(null);
  });

  it("nextMobiliNum on empty grid returns 1", () => {
    expect(nextMobiliNum([])).toBe(1);
    expect(nextMobiliNum([{ mobili: { num: null } }, { mobili: { num: null } }])).toBe(1);
  });

  it("cellHasMonster usa il flag mostab.mos (id 0 = Goblin è valido)", () => {
    expect(cellHasMonster(null)).toBe(false);
    expect(cellHasMonster({})).toBe(false);
    expect(cellHasMonster({ mostab: { mos: false, mosid: 5 } })).toBe(false);
    expect(cellHasMonster({ mostab: { mos: true, mosid: 0 } })).toBe(true);
    expect(cellHasMonster({ mostab: { mos: true, mosid: 7 } })).toBe(true);
  });

  it("nextMobiliNum returns max+1 of existing nums", () => {
    const grid = [
      { mobili: { num: null } },
      { mobili: { num: 3 } },
      { mobili: { num: 7 } },
      { mobili: { num: 5 } },
      {},
    ];
    expect(nextMobiliNum(grid)).toBe(8);
  });
});
