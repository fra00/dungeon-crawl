import { describe, it, expect } from "vitest";
import {
  normalizeValo,
  isCorridorValo,
  calculateVisibleCellsCore,
  hasLineOfSightCore,
} from "../../dungeon-visibility-calc-core.js";

describe("normalizeValo / isCorridorValo", () => {
  it("treats 0 and 1 and string forms as corridor ids", () => {
    expect(isCorridorValo(0)).toBe(true);
    expect(isCorridorValo(1)).toBe(true);
    expect(isCorridorValo("0")).toBe(true);
    expect(isCorridorValo("1")).toBe(true);
    expect(normalizeValo("2")).toBe(2);
    expect(isCorridorValo(2)).toBe(false);
  });
});

describe("calculateVisibleCellsCore", () => {
  it("in a room (valo !== 0/1), reveals all cells with same numeric valo", () => {
    const visibilityMap = {
      data: [
        { x: 1, y: 1, valo: "2" },
        { x: 2, y: 1, valo: "2" },
        { x: 3, y: 1, valo: "3" },
      ],
    };
    const gameSession = { currentMap: { grid: [] } };
    const cells = calculateVisibleCellsCore(gameSession, visibilityMap, 1, 1);
    const keys = new Set(cells.map((c) => `${c.x},${c.y}`));
    expect(keys.has("1,1")).toBe(true);
    expect(keys.has("2,1")).toBe(true);
    expect(keys.has("3,1")).toBe(false);
  });

  it("in corridor (valo 1), ray propagates in cardinal directions until room boundary", () => {
    const visibilityMap = {
      data: [
        { x: 2, y: 1, valo: "1" },
        { x: 3, y: 1, valo: "1" },
        { x: 4, y: 1, valo: "5" },
      ],
    };
    const gameSession = { currentMap: { grid: [] } };
    const cells = calculateVisibleCellsCore(gameSession, visibilityMap, 2, 1);
    const keys = new Set(cells.map((c) => `${c.x},${c.y}`));
    expect(keys.has("2,1")).toBe(true);
    expect(keys.has("3,1")).toBe(true);
    expect(keys.has("4,1")).toBe(false);
  });

  it("stops corridor ray at rock obstacle but includes the rock cell", () => {
    const visibilityMap = {
      data: [
        { x: 2, y: 1, valo: "1" },
        { x: 3, y: 1, valo: "1" },
        { x: 4, y: 1, valo: "1" },
      ],
    };
    const gameSession = {
      currentMap: {
        grid: [{ x: 3, y: 1, arnt: { antroc: true } }],
      },
    };
    const cells = calculateVisibleCellsCore(gameSession, visibilityMap, 2, 1);
    const keys = new Set(cells.map((c) => `${c.x},${c.y}`));
    expect(keys.has("3,1")).toBe(true);
    expect(keys.has("4,1")).toBe(false);
  });
});

describe("hasLineOfSightCore", () => {
  it("blocks cross-area step without a door on the path", () => {
    const visibilityMap = {
      data: [
        { x: 1, y: 1, valo: 3 },
        { x: 2, y: 1, valo: 4 },
      ],
    };
    const gameSession = { currentMap: { grid: [] }, openedDoors: [] };
    expect(hasLineOfSightCore(gameSession, visibilityMap, 1, 1, 2, 1)).toBe(false);
  });

  it("allows step across different valo when a door coordinate is in openedDoors", () => {
    const visibilityMap = {
      data: [
        { x: 1, y: 1, valo: 3 },
        { x: 2, y: 1, valo: 4 },
        { x: 3, y: 1, valo: 3 },
      ],
    };
    const gameSession = { currentMap: { grid: [] }, openedDoors: ["2,1"] };
    expect(hasLineOfSightCore(gameSession, visibilityMap, 1, 1, 3, 1)).toBe(true);
  });
});
