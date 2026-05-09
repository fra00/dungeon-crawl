/**
 * Regression: `isBlockedByFurniture` non deve bloccare celle che hanno
 * `mobili.flpo === true` o `mobili.flpv === true` ma `mobili.num === null`.
 *
 * Caso reale: in `public/jsonData/map/DGBase01.json` la cella (13, 12) ha
 * `mobili.num === null` ma `mobili.flpv === true` (residuo legacy). Con il
 * vecchio check questa cella veniva considerata "bloccata da arredo",
 * impedendo il pathfinding di terminare lì sopra.
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDungeonMapQuery } from "../../dungeon-map-query.js";

function makeSession(cells) {
  return {
    currentTurn: 1,
    heroes: [],
    monsters: [],
    openedDoors: [],
    currentMap: { porte: [], grid: cells },
  };
}

describe("isBlockedByFurniture", () => {
  it("flpo/flpv NON bloccano se non c'è arredo (mobili.num === null)", () => {
    const cells = [
      {
        x: 13, y: 12,
        arnt: { antroc: false, inv: false },
        mobili: { num: null, img: "", flpo: false, flpv: true },
      },
      {
        x: 14, y: 12,
        arnt: { antroc: false, inv: false },
        mobili: { num: null, img: "", flpo: true, flpv: true },
      },
    ];
    const { result } = renderHook(() =>
      useDungeonMapQuery({ gameSession: makeSession(cells), visibilityMap: { data: [] } })
    );
    expect(result.current.isBlockedByFurniture(13, 12)).toBe(false);
    expect(result.current.isBlockedByFurniture(14, 12)).toBe(false);
  });

  it("blocco corretto se l'arredo è effettivamente presente", () => {
    const cells = [
      {
        x: 5, y: 5,
        arnt: { antroc: false, inv: false },
        mobili: { num: 3, img: "scrivania.png", flpo: false, flpv: false },
      },
    ];
    const { result } = renderHook(() =>
      useDungeonMapQuery({ gameSession: makeSession(cells), visibilityMap: { data: [] } })
    );
    expect(result.current.isBlockedByFurniture(5, 5)).toBe(true);
  });

  it("blocco corretto su arnt.inv === true anche senza mobili", () => {
    const cells = [
      {
        x: 5, y: 5,
        arnt: { antroc: false, inv: true },
        mobili: { num: null, img: "", flpo: false, flpv: false },
      },
    ];
    const { result } = renderHook(() =>
      useDungeonMapQuery({ gameSession: makeSession(cells), visibilityMap: { data: [] } })
    );
    expect(result.current.isBlockedByFurniture(5, 5)).toBe(true);
  });

  it("celle vuote standard non sono bloccate", () => {
    const cells = [
      {
        x: 1, y: 1,
        arnt: { antroc: false, inv: false },
        mobili: { num: null, img: "", flpo: false, flpv: false },
      },
    ];
    const { result } = renderHook(() =>
      useDungeonMapQuery({ gameSession: makeSession(cells), visibilityMap: { data: [] } })
    );
    expect(result.current.isBlockedByFurniture(1, 1)).toBe(false);
  });
});
