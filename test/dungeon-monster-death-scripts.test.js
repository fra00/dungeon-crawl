import { describe, it, expect } from "vitest";
import { applyMonsterDeathMissionScripts } from "../dungeon-monster-death-scripts.js";

describe("applyMonsterDeathMissionScripts", () => {
  it("esegue script morte per mostro con id catalogo 0 (Goblin)", () => {
    const session = {
      currentTurn: 1,
      heroes: [{ turnOrder: 1, x: 1, y: 1 }],
      triggeredScripts: [],
      scriptImages: [],
      currentMap: {
        scripts: [
          {
            x: 1,
            y: 1,
            evento: 2,
            idmosc: 0,
            morto: true,
            text: "possta 13,10\nmsg allarme goblin;",
          },
        ],
        grid: [],
      },
    };
    const killed = {
      id: 999,
      monster: { id: 0, nome: "Goblin" },
      x: 1,
      y: 1,
    };
    const r = applyMonsterDeathMissionScripts(session, killed, null);
    expect(r.handled).toBe(true);
    expect(r.notifications).toContain("allarme goblin");
    expect(r.revealPoints).toEqual([{ x: 13, y: 10 }]);
  });
});
