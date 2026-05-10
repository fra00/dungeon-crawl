import React, { useMemo } from "react";

export default function EditorPanelHeroStarts({
  mapState,
  setMapState,
  heroes = [],
  heroStartPlacingId = null,
  setHeroStartPlacingId = () => {},
}) {
  const rows = mapState.eroi_start || [];

  const heroCatalog = useMemo(() => {
    if (Array.isArray(heroes) && heroes.length > 0) return heroes;
    return [0, 1, 2, 3].map((id) => ({ id, classe: `Eroe ${id}` }));
  }, [heroes]);

  const rowsSorted = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows]);

  const idsOnMap = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  const availableToAdd = useMemo(
    () => heroCatalog.filter((h) => h.id != null && !idsOnMap.has(h.id)),
    [heroCatalog, idsOnMap]
  );

  const labelForId = (id) => {
    const h = heroCatalog.find((x) => x.id === id);
    return h?.classe ? String(h.classe) : `Eroe ${id}`;
  };

  const removeStart = (id) => {
    setMapState((prev) => ({
      ...prev,
      eroi_start: (prev.eroi_start || []).filter((s) => s.id !== id),
    }));
    if (heroStartPlacingId === id) setHeroStartPlacingId(null);
  };

  const startPlacing = (id) => {
    setHeroStartPlacingId(heroStartPlacingId === id ? null : id);
  };

  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Start eroi</h3>
      <p className="text-xs text-stone-400 mb-2">
        Aggiungi solo gli eroi previsti per questa missione (anche uno solo). Dopo «Aggiungi», clicca una cella per
        piazzare lo spawn; «Sposta» riposiziona; «Rimuovi» toglie l&apos;eroe dalla mappa.
      </p>

      {rowsSorted.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[11px] uppercase tracking-wide text-stone-500">In mappa</div>
          <div className="grid grid-cols-1 gap-2">
            {rowsSorted.map((row) => {
              const active = heroStartPlacingId === row.id;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 rounded border border-stone-600 bg-stone-800/80 px-2 py-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-100 truncate">{labelForId(row.id)}</div>
                    <div className="text-[11px] text-stone-400">
                      ({row.x}, {row.y}) · id {row.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`text-xs rounded border px-2 py-0.5 shrink-0 ${
                      active
                        ? "bg-amber-800 border-amber-600 text-white"
                        : "bg-stone-700 border-stone-500 text-stone-200 hover:bg-stone-600"
                    }`}
                    onClick={() => startPlacing(row.id)}
                  >
                    {active ? "Annulla" : "Sposta"}
                  </button>
                  <button
                    type="button"
                    className="text-xs rounded border border-red-800/80 bg-red-950/50 text-red-200 px-2 py-0.5 shrink-0 hover:bg-red-900/60"
                    onClick={() => removeStart(row.id)}
                  >
                    Rimuovi
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {availableToAdd.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-stone-500">Aggiungi eroe</div>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.map((h) => {
              const id = h.id;
              const active = heroStartPlacingId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`text-xs rounded border px-2 py-1.5 ${
                    active
                      ? "bg-amber-800 border-amber-600 text-white"
                      : "bg-stone-800 border-stone-600 text-stone-200 hover:bg-stone-700"
                  }`}
                  onClick={() => setHeroStartPlacingId(active ? null : id)}
                >
                  + {h.classe != null ? String(h.classe) : `Eroe ${id}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableToAdd.length === 0 && rowsSorted.length > 0 && (
        <p className="text-[11px] text-stone-500 mt-2">Tutti gli eroi del catalogo sono già in mappa (max 4).</p>
      )}

      {heroStartPlacingId != null && (
        <p className="text-[11px] text-amber-400/95 mt-2">
          Clicca una cella del tabellone per{" "}
          {idsOnMap.has(heroStartPlacingId) ? "spostare" : "piazzare"} {labelForId(heroStartPlacingId)}.
        </p>
      )}
    </section>
  );
}
