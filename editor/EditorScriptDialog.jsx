import React, { useEffect } from "react";
import EditorScriptManager from "./EditorScriptManager.jsx";

/**
 * Dialog modale che ospita l'editor degli script.
 * Si chiude con click sul backdrop, sul pulsante X, o premendo Esc.
 */
export default function EditorScriptDialog({
  open,
  onClose,
  mapState,
  setMapState,
  selectedCell = null,
  onHighlightStructure,
  onFocusCell,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Editor script"
    >
      <div
        className="w-full h-full max-w-[1400px] max-h-[90vh] flex flex-col rounded-lg border-2 border-amber-800/60 bg-stone-900 shadow-[0_0_40px_rgba(251,191,36,0.15)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-amber-800/40 bg-stone-950/80 shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
            Gestione script della missione
          </h2>
          <button
            type="button"
            className="text-stone-400 hover:text-amber-300 transition-colors text-xl leading-none px-2"
            onClick={onClose}
            title="Chiudi (Esc)"
            aria-label="Chiudi dialog"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 p-3">
          <EditorScriptManager
            mapState={mapState}
            setMapState={setMapState}
            selectedCell={selectedCell}
            onHighlightStructure={onHighlightStructure}
            onFocusCell={(x, y) => {
              onFocusCell?.(x, y);
              onClose?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}
