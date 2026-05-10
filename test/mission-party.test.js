import { describe, it, expect } from "vitest";
import {
  sliceHeroesForMissionMap,
  mergeMissionHeroesIntoCampaignRoster,
  heroUsesMissionSpellSelection,
  missionHeroesNeedSpellSelection,
  filterHeroesForSpellSelection,
} from "../mission-party.js";

describe("sliceHeroesForMissionMap", () => {
  const roster = [
    { heroId: 0, gold: 1 },
    { heroId: 1, gold: 2 },
    { heroId: 2, gold: 3 },
    { heroId: 3, gold: 4 },
  ];

  it("without eroi_start keeps full roster and no backup", () => {
    const r = sliceHeroesForMissionMap(roster, { eroi_start: [] });
    expect(r.heroes).toHaveLength(4);
    expect(r.preMissionHeroesBackup).toBeNull();
  });

  it("filters by spawn ids and sets backup when subset", () => {
    const r = sliceHeroesForMissionMap(roster, { eroi_start: [{ id: 2 }, { id: 0 }] });
    expect(r.heroes.map((h) => h.heroId).sort()).toEqual([0, 2]);
    expect(r.preMissionHeroesBackup).toHaveLength(4);
  });

  it("full four spawns = no backup", () => {
    const r = sliceHeroesForMissionMap(roster, {
      eroi_start: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
    });
    expect(r.heroes).toHaveLength(4);
    expect(r.preMissionHeroesBackup).toBeNull();
  });
});

describe("heroUsesMissionSpellSelection / missionHeroesNeedSpellSelection", () => {
  it("only Mago ed Elfo", () => {
    expect(heroUsesMissionSpellSelection({ hero: { classe: "Mago" } })).toBe(true);
    expect(heroUsesMissionSpellSelection({ hero: { classe: "elfo" } })).toBe(true);
    expect(heroUsesMissionSpellSelection({ hero: { classe: "Barbaro" } })).toBe(false);
    expect(missionHeroesNeedSpellSelection([{ hero: { classe: "Nano" } }])).toBe(false);
    expect(
      missionHeroesNeedSpellSelection([
        { hero: { classe: "Nano" } },
        { hero: { classe: "Mago" } },
      ])
    ).toBe(true);
  });

  it("filterHeroesForSpellSelection keeps only magic classes", () => {
    const out = filterHeroesForSpellSelection([
      { heroId: 0, hero: { classe: "Barbaro" } },
      { heroId: 2, hero: { classe: "Mago" } },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].heroId).toBe(2);
  });
});

describe("mergeMissionHeroesIntoCampaignRoster", () => {
  it("merges mission state into full roster by heroId", () => {
    const backup = [
      { heroId: 0, gold: 10, hero: { classe: "A" } },
      { heroId: 1, gold: 20, hero: { classe: "B" } },
    ];
    const mission = [{ heroId: 0, gold: 99, inventory: [1] }];
    const out = mergeMissionHeroesIntoCampaignRoster(backup, mission);
    expect(out).toHaveLength(2);
    expect(out[0].gold).toBe(99);
    expect(out[0].inventory).toEqual([1]);
    expect(out[0].hero.classe).toBe("A");
    expect(out[1].gold).toBe(20);
  });
});
