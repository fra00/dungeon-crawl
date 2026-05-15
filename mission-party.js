/**
 * Partecipanti missione da `currentMap.eroi_start` e ripristino roster campagna a fine missione.
 */

/** Stesso schema usato da play-game per una nuova campagna. */
export function buildDefaultHeroParty(staticHeroes, staticEquipment) {
  if (!staticHeroes?.length) return [];
  return staticHeroes.map((hero) => {
    let initialEquipmentIds = [];
    if (hero.classe === "Barbaro") initialEquipmentIds = [13];
    else if (hero.classe === "Nano") initialEquipmentIds = [2];
    else if (hero.classe === "Elfo") initialEquipmentIds = [12];
    else if (hero.classe === "Mago") initialEquipmentIds = [4];

    const equippedIds = (staticEquipment || [])
      .filter((e) => initialEquipmentIds.includes(e.id))
      .map((e) => e.id);

    return {
      heroId: hero.id,
      hero,
      currentBody: hero.corpo,
      currentMind: hero.mente,
      gold: 0,
      inventory: [],
      equipment: equippedIds,
      equipped: equippedIds,
      availableSpells: [],
      activeStatus: [],
      isEscaped: false,
      x: 0,
      y: 0,
      turnOrder: 0,
    };
  });
}

/**
 * Allinea il salvataggio al catalogo (heroes.json): se in missione 1 c'era solo il Barbaro,
 * a missione 2 gli spawn (es. Mago id 2) trovano comunque l'eroe nel roster.
 */
export function mergeCampaignRosterWithCatalog(savedHeroes, staticHeroes, staticEquipment) {
  const defaults = buildDefaultHeroParty(staticHeroes, staticEquipment);
  const byId = new Map(
    (Array.isArray(savedHeroes) ? savedHeroes : []).map((h) => [Number(h.heroId), h])
  );
  return defaults.map((def) => {
    const saved = byId.get(Number(def.heroId));
    if (!saved) return def;
    return {
      ...def,
      ...saved,
      hero: saved.hero ?? def.hero,
    };
  });
}

/**
 * @param {Array<{ heroId: unknown }>} heroes
 * @param {{ eroi_start?: Array<{ id: unknown }> } | null | undefined} mapDoc
 * @param {{ strictSpawnSubset?: boolean }} [options] — `strictSpawnSubset: true` (playtest editor): partecipano
 *   solo gli eroi con spawn sulla mappa; mai il roster intero se mancano spawn o gli id non coincidono.
 * @returns {{ heroes: typeof heroes; preMissionHeroesBackup: typeof heroes | null }}
 */
export function sliceHeroesForMissionMap(heroes, mapDoc, options = {}) {
  const roster = Array.isArray(heroes) ? heroes : [];
  const strictSpawnSubset = options.strictSpawnSubset === true;
  const starts = mapDoc?.eroi_start;
  if (!Array.isArray(starts) || starts.length === 0) {
    if (strictSpawnSubset) {
      return {
        heroes: [],
        preMissionHeroesBackup: roster.length ? roster : null,
      };
    }
    return { heroes: roster, preMissionHeroesBackup: null };
  }
  const idSet = new Set(starts.map((s) => Number(s.id)));
  const filtered = roster.filter((h) => idSet.has(Number(h.heroId)));
  const missionHeroes =
    filtered.length > 0 ? filtered : strictSpawnSubset ? [] : roster;
  const backup =
    roster.length > 0 && missionHeroes.length < roster.length ? roster : null;
  return { heroes: missionHeroes, preMissionHeroesBackup: backup };
}

/**
 * Ripristina gli eroi non presenti in missione e aggiorna chi ha giocato con lo stato finale.
 * @param {Array<object>|null|undefined} backupRoster — roster campagna completo all'ingresso
 * @param {Array<object>|null|undefined} missionHeroes — stato finale degli eroi in missione (sottoinsieme)
 */
export function mergeMissionHeroesIntoCampaignRoster(backupRoster, missionHeroes) {
  if (!Array.isArray(backupRoster) || backupRoster.length === 0) {
    return Array.isArray(missionHeroes) ? [...missionHeroes] : [];
  }
  const byId = new Map((missionHeroes || []).map((h) => [Number(h.heroId), h]));
  return backupRoster.map((full) => {
    const m = byId.get(Number(full.heroId));
    return m ? { ...full, ...m, hero: full.hero } : full;
  });
}

/** Solo Mago ed Elfo richiedono la selezione iniziale degli incantesimi in missione. */
export function heroUsesMissionSpellSelection(hero) {
  const cls = (hero?.hero?.classe ?? "").toString().trim().toLowerCase();
  return cls === "mago" || cls === "elfo";
}

export function missionHeroesNeedSpellSelection(heroes) {
  return Array.isArray(heroes) && heroes.some(heroUsesMissionSpellSelection);
}

export function filterHeroesForSpellSelection(heroes) {
  if (!Array.isArray(heroes)) return [];
  return heroes.filter(heroUsesMissionSpellSelection);
}
