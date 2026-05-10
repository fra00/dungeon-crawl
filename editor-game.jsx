import React, { useCallback, useEffect, useMemo, useState } from "react";
import EditorMapToolbar from "./editor/EditorMapToolbar.jsx";
import EditorMapMessageBanner from "./editor/EditorMapMessageBanner.jsx";
import EditorMapGrid from "./editor/EditorMapGrid.jsx";
import EditorMapSidebar from "./editor/EditorMapSidebar.jsx";
import EditorScriptDialog from "./editor/EditorScriptDialog.jsx";
import { useEditorMapState } from "./editor/use-editor-map-state.js";
import { useCampaignManager } from "./dungeon-use-campaign-manager.js";
import { PageNavigationEnum } from "./domain-core.js";
import { applyFurnitureSelection, validateMapState } from "./editor-map-model.js";
import {
  buildDefaultHeroParty,
  buildEditorPlaytestSessionUpdate,
  stashEditorMapForPlaytest,
  setEditorPlaytestActive,
} from "./editor/editor-playtest-session.js";
import { sliceHeroesForMissionMap } from "./mission-party.js";

export default function EditorGame({
  onChangePageView = () => {},
  onUpdateSession = () => {},
  campaign = null,
  heroes: staticHeroes = [],
  monsters = [],
  items = [],
  equipment = [],
  boardData = null,
  treasureDeck = [],
  mobili = [],
}) {
  const SIDEBAR_WIDTH_KEY = "dg_editor_sidebar_width";
  const { loadCampaign } = useCampaignManager();
  const editor = useEditorMapState(monsters);
  const [showValoOverlay, setShowValoOverlay] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      const n = Number(raw);
      if (Number.isFinite(n)) return Math.min(620, Math.max(320, n));
    } catch {
      /* ignore */
    }
    return 440;
  });
  const [highlightedStructure, setHighlightedStructure] = useState(null);
  const [centerOnCellToken, setCenterOnCellToken] = useState(0);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);

  const handlePlaytest = useCallback(() => {
    const v = validateMapState(editor.mapState, {
      monsterIds: monsters.map((m) => m.id).filter((id) => id != null),
    });
    if (v.errors.length > 0) {
      editor.setLastMessage({ type: "err", text: v.errors.join(" ") });
      return;
    }
    const saved = loadCampaign();
    let party = saved?.heroes?.length ? saved.heroes : buildDefaultHeroParty(staticHeroes, equipment);
    if (!party?.length) {
      editor.setLastMessage({
        type: "err",
        text: "Nessun gruppo disponibile: avvia «Gioca» una volta per creare la campagna, oppure verifica heroes.json.",
      });
      return;
    }
    const mapDoc = { eroi_start: editor.mapState?.eroi_start || [] };
    const { heroes: missionParty, preMissionHeroesBackup } = sliceHeroesForMissionMap(party, mapDoc);
    stashEditorMapForPlaytest(editor.mapState);
    setEditorPlaytestActive(true);
    onUpdateSession((prev) =>
      buildEditorPlaytestSessionUpdate(prev, {
        mapState: editor.mapState,
        campaignName: campaign?.nome_campagna,
        heroes: missionParty,
        preMissionHeroesBackup,
      })
    );
    if (v.warnings.length > 0) {
      editor.setLastMessage({ type: "warn", text: `Playtest: ${v.warnings.join("; ")}` });
    } else {
      editor.setLastMessage({ type: "ok", text: "Playtest: briefing missione…" });
    }
    onChangePageView(PageNavigationEnum.DUNGEON_DESCRIPTION);
  }, [
    editor.mapState,
    editor.setLastMessage,
    loadCampaign,
    staticHeroes,
    equipment,
    campaign,
    monsters,
    onUpdateSession,
    onChangePageView,
  ]);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        editor.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor.undo, editor.redo]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  const startResizeSidebar = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev) => {
      const delta = startX - ev.clientX;
      const next = Math.min(620, Math.max(320, startW + delta));
      setSidebarWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  const focusEditorCell = useCallback((x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const gx = Math.max(0, Math.min(25, Number(x) - 1));
    const gy = Math.max(0, Math.min(18, Number(y) - 1));
    editor.setSelected({ x: gx, y: gy });
    setCenterOnCellToken((t) => t + 1);
  }, [editor.setSelected]);

  const toggleDoorAtCell = useCallback((x, y, enabled) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const mapX = Number(x) + 1;
    const mapY = Number(y) + 1;
    editor.setMapState((s) => {
      const doors = s.porte || [];
      const idx = doors.findIndex((d) => d.x === mapX && d.y === mapY);
      if (enabled) {
        if (idx >= 0) return s;
        return { ...s, porte: [...doors, { x: mapX, y: mapY, oriz: true }] };
      }
      if (idx < 0) return s;
      return {
        ...s,
        porte: doors.filter((_, i) => i !== idx),
      };
    });
    editor.setLastMessage({
      type: "ok",
      text: enabled ? `Porta aggiunta su (${mapX},${mapY}).` : `Porta rimossa da (${mapX},${mapY}).`,
    });
  }, [editor.setMapState, editor.setLastMessage]);

  const setDoorOrientationAtCell = useCallback((x, y, oriz) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const mapX = Number(x) + 1;
    const mapY = Number(y) + 1;
    editor.setMapState((s) => {
      const doors = s.porte || [];
      const idx = doors.findIndex((d) => d.x === mapX && d.y === mapY);
      if (idx < 0) return s;
      const next = [...doors];
      next[idx] = { ...next[idx], oriz: !!oriz };
      return { ...s, porte: next };
    });
  }, [editor.setMapState]);

  const handleSetCellFurniture = useCallback(
    (x, y, payload) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      editor.setMapState((s) => ({
        ...s,
        grid: applyFurnitureSelection(s.grid, x, y, payload, mobili),
      }));
    },
    [editor.setMapState, mobili]
  );

  const doorAtSelected = useMemo(() => {
    if (!editor.selected) return null;
    return (
      (editor.mapState.porte || []).find(
        (d) => d.x === editor.selected.x + 1 && d.y === editor.selected.y + 1
      ) || null
    );
  }, [editor.selected, editor.mapState.porte]);

  const finalTreasureCoord = useMemo(() => {
    const tf = editor.mapState.header?.tesoro_finale;
    const x = Number(tf?.x) || 0;
    const y = Number(tf?.y) || 0;
    return x > 0 && y > 0 ? { x, y } : null;
  }, [editor.mapState.header]);

  const isSelectedFinalTreasure = useMemo(() => {
    if (!editor.selected || !finalTreasureCoord) return false;
    return (
      finalTreasureCoord.x === editor.selected.x + 1 &&
      finalTreasureCoord.y === editor.selected.y + 1
    );
  }, [editor.selected, finalTreasureCoord]);

  const handleToggleFinalTreasure = useCallback(
    (cellX, cellY, enabled) => {
      if (!Number.isFinite(cellX) || !Number.isFinite(cellY)) return;
      const mapX = Number(cellX) + 1;
      const mapY = Number(cellY) + 1;
      if (enabled) {
        const tf = editor.mapState.header?.tesoro_finale;
        const prevX = Number(tf?.x) || 0;
        const prevY = Number(tf?.y) || 0;
        const hasOther = prevX > 0 && prevY > 0 && (prevX !== mapX || prevY !== mapY);
        if (hasOther) {
          const ok = window.confirm(
            `Esiste già un tesoro finale alla cella (${prevX},${prevY}). Spostarlo qui (${mapX},${mapY})?`
          );
          if (!ok) return;
        }
        editor.setMapState((s) => ({
          ...s,
          header: { ...s.header, tesoro_finale: { x: mapX, y: mapY } },
        }));
        editor.setLastMessage({
          type: "ok",
          text: hasOther
            ? `Tesoro finale spostato a (${mapX},${mapY}).`
            : `Tesoro finale impostato a (${mapX},${mapY}).`,
        });
      } else {
        editor.setMapState((s) => ({
          ...s,
          header: { ...s.header, tesoro_finale: { x: 0, y: 0 } },
        }));
        editor.setLastMessage({ type: "ok", text: "Tesoro finale rimosso." });
      }
    },
    [editor.setMapState, editor.setLastMessage, editor.mapState.header]
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-stone-950 text-stone-100">
      <EditorMapToolbar
        onChangePageView={onChangePageView}
        tool={editor.tool}
        setTool={editor.setTool}
        handleNewMap={editor.handleNewMap}
        fileInputRef={editor.fileInputRef}
        handleImportFile={editor.handleImportFile}
        onPlaytest={handlePlaytest}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        showValoOverlay={showValoOverlay}
        onToggleValoOverlay={() => setShowValoOverlay((v) => !v)}
        canShowValoOverlay={Array.isArray(boardData?.data) && boardData.data.length > 0}
      />
      <EditorMapMessageBanner lastMessage={editor.lastMessage} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <EditorMapGrid
          mapState={editor.mapState}
          selected={editor.selected}
          handleGridClick={editor.handleGridClick}
          boardData={boardData}
          showValoOverlay={showValoOverlay}
          monsters={monsters}
          equipment={equipment}
          heroes={staticHeroes}
          treasureDeck={treasureDeck}
          highlightedStructure={highlightedStructure}
          centerOnCellToken={centerOnCellToken}
          finalTreasureCoord={finalTreasureCoord}
        />
        <div
          className="w-1.5 shrink-0 cursor-col-resize bg-stone-800 hover:bg-amber-700/70 transition-colors"
          onMouseDown={startResizeSidebar}
          title="Ridimensiona pannello laterale"
        />
        <EditorMapSidebar
          mapState={editor.mapState}
          setMapState={editor.setMapState}
          heroes={staticHeroes}
          selectedCell={editor.selectedCell}
          applyCellPatch={editor.applyCellPatch}
          monsters={monsters}
          items={items}
          equipment={equipment}
          exportFilename={editor.exportFilename}
          setExportFilename={editor.setExportFilename}
          validation={editor.validation}
          handleExport={editor.handleExport}
          lastMessage={editor.lastMessage}
          onHighlightStructure={setHighlightedStructure}
          onFocusCell={focusEditorCell}
          sidebarWidth={sidebarWidth}
          heroStartPlacingId={editor.heroStartPlacingId}
          setHeroStartPlacingId={editor.setHeroStartPlacingId}
          hasDoorAtSelectedCell={!!doorAtSelected}
          selectedDoorOrientation={doorAtSelected?.oriz ?? true}
          onToggleDoorAtCell={toggleDoorAtCell}
          onSetDoorOrientationAtCell={setDoorOrientationAtCell}
          mobili={mobili}
          onSetCellFurniture={handleSetCellFurniture}
          finalTreasureCoord={finalTreasureCoord}
          isSelectedFinalTreasure={isSelectedFinalTreasure}
          onToggleFinalTreasure={handleToggleFinalTreasure}
          onOpenScriptDialog={() => setScriptDialogOpen(true)}
        />
      </div>
      <EditorScriptDialog
        open={scriptDialogOpen}
        onClose={() => setScriptDialogOpen(false)}
        mapState={editor.mapState}
        setMapState={editor.setMapState}
        selectedCell={editor.selected}
        onHighlightStructure={setHighlightedStructure}
        onFocusCell={focusEditorCell}
      />
    </div>
  );
}
