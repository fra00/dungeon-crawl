import React, { useRef } from "react";
import { useBoardViewport } from "./use-board-viewport.js";
import {
  DUNGEON_BOARD_CHROME_WIDTH,
  DUNGEON_BOARD_CHROME_HEIGHT,
} from "./dungeon-board-constants.js";
import DungeonBoardZoomControls from "./dungeon-board-zoom-controls.jsx";

/**
 * Layout compatto: top bar + stats + board (fit massimo + zoom opzionale) + azioni.
 */
export default function DungeonGameShell({
  topBar = null,
  heroHud = null,
  board = null,
  actions = null,
  overlays = null,
}) {
  const boardSlotRef = useRef(null);
  const {
    displayScale,
    zoomStepIndex,
    zoomMultiplier,
    isPannable,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useBoardViewport(boardSlotRef);

  const scaledW = DUNGEON_BOARD_CHROME_WIDTH * displayScale;
  const scaledH = DUNGEON_BOARD_CHROME_HEIGHT * displayScale;
  const zoomLabel =
    zoomStepIndex === 0 ? null : `${Math.round(zoomMultiplier * 100)}%`;

  return (
    <div className="dungeon-shell game-viewport relative overflow-hidden">
      <div className="dungeon-shell-grid h-full w-full min-h-0">
        <header className="dungeon-shell-top min-h-0 shrink-0">{topBar}</header>
        <aside className="dungeon-shell-stats min-h-0 min-w-0">{heroHud}</aside>
        <div className="dungeon-board-frame relative min-h-0 min-w-0 overflow-hidden">
          <main
            ref={boardSlotRef}
            id="board-slot"
            className={`dungeon-board-slot h-full w-full touch-pan-x touch-pan-y ${
              isPannable
                ? "overflow-auto"
                : "overflow-hidden flex items-center justify-center"
            }`}
            data-pannable={isPannable ? "true" : "false"}
          >
            <div
              className={`dungeon-board-scaled relative shrink-0 ${
                isPannable ? "" : "mx-auto"
              }`}
              style={{ width: scaledW, height: scaledH }}
            >
              <div
                style={{
                  width: DUNGEON_BOARD_CHROME_WIDTH,
                  height: DUNGEON_BOARD_CHROME_HEIGHT,
                  transform: `scale(${displayScale})`,
                  transformOrigin: "top left",
                }}
              >
                {board}
              </div>
            </div>
          </main>
          <DungeonBoardZoomControls
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
            zoomLabel={zoomLabel}
          />
        </div>
        <footer className="dungeon-shell-actions min-h-0 z-30 shrink-0">{actions}</footer>
      </div>
      {overlays}
    </div>
  );
}
