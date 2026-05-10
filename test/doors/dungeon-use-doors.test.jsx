/** Porte visibili quando rivelate (cella porta o vicino +1), poi sticky. */
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
  it("non mostra porte mai rivelate (nebbia su porta e vicino +1)", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(5, 2, true, 13),
        visCell(6, 2, true, 13),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 7, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([]);
  });

  it("mostra la porta quando viene rivelata la cella destinazione +1", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = {
      data: [
        visCell(5, 2, true, 13),
        visCell(6, 2, false, 13),
      ],
    };
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 7, y: 2, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("una porta già rivelata resta visibile anche se torna in nebbia (sticky)", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const gameSession = baseSession({
      porte,
      hero: { turnOrder: 1, x: 7, y: 2, heroId: "h1" },
    });
    const boardRevealed = {
      data: [visCell(5, 2, false, 13), visCell(6, 2, true, 13)],
    };
    const boardFoggedAgain = {
      data: [visCell(5, 2, true, 13), visCell(6, 2, true, 13)],
    };

    const { result, rerender } = renderHook(
      ({ boardVisibilityMap }) => useDungeonDoors({ gameSession, boardVisibilityMap }),
      { initialProps: { boardVisibilityMap: boardRevealed } }
    );
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
    rerender({ boardVisibilityMap: boardFoggedAgain });
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portav.png" }]);
  });

  it("porta orizzontale aperta: renderizza immagine verticale (solo stato grafico)", () => {
    const porte = [{ x: 5, y: 10, oriz: true }];
    const boardVisibilityMap = { data: [visCell(1, 1, false, 0)] };
    const gameSession = baseSession({
      porte,
      openedDoors: ["5,10"],
      hero: { turnOrder: 1, x: 1, y: 1, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 10, img: "portav.png" }]);
  });

  it("porta verticale aperta: renderizza immagine orizzontale (solo stato grafico)", () => {
    const porte = [{ x: 5, y: 2, oriz: false }];
    const boardVisibilityMap = { data: [visCell(1, 1, true, 0)] };
    const gameSession = baseSession({
      porte,
      openedDoors: ["5,2"],
      hero: { turnOrder: 1, x: 1, y: 1, heroId: "h1" },
    });
    const { result } = renderHook(() => useDungeonDoors({ gameSession, boardVisibilityMap }));
    expect(result.current.visibleDoors).toEqual([{ x: 5, y: 2, img: "portao.png" }]);
  });
});
