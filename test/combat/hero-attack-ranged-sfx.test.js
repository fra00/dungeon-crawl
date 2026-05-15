import { describe, it, expect } from "vitest";
import { isHeroAttackRanged } from "../../dungeon-use-turn-logic.js";

describe("isHeroAttackRanged (SFX corpo a corpo vs lancio)", () => {
  it("adiacente ortogonale (dist 1) → corpo a corpo", () => {
    expect(isHeroAttackRanged(1, 1, 0, false)).toBe(false);
    expect(isHeroAttackRanged(1, 0, 1, false)).toBe(false);
  });

  it("diagonale con bastone (diago) → corpo a corpo, non tiro", () => {
    expect(isHeroAttackRanged(2, 1, 1, true)).toBe(false);
  });

  it("diagonale senza diago → arma da lancio / tiro", () => {
    expect(isHeroAttackRanged(2, 1, 1, false)).toBe(true);
  });

  it("distanza > 1 con canAttackRanged implicito → tiro", () => {
    expect(isHeroAttackRanged(3, 2, 1, false)).toBe(true);
    expect(isHeroAttackRanged(4, 2, 2, true)).toBe(true);
  });
});
