import React from "react";

const ctl =
  "w-8 h-8 flex items-center justify-center rounded border border-amber-700/50 bg-stone-900/90 text-amber-200 text-lg font-bold shadow-md hover:bg-stone-800 active:scale-95 disabled:opacity-35 disabled:pointer-events-none";

export default function DungeonBoardZoomControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLabel,
}) {
  return (
    <div
      className="dungeon-board-zoom-controls absolute bottom-2 right-2 z-30 flex items-center gap-0.5 pointer-events-auto"
      aria-label="Zoom tabellone"
    >
      {zoomLabel != null && (
        <span className="text-[10px] text-stone-400 px-1 tabular-nums hidden sm:inline">
          {zoomLabel}
        </span>
      )}
      <button type="button" className={ctl} onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom indietro">
        −
      </button>
      <button type="button" className={ctl} onClick={onReset} aria-label="Adatta allo schermo" title="Adatta">
        ⊡
      </button>
      <button type="button" className={ctl} onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom avanti">
        +
      </button>
    </div>
  );
}
