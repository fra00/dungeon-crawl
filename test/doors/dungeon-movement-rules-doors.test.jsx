/**
 * Verifica end-to-end della geometria direzionale +1 delle porte attraverso
 * useDungeonMovementRules.
 *
 * Convenzione (vedi .cursor/rules/doors.mdc):
 *   - Una porta a (px, py) con oriz=true gestisce SOLO la coppia
 *     (px, py) ↔ (px, py+1). Il lato -1 NON è gestito.
 *   - oriz=false gestisce SOLO la coppia (px, py) ↔ (px+1, py).
 *   - L'orientazione vincola anche l'asse: una porta oriz=true non consente
 *     passaggi sull'asse X e viceversa.
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDungeonMovementRules } from "../../dungeon-movement-rules.js";

function buildMapQuery({ porte = [], grid = {}, valo = {} } = {}) {
  const session = {
    currentMap: {
      grid: Object.entries(grid).map(([key, cell]) => {
        const [x, y] = key.split(",").map(Number);
        return { x, y, ...cell };
      }),
      porte,
    },
    heroes: [],
    monsters: [],
  };

  return {
    getMapCell: (x, y) => session.currentMap.grid.find((c) => c.x === x && c.y === y) || null,
    getVisibilityCell: (x, y) => {
      const v = valo[`${x},${y}`];
      return v != null ? { x, y, valo: v } : null;
    },
    isDoor: (x, y) => porte.some((d) => d.x === x && d.y === y),
    isSecretPassage: () => false,
    isBlockedByFurniture: () => false,
    isBlockedByMonster: () => false,
    isOccupiedByHero: () => false,
    isBlockedByRock: () => false,
    getMapDimensions: () => ({ width: 26, height: 19 }),
    exposedContext: { gameSession: session },
    gameSession: session,
  };
}

describe("Movement rules con geometria porta direzionale (+1)", () => {
  it("attraversa la coppia (door, +1) sull'asse Y (oriz=true)", () => {
    const mapQuery = buildMapQuery({
      porte: [{ x: 5, y: 10, oriz: true }],
      grid: { "5,10": {}, "5,11": {} },
      valo: { "5,10": "A", "5,11": "B" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    expect(result.current.isWalkable(5, 10, 5, 11, "h1")).toBe(true);
    expect(result.current.isWalkable(5, 11, 5, 10, "h1")).toBe(true);
  });

  it("BLOCCA il lato -1 sull'asse Y (door oriz=true non gata (x, y-1))", () => {
    const mapQuery = buildMapQuery({
      porte: [{ x: 5, y: 10, oriz: true }],
      grid: { "5,9": {}, "5,10": {}, "5,11": {} },
      valo: { "5,9": "C", "5,10": "A", "5,11": "B" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    expect(result.current.isWalkable(5, 10, 5, 9, "h1")).toBe(false);
    expect(result.current.isWalkable(5, 9, 5, 10, "h1")).toBe(false);
    // Il lato +1 resta gestito
    expect(result.current.isWalkable(5, 10, 5, 11, "h1")).toBe(true);
  });

  it("BLOCCA il passaggio fuori asse di orientamento (oriz=true non gata X)", () => {
    const mapQuery = buildMapQuery({
      porte: [{ x: 5, y: 10, oriz: true }],
      grid: { "5,10": {}, "6,10": {}, "4,10": {} },
      valo: { "4,10": "X", "5,10": "A", "6,10": "Y" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    expect(result.current.isWalkable(5, 10, 6, 10, "h1")).toBe(false);
    expect(result.current.isWalkable(5, 10, 4, 10, "h1")).toBe(false);
  });

  it("porta verticale (oriz=false) gestisce SOLO il vicino +1 sull'asse X", () => {
    const mapQuery = buildMapQuery({
      porte: [{ x: 5, y: 10, oriz: false }],
      grid: { "5,10": {}, "6,10": {}, "4,10": {} },
      valo: { "4,10": "C", "5,10": "A", "6,10": "B" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    // Lato +1 → gestito
    expect(result.current.isWalkable(5, 10, 6, 10, "h1")).toBe(true);
    expect(result.current.isWalkable(6, 10, 5, 10, "h1")).toBe(true);
    // Lato -1 → NON gestito
    expect(result.current.isWalkable(5, 10, 4, 10, "h1")).toBe(false);
    expect(result.current.isWalkable(4, 10, 5, 10, "h1")).toBe(false);
  });

  it("porta verticale NON gata l'asse Y", () => {
    const mapQuery = buildMapQuery({
      porte: [{ x: 5, y: 10, oriz: false }],
      grid: { "5,9": {}, "5,10": {}, "5,11": {} },
      valo: { "5,9": "X", "5,10": "A", "5,11": "Y" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    expect(result.current.isWalkable(5, 10, 5, 11, "h1")).toBe(false);
    expect(result.current.isWalkable(5, 10, 5, 9, "h1")).toBe(false);
  });

  it("due porte autorate per gating dei DUE lati: una +1, una -1", () => {
    // Per gestire entrambi i lati di un corridoio servono DUE porte
    // autorate sulle due celle vicine, ciascuna direzionale verso il
    // corridoio centrale.
    //   Porta A: (5, 9, oriz=true)   → gata (5,9)↔(5,10)
    //   Porta B: (5, 10, oriz=true)  → gata (5,10)↔(5,11)
    const mapQuery = buildMapQuery({
      porte: [
        { x: 5, y: 9, oriz: true },
        { x: 5, y: 10, oriz: true },
      ],
      grid: { "5,9": {}, "5,10": {}, "5,11": {} },
      valo: { "5,9": "A", "5,10": "C", "5,11": "B" },
    });
    const { result } = renderHook(() => useDungeonMovementRules({ mapQuery }));
    expect(result.current.isWalkable(5, 9, 5, 10, "h1")).toBe(true);
    expect(result.current.isWalkable(5, 10, 5, 11, "h1")).toBe(true);
    // Il salto diretto (5,9)→(5,11) NON è gestito da nessuna delle due
    expect(result.current.isWalkable(5, 9, 5, 11, "h1")).toBe(false);
  });
});
