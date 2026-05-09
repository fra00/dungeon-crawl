import { describe, it, expect } from "vitest";
import { applyTrapEffectOnCurrentHeroSession } from "../../dungeon-trap-effect-core.js";

/**
 * Simulates: disinnesco trappola fallito → stesso effetto meccanico dello scatto trappola,
 * ma l'eroe non viene spostato sulla casella trappola (solo danni / tipo 3 roccia).
 */
describe("applyTrapEffectOnCurrentHeroSession (disarm fail / trigger effetto senza movimento)", () => {
  function baseSession(overrides = {}) {
    return {
      currentTurn: 1,
      heroes: [
        {
          heroId: "h1",
          turnOrder: 1,
          x: 4,
          y: 5,
          currentBody: 8,
          activeStatus: [],
          hero: { classe: "Nano" },
        },
      ],
      currentMap: {
        grid: [
          { x: 5, y: 5, arnt: { antroc: false } },
          { x: 10, y: 10, arnt: { antroc: false } },
        ],
      },
      ...overrides,
    };
  }

  it("riduce di 1 il corpo dell'eroe attivo senza cambiare posizione", () => {
    const before = baseSession();
    const after = applyTrapEffectOnCurrentHeroSession(before, 1, null, null);
    const hero = after.heroes.find((h) => h.turnOrder === 1);
    expect(hero.currentBody).toBe(7);
    expect(hero.x).toBe(4);
    expect(hero.y).toBe(5);
  });

  it("rimuove RockSkin se presente", () => {
    const before = baseSession({
      heroes: [
        {
          heroId: "h1",
          turnOrder: 1,
          x: 4,
          y: 5,
          currentBody: 8,
          activeStatus: ["RockSkin"],
          hero: { classe: "Nano" },
        },
      ],
    });
    const after = applyTrapEffectOnCurrentHeroSession(before, 2, null, null);
    const hero = after.heroes.find((h) => h.turnOrder === 1);
    expect(hero.activeStatus).not.toContain("RockSkin");
    expect(hero.currentBody).toBe(7);
  });

  it("per trappola tipo 3 marca antroc sulla cella indicata da rccadex/rccadey", () => {
    const before = baseSession();
    const after = applyTrapEffectOnCurrentHeroSession(before, 3, 5, 5);
    const cell = after.currentMap.grid.find((c) => c.x === 5 && c.y === 5);
    expect(cell.arnt.antroc).toBe(true);
    expect(after.heroes.find((h) => h.turnOrder === 1).currentBody).toBe(7);
  });
});
