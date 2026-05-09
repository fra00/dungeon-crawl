/**
 * Test END-TO-END: combina `useTurnLogic` + `useMapInteraction` REALI
 * con un sessionManager che usa il VERO `moveCurrentHeroInSession` e
 * `mergeOpenedDoorsAfterStep`. Verifica il flusso utente completo:
 *
 *   1. Eroe al lato neighbor (4,2). Click sulla porta (5,2).
 *   2. Movement loop avanza, hero arriva su (5,2).
 *   3. mergeOpenedDoorsAfterStep NON apre la porta (atTo).
 *   4. Watchdog ricalcola `canOpenDoor` con la session aggiornata
 *      → isFrontOfDoor reale ritorna {found:true, destination:(6,2)}.
 *   5. handleOpenDoor chiama `openPassage` → la porta entra in openedDoors.
 *   6. canOpenDoor torna null → il pulsante "Apri porta" sparisce.
 *
 * Questo test catturerebbe regressioni che sfuggono ai test parziali:
 * inconsistenze tra il commit di `moveCurrentHeroTo` e il watchdog,
 * stale closure di `mapInteractionLogic`, race con `executeMissionScripts`,
 * eventuale ri-aggiunta di `atTo` in mergeOpenedDoorsAfterStep, ecc.
 */
import React, { useState, useMemo } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";
import { useMapInteraction } from "../../dungeon-use-map-interaction.js";
import {
  moveCurrentHeroInSession,
} from "../../dungeon-script-runtime.js";
import {
  mergeOpenedDoorsAfterStep,
} from "../../dungeon-melee-doorway.js";

function makeInitialSession({ heroAt, doorAt }) {
  return {
    currentTurn: 1,
    heroes: [
      {
        heroId: "h1",
        turnOrder: 1,
        x: heroAt.x,
        y: heroAt.y,
        currentBody: 5,
        isEscaped: false,
        activeStatus: [],
        hero: { classe: "Mago" },
      },
    ],
    monsters: [],
    openedDoors: [],
    currentMap: {
      header: {},
      grid: [
        { x: 4, y: 2, arnt: { antroc: false, inv: false } },
        { x: 5, y: 2, arnt: { antroc: false, inv: false } },
        { x: 6, y: 2, arnt: { antroc: false, inv: false } },
      ],
      porte: [doorAt],
      scripts: [],
    },
    triggeredScripts: [],
    scriptImages: [],
  };
}

function makeVisibilityMap() {
  // (4,2) e (5,2) stanza A; (6,2) stanza B. La porta gata (5,2)↔(6,2).
  return {
    data: [
      { x: 4, y: 2, valo: "A", fog: false },
      { x: 5, y: 2, valo: "A", fog: false },
      { x: 6, y: 2, valo: "B", fog: false },
    ],
  };
}

// Tutti i prop di useTurnLogic devono essere ref-stabili tra render, altrimenti
// la pioggia di `useEffect`/`useCallback` con quelle deps refire all'infinito.
// In dungeon.jsx la stabilità deriva da useMemo/useCallback nei vari hook
// genitori; qui simuliamo lo stesso scenario con costanti ref-stabili.
const STABLE_FOUND_PASSAGES = [];
const STABLE_TRAPS_LOGIC = {
  checkTrapActivation: () => false,
  registerTriggeredTrap: () => {},
  isTrapVisible: () => false,
};
const STABLE_HERO_STATS_LOGIC = {
  calculateStats: () => ({ movimento: 2, canAttackDiagonal: false, canAttackRanged: false }),
  calculateAttackDice: () => 2,
  canAttackTwice: () => false,
  getConsumableWeaponId: () => null,
};
const STABLE_COMBAT_LOGIC = { resolveCombat: () => null };
const STABLE_VISIBILITY_CALC = { hasLineOfSight: () => true };
const STABLE_HOOKS_PATHFINDING = {
  calculatePath: (sx, sy, tx, ty) => {
    const dx = tx - sx;
    const dy = ty - sy;
    if (Math.abs(dx) + Math.abs(dy) === 1) return [{ x: tx, y: ty }];
    return [];
  },
};

/**
 * Hook composito che monta useTurnLogic + useMapInteraction reali con un
 * sessionManager basato sui REALI moveCurrentHeroInSession + mergeOpenedDoorsAfterStep.
 */
function useDoorTestRig(initialSession) {
  const [session, setSession] = useState(initialSession);
  const visibilityMap = useMemo(makeVisibilityMap, []);
  const onNotify = useMemo(() => () => {}, []);

  const sessionManager = useMemo(
    () => ({
      moveCurrentHeroTo: (nextX, nextY) => {
        setSession((prev) => {
          const hero = prev.heroes.find((h) => h.turnOrder === prev.currentTurn);
          let next = moveCurrentHeroInSession(prev, nextX, nextY);
          next = mergeOpenedDoorsAfterStep(next, hero.x, hero.y, nextX, nextY);
          return next;
        });
      },
      openPassage: (px, py) => {
        setSession((prev) => {
          const k = `${px},${py}`;
          if (prev.openedDoors?.includes(k)) return prev;
          return {
            ...prev,
            openedDoors: [...(prev.openedDoors || []), k],
          };
        });
        return true;
      },
      executeMissionScripts: () => null,
      advanceTurn: () => {},
      clearCurrentHeroStatus: () => {},
      clearHeroStatusEverywhere: () => {},
      clearBonusMovementDiceForHero: () => {},
      clearBonusMeleeAttackQuotaForHero: () => {},
      resolveHeroAttack: () => {},
      markCurrentHeroEscaped: () => {},
      resolveMovementTrap: () => {},
      resolveTrapEffectOnCurrentHero: () => {},
    }),
    []
  );

  const mapInteractionLogic = useMapInteraction({
    gameSession: session,
    foundPassages: STABLE_FOUND_PASSAGES,
    sessionManager,
  });

  const turnLogic = useTurnLogic({
    gameSession: session,
    visibilityMap,
    onNotify,
    trapsLogic: STABLE_TRAPS_LOGIC,
    heroStatsLogic: STABLE_HERO_STATS_LOGIC,
    hooksPathfinding: STABLE_HOOKS_PATHFINDING,
    combatLogic: STABLE_COMBAT_LOGIC,
    mapInteractionLogic,
    visibilityCalc: STABLE_VISIBILITY_CALC,
    sessionManager,
  });

  return { session, turnLogic };
}

describe("End-to-end: arrivo sulla porta → pulsante 'Apri porta' visibile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("eroe (4,2) clicca porta (5,2,oriz=false): dopo lo step canOpenDoor è truthy", () => {
    const initial = makeInitialSession({
      heroAt: { x: 4, y: 2 },
      doorAt: { x: 5, y: 2, oriz: false },
    });
    const { result } = renderHook(() => useDoorTestRig(initial));

    // Stato iniziale: eroe al lato (4,2). isFrontOfDoor con direzionale +1
    // restituisce null perché (4,2) è il lato -1, non gestito.
    act(() => result.current.turnLogic.rollMovement());
    expect(result.current.turnLogic.canOpenDoor).toBeNull();

    // Click sulla cella della porta (5,2) come destinazione del pathfinding.
    act(() => result.current.turnLogic.handleBoardClick(5, 2));

    // Avanza il setTimeout del movement loop (300ms per step).
    act(() => vi.advanceTimersByTime(350));

    // Verifica session: eroe a (5,2), porta NON in openedDoors.
    const hero = result.current.session.heroes.find((h) => h.turnOrder === 1);
    expect(hero.x).toBe(5);
    expect(hero.y).toBe(2);
    expect(result.current.session.openedDoors).toEqual([]);

    // Watchdog: canOpenDoor deve essere truthy con destinazione (6,2).
    expect(result.current.turnLogic.canOpenDoor).toBeTruthy();
    expect(result.current.turnLogic.canOpenDoor.found).toBe(true);
    expect(result.current.turnLogic.canOpenDoor.passageCell).toEqual({ x: 5, y: 2 });
    expect(result.current.turnLogic.canOpenDoor.destination).toEqual({ x: 6, y: 2 });
  });

  it("dopo aver cliccato 'Apri porta', canOpenDoor torna null (porta in openedDoors)", () => {
    const initial = makeInitialSession({
      heroAt: { x: 5, y: 2 },
      doorAt: { x: 5, y: 2, oriz: false },
    });
    const { result } = renderHook(() => useDoorTestRig(initial));

    // Stato iniziale: eroe sulla porta (mai entrata in openedDoors).
    expect(result.current.session.openedDoors).toEqual([]);
    expect(result.current.turnLogic.canOpenDoor).toBeTruthy();

    // Simula il click sul pulsante "Apri porta".
    act(() => result.current.turnLogic.handleOpenDoor());

    // La porta entra in openedDoors.
    expect(result.current.session.openedDoors).toEqual(["5,2"]);

    // Watchdog: canOpenDoor torna null.
    expect(result.current.turnLogic.canOpenDoor).toBeNull();
  });

  it("oriz=true: arrivo dal vicino +1 sulla porta → canOpenDoor visibile", () => {
    // Door (5,10,oriz=true). Vicino +1 = (5,11). Hero starts at (5,11).
    const initial = {
      currentTurn: 1,
      heroes: [
        {
          heroId: "h1", turnOrder: 1, x: 5, y: 11, currentBody: 5,
          isEscaped: false, activeStatus: [], hero: { classe: "Mago" },
        },
      ],
      monsters: [],
      openedDoors: [],
      currentMap: {
        header: {},
        grid: [
          { x: 5, y: 10, arnt: { antroc: false, inv: false } },
          { x: 5, y: 11, arnt: { antroc: false, inv: false } },
        ],
        porte: [{ x: 5, y: 10, oriz: true }],
        scripts: [],
      },
      triggeredScripts: [],
      scriptImages: [],
    };

    const { result } = renderHook(() => useDoorTestRig(initial));

    // Hero al neighbor (5,11): canOpenDoor truthy (può aprire andando alla door cell).
    expect(result.current.turnLogic.canOpenDoor).toBeTruthy();
    expect(result.current.turnLogic.canOpenDoor.destination).toEqual({ x: 5, y: 10 });

    // Click sulla porta (5,10).
    act(() => result.current.turnLogic.rollMovement());
    act(() => result.current.turnLogic.handleBoardClick(5, 10));
    act(() => vi.advanceTimersByTime(350));

    // Eroe ora sulla porta. Porta NON in openedDoors (atTo non apre).
    const hero = result.current.session.heroes.find((h) => h.turnOrder === 1);
    expect(hero.x).toBe(5);
    expect(hero.y).toBe(10);
    expect(result.current.session.openedDoors).toEqual([]);

    // canOpenDoor visibile, destinazione = vicino +1 (5,11).
    expect(result.current.turnLogic.canOpenDoor).toBeTruthy();
    expect(result.current.turnLogic.canOpenDoor.passageCell).toEqual({ x: 5, y: 10 });
    expect(result.current.turnLogic.canOpenDoor.destination).toEqual({ x: 5, y: 11 });
  });

  it("attraversamento completo (porta → vicino +1): la porta si apre alla partenza (atFrom)", () => {
    const initial = makeInitialSession({
      heroAt: { x: 5, y: 2 },
      doorAt: { x: 5, y: 2, oriz: false },
    });
    const { result } = renderHook(() => useDoorTestRig(initial));

    // Pre: eroe su porta, openedDoors vuoto, canOpenDoor truthy.
    expect(result.current.session.openedDoors).toEqual([]);
    expect(result.current.turnLogic.canOpenDoor).toBeTruthy();

    // L'eroe attraversa la porta cliccando (6,2).
    act(() => result.current.turnLogic.rollMovement());
    act(() => result.current.turnLogic.handleBoardClick(6, 2));
    act(() => vi.advanceTimersByTime(350));

    // Post: eroe a (6,2), porta APERTA (atFrom).
    const hero = result.current.session.heroes.find((h) => h.turnOrder === 1);
    expect(hero.x).toBe(6);
    expect(hero.y).toBe(2);
    expect(result.current.session.openedDoors).toEqual(["5,2"]);

    // canOpenDoor null (porta già aperta).
    expect(result.current.turnLogic.canOpenDoor).toBeNull();
  });
});
