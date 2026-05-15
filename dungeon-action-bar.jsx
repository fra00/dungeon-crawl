import React from "react";

const btnBase =
  "px-1.5 sm:px-2 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all border shadow-inner active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed flex-1 min-w-0 sm:flex-none sm:min-w-fit";

function ActionButton({ className = "", children, ...rest }) {
  return (
    <button type="button" className={`${btnBase} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/**
 * Barra azioni di turno. I PM sono tirati automaticamente a inizio turno (top bar + badge PM).
 */
export default function DungeonActionBar(props) {
  const {
    movementPoints,
    turnPhase = {},
    canOpenDoor,
    isTargeting = false,
    isMoving = false,
    onEndTurn,
    onSearchPassages,
    onSearchTreasure,
    onSearchTraps,
    canDisarmTrap = false,
    onDisarmTrap,
    onCancelTargeting,
    onOpenDoor,
  } = props;

  const isDoorOpenable = canOpenDoor === true || canOpenDoor?.found === true;
  const hasPerformedAction = turnPhase?.HasPerformedAction === true;
  const isActionDisabled = hasPerformedAction || isMoving || isTargeting;
  const pm =
    movementPoints !== null && movementPoints !== undefined
      ? movementPoints
      : null;

  return (
    <div
      className="dungeon-action-bar flex flex-wrap items-stretch justify-center gap-1 p-1 sm:p-1.5 bg-stone-900/98 border-t border-amber-700/50 font-serif text-stone-200"
      data-testid="dungeon-action-bar"
    >
      <ActionButton
        onClick={onEndTurn}
        disabled={isMoving}
        className="bg-red-900/90 hover:bg-red-800 border-red-700 text-red-100"
      >
        Fine
      </ActionButton>
      {pm !== null && (
        <div
          className="flex items-center justify-center px-2 py-1 rounded border border-amber-600/60 bg-amber-950/50 text-amber-200 text-[10px] sm:text-xs font-bold tabular-nums shrink-0"
          data-testid="dungeon-movement-points"
          aria-label={`Punti movimento: ${pm}`}
        >
          PM {pm}
        </div>
      )}
      <ActionButton
        onClick={onSearchPassages}
        disabled={hasPerformedAction}
        className="bg-yellow-900/70 hover:bg-yellow-800 border-yellow-700/60 text-yellow-200"
      >
        Passaggi
      </ActionButton>
      <ActionButton
        onClick={onSearchTreasure}
        disabled={hasPerformedAction}
        className="bg-yellow-900/70 hover:bg-yellow-800 border-yellow-700/60 text-yellow-200"
      >
        Tesori
      </ActionButton>
      <ActionButton
        onClick={onSearchTraps}
        disabled={hasPerformedAction}
        className="bg-yellow-900/70 hover:bg-yellow-800 border-yellow-700/60 text-yellow-200"
      >
        Trappole
      </ActionButton>
      {canDisarmTrap && (
        <ActionButton
          onClick={onDisarmTrap}
          disabled={isActionDisabled}
          className="bg-orange-800/90 hover:bg-orange-700 border-orange-600 text-orange-100"
        >
          Disinn.
        </ActionButton>
      )}
      {isDoorOpenable && (
        <ActionButton
          onClick={onOpenDoor}
          className="bg-green-900/90 hover:bg-green-800 border-green-700 text-green-100"
        >
          Porta
        </ActionButton>
      )}
      {isTargeting && (
        <ActionButton
          onClick={onCancelTargeting}
          className="bg-stone-700/90 hover:bg-stone-600 border-stone-500 text-stone-200"
        >
          Annulla
        </ActionButton>
      )}
    </div>
  );
}
