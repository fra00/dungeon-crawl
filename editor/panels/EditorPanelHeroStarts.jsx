import React from "react";

export default function EditorPanelHeroStarts({
  mapState,
  heroStartPlacingId = null,
  setHeroStartPlacingId = () => {},
}) {
  const rows = mapState.eroi_start || [];
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Eroi start</h3>
      <p className="text-xs text-stone-400 mb-2">
        Premi un eroe e poi clicca una cella della mappa per piazzare lo start.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[0, 1, 2, 3].map((id) => {
          const row = rows.find((r) => r.id === id);
          const active = heroStartPlacingId === id;
          return (
            <button
              key={id}
              type="button"
              className={`text-xs rounded border px-2 py-1.5 text-left ${
                active
                  ? "bg-amber-800 border-amber-600 text-white"
                  : "bg-stone-800 border-stone-600 text-stone-200 hover:bg-stone-700"
              }`}
              onClick={() => setHeroStartPlacingId(active ? null : id)}
            >
              <div className="font-semibold">Eroe {id}</div>
              <div className="text-[11px] opacity-80">
                {row ? `(${row.x}, ${row.y})` : "(non posizionato)"}
              </div>
            </button>
          );
        })}
      </div>
      {heroStartPlacingId != null && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-stone-700 hover:bg-stone-600"
          onClick={() => setHeroStartPlacingId(null)}
        >
          Annulla posizionamento
        </button>
      )}
    </section>
  );
}
