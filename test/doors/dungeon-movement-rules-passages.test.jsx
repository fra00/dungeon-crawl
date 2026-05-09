/**
 * Verifica che la geometria direzionale +1 si applichi anche ai PASSAGGI
 * SEGRETI scoperti.
 *
 * I passaggi segreti sono memorizzati per cella: `cell.psgg.ps > 0` con
 * `cell.psgg.oriz`. Al momento della scoperta, vengono inseriti in
 * `foundPassages` come `{x, y, oriz, img, flpo, flpv}`. La movement rule li
 * valuta tramite `findDoorGatingPair` che è agnostico tra porte e passaggi.
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

  const isSecretPassage = (x, y) => {
    const c = session.currentMap.grid.find((c) => c.x === x && c.y === y);
    return c?.psgg?.ps != null && Number(c.psgg.ps) > 0;
  };

  return {
    getMapCell: (x, y) => session.currentMap.grid.find((c) => c.x === x && c.y === y) || null,
    getVisibilityCell: (x, y) => {
      const v = valo[`${x},${y}`];
      return v != null ? { x, y, valo: v } : null;
    },
    isDoor: (x, y) => porte.some((d) => d.x === x && d.y === y),
    isSecretPassage,
    isBlockedByFurniture: () => false,
    isBlockedByMonster: () => false,
    isOccupiedByHero: () => false,
    isBlockedByRock: () => false,
    getMapDimensions: () => ({ width: 26, height: 19 }),
    exposedContext: { gameSession: session },
    gameSession: session,
  };
}

describe("Movement rules: passaggi segreti (geometria direzionale +1)", () => {
  it("scoperto: attraversa SOLO la coppia +1 sull'asse Y", () => {
    const mapQuery = buildMapQuery({
      grid: {
        "5,9": {},
        "5,10": { psgg: { ps: 1, oriz: true } },
        "5,11": {},
      },
      valo: { "5,9": "C", "5,10": "A", "5,11": "B" },
    });
    const foundPassages = [{ x: 5, y: 10, oriz: true, img: "pso.png" }];
    const { result } = renderHook(() =>
      useDungeonMovementRules({ mapQuery, foundPassages })
    );

    // Lato +1 → gestito
    expect(result.current.isWalkable(5, 10, 5, 11, "h1", foundPassages)).toBe(true);
    expect(result.current.isWalkable(5, 11, 5, 10, "h1", foundPassages)).toBe(true);
    // Lato -1 → NON gestito
    expect(result.current.isWalkable(5, 9, 5, 10, "h1", foundPassages)).toBe(false);
    expect(result.current.isWalkable(5, 10, 5, 9, "h1", foundPassages)).toBe(false);
  });

  it("BLOCCA il passaggio fuori asse di orientamento", () => {
    const mapQuery = buildMapQuery({
      grid: {
        "4,10": {},
        "5,10": { psgg: { ps: 1, oriz: true } },
        "6,10": {},
      },
      valo: { "4,10": "X", "5,10": "A", "6,10": "Y" },
    });
    const foundPassages = [{ x: 5, y: 10, oriz: true, img: "pso.png" }];
    const { result } = renderHook(() =>
      useDungeonMovementRules({ mapQuery, foundPassages })
    );

    // oriz=true non gata l'asse X
    expect(result.current.isWalkable(5, 10, 6, 10, "h1", foundPassages)).toBe(false);
    expect(result.current.isWalkable(5, 10, 4, 10, "h1", foundPassages)).toBe(false);
  });

  it("non scoperto: nessun attraversamento, anche sulla coppia +1", () => {
    const mapQuery = buildMapQuery({
      grid: {
        "5,10": { psgg: { ps: 1, oriz: true } },
        "5,11": {},
      },
      valo: { "5,10": "A", "5,11": "B" },
    });
    const foundPassages = []; // Non ancora scoperto
    const { result } = renderHook(() =>
      useDungeonMovementRules({ mapQuery, foundPassages })
    );

    expect(result.current.isWalkable(5, 10, 5, 11, "h1", foundPassages)).toBe(false);
  });

  it("passaggio verticale (oriz=false) gestisce SOLO il vicino +1 sull'asse X", () => {
    const mapQuery = buildMapQuery({
      grid: {
        "4,10": {},
        "5,10": { psgg: { ps: 1, oriz: false } },
        "6,10": {},
      },
      valo: { "4,10": "C", "5,10": "A", "6,10": "B" },
    });
    const foundPassages = [{ x: 5, y: 10, oriz: false, img: "psv.png" }];
    const { result } = renderHook(() =>
      useDungeonMovementRules({ mapQuery, foundPassages })
    );

    // Lato +1 → gestito
    expect(result.current.isWalkable(5, 10, 6, 10, "h1", foundPassages)).toBe(true);
    expect(result.current.isWalkable(6, 10, 5, 10, "h1", foundPassages)).toBe(true);
    // Lato -1 → NON gestito
    expect(result.current.isWalkable(5, 10, 4, 10, "h1", foundPassages)).toBe(false);
    expect(result.current.isWalkable(4, 10, 5, 10, "h1", foundPassages)).toBe(false);
  });
});
