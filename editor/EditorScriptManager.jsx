import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditorScriptHelp from "./panels/EditorScriptHelp.jsx";
import { summarizeValidation } from "../dungeon-script-validator.js";

const SCRIPT_EVENT_OPTIONS = [
  { value: 1, label: "1 — Movimento eroe" },
  { value: 2, label: "2 — Combattimento mostro" },
  { value: 3, label: "3 — Ricerca tesoro (stanza)" },
  { value: 4, label: "4 — Trappola (stanza)" },
  { value: 5, label: "5 — Passaggi segreti (stanza)" },
  { value: 6, label: "6 — Inizio missione" },
  { value: 7, label: "7 — Fine missione" },
  { value: 8, label: "8 — Cambio stanza" },
];

function NumberInput({ value, onChange, className = "" }) {
  return (
    <input
      type="number"
      className={`bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm ${className}`}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/**
 * Pannello compatto sotto la textarea che elenca errori/avvisi/info del
 * validatore sintattico. Si auto-nasconde quando lo script è vuoto.
 */
function ScriptValidationPanel({ validation }) {
  const [open, setOpen] = useState(true);
  if (!validation) return null;
  const { errors, warnings, infos, statements, ok } = validation;
  const total = errors.length + warnings.length + infos.length;
  const isEmpty = statements.length === 0 && total === 0;
  if (isEmpty) return null;

  const statusLabel = ok
    ? warnings.length > 0
      ? `${warnings.length} avviso/i`
      : "OK"
    : `${errors.length} error${errors.length === 1 ? "e" : "i"}`;
  const statusClass = ok
    ? warnings.length > 0
      ? "bg-amber-950/40 border-amber-700/60 text-amber-200"
      : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
    : "bg-red-950/40 border-red-800/60 text-red-300";
  const icon = ok ? (warnings.length > 0 ? "⚠" : "✓") : "✕";

  return (
    <div className={`rounded border ${statusClass} text-[11px] shrink-0`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-2 py-1 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        title="Espandi/comprimi dettagli validazione"
      >
        <span className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className="font-semibold uppercase tracking-wide">Validazione</span>
          <span className="opacity-80">— {statusLabel}</span>
          <span className="opacity-60">· {statements.length} statement</span>
        </span>
        <span className="opacity-70">{open ? "▾" : "▸"}</span>
      </button>
      {open && total > 0 && (
        <ul className="px-2 pb-2 space-y-1 leading-snug">
          {errors.map((it, i) => (
            <li key={`err-${i}`} className="text-red-300/95">
              <span className="font-mono mr-1">[err]</span>
              {it.line != null ? <span className="opacity-70 mr-1">L{it.line}:</span> : null}
              {it.message}
            </li>
          ))}
          {warnings.map((it, i) => (
            <li key={`warn-${i}`} className="text-amber-200/90">
              <span className="font-mono mr-1">[warn]</span>
              {it.line != null ? <span className="opacity-70 mr-1">L{it.line}:</span> : null}
              {it.message}
            </li>
          ))}
          {infos.map((it, i) => (
            <li key={`info-${i}`} className="text-stone-300/90">
              <span className="font-mono mr-1">[info]</span>
              {it.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * UI completa di gestione script, pensata per essere ospitata in una dialog
 * (layout a 3 colonne con guida sempre visibile sulla destra).
 *
 * Le coordinate (x, y) di uno script vengono prese dalla cella attualmente
 * selezionata sulla mappa: niente input manuali. Per spostare uno script
 * esistente basta selezionare un'altra cella sulla mappa e usare "Sposta qui".
 */
export default function EditorScriptManager({
  mapState,
  setMapState,
  selectedCell = null,
  onHighlightStructure = () => {},
  onFocusCell = () => {},
}) {
  const scripts = mapState.scripts || [];
  // Cella selezionata sulla mappa (0-based nell'editor) → coordinate 1-based per gli script.
  const selectedMapCoord = useMemo(() => {
    if (!selectedCell) return null;
    return { x: Number(selectedCell.x) + 1, y: Number(selectedCell.y) + 1 };
  }, [selectedCell]);

  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const [scriptFilter, setScriptFilter] = useState("");
  const [helpVisible, setHelpVisible] = useState(true);
  const helpAnchorRef = useRef(null);

  // All'apertura, se esiste già uno script sulla cella selezionata, mettilo a fuoco.
  const lastSelectionKeyRef = useRef(null);
  useEffect(() => {
    if (!selectedMapCoord) return;
    const key = `${selectedMapCoord.x},${selectedMapCoord.y}`;
    if (lastSelectionKeyRef.current === key) return;
    lastSelectionKeyRef.current = key;
    const idx = scripts.findIndex(
      (s) => Number(s.x) === selectedMapCoord.x && Number(s.y) === selectedMapCoord.y
    );
    if (idx >= 0) setSelectedScriptIndex(idx);
  }, [selectedMapCoord, scripts]);

  const safeScriptIndex = Math.max(0, Math.min(selectedScriptIndex, Math.max(scripts.length - 1, 0)));
  const selectedScript = scripts[safeScriptIndex] || null;

  // Validazione sintattica live dello script corrente.
  const validation = useMemo(
    () => summarizeValidation(selectedScript?.text ?? ""),
    [selectedScript?.text]
  );

  const scriptLabelList = useMemo(
    () => scripts.map((s, i) => `#${i + 1} (${s.x},${s.y}) ev:${s.evento ?? 0}`),
    [scripts]
  );

  const filteredScriptIndices = useMemo(() => {
    const q = scriptFilter.trim().toLowerCase();
    if (!q) return scripts.map((_, i) => i);
    return scripts
      .map((s, i) => ({
        s,
        i,
        text: `${scriptLabelList[i]} ${s.text || ""}`.toLowerCase(),
      }))
      .filter((row) => row.text.includes(q))
      .map((row) => row.i);
  }, [scripts, scriptFilter, scriptLabelList]);

  const focusGuide = useCallback(() => {
    setHelpVisible(true);
    requestAnimationFrame(() => {
      helpAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const updateScript = useCallback(
    (patch) => {
      setMapState((s) => {
        const scr = [...(s.scripts || [])];
        scr[safeScriptIndex] = { ...scr[safeScriptIndex], ...patch };
        return { ...s, scripts: scr };
      });
    },
    [safeScriptIndex, setMapState]
  );

  const addScript = useCallback(() => {
    if (!selectedMapCoord) return;
    setMapState((s) => ({
      ...s,
      scripts: [
        ...(s.scripts || []),
        {
          x: selectedMapCoord.x,
          y: selectedMapCoord.y,
          text: "",
          evento: 1,
          unavolta: false,
          morto: false,
          idmosc: 0,
        },
      ],
    }));
    setSelectedScriptIndex(scripts.length);
  }, [scripts.length, setMapState, selectedMapCoord]);

  const moveScriptToSelectedCell = useCallback(() => {
    if (!selectedMapCoord || !selectedScript) return;
    updateScript({ x: selectedMapCoord.x, y: selectedMapCoord.y });
  }, [selectedMapCoord, selectedScript, updateScript]);

  const removeScript = useCallback(() => {
    setMapState((s) => ({
      ...s,
      scripts: (s.scripts || []).filter((_, i) => i !== safeScriptIndex),
    }));
  }, [safeScriptIndex, setMapState]);

  return (
    <div
      className="flex flex-col gap-3 min-h-0 h-full"
      onMouseLeave={() => onHighlightStructure(null)}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm uppercase tracking-wide text-amber-500/95 font-semibold">
            Editor script
          </h3>
          {selectedScript ? (
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                validation.errors.length > 0
                  ? "bg-red-950/50 border-red-800/60 text-red-300"
                  : validation.warnings.length > 0
                  ? "bg-amber-950/50 border-amber-700/60 text-amber-200"
                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              }`}
              title={
                validation.errors.length === 0 && validation.warnings.length === 0
                  ? "Sintassi script valida"
                  : `${validation.errors.length} errori · ${validation.warnings.length} avvisi`
              }
            >
              {validation.errors.length > 0
                ? `✕ ${validation.errors.length} err`
                : validation.warnings.length > 0
                ? `⚠ ${validation.warnings.length} warn`
                : "✓ sintassi"}
            </span>
          ) : null}
          {selectedMapCoord ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">
              Cella selezionata:{" "}
              <span className="text-amber-300 font-mono">
                ({selectedMapCoord.x},{selectedMapCoord.y})
              </span>
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded bg-red-950/50 border border-red-800/40 text-red-300">
              Nessuna cella selezionata
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!selectedMapCoord}
            className="text-xs px-3 py-1.5 rounded bg-amber-900/50 hover:bg-amber-800/60 text-amber-100 border border-amber-700/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-900/50"
            onClick={addScript}
            title={
              selectedMapCoord
                ? `Aggiungi script alla cella (${selectedMapCoord.x},${selectedMapCoord.y})`
                : "Seleziona prima una cella sulla mappa"
            }
          >
            + Nuovo script su cella selezionata
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded border ${
              helpVisible
                ? "bg-stone-800 border-stone-600 text-stone-300"
                : "bg-amber-950/40 border-amber-700/60 text-amber-200 hover:bg-amber-900/40"
            }`}
            onClick={() => setHelpVisible((v) => !v)}
            title="Mostra/nascondi guida script"
          >
            {helpVisible ? "Nascondi guida" : "Mostra guida"}
          </button>
        </div>
      </div>

      {/* Layout principale */}
      <div className="flex flex-1 min-h-0 gap-3">
        {/* Colonna 1: lista script */}
        <div className="w-[260px] shrink-0 flex flex-col min-h-0 rounded border border-stone-700 bg-stone-900/70">
          <div className="p-2 border-b border-stone-700/70 shrink-0">
            <input
              type="text"
              className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs"
              placeholder="Filtra (#, coord, evento, testo)"
              value={scriptFilter}
              onChange={(e) => setScriptFilter(e.target.value)}
            />
            <div className="text-[10px] text-stone-500 mt-1">
              {filteredScriptIndices.length} di {scripts.length} script
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {scriptLabelList.length === 0 && (
              <p className="text-xs text-stone-500 italic">
                Nessuno script. Aggiungine uno.
              </p>
            )}
            {scriptLabelList.length > 0 && filteredScriptIndices.length === 0 && (
              <p className="text-xs text-stone-500 italic">Nessun risultato.</p>
            )}
            {filteredScriptIndices.map((i) => {
              const s = scripts[i];
              const evLabel =
                SCRIPT_EVENT_OPTIONS.find((o) => o.value === Number(s.evento ?? 0))?.label?.split(
                  " — "
                )[1] ?? `ev ${s.evento ?? 0}`;
              return (
                <button
                  key={`script-${i}`}
                  type="button"
                  className={`w-full text-left text-xs px-2 py-1.5 rounded border ${
                    i === safeScriptIndex
                      ? "bg-amber-900/50 border-amber-700 text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]"
                      : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                  }`}
                  onClick={() => setSelectedScriptIndex(i)}
                  onMouseEnter={() => onHighlightStructure({ type: "script", x: s.x, y: s.y })}
                  onDoubleClick={() => onFocusCell(s.x, s.y)}
                  title="Doppio click: vai alla cella sulla mappa"
                >
                  <div className="font-mono">#{i + 1} ({s.x},{s.y})</div>
                  <div className="text-[10px] text-stone-400 truncate">{evLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colonna 2: editor script */}
        <div className="flex-1 min-w-0 flex flex-col rounded border border-stone-700 bg-stone-900/70 min-h-0">
          {selectedScript ? (
            <>
              <div className="p-3 border-b border-stone-700/70 flex flex-wrap gap-3 items-end">
                <div className="flex flex-col">
                  <span className="text-[11px] text-stone-400">Cella associata</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-stone-800 border border-stone-700 text-amber-300 font-mono text-sm">
                      ({selectedScript.x},{selectedScript.y})
                    </span>
                    {(() => {
                      const cellMatches =
                        selectedMapCoord &&
                        Number(selectedScript.x) === selectedMapCoord.x &&
                        Number(selectedScript.y) === selectedMapCoord.y;
                      if (!selectedMapCoord) return null;
                      return cellMatches ? (
                        <span
                          className="text-[10px] text-emerald-400/80 italic"
                          title="La cella selezionata coincide con quella di questo script"
                        >
                          ✓ corrisponde alla selezione
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-[11px] px-2 py-1 rounded bg-amber-950/40 border border-amber-700/50 text-amber-200 hover:bg-amber-900/40"
                          onClick={moveScriptToSelectedCell}
                          title={`Sposta lo script su (${selectedMapCoord.x},${selectedMapCoord.y})`}
                        >
                          Sposta su ({selectedMapCoord.x},{selectedMapCoord.y})
                        </button>
                      );
                    })()}
                  </div>
                </div>
                <label className="text-[11px] text-stone-400 flex flex-col flex-1 min-w-[200px]">
                  Evento di trigger
                  <select
                    className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs mt-0.5"
                    value={Number(selectedScript.evento ?? 0)}
                    onChange={(e) => updateScript({ evento: Number(e.target.value) })}
                  >
                    {SCRIPT_EVENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded bg-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-800/60 border border-fuchsia-700/40"
                    onClick={() => onFocusCell(selectedScript.x, selectedScript.y)}
                    title="Centra la mappa sulla cella associata"
                  >
                    → Cella
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded bg-red-950/60 text-red-300 hover:bg-red-900/60 border border-red-800/50"
                    onClick={removeScript}
                  >
                    ✕ Rimuovi
                  </button>
                </div>
              </div>
              <div className="px-3 pt-2 pb-1 flex items-center gap-2 text-[10px] text-stone-500">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedScript.unavolta}
                    onChange={(e) => updateScript({ unavolta: e.target.checked })}
                  />
                  unavolta (esegui solo una volta)
                </label>
                <label className="flex items-center gap-1 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={!!selectedScript.morto}
                    onChange={(e) => updateScript({ morto: e.target.checked })}
                  />
                  morto (richiede mostro morto)
                </label>
                <label className="flex items-center gap-1 ml-2">
                  idmosc:
                  <NumberInput
                    value={selectedScript.idmosc ?? 0}
                    onChange={(v) => updateScript({ idmosc: v })}
                    className="w-14 ml-0.5"
                  />
                </label>
                <button
                  type="button"
                  className="ml-auto text-[11px] px-2 py-0.5 rounded border border-amber-700/50 text-amber-200/95 hover:bg-amber-950/35"
                  onClick={focusGuide}
                >
                  Guida sintassi
                </button>
              </div>
              <div className="flex-1 min-h-0 p-3 pt-2 flex flex-col gap-2">
                <textarea
                  className={`w-full flex-1 min-h-[160px] bg-stone-950 border rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none ${
                    validation.errors.length > 0
                      ? "border-red-700/60 focus:border-red-600"
                      : validation.warnings.length > 0
                      ? "border-amber-700/60 focus:border-amber-500"
                      : "border-stone-700 focus:border-amber-700/60"
                  }`}
                  value={selectedScript.text || ""}
                  onChange={(e) => updateScript({ text: e.target.value })}
                  placeholder="Es. msg attento;&#10;sestanza 5&#10;  posmostro 2,7,8&#10;end"
                  spellCheck={false}
                />
                <ScriptValidationPanel validation={validation} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-stone-500 italic">
              Seleziona uno script dalla lista o aggiungine uno nuovo.
            </div>
          )}
        </div>

        {/* Colonna 3: guida (mostrabile/nascondibile) */}
        {helpVisible && (
          <div
            ref={helpAnchorRef}
            className="w-[380px] shrink-0 flex flex-col rounded border border-stone-700 bg-stone-900/70 min-h-0"
          >
            <div className="p-2 border-b border-stone-700/70 flex items-center justify-between shrink-0">
              <h4 className="text-xs uppercase tracking-wide text-amber-500/95 font-semibold">
                Guida script
              </h4>
              <button
                type="button"
                className="text-[11px] text-stone-400 hover:text-amber-200"
                onClick={() => setHelpVisible(false)}
                title="Nascondi guida"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <EditorScriptHelp />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
