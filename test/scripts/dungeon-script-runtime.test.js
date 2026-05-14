import { describe, it, expect } from "vitest";
import {
  buildScriptKey,
  getRoomIdFromVisibilityMap,
  executeDungeonScripts,
  moveCurrentHeroInSession,
} from "../../dungeon-script-runtime.js";

/** Sessione minima: currentTurn e turnOrder dell'eroe attivo devono coincidere. */
function sessionWithScripts(scripts, overrides = {}) {
  const {
    currentTurn = 0,
    hero = {},
    grid = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 10, y: 10 },
    ],
    heroes,
    ...rest
  } = overrides;

  const defaultHero = {
    turnOrder: currentTurn,
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
    currentTurn,
    triggeredScripts: [],
    scriptImages: [],
    heroes: heroes ?? [defaultHero],
    monsters: [],
    currentMap: {
      grid,
      scripts,
      porte: [],
      ...rest.currentMapExtra,
    },
    ...rest.sessionExtra,
  };
}

function visMap(entries) {
  return { data: entries.map(([x, y, valo]) => ({ x, y, valo })) };
}

describe("buildScriptKey", () => {
  it("include index, evento, coords, idmosc, morto, unavolta e testo", () => {
    const key = buildScriptKey(
      { x: 3, y: 4, evento: 2, idmosc: 9, morto: true, unavolta: false, text: "msg x;" },
      2
    );
    expect(key).toBe("2_2_3_4_9_true_false_msg x;");
  });
});

describe("getRoomIdFromVisibilityMap", () => {
  it("restituisce valo come stringa per la cella", () => {
    const vm = visMap([
      [5, 7, 13],
      [5, 5, 13],
    ]);
    expect(getRoomIdFromVisibilityMap(vm, 5, 7)).toBe("13");
  });

  it("restituisce null se mancano dati o cella", () => {
    expect(getRoomIdFromVisibilityMap(null, 1, 1)).toBeNull();
    expect(getRoomIdFromVisibilityMap({ data: [] }, 1, 1)).toBeNull();
  });
});

describe("executeDungeonScripts", () => {
  it("con session null restituisce handled false e array vuoti", () => {
    const r = executeDungeonScripts({ session: null, eventType: 6 });
    expect(r.handled).toBe(false);
    expect(r.notifications).toEqual([]);
    expect(r.revealPoints).toEqual([]);
    expect(r.blockingDialogs).toEqual([]);
    expect(r.scriptSuspended).toBe(false);
  });

  it("dlg apre modale (blockingDialogs) e salta i comandi successivi nello stesso script", () => {
    const session = sessionWithScripts([
      { x: 1, y: 1, evento: 6, text: "msg prima; dlg attendi; msg dopo;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual(["prima"]);
    expect(r.blockingDialogs).toEqual(["attendi"]);
    expect(r.scriptSuspended).toBe(true);
  });

  it("ignora script con testo vuoto o evento diverso", () => {
    const session = sessionWithScripts([
      { x: 1, y: 1, evento: 6, text: "   " },
      { x: 1, y: 1, evento: 7, text: "msg no;" },
    ]);
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.handled).toBe(false);
    expect(r.notifications).toEqual([]);
  });

  describe("evento 1 — cella di arrivo", () => {
    it("esegue solo se (x,y) dello script coincide con newPosition", () => {
      const session = sessionWithScripts([
        { x: 5, y: 6, evento: 1, text: "msg da 5,6;" },
        { x: 9, y: 9, evento: 1, text: "msg no;" },
      ]);
      const r = executeDungeonScripts({
        session,
        eventType: 1,
        context: { newPosition: { x: 5, y: 6 } },
      });
      expect(r.handled).toBe(true);
      expect(r.notifications).toEqual(["da 5,6"]);
    });
  });

  describe("evento 2 — combattimento", () => {
    it("richiede idmosc e morto coerenti con il context", () => {
      const session = sessionWithScripts([
        { x: 1, y: 1, evento: 2, idmosc: 3, morto: false, text: "msg colpo;" },
        { x: 1, y: 1, evento: 2, idmosc: 3, morto: true, text: "msg morte;" },
      ]);
      const onHit = executeDungeonScripts({
        session,
        eventType: 2,
        context: { monsterTypeId: 3, onDeath: false },
      });
      expect(onHit.notifications).toEqual(["colpo"]);

      const onDeath = executeDungeonScripts({
        session,
        eventType: 2,
        context: { monsterTypeId: 3, onDeath: true },
      });
      expect(onDeath.notifications).toEqual(["morte"]);
    });
  });

  describe("evento 3 — stessa stanza (valo)", () => {
    it("esegue se eroe e script hanno lo stesso valo", () => {
      const session = sessionWithScripts(
        [{ x: 5, y: 5, evento: 3, text: "msg tesoro;" }],
        { hero: { x: 5, y: 7 } }
      );
      const vm = visMap([
        [5, 5, 20],
        [5, 7, 20],
      ]);
      const r = executeDungeonScripts({
        session,
        eventType: 3,
        visibilityMap: vm,
      });
      expect(r.handled).toBe(true);
      expect(r.notifications).toEqual(["tesoro"]);
    });

    it("non esegue se valo diverso", () => {
      const session = sessionWithScripts(
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

    it("in corridoio (valo 1) richiede stessa riga o colonna senza muri tra script ed eroe", () => {
      const grid = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 5, y: 7 },
      ];
      const session = sessionWithScripts(
        [{ x: 5, y: 5, evento: 3, text: "msg corr;" }],
        { hero: { x: 5, y: 7 }, grid }
      );
      const vm = visMap([
        [5, 5, 1],
        [5, 6, 1],
        [5, 7, 1],
      ]);
      const r = executeDungeonScripts({ session, eventType: 3, visibilityMap: vm });
      expect(r.notifications).toEqual(["corr"]);
    });

    it("in corridoio fallisce se script ed eroe non sono allineati su asse", () => {
      const grid = [
        { x: 5, y: 5 },
        { x: 6, y: 7 },
      ];
      const session = sessionWithScripts(
        [{ x: 5, y: 5, evento: 3, text: "msg no;" }],
        { hero: { x: 6, y: 7 }, grid }
      );
      const vm = visMap([
        [5, 5, 1],
        [6, 7, 1],
      ]);
      const r = executeDungeonScripts({ session, eventType: 3, visibilityMap: vm });
      expect(r.handled).toBe(false);
    });

    it("in corridoio fallisce se c'è antroc sul segmento", () => {
      const grid = [
        { x: 5, y: 5 },
        { x: 5, y: 6, arnt: { antroc: true } },
        { x: 5, y: 7 },
      ];
      const session = sessionWithScripts(
        [{ x: 5, y: 5, evento: 4, text: "msg trappola;" }],
        { hero: { x: 5, y: 7 }, grid }
      );
      const vm = visMap([
        [5, 5, 1],
        [5, 6, 1],
        [5, 7, 1],
      ]);
      const r = executeDungeonScripts({ session, eventType: 4, visibilityMap: vm });
      expect(r.handled).toBe(false);
    });

    it("evento 5 (passaggi segreti) usa le stesse regole di stanza di evento 3", () => {
      const session = sessionWithScripts(
        [{ x: 5, y: 5, evento: 5, text: "msg ps;" }],
        { hero: { x: 5, y: 7 } }
      );
      const vm = visMap([
        [5, 5, 20],
        [5, 7, 20],
      ]);
      const r = executeDungeonScripts({ session, eventType: 5, visibilityMap: vm });
      expect(r.notifications).toEqual(["ps"]);
    });
  });

  describe("evento 6, 7, 8 — senza filtro posizione", () => {
    it("evento 6 esegue msg", () => {
      const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "msg start;" }]);
      const r = executeDungeonScripts({ session, eventType: 6 });
      expect(r.handled).toBe(true);
      expect(r.notifications).toEqual(["start"]);
    });

    it("evento 7 (fine missione) esegue senza filtri mappa", () => {
      const session = sessionWithScripts([{ x: 1, y: 1, evento: 7, text: "msg end;" }]);
      const r = executeDungeonScripts({
        session,
        eventType: 7,
        context: { isVictory: true },
      });
      expect(r.handled).toBe(true);
      expect(r.notifications).toEqual(["end"]);
    });

    it("evento 8 (cambio stanza) esegue senza filtri mappa", () => {
      const session = sessionWithScripts([{ x: 1, y: 1, evento: 8, text: "msg roomchange;" }]);
      const r = executeDungeonScripts({ session, eventType: 8 });
      expect(r.handled).toBe(true);
      expect(r.notifications).toEqual(["roomchange"]);
    });
  });

  it("evento non gestito (es. 99) non fa match e non esegue lo script", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 99, text: "msg never;" }]);
    const r = executeDungeonScripts({ session, eventType: 99 });
    expect(r.handled).toBe(false);
    expect(r.notifications).toEqual([]);
  });

  describe("unavolta", () => {
    it("la seconda esecuzione salta lo script già triggerato", () => {
      const session = sessionWithScripts([
        { x: 1, y: 1, evento: 6, unavolta: true, text: "msg once;" },
      ]);
      const key = buildScriptKey(session.currentMap.scripts[0], 0);
      session.triggeredScripts = [key];

      const r = executeDungeonScripts({ session, eventType: 6 });
      expect(r.handled).toBe(false);
      expect(r.notifications).toEqual([]);
    });

    it("dopo la prima esecuzione aggiunge la chiave a triggeredScripts", () => {
      const session = sessionWithScripts([
        { x: 1, y: 1, evento: 6, unavolta: true, text: "msg once;" },
      ]);
      const r1 = executeDungeonScripts({ session, eventType: 6 });
      expect(r1.handled).toBe(true);
      const key = buildScriptKey({ ...session.currentMap.scripts[0] }, 0);
      expect(r1.session.triggeredScripts).toContain(key);

      const r2 = executeDungeonScripts({ session: r1.session, eventType: 6 });
      expect(r2.handled).toBe(false);
    });
  });
});

describe("comandi script (via evento 6)", () => {
  const run = (text, sessionOverrides = {}, extra = {}) => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text }], sessionOverrides);
    return executeDungeonScripts({ session, eventType: 6, ...extra });
  };

  it("msg e testo libero (fallback msg)", () => {
    const r = run("msg Ciao; narrativa senza keyword iniziale");
    expect(r.notifications).toEqual(["Ciao", "narrativa senza keyword iniziale"]);
  });

  it("pospsg sposta l'eroe e imposta effetti movimento", () => {
    const r = run("pospsg 10,10");
    const h = r.session.heroes.find((x) => x.turnOrder === 0);
    expect(h.x).toBe(10);
    expect(h.y).toBe(10);
    expect(r.effects.stopMovement).toBe(true);
    expect(r.effects.movementDelta).toBe(-1);
  });

  it("pospsg su cella occupata senza overlap notifica e non sposta", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "pospsg 5,5" }], {
      heroes: [
        { turnOrder: 0, x: 10, y: 10, currentBody: 5, inventory: [], equipment: [], equipped: [] },
        { turnOrder: 1, x: 5, y: 5, currentBody: 5, inventory: [], equipment: [], equipped: [] },
      ],
      grid: [
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ],
    });
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toContain("Casella occupata spostamento impossibile");
    expect(r.session.heroes[0].x).toBe(10);
  });

  it("pospsg con allowOverlap true danneggia l'occupante e sposta", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "pospsg 5,5,1" }], {
      heroes: [
        { turnOrder: 0, x: 10, y: 10, currentBody: 5, inventory: [], equipment: [], equipped: [] },
        { turnOrder: 1, x: 5, y: 5, currentBody: 5, inventory: [], equipment: [], equipped: [] },
      ],
      grid: [
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ],
    });
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.notifications).toEqual([]);
    expect(r.session.heroes[0].x).toBe(5);
    expect(r.session.heroes[1].currentBody).toBe(4);
  });

  it("possta aggiunge revealPoints", () => {
    const r = run("possta 2,3");
    expect(r.revealPoints).toEqual([{ x: 2, y: 3 }]);
  });

  it("posroc e posrocinv aggiornano la cella", () => {
    const r = run("posroc 5,5; posrocinv 5,7");
    const c5 = r.session.currentMap.grid.find((c) => c.x === 5 && c.y === 5);
    const c7 = r.session.currentMap.grid.find((c) => c.x === 5 && c.y === 7);
    expect(c5.arnt.antroc).toBe(true);
    expect(c7.arnt.inv).toBe(true);
  });

  it("posmostro imposta mostro e rimuove scriptImages sulla cella", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "posmostro 42,5,7" }], {
      sessionExtra: { scriptImages: [{ x: 5, y: 7, src: "/x.png" }] },
    });
    const r = executeDungeonScripts({ session, eventType: 6 });
    const cell = r.session.currentMap.grid.find((c) => c.x === 5 && c.y === 7);
    expect(cell.mostab.mosid).toBe(42);
    expect(cell.mostab.mos).toBe(true);
    expect(r.session.scriptImages).toEqual([]);
  });

  it("posps e posporta", () => {
    const r = run("posps 1,5,6; posporta 0,10,10");
    const cell = r.session.currentMap.grid.find((c) => c.x === 5 && c.y === 6);
    expect(cell.psgg.ps).toBe(1);
    expect(cell.psgg.oriz).toBe(true);
    expect(r.session.currentMap.porte).toHaveLength(1);
    expect(r.session.currentMap.porte[0]).toMatchObject({ x: 10, y: 10, oriz: false });
  });

  it("aggogg, aggarma, aggoro, aggoroid, rimogg", () => {
    const session = sessionWithScripts(
      [
        {
          x: 1,
          y: 1,
          evento: 6,
          text: "aggogg 7; aggarma 3; aggoro 15; aggoroid 0,5; rimogg 7",
        },
      ],
      { hero: { inventory: [], gold: 0 } }
    );
    const r = executeDungeonScripts({ session, eventType: 6 });
    const h = r.session.heroes[0];
    expect(h.inventory).toEqual([]);
    expect(h.equipment).toContain(3);
    expect(h.gold).toBe(20);
  });

  it("rrndogg rimuove un oggetto con random fisso", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "rrndogg" }], {
      hero: { inventory: [1, 2, 3] },
    });
    const r = executeDungeonScripts({
      session,
      eventType: 6,
      random: () => 0.99,
    });
    expect(r.session.heroes[0].inventory).toHaveLength(2);
  });

  it("agghp e agghppsg", () => {
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text: "agghp -2; agghppsg 0,3" }], {
      heroes: [
        { turnOrder: 0, x: 5, y: 5, currentBody: 10, inventory: [], equipment: [], equipped: [] },
      ],
    });
    const r = executeDungeonScripts({ session, eventType: 6 });
    expect(r.session.heroes[0].currentBody).toBe(11);
  });

  it("fineturno", () => {
    const r = run("fineturno");
    expect(r.effects.forceFinishTurn).toBe(true);
    expect(r.effects.stopMovement).toBe(true);
  });

  it("att, noatt, noattarma", () => {
    const r1 = run("noatt; att");
    expect(r1.effects.attackBlocked).toBe(false);

    const r2 = run("noatt");
    expect(r2.effects.attackBlocked).toBe(true);

    const r3 = run("noattarma 99", { hero: { equipped: [99] } });
    expect(r3.effects.attackBlocked).toBe(false);

    const r4 = run("noattarma 99", { hero: { equipped: [] } });
    expect(r4.effects.attackBlocked).toBe(true);
  });

  it("img normalizza path e aggiunge ScriptImage", () => {
    const r = run("img mob/x.png,5,7");
    expect(r.session.scriptImages).toHaveLength(1);
    expect(r.session.scriptImages[0]).toMatchObject({
      x: 5,
      y: 7,
      src: "/mob/x.png",
    });
  });

  it("blocchi condizionali: sestanza con context.roomId", () => {
    const r = run("sestanza 4\nmsg in4;\nend", {}, { context: { roomId: "4" } });
    expect(r.notifications).toEqual(["in4"]);
    const r2 = run("sestanza 4\nmsg in4;\nend", {}, { context: { roomId: "5" } });
    expect(r2.notifications).toEqual([]);
  });

  it("sestanza usa valo dell'eroe se roomId non è nel context", () => {
    const session = sessionWithScripts(
      [{ x: 1, y: 1, evento: 6, text: "sestanza 12\nmsg ok;\nend" }],
      { hero: { x: 5, y: 7 } }
    );
    const vm = visMap([[5, 7, 12]]);
    const r = executeDungeonScripts({ session, eventType: 6, visibilityMap: vm });
    expect(r.notifications).toEqual(["ok"]);
  });

  it("seogg e searma eseguono i figli solo se condizione vera", () => {
    const r = run("seogg 10\nmsg ha10;\nend", { hero: { inventory: [10] } });
    expect(r.notifications).toEqual(["ha10"]);
    const r2 = run("seogg 10\nmsg no;\nend", { hero: { inventory: [] } });
    expect(r2.notifications).toEqual([]);

    const r3 = run("searma 88\nmsg arma;\nend", { hero: { equipment: [88] } });
    expect(r3.notifications).toEqual(["arma"]);
    const r4 = run("searma 88\nmsg da_equipped;\nend", { hero: { equipped: [88] } });
    expect(r4.notifications).toEqual(["da_equipped"]);
  });

  it("serand: random memoizzato e confronto con valore atteso", () => {
    const text = `serand k,1,0
msg branch0;
end
serand k,1,1
msg branch1;
end`;
    let n = 0;
    const random = () => {
      n += 1;
      return n === 1 ? 0.1 : 0.9;
    };
    const session = sessionWithScripts([{ x: 1, y: 1, evento: 6, text }]);
    const r = executeDungeonScripts({ session, eventType: 6, random });
    expect(r.notifications).toEqual(["branch0"]);
  });
});

describe("moveCurrentHeroInSession", () => {
  it("sposta l'eroe del turno corrente", () => {
    const session = {
      currentTurn: 0,
      heroes: [{ turnOrder: 0, x: 1, y: 1, currentBody: 1 }],
    };
    const next = moveCurrentHeroInSession(session, 8, 9);
    expect(next.heroes[0].x).toBe(8);
    expect(next.heroes[0].y).toBe(9);
    expect(session.heroes[0].x).toBe(1);
  });
});
