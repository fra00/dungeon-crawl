/**
 * Regression: arrivare SULLA cella di una porta non deve auto-aprirla.
 * L'eroe deve poter cliccare "Apri porta" mentre è esattamente sulla cella
 * della porta.
 *
 * Bug originale (Saturday May 9, 2026):
 *   "Il pulsante apri porta viene visualizzato SOLO se sono nella cella di
 *    destinazione (il vicino) e non se sono esattamente sopra la cella
 *    dove è posizionata la porta"
 *
 * Causa: `mergeOpenedDoorsAfterStep` aggiungeva la porta a `openedDoors`
 *        anche quando l'eroe ARRIVAVA su di essa (`atTo`). Di conseguenza
 *        `isFrontOfDoor` trovava la porta in `openedDoors` e la saltava.
 *
 * Apertura automatica solo al cambio valo attraversando la coppia porta gestita.
 */
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { mergeOpenedDoorsAfterStep } from "../../dungeon-melee-doorway.js";
import { useMapInteraction } from "../../dungeon-use-map-interaction.js";

afterEach(() => cleanup());

const VIS_DOOR_52 = {
  data: [
    { x: 4, y: 2, valo: "A" },
    { x: 5, y: 2, valo: "A" },
    { x: 6, y: 2, valo: "B" },
  ],
};
const doorOpts = { visibilityMap: VIS_DOOR_52 };

describe("Arrivo sulla cella di una porta: la porta resta chiusa", () => {
  it("step (4,2) → (5,2) [door, oriz=false]: openedDoors NON contiene la porta", () => {
    const session0 = {
      currentTurn: 1,
      heroes: [{ heroId: "h1", turnOrder: 1, x: 4, y: 2 }],
      monsters: [],
      openedDoors: [],
      currentMap: { porte: [{ x: 5, y: 2, oriz: false }] },
    };
    const session1 = mergeOpenedDoorsAfterStep(session0, 4, 2, 5, 2, doorOpts);
    expect(session1.openedDoors).toEqual([]);
  });

  it("eroe sulla door cell con openedDoors=[] → isFrontOfDoor restituisce destinazione +1", () => {
    const gameSession = {
      currentTurn: 1,
      heroes: [{ heroId: "h1", turnOrder: 1, x: 5, y: 2 }],
      monsters: [],
      openedDoors: [],
      currentMap: {
        porte: [{ x: 5, y: 2, oriz: false }],
        grid: [
          { x: 4, y: 2, arnt: { antroc: false, inv: false } },
          { x: 5, y: 2, arnt: { antroc: false, inv: false } },
          { x: 6, y: 2, arnt: { antroc: false, inv: false } },
        ],
      },
    };
    const { result } = renderHook(() =>
      useMapInteraction({ gameSession, foundPassages: [], sessionManager: null })
    );
    const r = result.current.isFrontOfDoor(5, 2);
    expect(r).not.toBeNull();
    expect(r.passageCell).toEqual({ x: 5, y: 2 });
    expect(r.destination).toEqual({ x: 6, y: 2 });
  });

  it("attraversamento con cambio valo sulla coppia gestita: la porta si apre", () => {
    const session0 = {
      currentMap: { porte: [{ x: 5, y: 2, oriz: false }] },
      openedDoors: [],
    };
    const session1 = mergeOpenedDoorsAfterStep(session0, 6, 2, 5, 2, doorOpts);
    expect(session1.openedDoors).toEqual(["5,2"]);
  });

  it("flusso completo: arrivo laterale sulla porta (chiusa, button) → attraversa (aperta)", () => {
    // Step 1: arrivo. Porta resta chiusa.
    let session = {
      currentTurn: 1,
      heroes: [{ heroId: "h1", turnOrder: 1, x: 4, y: 2 }],
      monsters: [],
      openedDoors: [],
      currentMap: {
        porte: [{ x: 5, y: 2, oriz: false }],
        grid: [
          { x: 4, y: 2, arnt: { antroc: false, inv: false } },
          { x: 5, y: 2, arnt: { antroc: false, inv: false } },
          { x: 6, y: 2, arnt: { antroc: false, inv: false } },
        ],
      },
    };
    session = mergeOpenedDoorsAfterStep(session, 4, 2, 5, 2, doorOpts);
    session.heroes = [{ ...session.heroes[0], x: 5, y: 2 }];
    expect(session.openedDoors).toEqual([]);

    let { result, rerender } = renderHook(
      ({ s }) => useMapInteraction({ gameSession: s, foundPassages: [], sessionManager: null }),
      { initialProps: { s: session } }
    );
    expect(result.current.isFrontOfDoor(5, 2)).not.toBeNull();

    session = mergeOpenedDoorsAfterStep(session, 5, 2, 6, 2, doorOpts);
    session.heroes = [{ ...session.heroes[0], x: 6, y: 2 }];
    expect(session.openedDoors).toEqual(["5,2"]);

    rerender({ s: session });
    // Ora l'eroe è sul vicino +1 e la porta è aperta: niente più "Apri porta".
    expect(result.current.isFrontOfDoor(6, 2)).toBeNull();
  });
});
