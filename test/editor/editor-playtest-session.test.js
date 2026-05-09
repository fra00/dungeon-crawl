import { describe, it, expect, beforeEach } from "vitest";
import {
  buildDefaultHeroParty,
  buildEditorPlaytestSessionUpdate,
  stashEditorMapForPlaytest,
  takeStashedEditorMapForEditor,
  setEditorPlaytestActive,
  isEditorPlaytestActive,
} from "../../editor/editor-playtest-session.js";
import { createEmptyMapState } from "../../editor-map-model.js";

describe("editor-playtest-session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("buildDefaultHeroParty matches hero count", () => {
    const heroes = [
      { id: 1, classe: "Nano", corpo: 5, mente: 3 },
      { id: 2, classe: "Mago", corpo: 2, mente: 6 },
    ];
    const equipment = [{ id: 2, nome: "Ascia" }, { id: 4, nome: "Bastone" }];
    const party = buildDefaultHeroParty(heroes, equipment);
    expect(party).toHaveLength(2);
    expect(party[0].heroId).toBe(1);
    expect(party[0].equipment).toContain(2);
    expect(party[1].equipment).toContain(4);
  });

  it("buildEditorPlaytestSessionUpdate sets currentMap and resets combat state", () => {
    const mapState = createEmptyMapState();
    mapState.header.descrizione = "Test playtest";
    const heroes = [{ heroId: 1, currentBody: 3, x: 0, y: 0 }];
    const next = buildEditorPlaytestSessionUpdate({ foo: 1 }, { mapState, campaignName: "C", heroes });
    expect(next.currentMap.header.descrizione).toBe("Test playtest");
    expect(next.campaignName).toBe("C");
    expect(next.heroes).toEqual(heroes);
    expect(next.monsters).toEqual([]);
    expect(next.openedDoors).toEqual([]);
    expect(next.foo).toBe(1);
  });

  it("stash and take restore map via normalize", () => {
    const mapState = createEmptyMapState();
    mapState.header.descrizione = "Stash";
    stashEditorMapForPlaytest(mapState);
    const restored = takeStashedEditorMapForEditor();
    expect(restored.header.descrizione).toBe("Stash");
    expect(sessionStorage.getItem("dg_editor_playtest_map")).toBeNull();
  });

  it("playtest active flag toggles", () => {
    expect(isEditorPlaytestActive()).toBe(false);
    setEditorPlaytestActive(true);
    expect(isEditorPlaytestActive()).toBe(true);
    setEditorPlaytestActive(false);
    expect(isEditorPlaytestActive()).toBe(false);
  });
});
