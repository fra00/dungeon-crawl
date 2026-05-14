/**
 * Integration test: `useDungeonSessionManager.executeMissionScripts`.
 *
 * Verifica il "ponte" tra l'hook e il runtime degli script:
 *   - chiama `executeDungeonScripts` con i dati corretti
 *   - committa la sessione aggiornata via `onUpdateSession` SOLO se handled
 *   - inoltra le notifiche al callback `onNotify`
 *   - inoltra i revealPoints a `fogOfWarLogic.revealFromPoint`
 *   - non rompe se la mappa non ha scripts
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useDungeonSessionManager } from "../../dungeon-use-session-manager.js";

afterEach(() => cleanup());

function makeBaseSession(scripts) {
  return {
    currentTurn: 1,
    triggeredScripts: [],
    scriptImages: [],
    heroes: [
      {
        heroId: 0, turnOrder: 1, x: 5, y: 5, currentBody: 5, gold: 0,
        inventory: [], equipment: [], equipped: [], activeStatus: [],
        hero: { classe: "Mago" },
      },
    ],
    monsters: [],
    openedDoors: [],
    spawnedLocations: [],
    treasureDeck: [],
    currentMap: {
      header: {},
      grid: [
        { x: 5, y: 5, arnt: { antroc: false, inv: false } },
        { x: 7, y: 7, arnt: { antroc: false, inv: false } },
      ],
      porte: [],
      scripts,
    },
  };
}

function buildHook(scripts, { fogOfWar } = {}) {
  let session = makeBaseSession(scripts);
  const onUpdateSession = vi.fn((updater) => {
    session = updater(session);
  });
  const onNotify = vi.fn();
  const fogOfWarLogic = fogOfWar ?? { revealFromPoint: vi.fn() };
  const { result, rerender } = renderHook((p) => useDungeonSessionManager(p), {
    initialProps: {
      gameSession: session,
      onUpdateSession,
      onNotify,
      fogOfWarLogic,
      staticEquipment: [],
      staticItems: [],
    },
  });
  // Helper per propagare la sessione aggiornata all'hook al rerender successivo.
  const refreshHook = () => rerender({
    gameSession: session,
    onUpdateSession,
    onNotify,
    fogOfWarLogic,
    staticEquipment: [],
    staticItems: [],
  });
  return { result, onUpdateSession, onNotify, fogOfWarLogic, getSession: () => session, refreshHook };
}

describe("useDungeonSessionManager.executeMissionScripts (integration)", () => {
  it("evento 6: msg → notifica, sessione committata", () => {
    const { result, onUpdateSession, onNotify, getSession } = buildHook([
      { x: 1, y: 1, evento: 6, text: "msg ciao mondo;" },
    ]);

    let returned;
    act(() => {
      returned = result.current.executeMissionScripts({ eventType: 6 });
    });

    expect(returned.handled).toBe(true);
    expect(onUpdateSession).toHaveBeenCalledTimes(1);
    expect(onNotify).toHaveBeenCalledWith("ciao mondo");
    expect(getSession().triggeredScripts).toEqual([]); // unavolta=false
  });

  it("script con unavolta: triggeredScripts viene aggiornato dopo il primo run", () => {
    const { result, onUpdateSession, onNotify, getSession, refreshHook } = buildHook([
      { x: 1, y: 1, evento: 6, unavolta: true, text: "msg solo_una_volta;" },
    ]);

    act(() => result.current.executeMissionScripts({ eventType: 6 }));
    expect(onNotify).toHaveBeenCalledWith("solo_una_volta");
    expect(getSession().triggeredScripts).toHaveLength(1);

    onNotify.mockClear();
    onUpdateSession.mockClear();
    refreshHook(); // l'hook ora vede la session aggiornata

    act(() => result.current.executeMissionScripts({ eventType: 6 }));
    expect(onNotify).not.toHaveBeenCalled();
    // handled=false → niente nuovo commit
    expect(onUpdateSession).not.toHaveBeenCalled();
  });

  it("script con possta: revealFromPoint chiamato per ogni punto", () => {
    const { result, fogOfWarLogic } = buildHook([
      {
        x: 1, y: 1, evento: 6,
        text: "possta 3,3; possta 4,4",
      },
    ]);

    act(() => result.current.executeMissionScripts({ eventType: 6 }));

    expect(fogOfWarLogic.revealFromPoint).toHaveBeenCalledTimes(2);
    expect(fogOfWarLogic.revealFromPoint).toHaveBeenNthCalledWith(1, 3, 3);
    expect(fogOfWarLogic.revealFromPoint).toHaveBeenNthCalledWith(2, 4, 4);
  });

  it("script con effetti su sessione (aggoro): onUpdateSession riceve la session aggiornata", () => {
    const { result, onUpdateSession } = buildHook([
      { x: 1, y: 1, evento: 6, text: "aggoro 50;" },
    ]);

    act(() => result.current.executeMissionScripts({ eventType: 6 }));

    expect(onUpdateSession).toHaveBeenCalledTimes(1);
    // L'updater viene invocato dal commitSessionUpdate; ricostruiamo la session
    // applicando manualmente l'updater per verificare il delta.
    const updater = onUpdateSession.mock.calls[0][0];
    const finalSession = updater(makeBaseSession([{ x: 1, y: 1, evento: 6, text: "aggoro 50;" }]));
    expect(finalSession.heroes[0].gold).toBe(50);
  });

  it("se la mappa non ha scripts → handled=false, nessun side-effect", () => {
    const { result, onUpdateSession, onNotify } = buildHook([]);

    let returned;
    act(() => {
      returned = result.current.executeMissionScripts({ eventType: 6 });
    });
    expect(returned.handled).toBe(false);
    expect(onUpdateSession).not.toHaveBeenCalled();
    expect(onNotify).not.toHaveBeenCalled();
  });

  it("baseSession esplicito vince su gameSession dell'hook", () => {
    const { result } = buildHook([
      { x: 1, y: 1, evento: 6, text: "msg da_hook;" },
    ]);
    const customSession = makeBaseSession([
      { x: 1, y: 1, evento: 6, text: "msg da_baseSession;" },
    ]);

    let r;
    act(() => {
      r = result.current.executeMissionScripts({
        eventType: 6,
        baseSession: customSession,
      });
    });
    expect(r.notifications).toContain("da_baseSession");
  });

  it("evento 1: newPosition propagata al runtime (match su cella di arrivo)", () => {
    const { result, onNotify } = buildHook([
      { x: 5, y: 6, evento: 1, text: "msg entrato_in_5_6;" },
    ]);

    act(() => {
      result.current.executeMissionScripts({
        eventType: 1,
        context: { newPosition: { x: 5, y: 6 } },
      });
    });
    expect(onNotify).toHaveBeenCalledWith("entrato_in_5_6");

    onNotify.mockClear();
    act(() => {
      result.current.executeMissionScripts({
        eventType: 1,
        context: { newPosition: { x: 9, y: 9 } }, // posizione diversa
      });
    });
    expect(onNotify).not.toHaveBeenCalled();
  });

  it("random custom permette test deterministici di serand", () => {
    const { result, onNotify } = buildHook([
      {
        x: 1, y: 1, evento: 6,
        text: "serand a,3,2\n  msg matched_2;\nend",
      },
    ]);

    act(() => {
      result.current.executeMissionScripts({
        eventType: 6,
        random: () => 0.999, // → floor((3+1)*0.999) = 3 → no match
      });
    });
    expect(onNotify).not.toHaveBeenCalled();

    act(() => {
      result.current.executeMissionScripts({
        eventType: 6,
        random: () => 0.6, // → floor((3+1)*0.6) = 2 → match
      });
    });
    expect(onNotify).toHaveBeenCalledWith("matched_2");
  });
});
