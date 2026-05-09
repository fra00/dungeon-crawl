import React from "react";

export default function EditorPanelExport({
  exportFilename,
  setExportFilename,
  handleExport,
  validation,
}) {
  return (
    <section className="border-t border-stone-700 pt-4">
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Esporta</h3>
      <input
        type="text"
        className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm mb-2"
        value={exportFilename}
        onChange={(e) => setExportFilename(e.target.value)}
        placeholder="nome_file.json"
      />
      <button
        type="button"
        className="w-full py-2 rounded bg-amber-800 hover:bg-amber-700 text-sm font-medium"
        onClick={handleExport}
      >
        Scarica JSON
      </button>
      {validation.errors.length > 0 && (
        <p className="text-red-400 text-xs mt-2">{validation.errors.join(" ")}</p>
      )}
      {validation.warnings.length > 0 && validation.errors.length === 0 && (
        <p className="text-amber-200/80 text-xs mt-2">{validation.warnings.join(" ")}</p>
      )}
      <p className="text-[11px] text-stone-500 mt-2">
        Copia il file in <code className="text-amber-700/90">public/jsonData/map/</code> e aggiungi la missione in{" "}
        <code className="text-amber-700/90">campagne.json</code>.
      </p>
    </section>
  );
}
