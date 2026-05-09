/**
 * Regression: il pulsante "Apri Porta" deve apparire ogni volta che l'eroe
 * attivo è sulla cella di una porta NON ancora aperta (o su un suo vicino).
 *
 * Il bug riportato dall'utente:
 *   "se mi trovo sopra le coordinate di una porta, non appare il pulsante
 *    apri porta".
 *
 * La causa più frequente era che le chiamate sparse a `setCanOpenDoor` lungo
 * `useTurnLogic` usano `gameSession` in chiusura stale (computato prima del
 * commit della nuova posizione), così quando l'eroe arrivava sulla porta il
 * valore restava `null`. Adesso un useEffect "watchdog" ricomputa il valore
 * a ogni cambio di posizione/openedDoors usando lo state aggiornato.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";

function buildConfig({ heroAt = { x: 5, y: 10 }, openedDoors = [] } = {}) {
  const gameSession = {
    currentTurn: 1,
    heroes: [
      {
        heroId: "h1", turnOrder: 1, x: heroAt.x, y: heroAt.y, currentBody: 5,
        isEscaped: false, activeStatus: [], hero: { classe: "Mago" },
      },
    ],
    monsters: [],
    openedDoors,
    currentMap: {
      header: {},
      grid: [
        { x: 5, y: 9, arnt: { antroc: false, inv: false } },
        { x: 5, y: 10, arnt: { antroc: false, inv: false } },
        { x: 5, y: 11, arnt: { antroc: false, inv: false } },
      ],
      porte: [{ x: 5, y: 10, oriz: true }],
      scripts: [],
    },
  };
  const visibilityMap = { data: [] };

  // Mock realistico di `isFrontOfDoor`: ritorna result quando l'eroe attivo è
  // sulla porta o su un vicino, e la porta non è in openedDoors.
  const isFrontOfDoor = vi.fn(() => {
    const hero = gameSession.heroes.find(h => h.turnOrder === gameSession.currentTurn);
    if (!hero) return null;
    const door = gameSession.currentMap.porte[0];
    const opened = (gameSession.openedDoors || []).includes(`${door.x},${door.y}`);
    if (opened) return null;
    if (hero.x === door.x && hero.y === door.y) {
      return { found: true, destination: { x: door.x, y: door.y - 1 }, passageCell: { x: door.x, y: door.y } };
    }
    if (hero.x === door.x && Math.abs(hero.y - door.y) === 1) {
      return { found: true, destination: { x: door.x, y: door.y }, passageCell: { x: door.x, y: door.y } };
    }
    return null;
  });

  return {
    gameSession,
    visibilityMap,
    onNotify: vi.fn(),
    trapsLogic: {
      checkTrapActivation: vi.fn(() => false),
      registerTriggeredTrap: vi.fn(),
      isTrapVisible: vi.fn(() => false),
    },
    heroStatsLogic: {
      calculateStats: vi.fn(() => ({ movimento: 2, canAttackDiagonal: false, canAttackRanged: false })),
      calculateAttackDice: vi.fn(() => 2),
      canAttackTwice: vi.fn(() => false),
      getConsumableWeaponId: vi.fn(() => null),
    },
    hooksPathfinding: { calculatePath: vi.fn(() => []) },
    combatLogic: { resolveCombat: vi.fn() },
    mapInteractionLogic: { isFrontOfDoor, openPassage: vi.fn() },
    visibilityCalc: { hasLineOfSight: vi.fn(() => true) },
    sessionManager: {
      advanceTurn: vi.fn(),
      clearCurrentHeroStatus: vi.fn(),
      clearHeroStatusEverywhere: vi.fn(),
      clearBonusMovementDiceForHero: vi.fn(),
      moveCurrentHeroTo: vi.fn(),
      executeMissionScripts: vi.fn(() => null),
      resolveHeroAttack: vi.fn(),
      markCurrentHeroEscaped: vi.fn(),
      resolveMovementTrap: vi.fn(),
      resolveTrapEffectOnCurrentHero: vi.fn(),
    },
  };
}

describe("canOpenDoor watchdog", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("eroe sulla porta NON aperta → canOpenDoor.found === true", () => {
    const config = buildConfig({ heroAt: { x: 5, y: 10 }, openedDoors: [] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });
    expect(result.current.canOpenDoor).toBeTruthy();
    expect(result.current.canOpenDoor.found).toBe(true);
    expect(result.current.canOpenDoor.passageCell).toEqual({ x: 5, y: 10 });
  });

  it("porta già aperta → canOpenDoor === null", () => {
    const config = buildConfig({ heroAt: { x: 5, y: 10 }, openedDoors: ["5,10"] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });
    expect(result.current.canOpenDoor).toBeNull();
  });

  it("eroe lontano → canOpenDoor === null", () => {
    const config = buildConfig({ heroAt: { x: 1, y: 1 } });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });
    expect(result.current.canOpenDoor).toBeNull();
  });

  it("re-render con nuova posizione su porta → canOpenDoor si aggiorna automaticamente", () => {
    // Simula il ciclo "muovi → arrivi sulla porta → state aggiornato".
    const initial = buildConfig({ heroAt: { x: 1, y: 1 } });
    const { result, rerender } = renderHook(p => useTurnLogic(p), { initialProps: initial });
    expect(result.current.canOpenDoor).toBeNull();

    // Crea una nuova config con eroe ora sulla porta (clone della session).
    const moved = buildConfig({ heroAt: { x: 5, y: 10 } });
    rerender(moved);
    expect(result.current.canOpenDoor).toBeTruthy();
    expect(result.current.canOpenDoor.found).toBe(true);
  });

  it("apertura della porta (openedDoors aggiornati) → canOpenDoor diventa null", () => {
    const initial = buildConfig({ heroAt: { x: 5, y: 10 }, openedDoors: [] });
    const { result, rerender } = renderHook(p => useTurnLogic(p), { initialProps: initial });
    expect(result.current.canOpenDoor).toBeTruthy();

    const opened = buildConfig({ heroAt: { x: 5, y: 10 }, openedDoors: ["5,10"] });
    rerender(opened);
    expect(result.current.canOpenDoor).toBeNull();
  });
});
