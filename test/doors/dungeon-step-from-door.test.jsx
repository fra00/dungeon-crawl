/**
 * Riproduce il bug "eroe sulla cella di una porta clicca cella destinazione +1
 * direttamente: i PM scalano di 1 ma l'eroe NON si muove".
 *
 * Setup:
 *   - eroe attivo a (5, 10) — la cella della porta (oriz=true).
 *   - cliccando (5, 11), gated dalla porta, ci si aspetta:
 *       1. movementPoints decresce di 1 (da 5 a 4)
 *       2. sessionManager.moveCurrentHeroTo(5, 11, ...) viene chiamato
 *       3. activePath consumato fino a length<2 → isMoving torna false
 *
 * Quando il bug è presente, vediamo (1) ma NON (2) (movement loop interrotto)
 * oppure (2) chiamato ma con coordinate errate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTurnLogic } from "../../dungeon-use-turn-logic.js";
import { mergeOpenedDoorsAfterStep } from "../../dungeon-melee-doorway.js";

function buildConfig({
  heroAt = { x: 5, y: 10 },
  doorAt = { x: 5, y: 10, oriz: true },
  visMapEntries = [
    [5, 9, "C"],
    [5, 10, "A"],
    [5, 11, "B"],
    [5, 12, "B"],
  ],
  movementPoints = 5,
} = {}) {
  const grid = [
    { x: 5, y: 9, arnt: { antroc: false, inv: false } },
    { x: 5, y: 10, arnt: { antroc: false, inv: false } },
    { x: 5, y: 11, arnt: { antroc: false, inv: false } },
    { x: 5, y: 12, arnt: { antroc: false, inv: false } },
  ];
  const gameSession = {
    currentTurn: 1,
    heroes: [
      {
        heroId: "h1", turnOrder: 1, x: heroAt.x, y: heroAt.y, currentBody: 5,
        isEscaped: false, activeStatus: [], hero: { classe: "Mago" },
      },
    ],
    monsters: [],
    openedDoors: [], // porta non ancora aperta
    currentMap: {
      header: {},
      grid,
      porte: [doorAt],
      scripts: [],
    },
  };

  // Pathfinding "vero" semplificato: copia della logica BFS/walkable senza
  // tirare in ballo l'intero hook. Geometria direzionale +1 (vedi
  // .cursor/rules/doors.mdc): solo (door.y, door.y+1) è gestito.
  const calculatePath = vi.fn((startX, startY, targetX, targetY) => {
    if (startX === doorAt.x && startY === doorAt.y) {
      // Da porta a vicino +1 sull'asse di orientamento → 1 step.
      if (doorAt.oriz && targetX === doorAt.x && targetY === doorAt.y + 1) {
        return [{ x: targetX, y: targetY }];
      }
      // Caso "due celle oltre la porta": passa per la cella adiacente +1.
      if (doorAt.oriz && targetX === doorAt.x && targetY === doorAt.y + 2) {
        return [{ x: doorAt.x, y: doorAt.y + 1 }, { x: targetX, y: targetY }];
      }
    }
    return [];
  });

  return {
    gameSession,
    visibilityMap: { data: visMapEntries.map(([x, y, valo]) => ({ x, y, valo, fog: false })) },
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
    hooksPathfinding: { calculatePath },
    combatLogic: { resolveCombat: vi.fn() },
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
      clearBonusMeleeAttackQuotaForHero: vi.fn(),
      moveCurrentHeroTo: vi.fn(),
      executeMissionScripts: vi.fn(() => null),
      resolveHeroAttack: vi.fn(),
      markCurrentHeroEscaped: vi.fn(),
      resolveMovementTrap: vi.fn(),
      resolveTrapEffectOnCurrentHero: vi.fn(),
    },
    initialMP: movementPoints,
  };
}

describe("Step da una cella porta verso il vicino gated", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("eroe su (5,10) [porta], click (5,11): moveCurrentHeroTo chiamato e PM scalano", () => {
    const config = buildConfig();
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    // Forziamo movementPoints a un valore noto (rollMovement usa Math.random).
    act(() => result.current.rollMovement());
    const mpBefore = result.current.movementPoints;
    expect(mpBefore).toBeGreaterThan(0);

    // Click su (5, 11) — gated dalla porta (oriz=true).
    act(() => result.current.handleBoardClick(5, 11));

    // Il primo step parte dopo 300ms di setTimeout.
    act(() => vi.advanceTimersByTime(350));

    // Verifica: moveCurrentHeroTo è stato chiamato con la cella destinazione.
    const calls = config.sessionManager.moveCurrentHeroTo.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(5);
    expect(calls[0][1]).toBe(11);

    // PM scalati di 1
    expect(result.current.movementPoints).toBe(mpBefore - 1);

    // Movimento concluso (path completato)
    expect(result.current.isMoving).toBe(false);
  });

  it("eroe su (5,10) [porta], click (5,12): hero passa per (5,11) e arriva a (5,12)", () => {
    const config = buildConfig();
    const { result } = renderHook(p => useTurnLogic(p), { initialProps: config });

    act(() => result.current.rollMovement());
    const mpBefore = result.current.movementPoints;

    act(() => result.current.handleBoardClick(5, 12));

    // 2 step da 300ms ciascuno
    act(() => vi.advanceTimersByTime(350));
    act(() => vi.advanceTimersByTime(350));

    const calls = config.sessionManager.moveCurrentHeroTo.mock.calls;
    expect(calls.length).toBe(2);
    expect(calls[0]).toEqual(expect.arrayContaining([5, 11]));
    expect(calls[1]).toEqual(expect.arrayContaining([5, 12]));
    expect(result.current.movementPoints).toBe(mpBefore - 2);
  });
});

/**
 * Stessa scena ma con pathfinding REALE (`usePathfinding`). Vogliamo verificare
 * che il bug NON nasca dalla collaborazione tra useTurnLogic e
 * usePathfinding+useDungeonMovementRules+useDungeonMapQuery in setup
 * "production-like".
 */
import { usePathfinding } from "../../dungeon-use-pathfinding.js";

function buildRealisticConfig({ doorOriz = false, heroAt = { x: 5, y: 10 } } = {}) {
  const door = { x: 5, y: 10, oriz: doorOriz };
  const grid = [
    // Stanza A (sinistra) e Stanza B (destra) per oriz=false
    { x: 4, y: 10, arnt: { antroc: false, inv: false } },
    { x: 5, y: 10, arnt: { antroc: false, inv: false } }, // door cell
    { x: 6, y: 10, arnt: { antroc: false, inv: false } },
    { x: 7, y: 10, arnt: { antroc: false, inv: false } },
    // Per oriz=true
    { x: 5, y: 9, arnt: { antroc: false, inv: false } },
    { x: 5, y: 11, arnt: { antroc: false, inv: false } },
  ];
  const gameSession = {
    currentTurn: 1,
    heroes: [
      { heroId: "h1", turnOrder: 1, x: heroAt.x, y: heroAt.y, currentBody: 5,
        isEscaped: false, activeStatus: [], hero: { classe: "Mago" } },
    ],
    monsters: [],
    openedDoors: [],
    currentMap: { header: {}, grid, porte: [door], scripts: [] },
  };
  const visibilityMap = {
    data: [
      { x: 4, y: 10, valo: "A", fog: false },
      { x: 5, y: 10, valo: "A", fog: false }, // la porta è "appoggiata" su una stanza
      { x: 6, y: 10, valo: "B", fog: false },
      { x: 7, y: 10, valo: "B", fog: false },
      { x: 5, y: 9, valo: "A", fog: false },
      { x: 5, y: 11, valo: "B", fog: false },
    ],
  };
  return { gameSession, visibilityMap };
}

/**
 * REGRESSION test del bug specifico segnalato dall'utente:
 *
 *   "se mi trovo sopra una porta e premo nella cella di destinazione +1,
 *    non si sposta, se premo una cella diversa l'eroe attraversa la porta"
 *
 * Setup minimale fedele alla scena reale:
 *   - barbaro in (5,2) sulla cella della porta (oriz=false → gates X)
 *   - click su (6,2) (cella di destinazione gated dalla porta)
 *   - mappa con UNO script di evento 8 (cambio stanza) che matcha quando
 *     l'eroe entra nella stanza di destra
 *
 * Bug: il commit della session prodotta dallo script di evento 8 sovrascriveva
 * il `moveCurrentHeroTo` (perché era basato su `gameSession` STALE), quindi
 * la posizione dell'eroe veniva "rimessa" a (5,2) — i PM erano scalati ma
 * visivamente l'eroe non si muoveva.
 */
describe("REGRESSION: porta + script evento 8 attraversa la stanza correttamente", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("barbaro su porta (5,2) clicca (6,2) con script evt8: eroe arriva a (6,2)", () => {
    const door = { x: 5, y: 2, oriz: false };
    const grid = [
      { x: 4, y: 2, arnt: { antroc: false, inv: false } },
      { x: 5, y: 2, arnt: { antroc: false, inv: false } },
      { x: 6, y: 2, arnt: { antroc: false, inv: false } },
    ];
    let session = {
      currentTurn: 1,
      heroes: [
        { heroId: "h1", turnOrder: 1, x: 5, y: 2, currentBody: 5,
          isEscaped: false, activeStatus: [], hero: { classe: "Barbaro" } },
      ],
      monsters: [],
      openedDoors: [],
      currentMap: {
        header: {},
        grid,
        porte: [door],
        // Script di evento 8 che matcha SEMPRE (eventi 6/7/8 non hanno filtri).
        scripts: [{ x: 1, y: 1, evento: 8, text: "msg sei in stanza B;" }],
        triggeredScripts: [],
        scriptImages: [],
      },
      triggeredScripts: [],
      scriptImages: [],
    };
    const visibilityMap = {
      data: [
        { x: 4, y: 2, valo: "A", fog: false },
        { x: 5, y: 2, valo: "A", fog: false }, // porta sul lato A
        { x: 6, y: 2, valo: "B", fog: false },
      ],
    };

    // Mock di sessionManager: `moveCurrentHeroTo` e `executeMissionScripts`
    // devono interagire come in produzione (commit setter vs updater).
    const onUpdateSession = vi.fn((updater) => {
      session = typeof updater === "function" ? updater(session) : updater;
    });
    const onNotify = vi.fn();

    // Importiamo dinamicamente per testare il flusso reale di
    // useDungeonSessionManager + useTurnLogic.
    const sessionManagerHook = vi.hoisted(() => null);

    // Per semplicità mockiamo il sessionManager con la stessa semantica di
    // produzione: `moveCurrentHeroTo` come updater (rispetta providedSession),
    // `executeMissionScripts` come SETTER (riproduce il bug originale).
    const sessionManager = {
      moveCurrentHeroTo: vi.fn((nextX, nextY, baseSession) => {
        onUpdateSession((prev) => {
          const src = prev || baseSession || session;
          const cloned = JSON.parse(JSON.stringify(src));
          const h = cloned.heroes.find(x => x.turnOrder === cloned.currentTurn);
          if (h) { h.x = nextX; h.y = nextY; }
          const fromX = src.heroes.find(x => x.turnOrder === src.currentTurn)?.x;
          const fromY = src.heroes.find(x => x.turnOrder === src.currentTurn)?.y;
          return mergeOpenedDoorsAfterStep(cloned, fromX, fromY, nextX, nextY);
        });
      }),
      executeMissionScripts: vi.fn(({ baseSession, eventType }) => {
        // Riproduce il commit-as-setter del manager reale.
        const src = baseSession || session;
        const handled = (src.currentMap?.scripts || []).some(s => Number(s.evento) === Number(eventType));
        if (!handled) return { handled: false };
        // Lo script "msg" non muta hero pos: clona baseSession e aggiunge una
        // notifica. Il punto critico è che il commit è un setter.
        const cloned = JSON.parse(JSON.stringify(src));
        onUpdateSession(() => cloned); // SETTER: schiaccia il commit precedente
        onNotify("sei in stanza B");
        return { handled: true, session: cloned, notifications: ["sei in stanza B"], effects: {} };
      }),
      advanceTurn: vi.fn(),
      clearCurrentHeroStatus: vi.fn(),
      clearHeroStatusEverywhere: vi.fn(),
      clearBonusMovementDiceForHero: vi.fn(),
      clearBonusMeleeAttackQuotaForHero: vi.fn(),
      resolveHeroAttack: vi.fn(),
      markCurrentHeroEscaped: vi.fn(),
      resolveMovementTrap: vi.fn(),
      resolveTrapEffectOnCurrentHero: vi.fn(),
    };

    const { result, rerender } = renderHook(p => useTurnLogic(p), {
      initialProps: {
        gameSession: session,
        visibilityMap,
        onNotify,
        trapsLogic: { checkTrapActivation: vi.fn(() => false), registerTriggeredTrap: vi.fn(), isTrapVisible: vi.fn(() => false) },
        heroStatsLogic: {
          calculateStats: vi.fn(() => ({ movimento: 2, canAttackDiagonal: false, canAttackRanged: false })),
          calculateAttackDice: vi.fn(() => 2),
          canAttackTwice: vi.fn(() => false),
          getConsumableWeaponId: vi.fn(() => null),
        },
        hooksPathfinding: { calculatePath: vi.fn(() => [{ x: 6, y: 2 }]) },
        combatLogic: { resolveCombat: vi.fn() },
        mapInteractionLogic: { isFrontOfDoor: vi.fn(() => null), openPassage: vi.fn() },
        visibilityCalc: { hasLineOfSight: vi.fn(() => true) },
        sessionManager,
      },
    });

    act(() => result.current.rollMovement());
    act(() => result.current.handleBoardClick(6, 2));
    act(() => vi.advanceTimersByTime(350));

    // Forziamo il rerender propagando la session aggiornata all'hook
    // (in produzione lo fa React via props dal componente parent).
    rerender({
      gameSession: session,
      visibilityMap,
      onNotify,
      trapsLogic: { checkTrapActivation: vi.fn(() => false), registerTriggeredTrap: vi.fn(), isTrapVisible: vi.fn(() => false) },
      heroStatsLogic: {
        calculateStats: vi.fn(() => ({ movimento: 2, canAttackDiagonal: false, canAttackRanged: false })),
        calculateAttackDice: vi.fn(() => 2),
        canAttackTwice: vi.fn(() => false),
        getConsumableWeaponId: vi.fn(() => null),
      },
      hooksPathfinding: { calculatePath: vi.fn(() => []) },
      combatLogic: { resolveCombat: vi.fn() },
      mapInteractionLogic: { isFrontOfDoor: vi.fn(() => null), openPassage: vi.fn() },
      visibilityCalc: { hasLineOfSight: vi.fn(() => true) },
      sessionManager,
    });

    // L'eroe deve essersi spostato a (6, 2) (NON essere rimasto a (5, 2)).
    const finalHero = session.heroes.find(h => h.turnOrder === session.currentTurn);
    expect(finalHero.x).toBe(6);
    expect(finalHero.y).toBe(2);

    // Lo script di evento 8 dovrebbe aver mostrato la sua notifica
    expect(onNotify).toHaveBeenCalledWith("sei in stanza B");
  });
});

describe("Pathfinding REALE: eroe su porta clicca cella destinazione", () => {
  it("oriz=false: da (5,10) a (6,10) calcPath = [(6,10)]", () => {
    const { gameSession, visibilityMap } = buildRealisticConfig({ doorOriz: false });
    const { result } = renderHook(() =>
      usePathfinding({ gameSession, visibilityMap, foundPassages: [] })
    );
    const path = result.current.calculatePath(5, 10, 6, 10, 5, "h1");
    expect(path).toEqual([{ x: 6, y: 10 }]);
  });

  // Nota: il caso "(5,10) → (4,10) deve fallire" è coperto dai unit test in
  // [test/doors/dungeon-movement-rules-doors.test.jsx](mdc:test/doors/dungeon-movement-rules-doors.test.jsx).
  // Qui non lo riproduciamo perché il BFS di usePathfinding può
  // attraversare celle "fuori griglia" (non ha controllo `getMapCell`
  // intermedio) e questo rende difficile isolare il puro gating senza
  // riempire artificialmente la mappa con valos "WALL".

  it("oriz=false: da (5,10) a (7,10) calcPath passa per (6,10) e (7,10)", () => {
    const { gameSession, visibilityMap } = buildRealisticConfig({ doorOriz: false });
    const { result } = renderHook(() =>
      usePathfinding({ gameSession, visibilityMap, foundPassages: [] })
    );
    const path = result.current.calculatePath(5, 10, 7, 10, 5, "h1");
    expect(path).toEqual([{ x: 6, y: 10 }, { x: 7, y: 10 }]);
  });
});
