/**
 * Dialog modale obbligatoria per il comando script `dlg` (testo + pulsante Chiudi).
 */

import React from "react";

export default function DungeonScriptDialog({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dungeon-script-dialog-title"
    >
      <div className="bg-stone-900 border-4 border-amber-800 rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
        <h2
          id="dungeon-script-dialog-title"
          className="text-lg font-serif text-amber-500 uppercase tracking-wide border-b border-amber-900/50 pb-2"
        >
          Messaggio
        </h2>
        <div className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[2rem]">
          {message || "\u00a0"}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-amber-800 hover:bg-amber-700 border-2 border-amber-600 text-amber-100 font-bold uppercase tracking-wide text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
