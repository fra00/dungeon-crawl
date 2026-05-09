/**
 * Regression: clic su una cella raggiungibile come "passaggio" ma non come
 * "destinazione finale" (perché occupata da un alleato, da un mostro, o da
 * arredo) deve produrre una notifica utente — altrimenti l'utente vede un
 * silenzio di tomba e non capisce perché l'eroe non si muove.
 *
 * Questo era il sintomo riportato:
 *   "se mi trovo sopra una porta e premo nella cella di destinazione +1
 *   non si sposta, se premo una cella diversa (con una distanza diversa)
 *   da quella di destinazione sempre nella stessa stanza, l'eroe attraversa
 *   la porta."
 * → la cella +1 era occupata da un alleato. Senza notifica, sembrava un
 *   bug delle porte; in realtà era un blocco di destinazione (regola HQ).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";

function buildConfig({ otherHeroAt = null, monsterAt = null, target = { x: 5, y: 11 }, calcPath = [] } = {}) {
  const heroes = [
    {
      heroId: "h1", turnOrder: 1, x: 5, y: 10, currentBody: 5,
      isEscaped: false, activeStatus: [], hero: { classe: "Mago" },
    },
  ];
  if (otherHeroAt) {
    heroes.push({
      heroId: "h2", turnOrder: 2, x: otherHeroAt.x, y: otherHeroAt.y,
      currentBody: 5, isEscaped: false, activeStatus: [], hero: { classe: "Nano" },
    });
  }
  const monsters = monsterAt
    ? [{ id: "m1", x: monsterAt.x, y: monsterAt.y, currentBody: 3 }]
    : [];
  const grid = [
    { x: 5, y: 9, arnt: { antroc: false, inv: false } },
    { x: 5, y: 10, arnt: { antroc: false, inv: false } },
    { x: 5, y: 11, arnt: { antroc: false, inv: false } },
    { x: 5, y: 12, arnt: { antroc: false, inv: false } },
    { x: 6, y: 11, arnt: { antroc: true, inv: false } }, // muro
  ];
  const gameSession = {
    currentTurn: 1,
    heroes,
    monsters,
    openedDoors: [],
    currentMap: {
      header: {},
      grid,
      porte: [{ x: 5, y: 10, oriz: true }],
      scripts: [],
    },
  };
  const visibilityMap = {
    data: [
      { x: 5, y: 9, valo: "A", fog: false },
      { x: 5, y: 10, valo: "C", fog: false },
      { x: 5, y: 11, valo: "B", fog: false },
      { x: 5, y: 12, valo: "B", fog: false },
    ],
  };

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
    hooksPathfinding: {
      // Per simulare il fail di pathfinding ritorniamo array vuoto;
      // il test passa anche `target` per facilitare la validazione.
      calculatePath: vi.fn(() => calcPath),
    },
    combatLogic: { resolveCombat: vi.fn(() => ({ damageDealt: 1 })) },
    mapInteractionLogic: {
      isFrontOfDoor: vi.fn(() => null),
      openPassage: vi.fn(),
    },
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
    target,
  };
}

describe("UX: notifica quando il click di destinazione fallisce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("alleato sulla cella di destinazione: notifica esplicita", () => {
    const config = buildConfig({
      otherHeroAt: { x: 5, y: 11 },
      target: { x: 5, y: 11 },
      calcPath: [],
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 11));

    expect(config.onNotify).toHaveBeenCalledWith(
      "Non puoi terminare il movimento sulla cella di un alleato."
    );
    // E nessun movimento avviato
    expect(config.sessionManager.moveCurrentHeroTo).not.toHaveBeenCalled();
  });

  it("mostro sulla cella di destinazione: notifica diversa", () => {
    const config = buildConfig({
      monsterAt: { x: 5, y: 11 },
      target: { x: 5, y: 11 },
      calcPath: [],
    });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 11));

    expect(config.onNotify).toHaveBeenCalledWith(
      "La cella è occupata da un mostro."
    );
  });

  it("muro (antroc=true): notifica 'cella muro'", () => {
    const config = buildConfig({ target: { x: 6, y: 11 }, calcPath: [] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(6, 11));

    expect(config.onNotify).toHaveBeenCalledWith(
      "Quella è una cella muro: non è raggiungibile."
    );
  });

  it("cella fuori mappa: notifica 'fuori mappa'", () => {
    const config = buildConfig({ target: { x: 99, y: 99 }, calcPath: [] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(99, 99));

    expect(config.onNotify).toHaveBeenCalledWith("Cella fuori dalla mappa.");
  });

  it("nessun ostacolo specifico ma path non trovato: messaggio generico", () => {
    const config = buildConfig({ target: { x: 5, y: 12 }, calcPath: [] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 12));

    expect(config.onNotify).toHaveBeenCalledWith(
      "Nessun percorso valido fino a quella cella con i punti movimento attuali."
    );
  });

  it("click sulla propria cella: nessuna notifica spuria", () => {
    const config = buildConfig({ target: { x: 5, y: 10 }, calcPath: [] });
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(5, 10));

    expect(config.onNotify).not.toHaveBeenCalled();
  });
});
