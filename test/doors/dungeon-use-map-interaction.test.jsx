/**
 * Test di integrazione per `useMapInteraction.isFrontOfDoor` con geometria
 * direzionale +1.
 *
 * Convenzione (vedi .cursor/rules/doors.mdc):
 *   - Una porta a (px, py) con oriz=true gestisce SOLO il vicino (px, py+1).
 *   - oriz=false gestisce SOLO il vicino (px+1, py).
 *   - Il pulsante "Apri porta" appare solo se l'eroe è sulla door cell o sul
 *     vicino +1 e la cella destinazione è apribile (non muro / non blocco magico).
 */
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useMapInteraction } from "../../dungeon-use-map-interaction.js";

afterEach(() => cleanup());

function buildSession({ porte = [], gridCoords = [], hero = { x: 5, y: 10 }, openedDoors = [], walls = [] } = {}) {
  const wallSet = new Set(walls.map(([x, y]) => `${x},${y}`));
  return {
    currentTurn: 1,
    heroes: [{ heroId: "h1", turnOrder: 1, x: hero.x, y: hero.y }],
    monsters: [],
    openedDoors,
    currentMap: {
      porte,
      grid: gridCoords.map(([x, y]) => ({
        x,
        y,
        arnt: { antroc: wallSet.has(`${x},${y}`), inv: false },
      })),
    },
  };
}

describe("isFrontOfDoor (direzionale +1)", () => {
  it("eroe SULLA door cell (oriz=true): destinazione = vicino +1", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 10], [5, 11]],
      hero: { x: 5, y: 10 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    const r = result.current.isFrontOfDoor(5, 10);
    expect(r).not.toBeNull();
    expect(r.passageCell).toEqual({ x: 5, y: 10 });
    expect(r.destination).toEqual({ x: 5, y: 11 });
  });

  it("eroe sulla door cell, vicino +1 è muro → null", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 10], [5, 11]],
      hero: { x: 5, y: 10 },
      walls: [[5, 11]],
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    expect(result.current.isFrontOfDoor(5, 10)).toBeNull();
  });

  it("eroe sul vicino +1 → destinazione = door cell", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 10], [5, 11]],
      hero: { x: 5, y: 11 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    const r = result.current.isFrontOfDoor(5, 11);
    expect(r).not.toBeNull();
    expect(r.passageCell).toEqual({ x: 5, y: 10 });
    expect(r.destination).toEqual({ x: 5, y: 10 });
  });

  it("eroe sul lato -1 (NON gestito) → null", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 9], [5, 10]],
      hero: { x: 5, y: 9 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    expect(result.current.isFrontOfDoor(5, 9)).toBeNull();
  });

  it("porta verticale (oriz=false): eroe sulla door cell → vicino +1 sull'asse X", () => {
    const gameSession = buildSession({
      porte: [{ x: 2, y: 12, oriz: false }],
      gridCoords: [[1, 12], [2, 12], [3, 12]],
      hero: { x: 2, y: 12 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    const r = result.current.isFrontOfDoor(2, 12);
    expect(r).not.toBeNull();
    expect(r.destination).toEqual({ x: 3, y: 12 });
  });

  it("porta verticale: eroe sul vicino -1 (1, 12) → null", () => {
    const gameSession = buildSession({
      porte: [{ x: 2, y: 12, oriz: false }],
      gridCoords: [[1, 12], [2, 12], [3, 12]],
      hero: { x: 1, y: 12 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    expect(result.current.isFrontOfDoor(1, 12)).toBeNull();
  });

  it("porta già aperta: niente pulsante 'Apri porta'", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 10], [5, 11]],
      hero: { x: 5, y: 10 },
      openedDoors: ["5,10"],
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    expect(result.current.isFrontOfDoor(5, 10)).toBeNull();
  });

  it("eroe lontano dalla porta: null", () => {
    const gameSession = buildSession({
      porte: [{ x: 5, y: 10, oriz: true }],
      gridCoords: [[5, 10], [7, 10]],
      hero: { x: 7, y: 10 },
    });
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    expect(result.current.isFrontOfDoor(7, 10)).toBeNull();
  });

  it("passaggio segreto scoperto: stessa logica direzionale delle porte", () => {
    const gameSession = buildSession({
      porte: [],
      gridCoords: [[5, 10], [5, 11]],
      hero: { x: 5, y: 10 },
    });
    const foundPassages = [{ x: 5, y: 10, oriz: true, img: "pso.png" }];
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages, sessionManager: null })
    );
    const r = result.current.isFrontOfDoor(5, 10);
    expect(r).not.toBeNull();
    expect(r.passageCell).toEqual({ x: 5, y: 10 });
    expect(r.destination).toEqual({ x: 5, y: 11 });
  });
});
