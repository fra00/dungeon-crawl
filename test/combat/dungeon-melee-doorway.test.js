import { describe, it, expect } from "vitest";
import {
  isMeleeAttackThroughAdjacentDoorway,
  cellIsOpenDoorTile,
  mergeOpenedDoorsAfterStep,
  mergeOpenedDoorsAlongPath,
  stepCrossesValoThroughDoor,
} from "../../dungeon-melee-doorway.js";

function visMap(entries) {
  return { data: entries.map(([x, y, valo]) => ({ x, y, valo })) };
}

const VIS_ORIZ_DOOR = visMap([
  [6, 5, 2],
  [6, 6, 3],
  [5, 5, 2],
  [7, 5, 2],
]);

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

describe("stepCrossesValoThroughDoor", () => {
  const porte = [{ x: 6, y: 5, oriz: true }];

  it("true solo con coppia gestita e valo diverso", () => {
    expect(stepCrossesValoThroughDoor(VIS_ORIZ_DOOR, porte, 6, 5, 6, 6)).toBe(true);
    expect(stepCrossesValoThroughDoor(VIS_ORIZ_DOOR, porte, 6, 6, 6, 5)).toBe(true);
    expect(stepCrossesValoThroughDoor(VIS_ORIZ_DOOR, porte, 6, 5, 7, 5)).toBe(false);
    expect(stepCrossesValoThroughDoor(VIS_ORIZ_DOOR, porte, 5, 5, 6, 5)).toBe(false);
  });
});

describe("mergeOpenedDoorsAfterStep (apre solo al cambio valo attraverso porta)", () => {
  const porte = [{ x: 6, y: 5, oriz: true }];
  const opts = { visibilityMap: VIS_ORIZ_DOOR };

  it("arrivare sulla porta senza cambio valo NON la apre", () => {
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 5, 5, 6, 5, opts);
    expect(s1.openedDoors).toEqual([]);
  });

  it("attraversare con cambio valo sulla coppia gestita la apre", () => {
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 6, 6, opts);
    expect(s1.openedDoors).toEqual(["6,5"]);
  });

  it("coppia gestita ma stesso valo non apre", () => {
    const sameValo = visMap([
      [6, 5, 2],
      [6, 6, 2],
    ]);
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 6, 6, { visibilityMap: sameValo });
    expect(s1.openedDoors).toEqual([]);
  });

  it("senza visibilityMap non apre", () => {
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 6, 6);
    expect(s1.openedDoors).toEqual([]);
  });

  it("flusso: arrivo sulla porta (chiusa) → attraversa valo (aperta)", () => {
    let s = { currentMap: { porte }, openedDoors: [] };
    s = mergeOpenedDoorsAfterStep(s, 5, 5, 6, 5, opts);
    expect(s.openedDoors).toEqual([]);
    s = mergeOpenedDoorsAfterStep(s, 6, 5, 6, 6, opts);
    expect(s.openedDoors).toEqual(["6,5"]);
  });

  it("ri-passare su porta già aperta non duplica", () => {
    const s0 = { currentMap: { porte }, openedDoors: ["6,5"] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 5, 6, 6, opts);
    expect(s1.openedDoors).toEqual(["6,5"]);
  });

  it("returns the same session reference if nothing to add", () => {
    const s = { currentMap: { porte: [] }, openedDoors: [] };
    expect(mergeOpenedDoorsAfterStep(s, 1, 1, 1, 2, opts)).toBe(s);
  });

  it("salto multi-cella senza path non apre la porta intermedia", () => {
    const visibility = visMap([
      [4, 2, "A"],
      [5, 2, "A"],
      [6, 2, "B"],
    ]);
    const porte = [{ x: 5, y: 2, oriz: false }];
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const s1 = mergeOpenedDoorsAfterStep(s0, 4, 2, 6, 2, { visibilityMap: visibility });
    expect(s1.openedDoors).toEqual([]);
  });

  it("mergeOpenedDoorsAlongPath apre attraversando la porta nel percorso", () => {
    const visibility = visMap([
      [4, 2, "A"],
      [5, 2, "A"],
      [6, 2, "B"],
    ]);
    const porte = [{ x: 5, y: 2, oriz: false }];
    const s0 = { currentMap: { porte }, openedDoors: [] };
    const path = [
      { x: 4, y: 2 },
      { x: 5, y: 2 },
      { x: 6, y: 2 },
    ];
    const s1 = mergeOpenedDoorsAlongPath(s0, path, { visibilityMap: visibility });
    expect(s1.openedDoors).toEqual(["5,2"]);
  });

  it("stesso comportamento per passo mostro (solo openedDoors, nessun side-effect nebbia)", () => {
    const s0 = {
      currentMap: { porte },
      openedDoors: [],
      monsters: [{ id: 1, x: 6, y: 6, currentBody: 1 }],
    };
    const s1 = mergeOpenedDoorsAfterStep(s0, 6, 6, 6, 5, opts);
    expect(s1.openedDoors).toEqual(["6,5"]);
    expect(s1.monsters[0].x).toBe(6);
    expect(s1.monsters[0].y).toBe(6);
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
