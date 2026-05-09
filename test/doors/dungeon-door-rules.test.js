import { describe, it, expect } from "vitest";
import {
  getDoorGatedNeighbor,
  getDoorPair,
  getDoorGatedNeighbors,
  getDoorGatedPairs,
  isPairGatedByDoor,
  findDoorGatingPair,
  findDoorsTouchingCell,
} from "../../dungeon-door-rules.js";

/**
 * Convenzione (vedi .cursor/rules/doors.mdc): geometria DIREZIONALE +1.
 *   - oriz=true  → vicino gestito è (x, y+1).
 *   - oriz=false → vicino gestito è (x+1, y).
 */

describe("dungeon-door-rules (direzionale +1)", () => {
  describe("getDoorGatedNeighbor", () => {
    it("oriz=true → vicino è (x, y+1)", () => {
      expect(getDoorGatedNeighbor({ x: 5, y: 10, oriz: true })).toEqual({ x: 5, y: 11 });
    });
    it("oriz=false → vicino è (x+1, y)", () => {
      expect(getDoorGatedNeighbor({ x: 5, y: 10, oriz: false })).toEqual({ x: 6, y: 10 });
    });
    it("door senza oriz è trattata come oriz=false", () => {
      expect(getDoorGatedNeighbor({ x: 5, y: 10 })).toEqual({ x: 6, y: 10 });
    });
    it("input nulli o coordinate non finite → null", () => {
      expect(getDoorGatedNeighbor(null)).toBeNull();
      expect(getDoorGatedNeighbor({ x: "a", y: 10 })).toBeNull();
    });
  });

  describe("getDoorPair", () => {
    it("ritorna [door, neighbor +1]", () => {
      expect(getDoorPair({ x: 5, y: 10, oriz: true })).toEqual([
        { x: 5, y: 10 },
        { x: 5, y: 11 },
      ]);
    });
    it("input invalido → null", () => {
      expect(getDoorPair(null)).toBeNull();
    });
  });

  describe("getDoorGatedNeighbors (varianti plurali, sempre 0..1 elementi)", () => {
    it("oriz=true → array con un solo vicino (x, y+1)", () => {
      expect(getDoorGatedNeighbors({ x: 5, y: 10, oriz: true })).toEqual([
        { x: 5, y: 11 },
      ]);
    });
    it("oriz=false → array con un solo vicino (x+1, y)", () => {
      expect(getDoorGatedNeighbors({ x: 5, y: 10, oriz: false })).toEqual([
        { x: 6, y: 10 },
      ]);
    });
    it("input nullo → []", () => {
      expect(getDoorGatedNeighbors(null)).toEqual([]);
    });
  });

  describe("getDoorGatedPairs", () => {
    it("ritorna 1 sola coppia [door, neighbor +1]", () => {
      expect(getDoorGatedPairs({ x: 5, y: 10, oriz: true })).toEqual([
        [{ x: 5, y: 10 }, { x: 5, y: 11 }],
      ]);
    });
  });

  describe("isPairGatedByDoor (geometria direzionale)", () => {
    const door = { x: 5, y: 10, oriz: true };
    it("matcha la coppia (door → neighbor +1)", () => {
      expect(isPairGatedByDoor(door, 5, 10, 5, 11)).toBe(true);
    });
    it("matcha la coppia inversa (neighbor +1 → door)", () => {
      expect(isPairGatedByDoor(door, 5, 11, 5, 10)).toBe(true);
    });
    it("NON matcha il lato -1 (door → (x, y-1))", () => {
      expect(isPairGatedByDoor(door, 5, 10, 5, 9)).toBe(false);
      expect(isPairGatedByDoor(door, 5, 9, 5, 10)).toBe(false);
    });
    it("NON matcha celle fuori asse di orientamento", () => {
      expect(isPairGatedByDoor(door, 5, 10, 6, 10)).toBe(false);
      expect(isPairGatedByDoor(door, 5, 10, 4, 10)).toBe(false);
    });
    it("NON matcha celle non adiacenti", () => {
      expect(isPairGatedByDoor(door, 5, 10, 6, 11)).toBe(false);
    });
    it("oriz=false matcha SOLO (x, y) ↔ (x+1, y)", () => {
      const v = { x: 5, y: 10, oriz: false };
      expect(isPairGatedByDoor(v, 5, 10, 6, 10)).toBe(true);
      expect(isPairGatedByDoor(v, 6, 10, 5, 10)).toBe(true);
      expect(isPairGatedByDoor(v, 5, 10, 4, 10)).toBe(false);
      expect(isPairGatedByDoor(v, 5, 10, 5, 11)).toBe(false);
      expect(isPairGatedByDoor(v, 5, 10, 5, 9)).toBe(false);
    });
  });

  describe("findDoorGatingPair", () => {
    const porte = [
      { x: 5, y: 10, oriz: true },
      { x: 8, y: 12, oriz: false },
    ];
    it("trova la porta che gestisce la coppia +1", () => {
      expect(findDoorGatingPair(porte, 5, 10, 5, 11)).toEqual(porte[0]);
      expect(findDoorGatingPair(porte, 5, 11, 5, 10)).toEqual(porte[0]);
      expect(findDoorGatingPair(porte, 8, 12, 9, 12)).toEqual(porte[1]);
      expect(findDoorGatingPair(porte, 9, 12, 8, 12)).toEqual(porte[1]);
    });
    it("ritorna null per il lato -1 (non gestito)", () => {
      expect(findDoorGatingPair(porte, 5, 10, 5, 9)).toBeNull();
      expect(findDoorGatingPair(porte, 8, 12, 7, 12)).toBeNull();
    });
    it("ritorna null se nessuna porta gestisce la coppia", () => {
      expect(findDoorGatingPair(porte, 1, 1, 2, 1)).toBeNull();
      expect(findDoorGatingPair(porte, 5, 10, 6, 10)).toBeNull();
    });
    it("input nulli o vuoti → null", () => {
      expect(findDoorGatingPair(null, 1, 1, 1, 2)).toBeNull();
      expect(findDoorGatingPair([], 1, 1, 1, 2)).toBeNull();
    });
  });

  describe("findDoorsTouchingCell", () => {
    // Porta A: (5, 10, oriz=true)  → tocca (5,10) e (5,11)
    // Porta B: (5, 11, oriz=false) → tocca (5,11) e (6,11)
    const porte = [
      { x: 5, y: 10, oriz: true },
      { x: 5, y: 11, oriz: false },
    ];
    it("ritorna le porte che includono la cella (door cell o vicino +1)", () => {
      // (5,11) è il vicino +1 di A (door cell di B)
      expect(findDoorsTouchingCell(porte, 5, 11)).toEqual(porte);
      // (5,10) è SOLO la door cell di A
      expect(findDoorsTouchingCell(porte, 5, 10)).toEqual([porte[0]]);
      // (6,11) è il vicino +1 di B
      expect(findDoorsTouchingCell(porte, 6, 11)).toEqual([porte[1]]);
    });
    it("NON include la cella al lato -1 (non gestita)", () => {
      // (5, 9) sarebbe -1 rispetto ad A: NON è gestita.
      expect(findDoorsTouchingCell(porte, 5, 9)).toEqual([]);
      // (4, 11) sarebbe -1 rispetto a B: NON è gestita.
      expect(findDoorsTouchingCell(porte, 4, 11)).toEqual([]);
    });
    it("ritorna [] se nessuna porta tocca la cella", () => {
      expect(findDoorsTouchingCell(porte, 1, 1)).toEqual([]);
      expect(findDoorsTouchingCell(porte, 5, 12)).toEqual([]);
    });
  });
});
