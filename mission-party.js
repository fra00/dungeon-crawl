/**
 * Partecipanti missione da `currentMap.eroi_start` e ripristino roster campagna a fine missione.
 */

/**
 * @param {Array<{ heroId: unknown }>} heroes
 * @param {{ eroi_start?: Array<{ id: unknown }> } | null | undefined} mapDoc
 * @returns {{ heroes: typeof heroes; preMissionHeroesBackup: typeof heroes | null }}
 */
export function sliceHeroesForMissionMap(heroes, mapDoc) {
  const roster = Array.isArray(heroes) ? heroes : [];
  const starts = mapDoc?.eroi_start;
  if (!Array.isArray(starts) || starts.length === 0) {
    return { heroes: roster, preMissionHeroesBackup: null };
  }
  const idSet = new Set(starts.map((s) => Number(s.id)));
  const filtered = roster.filter((h) => idSet.has(Number(h.heroId)));
  const missionHeroes = filtered.length > 0 ? filtered : roster;
  const backup =
    missionHeroes.length < roster.length ? roster : null;
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
