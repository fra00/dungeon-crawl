import { describe, it, expect } from "vitest";
import { truncateHeroPathForMonsterObstacles } from "../dungeon-hero-path-monsters.js";

describe("truncateHeroPathForMonsterObstacles", () => {
  const session = {
    monsters: [
      { id: "m1", x: 5, y: 6, currentBody: 2 },
    ],
  };

  it("tronca prima della cella con mostro", () => {
    const path = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
    ];
    const out = truncateHeroPathForMonsterObstacles(session, path, "h1");
    expect(out).toEqual([{ x: 5, y: 5 }]);
  });

  it("lascia il percorso invariato se non ci sono mostri sulle destinazioni", () => {
    const path = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];
    const out = truncateHeroPathForMonsterObstacles(session, path, "h1");
    expect(out).toEqual(path);
  });

  it("ignora mostri a 0 corpo", () => {
    const s2 = {
      monsters: [{ id: "m1", x: 5, y: 6, currentBody: 0 }],
    };
    const path = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
    ];
    expect(truncateHeroPathForMonsterObstacles(s2, path, "h1")).toEqual(path);
  });
});
