/**
 * Integration test: `useTurnLogic` ↔ `executeMissionScripts`.
 *
 * Verifica che gli script vengano triggerati correttamente dai vari
 * eventi del turno (movimento, attacco, cambio stanza) e che gli effects
 * runtime arrivino al consumer:
 *   - eventType 1 (passaggio per cella): script match su newPosition (cella di arrivo)
 *   - eventType 2 pre-attacco: script con `noatt` blocca l'attacco
 *   - eventType 8 (cambio stanza): chiamato solo quando valo cambia
 *   - effects.movementDelta / stopMovement / forceFinishTurn applicati
 *
 * Bug storici coperti da questi test:
 *   1) `scriptRes?.attackBlocked` veniva letto al top-level invece che da
 *      `scriptRes.effects.attackBlocked`, quindi `noatt`/`noattarma` non
 *      bloccavano mai un attacco.
 *   2) `finalRes.movementDelta/stopMovement/forceFinishTurn` letti al top
 *      level invece che da `finalRes.effects.*`, quindi `pospsg`/`fineturno`
 *      negli script di movimento non avevano alcun effetto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";

function buildConfig({
  heroAt = { x: 5, y: 5 },
  monsterAt = null,
  visMapEntries = [
    [5, 5, "1"],
    [5, 6, "1"],
    [6, 5, "1"],
  ],
  movementSteps = 3,
  // Mocks customizzabili per executeMissionScripts.
  executeMissionScriptsImpl = () => ({ handled: false }),
} = {}) {
  const hero = {
    heroId: "h1", turnOrder: 1, x: heroAt.x, y: heroAt.y, currentBody: 5,
    isEscaped: false, activeStatus: [], hero: { classe: "Mago" },
    bonusMeleeAttackQuota: 0,
  };
  const monsters = monsterAt
    ? [{ id: "m1", x: monsterAt.x, y: monsterAt.y, currentBody: 3, monster: { id: 7, nome: "Goblin", difesa: 1 } }]
    : [];
  const grid = [
    { x: 5, y: 5, arnt: { antroc: false, inv: false } },
    { x: 5, y: 6, arnt: { antroc: false, inv: false } },
    { x: 6, y: 5, arnt: { antroc: false, inv: false } },
    { x: 7, y: 5, arnt: { antroc: false, inv: false } },
  ];
  const gameSession = {
    currentTurn: 1,
    heroes: [hero],
    monsters,
    openedDoors: [],
    currentMap: { header: {}, grid, porte: [], scripts: [] },
  };
  const visibilityMap = { data: visMapEntries.map(([x, y, valo]) => ({ x, y, valo, fog: false })) };

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
      calculateStats: vi.fn(() => ({ movimento: 1, canAttackDiagonal: false, canAttackRanged: false })),
      calculateAttackDice: vi.fn(() => 2),
      canAttackTwice: vi.fn(() => false),
      getConsumableWeaponId: vi.fn(() => null),
    },
    hooksPathfinding: {
      // ritorna i passi target → (target.x, target.y)
      calculatePath: vi.fn((sx, sy, tx, ty) => {
        const steps = [];
        let cx = sx, cy = sy;
        while ((cx !== tx || cy !== ty) && steps.length < movementSteps) {
          if (cx !== tx) cx += cx < tx ? 1 : -1;
          else if (cy !== ty) cy += cy < ty ? 1 : -1;
          steps.push({ x: cx, y: cy });
        }
        return steps;
      }),
    },
    combatLogic: { resolveCombat: vi.fn(() => ({ damageDealt: 1, attackDice: [], defenseDice: [] })) },
    mapInteractionLogic: { isFrontOfDoor: vi.fn(() => null), openPassage: vi.fn() },
    visibilityCalc: { hasLineOfSight: vi.fn(() => true) },
    sessionManager: {
      advanceTurn: vi.fn(),
      clearCurrentHeroStatus: vi.fn(),
      clearHeroStatusEverywhere: vi.fn(),
      clearBonusMovementDiceForHero: vi.fn(),
      clearBonusMeleeAttackQuotaForHero: vi.fn(),
      moveCurrentHeroTo: vi.fn(),
      executeMissionScripts: vi.fn(executeMissionScriptsImpl),
      resolveHeroAttack: vi.fn(),
      markCurrentHeroEscaped: vi.fn(),
      resolveMovementTrap: vi.fn(),
      resolveTrapEffectOnCurrentHero: vi.fn(),
    },
  };
}

describe("useTurnLogic — integrazione con executeMissionScripts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999); // 6 PM
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("evento 1: chiamato per ogni step con previousPosition e newPosition nel context", () => {
    const calls = [];
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      executeMissionScriptsImpl: (opts) => {
        calls.push({ eventType: opts.eventType, context: opts.context });
        return { handled: false };
      },
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 6)); // un solo step (5,5)→(5,6)
    act(() => vi.advanceTimersByTime(350));

    const ev1 = calls.filter(c => c.eventType === 1);
    expect(ev1.length).toBeGreaterThanOrEqual(1);
    expect(ev1[0].context).toMatchObject({
      previousPosition: { x: 5, y: 5 },
      newPosition: { x: 5, y: 6 },
    });
  });

  it("evento 8 (cambio stanza): chiamato SOLO quando valo cambia, non quando rimane uguale", () => {
    const calls = [];
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      visMapEntries: [
        [5, 5, "1"], // valo 1
        [5, 6, "1"], // stesso valo
      ],
      executeMissionScriptsImpl: (opts) => {
        calls.push(opts.eventType);
        return { handled: false };
      },
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 6));
    act(() => vi.advanceTimersByTime(350));

    expect(calls).toContain(1); // evento movimento sì
    expect(calls).not.toContain(8); // nessun cambio stanza
  });

  it("evento 8: chiamato quando il valo cambia (1→2)", () => {
    const calls = [];
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      visMapEntries: [
        [5, 5, "1"],
        [5, 6, "2"],
      ],
      executeMissionScriptsImpl: (opts) => {
        calls.push({ ev: opts.eventType, ctx: opts.context });
        return { handled: false };
      },
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 6));
    act(() => vi.advanceTimersByTime(350));

    const ev8 = calls.find(c => c.ev === 8);
    expect(ev8).toBeTruthy();
    expect(ev8.ctx).toMatchObject({
      previousRoomId: "1",
      roomId: "2",
    });
  });

  it("script con effects.stopMovement → activePath svuotato e movement azzerato", () => {
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      visMapEntries: [[5, 5, "1"], [5, 6, "1"], [5, 7, "1"]],
      executeMissionScriptsImpl: (opts) => ({
        handled: opts.eventType === 1,
        session: opts.baseSession,
        effects: { stopMovement: true },
      }),
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 7));
    act(() => vi.advanceTimersByTime(350));

    expect(result.current.movementPoints).toBe(0);
    expect(result.current.isMoving).toBe(false);
  });

  it("script con effects.forceFinishTurn → forceTurnExhausted (HasMoved=true, mp=0)", () => {
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      visMapEntries: [[5, 5, "1"], [5, 6, "1"]],
      executeMissionScriptsImpl: (opts) => ({
        handled: opts.eventType === 1,
        session: opts.baseSession,
        effects: { forceFinishTurn: true, stopMovement: true },
      }),
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 6));
    act(() => vi.advanceTimersByTime(350));

    expect(result.current.movementPoints).toBe(0);
    expect(result.current.turnPhase.HasMoved).toBe(true);
    expect(result.current.turnPhase.HasPerformedAction).toBe(true);
  });

  it("script con effects.movementDelta=-1: i punti movimento si riducono di 1 oltre allo step", () => {
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      visMapEntries: [[5, 5, "1"], [5, 6, "1"]],
      executeMissionScriptsImpl: (opts) => ({
        handled: opts.eventType === 1,
        session: opts.baseSession,
        effects: { movementDelta: -1, stopMovement: false },
      }),
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    expect(result.current.movementPoints).toBe(6);

    act(() => result.current.handleBoardClick(5, 6));
    act(() => vi.advanceTimersByTime(350));

    // 6 - 1 (step) - 1 (movementDelta) = 4
    expect(result.current.movementPoints).toBe(4);
  });

  it("evento 2 con effects.attackBlocked → resolveCombat NON viene chiamato", () => {
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      monsterAt: { x: 5, y: 6 },
      executeMissionScriptsImpl: (opts) => {
        if (opts.eventType === 2) {
          return {
            handled: true,
            session: opts.baseSession,
            effects: { attackBlocked: true },
          };
        }
        return { handled: false };
      },
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.handleMonsterClick("m1"));

    expect(config.combatLogic.resolveCombat).not.toHaveBeenCalled();
    expect(config.sessionManager.resolveHeroAttack).not.toHaveBeenCalled();
  });

  it("evento 2 senza attackBlocked → l'attacco procede regolarmente", () => {
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      monsterAt: { x: 5, y: 6 },
      executeMissionScriptsImpl: () => ({ handled: false }),
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.handleMonsterClick("m1"));

    expect(config.combatLogic.resolveCombat).toHaveBeenCalledTimes(1);
    expect(config.sessionManager.resolveHeroAttack).toHaveBeenCalled();
  });

  it("evento 2 (uccisione mostro) chiamato con onDeath:true e monsterTypeId", () => {
    const calls = [];
    const config = buildConfig({
      heroAt: { x: 5, y: 5 },
      monsterAt: { x: 5, y: 6 },
      executeMissionScriptsImpl: (opts) => {
        calls.push({ ev: opts.eventType, ctx: opts.context });
        return { handled: false };
      },
    });
    // Mostro con currentBody=1, danno 1 → muore
    config.gameSession.monsters[0].currentBody = 1;

    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });
    act(() => result.current.handleMonsterClick("m1"));

    const onDeath = calls.find(c => c.ev === 2 && c.ctx?.onDeath === true);
    expect(onDeath).toBeTruthy();
    expect(onDeath.ctx).toMatchObject({ monsterTypeId: 7, onDeath: true });
  });
});
