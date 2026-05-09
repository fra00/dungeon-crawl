import React from "react";
import { PageNavigationEnum } from "../domain-core";

export default function EditorMapToolbar({
  onChangePageView,
  tool,
  setTool,
  handleNewMap,
  fileInputRef,
  handleImportFile,
  onPlaytest,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showValoOverlay,
  onToggleValoOverlay,
  canShowValoOverlay,
}) {
  return (
    <header className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-amber-900/40 bg-stone-900/90 shrink-0">
      <button
        type="button"
        className="px-3 py-1.5 rounded bg-stone-700 hover:bg-stone-600 text-sm"
        onClick={() => onChangePageView(PageNavigationEnum.MAIN_MENU)}
      >
        ← Menu
      </button>
      <span className="text-amber-500/90 font-serif text-sm tracking-wide">Editor mappe</span>
      <div className="flex gap-1 ml-2">
        {["select", "wall", "clear"].map((t) => (
          <button
            key={t}
            type="button"
            className={`px-2 py-1 rounded text-xs capitalize ${
              tool === t ? "bg-amber-800 text-white" : "bg-stone-800 text-stone-300"
            }`}
            onClick={() => setTool(t)}
          >
            {t === "select" ? "Seleziona" : t === "wall" ? "Muro/roccia" : "Svuota"}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="px-2 py-1 rounded bg-stone-800 text-xs disabled:opacity-40"
        disabled={!canUndo}
        onClick={onUndo}
        title="Annulla (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-stone-800 text-xs disabled:opacity-40"
        disabled={!canRedo}
        onClick={onRedo}
        title="Ripeti (Ctrl+Y / Ctrl+Shift+Z)"
      >
        Redo
      </button>
      <button type="button" className="px-2 py-1 rounded bg-stone-800 text-xs" onClick={handleNewMap}>
        Nuova
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-stone-800 text-xs"
        onClick={() => fileInputRef.current?.click()}
      >
        Importa JSON
      </button>
      {typeof onPlaytest === "function" && (
        <button
          type="button"
          className="px-2 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-xs text-emerald-100"
          onClick={onPlaytest}
        >
          Prova mappa
        </button>
      )}
      {typeof onToggleValoOverlay === "function" && (
        <button
          type="button"
          disabled={!canShowValoOverlay}
          className={`px-2 py-1 rounded text-xs disabled:opacity-40 ${
            showValoOverlay ? "bg-amber-800 text-white" : "bg-stone-800 text-stone-300"
          }`}
          onClick={onToggleValoOverlay}
          title="Mostra valo dal tabellone (visibilità stanze/corridoi)"
        >
          Valo
        </button>
      )}
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
      <span className="text-xs text-stone-500 ml-2">Tabellone: default.tbl (griglia 26×19)</span>
    </header>
  );
}
