import { useState, useCallback, useMemo, useRef } from "react";
import {
  createEmptyMapState,
  normalizeImportedMap,
  validateMapState,
  downloadMapJson,
  editorCellIndex,
  patchGridCell,
  toggleWallAt,
  resetCellAt,
} from "../editor-map-model.js";
import { takeStashedEditorMapForEditor } from "./editor-playtest-session.js";

const MAX_UNDO = 50;

export function useEditorMapState(monsters = []) {
  const [mapState, setMapState] = useState(() => takeStashedEditorMapForEditor() || createEmptyMapState());
  const [tool, setTool] = useState("select");
  const [selected, setSelected] = useState(null);
  const [heroStartPlacingId, setHeroStartPlacingId] = useState(null);
  const [exportFilename, setExportFilename] = useState("mia_mappa.json");
  const [lastMessage, setLastMessage] = useState(null);
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const fileInputRef = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const bumpHistory = useCallback(() => {
    setHistoryEpoch((e) => e + 1);
  }, []);

  const clearHistoryStacks = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    bumpHistory();
  }, [bumpHistory]);

  const setMapStateTracked = useCallback(
    (update) => {
      setMapState((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        if (next === prev) return prev;
        undoStack.current.push(structuredClone(prev));
        if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
        redoStack.current = [];
        Promise.resolve().then(bumpHistory);
        return next;
      });
    },
    [bumpHistory]
  );

  const undo = useCallback(() => {
    setMapState((current) => {
      if (undoStack.current.length === 0) return current;
      const prevSnap = undoStack.current.pop();
      redoStack.current.push(structuredClone(current));
      Promise.resolve().then(bumpHistory);
      return prevSnap;
    });
  }, [bumpHistory]);

  const redo = useCallback(() => {
    setMapState((current) => {
      if (redoStack.current.length === 0) return current;
      const nextSnap = redoStack.current.pop();
      undoStack.current.push(structuredClone(current));
      Promise.resolve().then(bumpHistory);
      return nextSnap;
    });
  }, [bumpHistory]);

  const canUndo = useMemo(() => undoStack.current.length > 0, [historyEpoch, mapState]);
  const canRedo = useMemo(() => redoStack.current.length > 0, [historyEpoch, mapState]);

  const monsterIds = useMemo(() => monsters.map((m) => m.id).filter((id) => id != null), [monsters]);

  const validation = useMemo(
    () => validateMapState(mapState, { monsterIds }),
    [mapState, monsterIds]
  );

  const applyCellPatch = useCallback((x, y, patch) => {
    setMapStateTracked((prev) => ({
      ...prev,
      grid: patchGridCell(prev.grid, x, y, patch),
    }));
  }, [setMapStateTracked]);

  const handleGridClick = useCallback(
    (x, y) => {
      if (heroStartPlacingId != null) {
        setMapStateTracked((prev) => {
          const nextStarts = [...(prev.eroi_start || [])];
          const idx = nextStarts.findIndex((row) => row.id === heroStartPlacingId);
          const mapX = x + 1;
          const mapY = y + 1;
          if (idx >= 0) nextStarts[idx] = { ...nextStarts[idx], x: mapX, y: mapY };
          else nextStarts.push({ id: heroStartPlacingId, x: mapX, y: mapY });
          return { ...prev, eroi_start: nextStarts };
        });
        setHeroStartPlacingId(null);
        return;
      }
      if (tool === "wall") {
        setMapStateTracked((prev) => ({ ...prev, grid: toggleWallAt(prev.grid, x, y) }));
        setSelected({ x, y });
        return;
      }
      if (tool === "clear") {
        setMapStateTracked((prev) => ({ ...prev, grid: resetCellAt(prev.grid, x, y) }));
        setSelected({ x, y });
        return;
      }
      setSelected({ x, y });
    },
    [tool, setMapStateTracked, heroStartPlacingId, setHeroStartPlacingId]
  );

  const selectedCell = useMemo(() => {
    if (!selected) return null;
    const idx = editorCellIndex(selected.x, selected.y);
    return mapState.grid[idx];
  }, [selected, mapState.grid]);

  const handleImportFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = normalizeImportedMap(reader.result);
          clearHistoryStacks();
          setMapStateTracked(() => parsed);
          setSelected(null);
          setLastMessage({ type: "ok", text: "Mappa importata." });
        } catch (err) {
          setLastMessage({ type: "err", text: err.message || "Import fallito." });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [setMapStateTracked, clearHistoryStacks]
  );

  const handleExport = useCallback(() => {
    const v = validateMapState(mapState, { monsterIds });
    if (v.errors.length > 0) {
      setLastMessage({ type: "err", text: v.errors.join(" ") });
      return;
    }
    downloadMapJson(mapState, exportFilename);
    if (v.warnings.length > 0) {
      setLastMessage({ type: "warn", text: `Esportato. Avvisi: ${v.warnings.join("; ")}` });
    } else {
      setLastMessage({ type: "ok", text: "File JSON scaricato." });
    }
  }, [mapState, exportFilename, monsterIds]);

  const handleNewMap = useCallback(() => {
    if (!window.confirm("Scartare le modifiche e creare una mappa vuota?")) return;
    clearHistoryStacks();
    setMapStateTracked(() => createEmptyMapState());
    setSelected(null);
    setLastMessage({ type: "ok", text: "Nuova mappa." });
  }, [setMapStateTracked, clearHistoryStacks]);

  return {
    mapState,
    setMapState: setMapStateTracked,
    tool,
    setTool,
    selected,
    setSelected,
    heroStartPlacingId,
    setHeroStartPlacingId,
    exportFilename,
    setExportFilename,
    lastMessage,
    setLastMessage,
    fileInputRef,
    validation,
    applyCellPatch,
    handleGridClick,
    selectedCell,
    handleImportFile,
    handleExport,
    handleNewMap,
    monsterIds,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
