import React, { useEffect, useMemo, useRef, useState } from "react";
import EditorPanelMissionHeader from "./panels/EditorPanelMissionHeader.jsx";
import EditorPanelObjectives from "./panels/EditorPanelObjectives.jsx";
import EditorPanelHeroStarts from "./panels/EditorPanelHeroStarts.jsx";
import EditorPanelSelectedCell from "./panels/EditorPanelSelectedCell.jsx";
import EditorPanelExport from "./panels/EditorPanelExport.jsx";
import EditorTabsBar from "./ui/EditorTabsBar.jsx";
import EditorCollapsibleSection from "./ui/EditorCollapsibleSection.jsx";

export default function EditorMapSidebar({
  mapState,
  setMapState,
  selectedCell,
  applyCellPatch,
  monsters,
  items = [],
  equipment = [],
  exportFilename,
  setExportFilename,
  validation,
  handleExport,
  lastMessage = null,
  onHighlightStructure = () => {},
  onFocusCell = () => {},
  sidebarWidth = 440,
  heroStartPlacingId = null,
  setHeroStartPlacingId = () => {},
  hasDoorAtSelectedCell = false,
  selectedDoorOrientation = true,
  onToggleDoorAtCell = () => {},
  onSetDoorOrientationAtCell = () => {},
  mobili = [],
  onSetCellFurniture = () => {},
  finalTreasureCoord = null,
  isSelectedFinalTreasure = false,
  onToggleFinalTreasure = () => {},
  onOpenScriptDialog = () => {},
  heroes = [],
}) {
  const TAB_KEY = "dg_editor_active_tab";
  const tabs = useMemo(
    () => [
      { id: "cell", label: "Cella" },
      { id: "mission", label: "Missione" },
      { id: "script", label: "Script" },
      { id: "output", label: "Output" },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const t = localStorage.getItem(TAB_KEY);
      // "structures" è il nome legacy del tab Script: mappa al nuovo id.
      if (t === "structures") return "script";
      if (t === "cell" || t === "mission" || t === "script" || t === "output") return t;
    } catch {
      /* ignore */
    }
    return selectedCell ? "cell" : "mission";
  });

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  // Auto-apre la dialog quando si seleziona il tab Script.
  // Usiamo una ref per evitare di riaprirla se l'utente la chiude restando sul tab.
  const lastAutoOpenedRef = useRef(null);
  useEffect(() => {
    if (activeTab === "script" && lastAutoOpenedRef.current !== "script") {
      lastAutoOpenedRef.current = "script";
      onOpenScriptDialog();
    } else if (activeTab !== "script") {
      lastAutoOpenedRef.current = null;
    }
  }, [activeTab, onOpenScriptDialog]);

  return (
    <aside
      className="shrink-0 border-l border-amber-900/40 bg-stone-900 p-2 flex flex-col min-h-0"
      style={{ width: sidebarWidth }}
    >
      <div className="sticky top-0 z-20 bg-stone-900/95 backdrop-blur-sm pb-2">
        <EditorTabsBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <div className="mt-2 overflow-y-auto min-h-0 pr-1 space-y-3">
        {activeTab === "cell" && (
          <>
            <p className="text-[11px] text-stone-400 leading-snug px-1 -mt-1">
              Le <strong className="text-teal-300/95">uscite dal dungeon</strong> (scale) si impostano nel riquadro{" "}
              <em>Base &amp; Struttura</em>: contrassegno <span className="font-mono text-teal-200">U</span> sulla griglia.
              Di solito sono al massimo quattro celle.
            </p>
          <EditorPanelSelectedCell
            selectedCell={selectedCell}
            applyCellPatch={applyCellPatch}
            monsters={monsters}
            items={items}
            equipment={equipment}
            hasDoorAtCell={hasDoorAtSelectedCell}
            doorOrientation={selectedDoorOrientation}
            onToggleDoorAtCell={onToggleDoorAtCell}
            onSetDoorOrientationAtCell={onSetDoorOrientationAtCell}
            mobili={mobili}
            onSetCellFurniture={onSetCellFurniture}
            isFinalTreasure={isSelectedFinalTreasure}
            onToggleFinalTreasure={onToggleFinalTreasure}
          />
          </>
        )}

        {activeTab === "mission" && (
          <>
            <EditorCollapsibleSection
              title="Header missione"
              defaultOpen
              badge={<span className="text-[10px] text-stone-400">matrsf: {mapState.header?.matrsf || "default.tbl"}</span>}
            >
              <EditorPanelMissionHeader mapState={mapState} setMapState={setMapState} />
            </EditorCollapsibleSection>
            <EditorCollapsibleSection title="Obiettivi" defaultOpen>
              <EditorPanelObjectives
                mapState={mapState}
                setMapState={setMapState}
                items={items}
                equipment={equipment}
                monsters={monsters}
                finalTreasureCoord={finalTreasureCoord}
                onFocusCell={(x, y) => {
                  onFocusCell(x, y);
                  setActiveTab("cell");
                }}
                onClearFinalTreasure={() => onToggleFinalTreasure(0, 0, false)}
              />
            </EditorCollapsibleSection>
            <EditorCollapsibleSection title="Start eroi" defaultOpen={false}>
              <EditorPanelHeroStarts
                mapState={mapState}
                setMapState={setMapState}
                heroes={heroes}
                heroStartPlacingId={heroStartPlacingId}
                setHeroStartPlacingId={setHeroStartPlacingId}
              />
            </EditorCollapsibleSection>
          </>
        )}

        {activeTab === "script" && (
          <section className="rounded border border-amber-700/50 bg-stone-900/70 p-3 space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-amber-500/95">Script missione</h3>
            <p className="text-xs text-stone-300 leading-snug">
              La gestione degli script avviene in una finestra dedicata per avere più
              spazio (lista + editor + guida affiancati).
            </p>
            <div className="text-[11px] text-stone-400">
              {(mapState.scripts || []).length === 0 ? (
                <span className="italic">Nessuno script definito.</span>
              ) : (
                <span>
                  <span className="text-amber-300 font-semibold">
                    {(mapState.scripts || []).length}
                  </span>{" "}
                  script {(mapState.scripts || []).length === 1 ? "definito" : "definiti"}.
                </span>
              )}
            </div>
            <button
              type="button"
              className="w-full px-3 py-2 rounded border border-amber-700/60 bg-amber-900/40 hover:bg-amber-800/50 text-amber-100 text-sm font-semibold transition-colors"
              onClick={onOpenScriptDialog}
            >
              Apri editor script
            </button>
            <div className="text-[10px] text-stone-500 leading-snug">
              Suggerimento: la dialog si chiude con <kbd className="px-1 bg-stone-800 rounded">Esc</kbd>,
              click fuori dall'area, o sul pulsante ✕.
            </div>
          </section>
        )}

        {activeTab === "output" && (
          <>
            <section className="rounded border border-stone-700 bg-stone-900/60 p-2">
              <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Validazione</h3>
              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <p className="text-emerald-300 text-xs">Nessun problema rilevato.</p>
              )}
              {validation.errors.length > 0 && (
                <p className="text-red-300 text-xs">{validation.errors.join(" ")}</p>
              )}
              {validation.warnings.length > 0 && (
                <p className="text-amber-200 text-xs mt-1">{validation.warnings.join(" ")}</p>
              )}
            </section>
            <EditorPanelExport
              exportFilename={exportFilename}
              setExportFilename={setExportFilename}
              handleExport={handleExport}
              validation={validation}
            />
            {lastMessage && (
              <section className="rounded border border-stone-700 bg-stone-900/60 p-2">
                <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-1">Ultimo evento</h3>
                <p
                  className={`text-xs ${
                    lastMessage.type === "err"
                      ? "text-red-300"
                      : lastMessage.type === "warn"
                        ? "text-amber-200"
                        : "text-emerald-300"
                  }`}
                >
                  {lastMessage.text}
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
