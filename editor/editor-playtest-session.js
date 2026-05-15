import { toExportableMapDocument, normalizeImportedMap } from "../editor-map-model.js";

const DRAFT_KEY = "dg_editor_playtest_map";
const ACTIVE_KEY = "dg_editor_playtest_active";

export function stashEditorMapForPlaytest(mapState) {
  try {
    // Salviamo nello stesso formato canonico (1-based) usato per export/playtest,
    // così il round-trip con `takeStashedEditorMapForEditor` (che chiama
    // `normalizeImportedMap`) riporta correttamente la grid alla 0-based interna.
    const exportable = toExportableMapDocument(mapState);
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(exportable));
  } catch {
    /* ignore quota */
  }
}

/** Ripristina la mappa nell’editor dopo il playtest; rimuove la chiave. */
export function takeStashedEditorMapForEditor() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    return normalizeImportedMap(raw);
  } catch {
    return null;
  }
}

export function setEditorPlaytestActive(active) {
  try {
    if (active) sessionStorage.setItem(ACTIVE_KEY, "1");
    else sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

export function isEditorPlaytestActive() {
  try {
    return sessionStorage.getItem(ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

export {
  buildDefaultHeroParty,
  mergeCampaignRosterWithCatalog,
} from "../mission-party.js";

/**
 * Aggiornamento sessione per avviare il dungeon con la mappa corrente dall’editor.
 */
export function buildEditorPlaytestSessionUpdate(prevSession, { mapState, campaignName, heroes, preMissionHeroesBackup = null }) {
  const mapDoc = toExportableMapDocument(mapState);
  const baseSession = prevSession != null ? prevSession : {};
  return {
    ...baseSession,
    campaignName: campaignName || "Playtest editor",
    heroes,
    preMissionHeroesBackup,
    currentMap: mapDoc,
    currentMissionIndex: -1,
    monsters: [],
    openedDoors: [],
    spawnedLocations: [],
    currentTurn: 1,
    isHeroOrderConfirmed: false,
    lastAttack: null,
    treasureDeck: [],
    triggeredScripts: [],
    scriptImages: [],
  };
}
