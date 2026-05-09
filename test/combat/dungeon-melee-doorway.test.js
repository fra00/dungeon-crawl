import { describe, it, expect } from "vitest";
import {
  isMeleeAttackThroughAdjacentDoorway,
  cellIsOpenDoorTile,
  mergeOpenedDoorsAfterStep,
} from "../../dungeon-melee-doorway.js";

describe("cellIsOpenDoorTile", () => {
  const session = (porte, openedDoors) => ({
    currentMap: { porte },
    openedDoors,
  });

  it("is true only when the cell is a door on the map and listed as opened", () => {
    const s = session([{ x: 6, y: 5, oriz: true }], ["6,5"]);
    expect(cellIsOpenDoorTile(s, 6, 5)).toBe(true);
    expect(cellIsOpenDoorTile(s, "6", "5")).toBe(true);
  });

  it("is false if the door is closed or the tile is not a door", () => {
    expect(cellIsOpenDoorTile(session([{ x: 6, y: 5, oriz: true }], []), 6, 5)).toBe(false);
    expect(cellIsOpenDoorTile(session([], ["6,5"]), 6, 5)).toBe(false);
    expect(cellIsOpenDoorTile(session([{ x: 6, y: 5, oriz: true }], ["7,5"]), 7, 5)).toBe(false);
  });
});

describe("mergeOpenedDoorsAfterStep (apre solo quando si lascia la cella della porta)", () => {
  it("arrivare SU una porta NON la apre (atTo solo): l'eroe può ancora cliccare 'Apri porta'", () => {
    const s0 = {
      currentMap: { porte: [{ x: 6, y: 5, oriz: true }] },
      openedDoors: [],
    };
    // Step (5,5) → (6,5): atTo=true (arrivo sulla porta), atFrom=false.
    // Con la nuova semantica: non si apre.
    const s1 = mergeOpenedDoorsAfterStep(s0, 5, 5, 6, 5);
    expect(s1.openedDoors).toEqual([]);
  });

  it("lasciare una porta (atFrom) la apre", () => {
    const s0 = {
      currentMap: { porte: [{ x: 6, y: 5, oriz: true }] },
      openedDoors: [],
    };
    // Step (6,5) → (7,5): atFrom=true (sto lasciando la porta).
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 7, 5);
    expect(s1.openedDoors).toEqual(["6,5"]);
  });

  it("step lontano da qualunque porta non cambia openedDoors", () => {
    const s0 = {
      currentMap: { porte: [{ x: 6, y: 5, oriz: true }] },
      openedDoors: [],
    };
    const s1 = mergeOpenedDoorsAfterStep(s0, 1, 1, 1, 2);
    expect(s1.openedDoors).toEqual([]);
  });

  it("flusso reale: arrivo sulla porta (chiusa) → lascio la porta (aperta)", () => {
    let s = {
      currentMap: { porte: [{ x: 6, y: 5, oriz: true }] },
      openedDoors: [],
    };
    // Step 1: arrivo sulla porta. Resta chiusa.
    s = mergeOpenedDoorsAfterStep(s, 5, 5, 6, 5);
    expect(s.openedDoors).toEqual([]);
    // Step 2: lascio la porta. Si apre.
    s = mergeOpenedDoorsAfterStep(s, 6, 5, 7, 5);
    expect(s.openedDoors).toEqual(["6,5"]);
  });

  it("ri-passare su una porta già aperta non duplica la chiave", () => {
    const s0 = {
      currentMap: { porte: [{ x: 6, y: 5, oriz: true }] },
      openedDoors: ["6,5"],
    };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 7, 5);
    expect(s1.openedDoors).toEqual(["6,5"]);
  });

  it("returns the same session reference if nothing to add", () => {
    const s = { currentMap: { porte: [] }, openedDoors: [] };
    expect(mergeOpenedDoorsAfterStep(s, 1, 1, 1, 2)).toBe(s);
  });
});

describe("isMeleeAttackThroughAdjacentDoorway (legacy / isFrontOfDoor helper)", () => {
  it("returns true when monster is on destination tile opposite the doorway", () => {
    const doorwayInfo = {
      destination: { x: 7, y: 5 },
    };
    expect(isMeleeAttackThroughAdjacentDoorway(5, 5, 7, 5, doorwayInfo)).toBe(true);
    expect(
      isMeleeAttackThroughAdjacentDoorway(7, 5, 5, 5, { destination: { x: 5, y: 5 } })
    ).toBe(true);
  });

  it("requires Manhattan distance 2 on same row or column", () => {
    const doorwayInfo = { destination: { x: 7, y: 5 } };
    expect(isMeleeAttackThroughAdjacentDoorway(5, 5, 6, 5, doorwayInfo)).toBe(false);
    expect(isMeleeAttackThroughAdjacentDoorway(5, 5, 7, 6, doorwayInfo)).toBe(false);
  });

  it("returns false without doorway info", () => {
    expect(isMeleeAttackThroughAdjacentDoorway(5, 5, 7, 5, null)).toBe(false);
    expect(isMeleeAttackThroughAdjacentDoorway(5, 5, 7, 5, {})).toBe(false);
  });
});
