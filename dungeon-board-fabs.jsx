import React from "react";
import { ActionGlyph, IconCancelTarget, IconDisarmTrap, IconOpenDoor } from "./dungeon-action-icons.jsx";

const fabBase =
  "dungeon-board-fab flex flex-col items-center justify-center min-w-[3.25rem] min-h-[3.25rem] px-1.5 py-1 rounded-xl border-2 shadow-lg font-serif transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

/**
 * Azioni contestuali sul frame del tabellone (porta, disinnesco, annulla).
 * Posizionati fuori dalla scala del board così restano visibili con zoom/pan.
 */
export default function DungeonBoardFabs({
  chromeDisabled = false,
  isTargeting = false,
  isDoorOpenable = false,
  canDisarmTrap = false,
  isActionDisabled = false,
  onOpenDoor,
  onDisarmTrap,
  onCancelTargeting,
}) {
  if (chromeDisabled) return null;

  const showDoor = isDoorOpenable;
  const showDisarm = canDisarmTrap;
  const showCancel = isTargeting;

  if (!showDoor && !showDisarm && !showCancel) return null;

  return (
    <div
      className="dungeon-board-fabs absolute bottom-3 left-3 z-30 flex flex-col gap-2 pointer-events-auto"
      data-testid="dungeon-board-fabs"
    >
      {showCancel && (
        <button
          type="button"
          className={`${fabBase} bg-stone-800/95 border-stone-500 text-stone-100 hover:bg-stone-700`}
          aria-label="Annulla bersaglio"
          onClick={onCancelTargeting}
        >
          <ActionGlyph icon={IconCancelTarget} label="Annulla" iconClassName="w-5 h-5" />
        </button>
      )}
      {showDisarm && (
        <button
          type="button"
          className={`${fabBase} bg-orange-900/95 border-orange-500 text-orange-100 hover:bg-orange-800 ${
            showDoor ? "" : "dungeon-board-fab--pulse"
          }`}
          aria-label="Disinnesca trappola"
          disabled={isActionDisabled}
          onClick={onDisarmTrap}
        >
          <ActionGlyph icon={IconDisarmTrap} label="Disarma" iconClassName="w-5 h-5" />
        </button>
      )}
      {showDoor && (
        <button
          type="button"
          className={`${fabBase} bg-green-900/95 border-green-500 text-green-100 hover:bg-green-800 dungeon-board-fab--pulse`}
          aria-label="Apri porta"
          onClick={onOpenDoor}
        >
          <ActionGlyph icon={IconOpenDoor} label="Porta" iconClassName="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
