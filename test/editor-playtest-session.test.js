import { describe, it, expect } from "vitest";
import {
  mergeCampaignRosterWithCatalog,
  buildDefaultHeroParty,
} from "../editor/editor-playtest-session.js";

describe("mergeCampaignRosterWithCatalog", () => {
  const staticHeroes = [
    { id: 0, classe: "Barbaro", corpo: 8, mente: 2 },
    { id: 2, classe: "Mago", corpo: 4, mente: 6 },
  ];
  const equipment = [];

  it("completa gli id mancanti dal salvataggio con lo stato di default", () => {
    const savedOnlyBarbaro = [
      {
        heroId: 0,
        hero: staticHeroes[0],
        gold: 99,
        currentBody: 5,
        currentMind: 2,
        inventory: [1],
        equipment: [],
        equipped: [],
        availableSpells: [],
        activeStatus: [],
        isEscaped: false,
        x: 1,
        y: 1,
        turnOrder: 0,
      },
    ];
    const merged = mergeCampaignRosterWithCatalog(savedOnlyBarbaro, staticHeroes, equipment);
    expect(merged).toHaveLength(2);
    expect(merged[0].gold).toBe(99);
    expect(merged[1].heroId).toBe(2);
    expect(merged[1].hero.classe).toBe("Mago");
    expect(merged[1].gold).toBe(0);
  });

  it("equivalente a default se salvataggio vuoto", () => {
    const d = buildDefaultHeroParty(staticHeroes, equipment);
    const m = mergeCampaignRosterWithCatalog([], staticHeroes, equipment);
    expect(m.map((h) => h.heroId)).toEqual(d.map((h) => h.heroId));
    expect(m[0].gold).toBe(d[0].gold);
  });
});
