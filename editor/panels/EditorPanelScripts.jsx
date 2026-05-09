import React from "react";

const NEW_SCRIPT = { x: 0, y: 0, text: "", evento: 1, unavolta: false, morto: false, idmosc: 0 };

export default function EditorPanelScripts({ mapState, setMapState }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Script (lista)</h3>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded bg-amber-900/50 mb-2"
        onClick={() =>
          setMapState((s) => ({
            ...s,
            scripts: [...s.scripts, { ...NEW_SCRIPT }],
          }))
        }
      >
        + Aggiungi script
      </button>
      {(mapState.scripts || []).map((sc, i) => (
        <div key={i} className="mb-3 p-2 rounded bg-stone-800/80 border border-stone-700 space-y-1">
          <div className="flex gap-2">
            <input
              type="number"
              className="w-14 bg-stone-900 border border-stone-600 rounded px-1"
              placeholder="x"
              value={sc.x}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMapState((s) => {
                  const scr = [...s.scripts];
                  scr[i] = { ...scr[i], x: v };
                  return { ...s, scripts: scr };
                });
              }}
            />
            <input
              type="number"
              className="w-14 bg-stone-900 border border-stone-600 rounded px-1"
              placeholder="y"
              value={sc.y}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMapState((s) => {
                  const scr = [...s.scripts];
                  scr[i] = { ...scr[i], y: v };
                  return { ...s, scripts: scr };
                });
              }}
            />
            <input
              type="number"
              className="w-16 bg-stone-900 border border-stone-600 rounded px-1"
              placeholder="evento"
              value={sc.evento}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMapState((s) => {
                  const scr = [...s.scripts];
                  scr[i] = { ...scr[i], evento: v };
                  return { ...s, scripts: scr };
                });
              }}
            />
          </div>
          <textarea
            className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-xs font-mono"
            rows={3}
            value={sc.text || ""}
            onChange={(e) => {
              const v = e.target.value;
              setMapState((s) => {
                const scr = [...s.scripts];
                scr[i] = { ...scr[i], text: v };
                return { ...s, scripts: scr };
              });
            }}
          />
          <button
            type="button"
            className="text-red-400 text-xs"
            onClick={() =>
              setMapState((s) => ({
                ...s,
                scripts: s.scripts.filter((_, j) => j !== i),
              }))
            }
          >
            Rimuovi
          </button>
        </div>
      ))}
    </section>
  );
}
