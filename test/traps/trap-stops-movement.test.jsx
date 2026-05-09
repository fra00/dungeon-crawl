/**
 * Regressione: dopo aver fatto scattare una trappola in movimento, l'eroe
 * deve perdere il resto del movimento residuo (regola HQ: "you lose the rest
 * of your move"). Verifichiamo che `movementPoints` venga riportato a 0
 * quando si calpesta una trappola.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";

function buildConfig(overrides = {}) {
  const hero = {
    heroId: "h1",
    turnOrder: 1,
    currentBody: 5,
    isEscaped: false,
    activeStatus: [],
    x: 5,
    y: 5,
    bonusMovementDiceNextRoll: 0,
    hero: { classe: "Mago" },
  };
  const trapCell = {
    x: 5,
    y: 6,
    arnt: { antroc: false, inv: false },
    trpl: { tipo: 2, rccadex: 0, rccadey: 0 },
  };
  const gameSession = {
    currentTurn: 1,
    heroes: [hero],
    monsters: [],
    openedDoors: [],
    currentMap: {
      header: {},
      grid: [
        { x: 5, y: 5, arnt: { antroc: false, inv: false } },
        trapCell,
      ],
      porte: [],
      scripts: [],
    },
    ...overrides,
  };

  const visibilityMap = { data: [{ x: 5, y: 5, valo: "1", fog: false }, { x: 5, y: 6, valo: "1", fog: false }] };

  const trapsLogic = {
    checkTrapActivation: vi.fn(() => true),
    registerTriggeredTrap: vi.fn(),
    isTrapVisible: vi.fn(() => false),
  };
  const heroStatsLogic = {
    calculateStats: vi.fn(() => ({ movimento: 1, canAttackDiagonal: false, canAttackRanged: false })),
    calculateAttackDice: vi.fn(() => 2),
    canAttackTwice: vi.fn(() => false),
    getConsumableWeaponId: vi.fn(() => null),
  };
  const hooksPathfinding = {
    calculatePath: vi.fn(() => [{ x: 5, y: 6 }]),
  };
  const combatLogic = { resolveCombat: vi.fn(() => ({ damageDealt: 1 })) };
  const mapInteractionLogic = {
    isFrontOfDoor: vi.fn(() => null),
    openPassage: vi.fn(),
  };
  const visibilityCalc = { hasLineOfSight: vi.fn(() => true) };
  const sessionManager = {
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
  };

  return {
    gameSession,
    visibilityMap,
    onNotify: vi.fn(),
    trapsLogic,
    heroStatsLogic,
    hooksPathfinding,
    combatLogic,
    mapInteractionLogic,
    visibilityCalc,
    sessionManager,
  };
}

describe("Trappola in movimento → l'eroe perde il resto del movimento", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 0.999 → Math.floor(0.999*6)+1 = 6 → un solo dado, 6 punti movimento.
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("azzerа movementPoints e setta HasMoved=true quando si calpesta una trappola", () => {
    const config = buildConfig();
    const { result } = renderHook((p) => useTurnLogic(p), { initialProps: config });

    act(() => {
      result.current.rollMovement();
    });
    expect(result.current.movementPoints).toBe(6);

    act(() => {
      result.current.handleBoardClick(5, 6);
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(config.sessionManager.resolveMovementTrap).toHaveBeenCalledWith(5, 6, 2, 0, 0);
    expect(config.trapsLogic.registerTriggeredTrap).toHaveBeenCalledWith(5, 6, 2);
    expect(config.onNotify).toHaveBeenCalledWith("Hai fatto scattare una trappola!");

    // Il fix: dopo la trappola non deve essere possibile continuare a muoversi.
    expect(result.current.movementPoints).toBe(0);
    expect(result.current.turnPhase.HasMoved).toBe(true);
  });

  it("non chiama moveCurrentHeroTo quando scatta la trappola (resolveMovementTrap già sposta+danneggia)", () => {
    const config = buildConfig();
    const { result } = renderHook((p) => useTurnLogic(p), { initialProps: config });

    act(() => {
      result.current.rollMovement();
    });
    act(() => {
      result.current.handleBoardClick(5, 6);
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(config.sessionManager.moveCurrentHeroTo).not.toHaveBeenCalled();
  });
});
