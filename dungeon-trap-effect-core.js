/**
 * Pure trap damage/effects for the active hero (disarm fail or similar), without moving the hero.
 */

export function applyTrapEffectOnCurrentHeroSession(providedSession, trapType, rockFallX, rockFallY) {
  if (providedSession?.currentMap == null) return providedSession;

  const hero = providedSession.heroes.find((h) => h.turnOrder === providedSession.currentTurn);
  if (hero == null) return providedSession;

  const updatedHero = { ...hero };
  updatedHero.currentBody -= 1;

  if (updatedHero.activeStatus?.includes("RockSkin")) {
    updatedHero.activeStatus = updatedHero.activeStatus.filter((s) => s !== "RockSkin");
  }

  const updatedHeroes = providedSession.heroes.map((h) =>
    h.turnOrder === providedSession.currentTurn ? updatedHero : h
  );

  const updatedMap = { ...providedSession.currentMap };
  let updatedGrid = [...providedSession.currentMap.grid];

  if (trapType === 3 && rockFallX != null && rockFallY != null) {
    updatedGrid = updatedGrid.map((c) => {
      if (c.x === rockFallX && c.y === rockFallY) {
        return {
          ...c,
          arnt: { ...c.arnt, antroc: true },
        };
      }
      return c;
    });
  }

  updatedMap.grid = updatedGrid;

  return {
    ...providedSession,
    heroes: updatedHeroes,
    currentMap: updatedMap,
  };
}
