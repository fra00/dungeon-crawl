/**
 * Visibilità grafica delle porte sul tabellone: cella porta + solo vicino +1,
 * e filtro valo quando l'eroe è in una stanza (non corridoio).
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDungeonDoors } from "../../dungeon-use-doors.js";

function visCell(x, y, fog, valo) {
  return { x, y, fog, valo };
}

function baseSession({ porte, hero, heroes, currentTurn = 1, openedDoors = [], currentMap }) {
  const map = currentMap ?? { porte };
  const heroList = heroes ?? (hero ? [hero] : []);
  return {
    currentTurn,
    openedDoors,
    heroes: heroList,
    currentMap: map,
  };
}

describe("useDungeonDoors", () => {
  it("oriz=false: non mostra la porta se solo il lato -1 (non gatato) è senza nebbia", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(4, 2, false, 10),
        visCell(5, 2, true, 13),
        visCell(6, 2, true, 13),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 4, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([]);
  });

  it("oriz=false: mostra la porta se la cella destinazione +1 è senza nebbia e valo coincide con la stanza dell'eroe", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(4, 2, false, 10),
        visCell(5, 2, true, 13),
        visCell(6, 2, false, 10),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 6, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("eroe nel valo 10: nasconde porta solo 13/13 anche se la cella porta è scoperta", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(5, 2, false, 13),
        visCell(6, 2, false, 13),
        visCell(7, 2, false, 10),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 7, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([]);
  });

  it("corridoio (valo 0): non applica il filtro valo — basta nebbia su porta o +1", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(4, 2, false, 0),
        visCell(5, 2, false, 13),
        visCell(6, 2, true, 13),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 4, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("porta aperta: resta visibile senza filtro valo", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [visCell(7, 2, false, 10)],
    };
    const gameSession = baseSession({
      porte,
      openedDoors: ["5,2"],
      hero: { turnOrder: 1, x: 7, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("oriz=true: usa solo (x,y) e (x,y+1), non (x,y-1)", () => {
    const porte = [{ x: 5, y: 10, oriz: true }];
    const boardVisibilityMap = {
      data: [
        visCell(5, 9, false, 10),
        visCell(5, 10, true, 13),
        visCell(5, 11, true, 13),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 5, y: 9, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([]);
  });

  it("porta già vista non sparisce al cambio turno (altro eroe / altro valo attivo)", () => {
    const currentMap = { porte: [{ x: 5, y: 2, oriz: false }] };
    const boardVisibilityMap = {
      data: [
        visCell(6, 2, false, 10),
        visCell(5, 2, false, 10),
        visCell(1, 1, false, 99),
      ],
    };
    const h1 = { heroId: "a", turnOrder: 1, x: 6, y: 2 };
    const h2 = { heroId: "b", turnOrder: 2, x: 1, y: 1 };
    const s1 = { currentTurn: 1, heroes: [h1, h2], currentMap, openedDoors: [] };
    const s2 = { currentTurn: 2, heroes: [h1, h2], currentMap, openedDoors: [] };

    const { result, rerender } = renderHook(
      ({ gameSession }) => useDungeonDoors({ gameSession, boardVisibilityMap }),
      { initialProps: { gameSession: s1 } }
    );
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
    rerender({ gameSession: s2 });
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("cambio mappa (currentMissionIndex diverso): sticky si azzera — senza nuova rivelazione la porta resta nascosta se tutto in nebbia", () => {
    const map1 = { porte: [{ x: 5, y: 2, oriz: false }] };
    const map2 = { porte: [{ x: 5, y: 2, oriz: false }] };
    const boardClear = {
      data: [visCell(6, 2, false, 10), visCell(5, 2, false, 10)],
    };
    const boardFogged = {
      data: [visCell(6, 2, true, 10), visCell(5, 2, true, 10)],
    };
    const hero = { turnOrder: 1, x: 6, y: 2, heroId: "h1" };
    const s1 = { currentTurn: 1, heroes: [hero], currentMap: map1, openedDoors: [], currentMissionIndex: 0, campaignName: "C" };
    const s2 = { currentTurn: 1, heroes: [hero], currentMap: map2, openedDoors: [], currentMissionIndex: 1, campaignName: "C" };

    const { result, rerender } = renderHook(
      ({ gameSession, board }) => useDungeonDoors({ gameSession, boardVisibilityMap: board }),
      { initialProps: { gameSession: s1, board: boardClear } }
    );
    expect(result.current.visibleDoors).toHaveLength(1);
    rerender({ gameSession: s2, board: boardFogged });
    expect(result.current.visibleDoors).toEqual([]);
  });

  it("clone profondo della session (stesso campaignName+missionIndex, currentMap ricreato per ref): sticky NON si azzera", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [visCell(6, 2, false, 10), visCell(5, 2, false, 10)],
    };
    const hero1 = { turnOrder: 1, x: 6, y: 2, heroId: "h1" };
    const hero2 = { turnOrder: 2, x: 1, y: 1, heroId: "h2" };

    const buildSession = (turn) =>
      JSON.parse(
        JSON.stringify({
          currentTurn: turn,
          heroes: [hero1, hero2],
          currentMap: { porte },
          openedDoors: [],
          currentMissionIndex: 0,
          campaignName: "Camp",
        })
      );

    const { result, rerender } = renderHook(
      ({ gameSession }) => useDungeonDoors({ gameSession, boardVisibilityMap }),
      { initialProps: { gameSession: buildSession(1) } }
    );
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
    rerender({ gameSession: buildSession(2) });
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });
});
