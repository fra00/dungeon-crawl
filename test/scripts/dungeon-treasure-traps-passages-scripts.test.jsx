/**
 * Integration test: gli script intercettano correttamente le azioni di
 * "Cerca tesoro" (evento 3), "Cerca trappole" (evento 4) e
 * "Cerca passaggi segreti" (evento 5).
 *
 * Bug storico coperto da questi test: alcune azioni leggevano
 * `scriptResult.forceFinishTurn` invece di `scriptResult.effects.forceFinishTurn`,
 * quindi un comando `fineturno` in uno script di tesoro/trappola/passaggio
 * non chiudeva mai il turno e l'azione "normale" partiva comunque.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTreasureSearch } from "../../dungeon-use-treasure.js";
import { useTraps } from "../../dungeon-use-traps.js";
import { useSecretPassages } from "../../dungeon-use-secret-passages.js";

afterEach(() => cleanup());

function makeSession(overrides = {}) {
  const hero = {
    heroId: "h1", turnOrder: 1, x: 5, y: 5, currentBody: 5, gold: 0,
    inventory: [], equipment: [], equipped: [], activeStatus: [],
    hero: { classe: "Mago" },
  };
  return {
    currentTurn: 1,
    heroes: [hero],
    monsters: [],
    openedDoors: [],
    treasureDeck: [],
    spawnedLocations: [],
    foundPassages: [],
    currentMap: {
      header: {},
      grid: [
        { x: 5, y: 5, arnt: { antroc: false, inv: false }, tes: { ts: 0, ogg: 0, arma: 0, mon: 0, trp: 0 }, psgg: { ps: null, oriz: false } },
        { x: 5, y: 6, arnt: { antroc: false, inv: false }, tes: { ts: 0, ogg: 0, arma: 0, mon: 0, trp: 0 }, psgg: { ps: null, oriz: false }, trpl: { tipo: 0, rccadex: 0, rccadey: 0 } },
      ],
      porte: [],
      scripts: [],
    },
    ...overrides,
  };
}

describe("useTreasureSearch (evento 3)", () => {
  it("script handled con forceFinishTurn → onForceTurnEnd, NON onActionDone", () => {
    const onForceTurnEnd = vi.fn();
    const onActionDone = vi.fn();
    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({
        handled: true,
        session: makeSession(),
        notifications: [],
        revealPoints: [],
        effects: { forceFinishTurn: true, attackBlocked: false, stopMovement: true, movementDelta: 0 },
      })),
      collectTreasureAtCell: vi.fn(),
      drawTreasureCard: vi.fn(),
    };

    const { result } = renderHook(() =>
      useTreasureSearch({
        gameSession: makeSession(),
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        onNotify: vi.fn(),
        onActionDone,
        onForceTurnEnd,
        sessionManager,
        onTreasureCardDrawn: vi.fn(),
        onWanderingMonster: vi.fn(),
      })
    );

    act(() => result.current.searchTreasure());

    expect(sessionManager.executeMissionScripts).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 3 })
    );
    expect(onForceTurnEnd).toHaveBeenCalledTimes(1);
    expect(onActionDone).not.toHaveBeenCalled();
    // L'azione "normale" non parte: niente collect/treasureCard
    expect(sessionManager.collectTreasureAtCell).not.toHaveBeenCalled();
    expect(sessionManager.drawTreasureCard).not.toHaveBeenCalled();
  });

  it("script handled SENZA forceFinishTurn → onActionDone (azione consumata)", () => {
    const onForceTurnEnd = vi.fn();
    const onActionDone = vi.fn();
    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({
        handled: true,
        session: makeSession(),
        notifications: ["msg evento3"],
        revealPoints: [],
        effects: { forceFinishTurn: false, stopMovement: false, movementDelta: 0, attackBlocked: false },
      })),
      collectTreasureAtCell: vi.fn(),
      drawTreasureCard: vi.fn(),
    };

    const { result } = renderHook(() =>
      useTreasureSearch({
        gameSession: makeSession(),
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        onNotify: vi.fn(),
        onActionDone,
        onForceTurnEnd,
        sessionManager,
        onTreasureCardDrawn: vi.fn(),
        onWanderingMonster: vi.fn(),
      })
    );

    act(() => result.current.searchTreasure());

    expect(onForceTurnEnd).not.toHaveBeenCalled();
    expect(onActionDone).toHaveBeenCalledTimes(1);
  });

  it("script NON handled → l'azione di tesoro parte normalmente (drawTreasureCard chiamato)", () => {
    const onActionDone = vi.fn();
    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({ handled: false })),
      collectTreasureAtCell: vi.fn(() => true),
      drawTreasureCard: vi.fn(() => ({ id: 1, name: "Test Card" })),
    };

    const session = makeSession({ treasureDeck: [{ id: 1 }] });

    const { result } = renderHook(() =>
      useTreasureSearch({
        gameSession: session,
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        onNotify: vi.fn(),
        onActionDone,
        onForceTurnEnd: vi.fn(),
        sessionManager,
        onTreasureCardDrawn: vi.fn(),
        onWanderingMonster: vi.fn(),
      })
    );

    act(() => result.current.searchTreasure());

    expect(sessionManager.drawTreasureCard).toHaveBeenCalled();
    expect(onActionDone).toHaveBeenCalled();
  });
});

describe("useTraps (evento 4)", () => {
  it("script handled con forceFinishTurn → onForceTurnEnd", () => {
    const onForceTurnEnd = vi.fn();
    const onActionDone = vi.fn();
    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({
        handled: true,
        session: makeSession(),
        notifications: [],
        revealPoints: [],
        effects: { forceFinishTurn: true, stopMovement: true, movementDelta: 0, attackBlocked: false },
      })),
    };

    const { result } = renderHook(() =>
      useTraps({
        gameSession: makeSession(),
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        areMonstersVisible: false,
        onNotify: vi.fn(),
        onActionDone,
        onForceTurnEnd,
        sessionManager,
      })
    );

    act(() => result.current.searchTraps());

    expect(sessionManager.executeMissionScripts).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 4 })
    );
    expect(onForceTurnEnd).toHaveBeenCalledTimes(1);
    expect(onActionDone).not.toHaveBeenCalled();
  });

  it("script handled SENZA forceFinishTurn → onActionDone, niente cerca-trappole standard", () => {
    const onForceTurnEnd = vi.fn();
    const onActionDone = vi.fn();
    const onNotify = vi.fn();

    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({
        handled: true,
        session: makeSession(),
        notifications: ["msg da_script"],
        revealPoints: [],
        effects: { forceFinishTurn: false, stopMovement: false, movementDelta: 0, attackBlocked: false },
      })),
    };

    const { result } = renderHook(() =>
      useTraps({
        gameSession: makeSession(),
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        areMonstersVisible: false,
        onNotify,
        onActionDone,
        onForceTurnEnd,
        sessionManager,
      })
    );

    act(() => result.current.searchTraps());

    expect(onForceTurnEnd).not.toHaveBeenCalled();
    expect(onActionDone).toHaveBeenCalledTimes(1);
    // La notifica di "Trappole trovate"/"Nessuna trappola" NON deve apparire
    // perché lo script ha già gestito.
    const callArgs = onNotify.mock.calls.flat();
    expect(callArgs).not.toContain("Trappole trovate!");
    expect(callArgs).not.toContain("Nessuna trappola scoperta.");
  });

  it("areMonstersVisible=true: nessuna chiamata a script (azione invalidata prima)", () => {
    const sessionManager = {
      executeMissionScripts: vi.fn(),
    };

    const { result } = renderHook(() =>
      useTraps({
        gameSession: makeSession(),
        visibilityMap: { data: [] },
        areMonstersVisible: true,
        onNotify: vi.fn(),
        onActionDone: vi.fn(),
        onForceTurnEnd: vi.fn(),
        sessionManager,
      })
    );

    act(() => result.current.searchTraps());

    expect(sessionManager.executeMissionScripts).not.toHaveBeenCalled();
  });
});

describe("useSecretPassages (evento 5)", () => {
  it("evento 5 chiamato durante searchPassages; con forceFinishTurn → onForceTurnEnd", () => {
    const onForceTurnEnd = vi.fn();
    const onActionDone = vi.fn();

    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({
        handled: true,
        session: makeSession(),
        notifications: [],
        revealPoints: [],
        effects: { forceFinishTurn: true, stopMovement: true, movementDelta: 0, attackBlocked: false },
      })),
    };

    const { result } = renderHook(() =>
      useSecretPassages({
        gameSession: makeSession(),
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        onNotify: vi.fn(),
        onActionDone,
        onForceTurnEnd,
        sessionManager,
      })
    );

    act(() => result.current.searchPassages());

    expect(sessionManager.executeMissionScripts).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 5 })
    );
    expect(onForceTurnEnd).toHaveBeenCalledTimes(1);
  });

  it("evento 5: chiamato con baseSession e visibilityMap corretti", () => {
    const sessionManager = {
      executeMissionScripts: vi.fn(() => ({ handled: false })),
    };
    const visibilityMap = { data: [{ x: 5, y: 5, valo: "1", fog: false }] };
    const session = makeSession();

    const { result } = renderHook(() =>
      useSecretPassages({
        gameSession: session,
        visibilityMap,
        onNotify: vi.fn(),
        onActionDone: vi.fn(),
        onForceTurnEnd: vi.fn(),
        sessionManager,
      })
    );

    act(() => result.current.searchPassages());

    expect(sessionManager.executeMissionScripts).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 5,
        baseSession: session,
        visibilityMap,
      })
    );
  });

  it("evento 5: con mostri visibili la ricerca non parte (e nemmeno gli script)", () => {
    const sessionManager = {
      executeMissionScripts: vi.fn(),
    };
    const session = makeSession({
      monsters: [{ id: "m1", x: 5, y: 5, currentBody: 3 }],
    });

    const { result } = renderHook(() =>
      useSecretPassages({
        gameSession: session,
        visibilityMap: { data: [{ x: 5, y: 5, valo: "1", fog: false }] },
        onNotify: vi.fn(),
        onActionDone: vi.fn(),
        onForceTurnEnd: vi.fn(),
        sessionManager,
      })
    );

    act(() => result.current.searchPassages());

    expect(sessionManager.executeMissionScripts).not.toHaveBeenCalled();
  });
});
