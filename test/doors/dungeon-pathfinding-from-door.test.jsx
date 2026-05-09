/**
 * Riproduce il bug "eroe su porta non si muove" segnalato dall'utente:
 *  - eroe sulla cella di una porta (px, py)
 *  - clicca sulla cella +1 (gated dalla porta) come destinazione finale
 *  - il path NON viene calcolato → niente movimento
 *
 * Geometria direzionale +1 (vedi .cursor/rules/doors.mdc).
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePathfinding } from "../../dungeon-use-pathfinding.js";

function buildSession({ porte = [], heroOn, gridCells = [] }) {
  const grid = gridCells.map(({ x, y, arnt }) => ({
    x,
    y,
    arnt: arnt || { antroc: false, inv: false },
  }));
  return {
    currentTurn: 1,
    heroes: [{ heroId: "h1", turnOrder: 1, x: heroOn.x, y: heroOn.y, currentBody: 5 }],
    monsters: [],
    openedDoors: [],
    currentMap: { porte, grid },
  };
}

function buildVisibility(valoMap) {
  const data = Object.entries(valoMap).map(([k, valo]) => {
    const [x, y] = k.split(",").map(Number);
    return { x, y, valo, fog: false };
  });
  return { source: "test", image: "", data };
}

describe("Pathfinding: eroe sulla cella di una porta (direzionale +1)", () => {
  it("clicca direttamente la cella gated (+1) come destinazione: path NON vuoto", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      heroOn: { x: 5, y: 10 },
      gridCells: [
        { x: 5, y: 10 },
        { x: 5, y: 11 },
        { x: 5, y: 12 },
      ],
    });
    const visibilityMap = buildVisibility({
      "5,10": "A",
      "5,11": "B",
      "5,12": "B",
    });

    const { result } = renderHook(() =>
      usePathfinding({ gameSession, visibilityMap, foundPassages: [] })
    );

    const path = result.current.calculatePath(5, 10, 5, 11, 10, "h1");
    expect(path).toEqual([{ x: 5, y: 11 }]);
  });

  it("clicca cella oltre +1 (5,12): path passa per (5,11)", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      heroOn: { x: 5, y: 10 },
      gridCells: [
        { x: 5, y: 10 },
        { x: 5, y: 11 },
        { x: 5, y: 12 },
      ],
    });
    const visibilityMap = buildVisibility({
      "5,10": "A",
      "5,11": "B",
      "5,12": "B",
    });

    const { result } = renderHook(() =>
      usePathfinding({ gameSession, visibilityMap, foundPassages: [] })
    );

    const path = result.current.calculatePath(5, 10, 5, 12, 10, "h1");
    expect(path).toEqual([{ x: 5, y: 11 }, { x: 5, y: 12 }]);
  });

  it("clicca cella -1 dalla porta: path VUOTO (gating direzionale, lato -1 non gestito)", () => {
    // Tutte le celle attorno hanno valo "WALL" diverso da A/B/C: BFS non
    // ha modo di girare attorno alla porta perché qualunque transizione
    // verso una cella WALL richiede gating che nessuna porta fornisce.
    const valos = { "5,9": "C", "5,10": "A", "5,11": "B" };
    for (let x = 3; x <= 7; x++) {
      for (let y = 7; y <= 13; y++) {
        const k = `${x},${y}`;
        if (!valos[k]) valos[k] = "WALL";
      }
    }
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      heroOn: { x: 5, y: 10 },
      gridCells: [
        { x: 5, y: 9 },
        { x: 5, y: 10 },
        { x: 5, y: 11 },
      ],
    });
    const visibilityMap = buildVisibility(valos);

    const { result } = renderHook(() =>
      usePathfinding({ gameSession, visibilityMap, foundPassages: [] })
    );

    const path = result.current.calculatePath(5, 10, 5, 9, 10, "h1");
    expect(path).toEqual([]);
  });
});
