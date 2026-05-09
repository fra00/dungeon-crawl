import React from "react";

export default function EditorPanelDoors({ mapState, setMapState }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Porte</h3>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded bg-amber-900/50 mb-2"
        onClick={() =>
          setMapState((s) => ({
            ...s,
            porte: [...s.porte, { x: 4, y: 10, oriz: true }],
          }))
        }
      >
        + Aggiungi porta
      </button>
      {(mapState.porte || []).map((d, i) => (
        <div key={i} className="flex flex-wrap gap-2 mb-1 items-center text-sm">
          <input
            type="number"
            className="w-14 bg-stone-800 border border-stone-600 rounded px-1"
            value={d.x}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMapState((s) => {
                const p = [...s.porte];
                p[i] = { ...p[i], x: v };
                return { ...s, porte: p };
              });
            }}
          />
          <input
            type="number"
            className="w-14 bg-stone-800 border border-stone-600 rounded px-1"
            value={d.y}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMapState((s) => {
                const p = [...s.porte];
                p[i] = { ...p[i], y: v };
                return { ...s, porte: p };
              });
            }}
          />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={!!d.oriz}
              onChange={(e) => {
                const v = e.target.checked;
                setMapState((s) => {
                  const p = [...s.porte];
                  p[i] = { ...p[i], oriz: v };
                  return { ...s, porte: p };
                });
              }}
            />
            oriz
          </label>
          <button
            type="button"
            className="text-red-400 text-xs"
            onClick={() =>
              setMapState((s) => ({
                ...s,
                porte: s.porte.filter((_, j) => j !== i),
              }))
            }
          >
            ✕
          </button>
        </div>
      ))}
    </section>
  );
}
