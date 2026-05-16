import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionGlyph,
  IconActionsMenu,
  IconCancelTarget,
  IconDisarmTrap,
  IconEndTurn,
  IconMagic,
  IconOpenDoor,
  IconSearchPassages,
  IconSearchTreasure,
  IconSearchTraps,
} from "./dungeon-action-icons.jsx";

const iconBtnBase =
  "dungeon-sidebar-icon-btn flex items-center justify-center w-9 h-9 rounded border shadow-inner transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none";

function IconActionButton({ icon: Icon, label, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      className={`${iconBtnBase} ${className}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="w-[1.2rem] h-[1.2rem]" />
    </button>
  );
}

function MenuRow({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-2 w-full py-2 px-2.5 rounded text-left text-xs font-semibold border border-transparent hover:bg-stone-800/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-stone-200"
    >
      <Icon className="w-5 h-5 shrink-0 text-amber-200/90" />
      <span className="truncate">{label}</span>
    </button>
  );
}

const MENU_SEEN_KEY = "dungeon-actions-menu-seen";

/**
 * Azioni di turno nella colonna sinistra: menu (solo azioni di gioco) + shortcut + Fine.
 */
export default function DungeonSidebarActions({
  turnPhase = {},
  chromeDisabled = false,
  isTargeting = false,
  isMoving = false,
  canUseMagic = false,
  magicDisabled = false,
  isDoorOpenable = false,
  canDisarmTrap = false,
  isActionDisabled = false,
  onEndTurn,
  onSearchPassages,
  onSearchTreasure,
  onSearchTraps,
  onDisarmTrap,
  onOpenDoor,
  onOpenMagic,
  onCancelTargeting,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenuHint, setShowMenuHint] = useState(false);
  const zoneRef = useRef(null);
  const closeTimerRef = useRef(null);

  const hasPerformedAction = turnPhase?.HasPerformedAction === true;
  const exploreDisabled =
    chromeDisabled || hasPerformedAction || isMoving || isTargeting;
  const endTurnDisabled = chromeDisabled || isMoving;

  useEffect(() => {
    try {
      setShowMenuHint(!sessionStorage.getItem(MENU_SEEN_KEY));
    } catch {
      setShowMenuHint(true);
    }
  }, []);

  const markMenuSeen = useCallback(() => {
    setShowMenuHint(false);
    try {
      sessionStorage.setItem(MENU_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    markMenuSeen();
  }, [markMenuSeen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(closeMenu, 200);
  }, [closeMenu]);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(closeTimerRef.current);
    },
    []
  );

  const runMenuAction = (fn) => {
    fn?.();
    closeMenu();
  };

  const handlePointerZoneEnter = () => {
    cancelClose();
    openMenu();
  };

  const handlePointerZoneLeave = (e) => {
    const next = e.relatedTarget;
    if (zoneRef.current?.contains(next)) return;
    scheduleClose();
  };

  return (
    <div
      className="dungeon-sidebar-actions shrink-0 border-t border-amber-800/50 bg-stone-900/98 p-1 flex flex-col items-center gap-1"
      data-testid="dungeon-sidebar-actions"
    >
      <div
        ref={zoneRef}
        className="relative w-full flex flex-col items-center"
        onPointerEnter={handlePointerZoneEnter}
        onPointerLeave={handlePointerZoneLeave}
      >
        <button
          type="button"
          className={`${iconBtnBase} w-full max-w-[2.35rem] border-amber-500/70 bg-amber-950/80 text-amber-200 hover:bg-amber-900/90 ${
            showMenuHint ? "dungeon-action-menu-trigger--hint" : ""
          } ${menuOpen ? "ring-2 ring-amber-400/80" : ""}`}
          aria-label="Menu azioni di turno"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <IconActionsMenu className="w-[1.15rem] h-[1.15rem]" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-black/25 md:bg-transparent"
              aria-label="Chiudi menu azioni"
              onClick={closeMenu}
            />
            <div
              role="menu"
              aria-label="Azioni di turno"
              className="absolute left-full bottom-0 ml-1 z-50 min-w-[11.5rem] max-w-[min(16rem,70vw)] rounded-lg border border-amber-700/50 bg-stone-950/98 shadow-2xl p-1.5 font-serif"
              onPointerEnter={cancelClose}
              onPointerLeave={handlePointerZoneLeave}
            >
              <p className="px-2 pb-1 text-[9px] uppercase tracking-wider text-amber-600/90 font-bold">
                Azioni turno
              </p>
              <MenuRow
                icon={IconSearchPassages}
                label="Cerca passaggi"
                disabled={exploreDisabled}
                onClick={() => runMenuAction(onSearchPassages)}
              />
              <MenuRow
                icon={IconSearchTreasure}
                label="Cerca tesori"
                disabled={exploreDisabled}
                onClick={() => runMenuAction(onSearchTreasure)}
              />
              <MenuRow
                icon={IconSearchTraps}
                label="Cerca trappole"
                disabled={exploreDisabled}
                onClick={() => runMenuAction(onSearchTraps)}
              />
              {(isDoorOpenable || canDisarmTrap) && (
                <>
                  <div className="h-px bg-stone-700/60 my-1" />
                  {isDoorOpenable && (
                    <MenuRow
                      icon={IconOpenDoor}
                      label="Apri porta"
                      onClick={() => runMenuAction(onOpenDoor)}
                    />
                  )}
                  {canDisarmTrap && (
                    <MenuRow
                      icon={IconDisarmTrap}
                      label="Disinnesca trappola"
                      disabled={isActionDisabled}
                      onClick={() => runMenuAction(onDisarmTrap)}
                    />
                  )}
                </>
              )}
              {isTargeting && (
                <MenuRow
                  icon={IconCancelTarget}
                  label="Annulla bersaglio"
                  onClick={() => runMenuAction(onCancelTargeting)}
                />
              )}
              {canUseMagic && (
                <MenuRow
                  icon={IconMagic}
                  label="Magia"
                  disabled={magicDisabled}
                  onClick={() => runMenuAction(onOpenMagic)}
                />
              )}
            </div>
          </>
        )}
      </div>

      <div
        className="dungeon-sidebar-shortcuts grid grid-cols-1 gap-1 w-full p-0.5 rounded border border-stone-700/50 bg-stone-950/60"
        data-testid="dungeon-sidebar-shortcuts"
      >
        <IconActionButton
          icon={IconSearchPassages}
          label="Cerca passaggi"
          disabled={exploreDisabled}
          onClick={onSearchPassages}
          className="bg-yellow-900/50 hover:bg-yellow-800/70 border-yellow-700/50 text-yellow-100 w-full max-w-none"
        />
        <IconActionButton
          icon={IconSearchTreasure}
          label="Cerca tesori"
          disabled={exploreDisabled}
          onClick={onSearchTreasure}
          className="bg-yellow-900/50 hover:bg-yellow-800/70 border-yellow-700/50 text-yellow-100 w-full max-w-none"
        />
        <IconActionButton
          icon={IconSearchTraps}
          label="Cerca trappole"
          disabled={exploreDisabled}
          onClick={onSearchTraps}
          className="bg-yellow-900/50 hover:bg-yellow-800/70 border-yellow-700/50 text-yellow-100 w-full max-w-none"
        />
      </div>

      <button
        type="button"
        className={`${iconBtnBase} w-full max-w-none min-h-[2.6rem] flex-col gap-0.5 bg-red-900/90 hover:bg-red-800 border-red-600 text-red-50 disabled:opacity-35`}
        aria-label="Fine turno"
        title="Fine turno"
        disabled={endTurnDisabled}
        onClick={onEndTurn}
        data-testid="dungeon-end-turn-btn"
      >
        <IconEndTurn className="w-[1.1rem] h-[1.1rem]" />
        <span className="text-[8px] font-black uppercase tracking-wider leading-none">
          Fine
        </span>
      </button>
    </div>
  );
}
