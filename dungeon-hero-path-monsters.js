/**
 * Percorso movimento eroe: [{x,y} start, ...steps] in coordinate 1-based (come pathfinding).
 * Tronca prima di una cella occupata da un mostro vivo (es. mostro comparso dopo nebbia).
 */

export function truncateHeroPathForMonsterObstacles(gameSession, pathWithStart, heroId) {
  if (!Array.isArray(pathWithStart) || pathWithStart.length < 2) {
    return pathWithStart;
  }
  const monsters = gameSession?.monsters || [];
  const hasLivingMonsterAt = (x, y) =>
    monsters.some(
      (m) =>
        Number(m.x) === Number(x) &&
        Number(m.y) === Number(y) &&
        (m.currentBody || 0) > 0
    );

  for (let i = 1; i < pathWithStart.length; i++) {
    const step = pathWithStart[i];
    if (hasLivingMonsterAt(step.x, step.y)) {
      return pathWithStart.slice(0, i);
    }
  }
  return pathWithStart;
}
