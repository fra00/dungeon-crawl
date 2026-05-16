import React, { useState } from "react";

const topBtn =
  "px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide border shadow-inner active:scale-95 whitespace-nowrap";

/**
 * Barra superiore unificata: hamburger (solo audio/esci), eroe, inventario/magia.
 */
export default function DungeonTopBar({
  currentHero,
  movementPoints = null,
  currentTurn = null,
  canUseMagic = false,
  magicDisabled = false,
  chromeDisabled = false,
  onOpenInventory,
  onOpenMagic,
  audioMuted = false,
  onToggleAudioMuted,
  onExitMap,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentHero) return null;

  const heroClass = currentHero.hero?.classe || "Sconosciuto";
  const portraitSrc = currentHero.hero?.portrait
    ? `img/eroi/${currentHero.hero.portrait}`
    : null;
  const pm =
    movementPoints !== null && movementPoints !== undefined
      ? movementPoints
      : "—";

  const shellClass = chromeDisabled
    ? "dungeon-top-bar flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 min-h-[2.75rem] bg-stone-900/95 border-b border-amber-700/40 font-serif text-stone-200 shrink-0 opacity-55 pointer-events-none select-none"
    : "dungeon-top-bar flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 min-h-[2.75rem] bg-stone-900/95 border-b border-amber-700/40 font-serif text-stone-200 shrink-0";

  return (
    <div className={shellClass} aria-disabled={chromeDisabled || undefined}>
      <div className="relative shrink-0">
        <button
          type="button"
          className={`${topBtn} bg-stone-800 border-stone-600 text-stone-200 px-2.5`}
          aria-label="Opzioni"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>
        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Chiudi menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-50 p-2 rounded border border-amber-700/40 bg-stone-950 shadow-xl flex flex-col gap-1 min-w-[160px]">
              <button
                type="button"
                onClick={() => onToggleAudioMuted?.()}
                className="text-left text-xs py-1.5 px-2 rounded hover:bg-stone-800 text-stone-200"
              >
                Audio: {audioMuted ? "Spento" : "Attivo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExitMap?.();
                }}
                className="text-left text-xs py-1.5 px-2 rounded hover:bg-amber-950/80 text-amber-100 font-semibold"
              >
                Esci mappa
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-amber-800/80 overflow-hidden bg-stone-900 shrink-0">
          {portraitSrc ? (
            <img
              src={portraitSrc}
              alt=""
              className="w-full h-full object-cover"
              draggable="false"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[10px] text-stone-500">
              ?
            </span>
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <span className="text-xs sm:text-sm font-bold capitalize block truncate text-stone-100">
            {heroClass}
          </span>
          <span className="text-[10px] sm:text-xs text-blue-200 font-semibold">
            PM: {pm}
            {currentTurn != null && (
              <span className="text-stone-400 font-normal"> · T{currentTurn}</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canUseMagic && (
          <button
            type="button"
            onClick={onOpenMagic}
            disabled={magicDisabled}
            className={`${topBtn} bg-indigo-900/90 border-indigo-700 text-indigo-100 disabled:opacity-40`}
          >
            Magia
          </button>
        )}
        <button
          type="button"
          onClick={onOpenInventory}
          className={`${topBtn} bg-stone-800 border-stone-600 text-stone-300`}
        >
          Inv
        </button>
      </div>
    </div>
  );
}
