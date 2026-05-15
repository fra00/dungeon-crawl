import React from "react";

const btnSecondary =
  "w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wide border shadow-inner bg-yellow-900/70 hover:bg-yellow-800 border-yellow-700/60 text-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95";

/**
 * Bottom sheet mobile: azioni esplorazione, disinnesco, opzioni.
 */
export default function DungeonActionsSheet({
  open,
  onClose,
  hasPerformedAction,
  isActionDisabled,
  canDisarmTrap,
  canUseMagic,
  isTargeting,
  isDoorOpenable,
  audioMuted,
  onSearchPassages,
  onSearchTreasure,
  onSearchTraps,
  onDisarmTrap,
  onOpenMagic,
  onCancelTargeting,
  onOpenDoor,
  onToggleAudioMuted,
  onExitMap,
}) {
  if (!open) return null;

  return (
    <div className="dungeon-actions-sheet md:hidden fixed inset-0 z-40 flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        aria-label="Chiudi menu azioni"
        onClick={onClose}
      />
      <div
        className="relative pointer-events-auto bg-stone-900/98 border-t-2 border-amber-700/60 rounded-t-xl shadow-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[55vh] overflow-y-auto custom-scrollbar font-serif text-stone-200"
        role="dialog"
        aria-modal="true"
        aria-label="Altre azioni"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">
            Esplora e opzioni
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 px-2 py-1 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onSearchPassages?.();
              onClose?.();
            }}
            disabled={hasPerformedAction}
            className={btnSecondary}
          >
            Cerca Passaggi
          </button>
          <button
            type="button"
            onClick={() => {
              onSearchTreasure?.();
              onClose?.();
            }}
            disabled={hasPerformedAction}
            className={btnSecondary}
          >
            Cerca Tesori
          </button>
          <button
            type="button"
            onClick={() => {
              onSearchTraps?.();
              onClose?.();
            }}
            disabled={hasPerformedAction}
            className={btnSecondary}
          >
            Cerca Trappole
          </button>

          {canDisarmTrap && (
            <button
              type="button"
              onClick={() => {
                onDisarmTrap?.();
                onClose?.();
              }}
              disabled={isActionDisabled}
              className="w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wide border shadow-inner bg-orange-800/90 hover:bg-orange-700 border-orange-600 text-orange-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              Disinnesca Trappola
            </button>
          )}

          {canUseMagic && (
            <button
              type="button"
              onClick={() => {
                onOpenMagic?.();
                onClose?.();
              }}
              disabled={isActionDisabled}
              className="w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wide border shadow-inner bg-indigo-900/90 hover:bg-indigo-800 border-indigo-700 text-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              Magia
            </button>
          )}

          {isTargeting && (
            <button
              type="button"
              onClick={() => {
                onCancelTargeting?.();
                onClose?.();
              }}
              className="w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wide border shadow-inner bg-stone-700/90 hover:bg-stone-600 border-stone-500 text-stone-200 active:scale-95"
            >
              Annulla Bersaglio
            </button>
          )}

          {isDoorOpenable && (
            <button
              type="button"
              onClick={() => {
                onOpenDoor?.();
                onClose?.();
              }}
              className="w-full py-2 px-3 rounded text-sm font-bold uppercase tracking-wide border shadow-inner bg-green-900/90 hover:bg-green-800 border-green-700 text-green-100 active:scale-95"
            >
              Apri Porta
            </button>
          )}

          <div className="w-full h-px bg-stone-700/50 my-1" />

          <button
            type="button"
            onClick={() => onToggleAudioMuted?.()}
            className="w-full py-2 px-2 rounded text-xs font-semibold border border-stone-600 bg-stone-800/90 hover:bg-stone-700 text-stone-200"
          >
            Audio: {audioMuted ? "Spento" : "Attivo"}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onExitMap?.();
            }}
            className="w-full py-2 px-2 rounded text-xs font-bold uppercase tracking-wide border border-amber-800/70 bg-amber-950/60 hover:bg-amber-900/50 text-amber-100"
          >
            Esci dalla mappa
          </button>
        </div>
      </div>
    </div>
  );
}
