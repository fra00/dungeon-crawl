import { executeDungeonScripts } from "./dungeon-script-runtime.js";

/**
 * Esegue script missione evento 2 (combattimento) con onDeath: true per il tipo mostro ucciso.
 * Da chiamare sulla sessione già aggiornata (mostro rimosso dall'array).
 */
export function applyMonsterDeathMissionScripts(session, killedMonster, visibilityMap) {
  if (!session || !killedMonster?.monster || killedMonster.monster.id == null) {
    return {
      session,
      handled: false,
      notifications: [],
      revealPoints: [],
      blockingDialogs: [],
      effects: {},
      scriptSuspended: false,
    };
  }
  return executeDungeonScripts({
    session,
    eventType: 2,
    context: { monsterTypeId: killedMonster.monster.id, onDeath: true },
    visibilityMap,
  });
}

/** Notifiche, rivelazione nebbia e dialog da `applyMonsterDeathMissionScripts`. */
export function flushMonsterDeathScriptSideEffects(
  dr,
  { onNotify, fogOfWarLogic, onScriptBlockingDialog } = {}
) {
  dr?.notifications?.forEach((n) => onNotify?.(n));
  dr?.revealPoints?.forEach((p) => fogOfWarLogic?.revealFromPoint?.(p.x, p.y));
  if (dr?.blockingDialogs?.length && onScriptBlockingDialog) {
    onScriptBlockingDialog(dr.blockingDialogs);
  }
}
