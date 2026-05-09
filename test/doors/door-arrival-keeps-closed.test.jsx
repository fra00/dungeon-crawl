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
 * Fix: `mergeOpenedDoorsAfterStep` apre la porta SOLO al passo `atFrom`
 *      (cioè quando l'eroe LASCIA la cella della porta).
 */
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { mergeOpenedDoorsAfterStep } from "../../dungeon-melee-doorway.js";
import { useMapInteraction } from "../../dungeon-use-map-interaction.js";

afterEach(() => cleanup());

describe("Arrivo sulla cella di una porta: la porta resta chiusa", () => {
  it("step (4,2) → (5,2) [door, oriz=false]: openedDoors NON contiene la porta", () => {
    const session0 = {
      currentTurn: 1,
      heroes: [{ heroId: "h1", turnOrder: 1, x: 4, y: 2 }],
      monsters: [],
      openedDoors: [],
      currentMap: { porte: [{ x: 5, y: 2, oriz: false }] },
    };
    const session1 = mergeOpenedDoorsAfterStep(session0, 4, 2, 5, 2);
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

  it("flusso completo: arrivo sulla porta (chiusa, button visibile) → lascio (aperta, button sparito)", () => {
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
    session = mergeOpenedDoorsAfterStep(session, 4, 2, 5, 2);
    session.heroes = [{ ...session.heroes[0], x: 5, y: 2 }];
    expect(session.openedDoors).toEqual([]);

    let { result, rerender } = renderHook(
      ({ s }) => useMapInteraction({ gameSession: s, foundPassages: [], sessionManager: null }),
      { initialProps: { s: session } }
    );
    expect(result.current.isFrontOfDoor(5, 2)).not.toBeNull();

    // Step 2: lascio la cella della porta. Si apre.
    session = mergeOpenedDoorsAfterStep(session, 5, 2, 6, 2);
    session.heroes = [{ ...session.heroes[0], x: 6, y: 2 }];
    expect(session.openedDoors).toEqual(["5,2"]);

    rerender({ s: session });
    // Ora l'eroe è sul vicino +1 e la porta è aperta: niente più "Apri porta".
    expect(result.current.isFrontOfDoor(6, 2)).toBeNull();
  });
});
