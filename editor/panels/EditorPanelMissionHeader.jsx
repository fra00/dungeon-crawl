import React from "react";

export default function EditorPanelMissionHeader({ mapState, setMapState }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Missione (header)</h3>
      <label className="block text-xs text-stone-400 mb-1">Descrizione</label>
      <textarea
        className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm min-h-[72px]"
        value={mapState.header.descrizione}
        onChange={(e) => setMapState((s) => ({ ...s, header: { ...s.header, descrizione: e.target.value } }))}
      />
      <p className="text-[11px] text-stone-500 mt-1">matrsf: {mapState.header.matrsf || "default.tbl"} (fisso)</p>
    </section>
  );
}
