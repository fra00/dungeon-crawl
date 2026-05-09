/**
 * Unit test aggiuntivi per `dungeon-script-runtime.js`.
 *
 * Copre casi che non erano già nel file `dungeon-script-runtime.test.js`:
 *  - blocchi condizionali annidati (sestanza > serand > seogg)
 *  - più script che fanno match nello stesso evento (cumulo effetti/notifiche)
 *  - parsing edge: text multi-line, fallback msg, parole sconosciute
 *  - flag `unavolta` con condizioni miste
 *  - interazione tra effects (movementDelta + stopMovement + forceFinishTurn)
 *  - mancanza di context / visibilityMap / activeHero
 *  - `searma` legge da `equipment` E da `equipped`
 *  - `posroc` su cella inesistente non crea cella né rompe
 */
import { describe, it, expect } from "vitest";
import {
  buildScriptKey,
  executeDungeonScripts,
} from "../../dungeon-script-runtime.js";

function makeSession(scripts, overrides = {}) {
  const {
    hero = {},
    grid = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 8, y: 8 },
    ],
    heroes,
    sessionExtra = {},
    currentMapExtra = {},
  } = overrides;
  const defaultHero = {
    turnOrder: 0,
    heroId: 0,
    x: 5,
    y: 7,
    currentBody: 10,
    gold: 0,
    inventory: [],
    equipment: [],
    equipped: [],
    ...hero,
  };
  return {
    currentTurn: 0,
    triggeredScripts: [],
    scriptImages: [],
    heroes: heroes ?? [defaultHero],
    monsters: [],
    currentMap: { grid, scripts, porte: [], ...currentMapExtra },
    ...sessionExtra,
  };
}

const visMap = (entries) => ({ data: entries.map(([x, y, valo]) => ({ x, y, valo })) });

describe("Parser: AST edge cases", () => {
  it("riga senza keyword conosciuta diventa un msg di fallback", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "ciao narratore;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["ciao narratore"]);
  });

  it("msg con punti virgola escapati in lista separata", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "msg primo;msg secondo;msg terzo;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["primo", "secondo", "terzo"]);
  });

  it("mix newline+semicolon: ogni keyword nota apre statement nuovo", () => {
    const session = makeSession([
      {
        x: 1, y: 1, evento: 6,
        text: "msg uno\nmsg due;\nmsg tre",
      },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["uno", "due", "tre"]);
  });

  it("end senza apertura non rompe l'AST", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "msg ok;\nend\nmsg dopo;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["ok", "dopo"]);
  });
});

describe("Blocchi condizionali annidati", () => {
  it("sestanza > seogg: figlio eseguito solo se entrambe le condizioni sono vere", () => {
    const text =
      "sestanza 4\n" +
      "  seogg 7\n" +
      "    msg dentro;\n" +
      "  end\n" +
      "end";
    // Stanza 4 + oggetto 7 → ok
    const session = makeSession([{ x: 1, y: 1, evento: 6, text }], {
      hero: { inventory: [7] },
    });
    const r = executeDungeonScripts({
      session,
      eventType: 6,
      context: { roomId: "4" },
    });
    expect(r.notifications).toEqual(["dentro"]);

    // Stanza 4 ma oggetto mancante → no
    const sessionNoItem = makeSession([{ x: 1, y: 1, evento: 6, text }], {
      hero: { inventory: [] },
    });
    const r2 = executeDungeonScripts({
      session: sessionNoItem,
      eventType: 6,
      context: { roomId: "4" },
    });
    expect(r2.notifications).toEqual([]);
  });

  it("serand annidato in sestanza: random valutato solo se sestanza vera", () => {
    const text =
      "sestanza 9\n" +
      "  serand k,1,1\n" +
      "    msg colpito;\n" +
      "  end\n" +
      "end";
    const session = makeSession([{ x: 1, y: 1, evento: 6, text }]);
    let calls = 0;
    const random = () => {
      calls++;
      return 0.99; // → Math.floor(2 * 0.99) = 1, matcha "1"
    };
    const r = executeDungeonScripts({
      session,
      eventType: 6,
      context: { roomId: "9" },
      random,
    });
    expect(r.notifications).toEqual(["colpito"]);
    expect(calls).toBe(1);

    const r2 = executeDungeonScripts({
      session,
      eventType: 6,
      context: { roomId: "1" }, // sestanza fallisce
      random,
    });
    expect(r2.notifications).toEqual([]);
    // Random NON viene chiamato perché sestanza è false: ottimizzazione corretta.
    expect(calls).toBe(1);
  });

  it("searma controlla sia inventory equipaggiato (equipment) sia attivo (equipped)", () => {
    const text = "searma 22\nmsg ho_arma;\nend";
    const r1 = executeDungeonScripts({
      session: makeSession([{ x: 1, y: 1, evento: 6, text }], {
        hero: { equipment: [22] },
      }),
      eventType: 6,
    });
    expect(r1.notifications).toEqual(["ho_arma"]);

    const r2 = executeDungeonScripts({
      session: makeSession([{ x: 1, y: 1, evento: 6, text }], {
        hero: { equipped: [22] },
      }),
      eventType: 6,
    });
    expect(r2.notifications).toEqual(["ho_arma"]);
  });
});

describe("Multi-script: più script che fanno match nello stesso evento", () => {
  it("cumulo notifiche di tutti gli script che matchano", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "msg A;" },
      { x: 1, y: 1, evento: 6, text: "msg B;" },
      { x: 1, y: 1, evento: 6, text: "msg C;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["A", "B", "C"]);
  });

  it("revealPoints accumulati da più script senza duplicati", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "possta 5,5" },
      { x: 1, y: 1, evento: 6, text: "possta 6,6" },
      { x: 1, y: 1, evento: 6, text: "possta 5,5" }, // duplicato deve essere ignorato
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.revealPoints).toEqual([{ x: 5, y: 5 }, { x: 6, y: 6 }]);
  });

  it("scripts indipendenti non si confondono: ognuno vede il suo idmosc/morto", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 2, idmosc: 3, morto: false, text: "msg colpito 3;" },
      { x: 1, y: 1, evento: 2, idmosc: 4, morto: false, text: "msg colpito 4;" },
      { x: 1, y: 1, evento: 2, idmosc: 3, morto: true, text: "msg morto 3;" },
    ]);
    const r = executeDungeonScripts({
      session,
      eventType: 2,
      context: { monsterTypeId: 3, onDeath: false },
    });
    expect(r.notifications).toEqual(["colpito 3"]);
  });
});

describe("Effects: cumulo e priorità", () => {
  it("forceFinishTurn implica stopMovement", () => {
    const session = makeSession([{ x: 1, y: 1, evento: 6, text: "fineturno" }]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.effects.forceFinishTurn).toBe(true);
    expect(r.effects.stopMovement).toBe(true);
  });

  it("attackBlocked dopo att/noatt riflette l'ULTIMO comando eseguito", () => {
    const r = executeDungeonScripts({
      session: makeSession([{ x: 1, y: 1, evento: 6, text: "att; noatt" }]),
      eventType: 6,
    });
    expect(r.effects.attackBlocked).toBe(true);

    const r2 = executeDungeonScripts({
      session: makeSession([{ x: 1, y: 1, evento: 6, text: "noatt; att" }]),
      eventType: 6,
    });
    expect(r2.effects.attackBlocked).toBe(false);
  });

  it("pospsg accumula correttamente movementDelta=-1 e activeHeroPosition aggiornata", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "pospsg 8,8" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.effects.activeHeroPosition).toEqual({ x: 8, y: 8 });
    expect(r.effects.movementDelta).toBe(-1);
    expect(r.effects.stopMovement).toBe(true);
    expect(r.session.heroes[0]).toMatchObject({ x: 8, y: 8 });
  });
});

describe("unavolta: persistenza tra invocazioni", () => {
  it("script con unavolta=true viene tracciato in triggeredScripts", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, unavolta: true, text: "msg first;" },
    ]);
    const r1 = executeDungeonScripts({ session, eventType: 6 });
    expect(r1.notifications).toEqual(["first"]);
    const key = buildScriptKey(session.currentMap.scripts[0], 0);
    expect(r1.session.triggeredScripts).toContain(key);

    // 2° invocazione: salta lo script
    const r2 = executeDungeonScripts({ session: r1.session, eventType: 6 });
    expect(r2.notifications).toEqual([]);
  });

  it("script senza unavolta può rifirare", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "msg again;" },
    ]);
    const r1 = executeDungeonScripts({ session, eventType: 6 });
    const r2 = executeDungeonScripts({ session: r1.session, eventType: 6 });
    expect(r1.notifications).toEqual(["again"]);
    expect(r2.notifications).toEqual(["again"]);
  });

  it("unavolta esclude la SOLA istanza, altri script con stesso testo ma posizione diversa rifirano", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, unavolta: true, text: "msg uguale;" },
      { x: 2, y: 2, evento: 6, unavolta: true, text: "msg uguale;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["uguale", "uguale"]);
    expect(r.session.triggeredScripts).toHaveLength(2);
  });
});

describe("Robustezza: input mancanti / malformati", () => {
  it("script ed eroe assenti → handled false, niente eccezioni", () => {
    const session = {
      currentTurn: 0,
      triggeredScripts: [],
      scriptImages: [],
      heroes: [],
      monsters: [],
      currentMap: { grid: [], scripts: [], porte: [] },
    };
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.handled).toBe(false);
  });

  it("evento 1 senza previousPosition non crasha (no match)", () => {
    const session = makeSession([
      { x: 5, y: 5, evento: 1, text: "msg test;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 1 });
    expect(r.handled).toBe(false);
  });

  it("evento 3/4/5 senza visibilityMap: scriptRoomId e heroRoomId entrambi null → match (non crasha)", () => {
    // Con visibilityMap mancante entrambe le room sono null; null === null,
    // quindi il match passa e lo script viene eseguito senza crashare.
    const session = makeSession([
      { x: 5, y: 5, evento: 3, text: "msg t3;" },
    ]);
    expect(() => executeDungeonScripts({ session, eventType: 3 })).not.toThrow();
  });

  it("evento 3 con visibilityMap che NON include la cella → null-equal, non crasha", () => {
    const session = makeSession(
      [{ x: 5, y: 5, evento: 3, text: "msg t3;" }],
      { hero: { x: 5, y: 7 } }
    );
    const r = executeDungeonScripts({
      session,
      eventType: 3,
      visibilityMap: { data: [] },
    });
    // scriptRoomId=null e heroRoomId=null → match → handled true
    expect(r.handled).toBe(true);
  });

  it("evento 3: stanze diverse (valo diversi) → script NON eseguito", () => {
    const session = makeSession(
      [{ x: 5, y: 5, evento: 3, text: "msg no;" }],
      { hero: { x: 5, y: 7 } }
    );
    const vm = visMap([
      [5, 5, 10],
      [5, 7, 20],
    ]);
    const r = executeDungeonScripts({ session, eventType: 3, visibilityMap: vm });
    expect(r.handled).toBe(false);
  });

  it("posroc su cella inesistente non crea celle né lancia errori", () => {
    const session = makeSession([
      { x: 1, y: 1, evento: 6, text: "posroc 99,99" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.session.currentMap.grid.find(c => c.x === 99 && c.y === 99)).toBeUndefined();
  });

  it("aggogg/aggarma senza activeHero non crashano", () => {
    const session = {
      currentTurn: 99, // nessun hero con turnOrder=99
      triggeredScripts: [],
      scriptImages: [],
      heroes: [{ turnOrder: 0, x: 1, y: 1, currentBody: 1, inventory: [], equipment: [], equipped: [] }],
      monsters: [],
      currentMap: {
        grid: [{ x: 1, y: 1 }],
        scripts: [{ x: 1, y: 1, evento: 6, text: "aggogg 5; aggarma 3" }],
        porte: [],
      },
    };
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.handled).toBe(true);
    // Non si è scritto su nessun eroe (activeHero null)
    expect(r.session.heroes[0].inventory).toEqual([]);
    expect(r.session.heroes[0].equipment).toEqual([]);
  });
});

describe("Determinismo serand", () => {
  it("memoizzazione: stessa chiave usa il primo random anche in successive valutazioni", () => {
    const text =
      "serand k,4,2\n" +
      "  msg primo;\n" +
      "end\n" +
      "serand k,4,2\n" +
      "  msg secondo;\n" +
      "end";
    let n = 0;
    const random = () => {
      n++;
      return n === 1 ? 0.5 : 0.99; // primo → floor((4+1)*0.5)=2 (match)
    };
    const session = makeSession([{ x: 1, y: 1, evento: 6, text }]);
    const r = executeDungeonScripts({ session, eventType: 6, random });
    // Entrambi devono firere perché la chiave 'k' è memoizzata a 2.
    expect(r.notifications).toEqual(["primo", "secondo"]);
    // random invocato una sola volta (memoizzazione)
    expect(n).toBe(1);
  });

  it("chiavi diverse → random diversi", () => {
    const text =
      "serand a,1,0\n" +
      "  msg A0;\n" +
      "end\n" +
      "serand b,1,1\n" +
      "  msg B1;\n" +
      "end";
    const session = makeSession([{ x: 1, y: 1, evento: 6, text }]);
    let n = 0;
    const random = () => {
      n++;
      return n === 1 ? 0.1 : 0.99;
    };
    const r = executeDungeonScripts({ session, eventType: 6, random });
    expect(r.notifications).toEqual(["A0", "B1"]);
    expect(n).toBe(2);
  });
});
