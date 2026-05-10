import React, { useEffect, useMemo, useRef } from "react";
import { EDITOR_MAP_WIDTH, EDITOR_MAP_HEIGHT, cellAllowsMapExit } from "../editor-map-model.js";
import {
  EDITOR_CELL_PX,
  cellHasMonster,
  editorTabelloneBackgroundUrl,
  editorTrapImage,
  cellHasTreasureLoot,
  equipmentImageUrl,
} from "./editor-map-visual.js";
import { furnitureFlipStyle, doorPlaceholderStyle } from "../furniture-flip.js";

const CELL = EDITOR_CELL_PX;
const BOARD_W = EDITOR_MAP_WIDTH * CELL;
const BOARD_H = EDITOR_MAP_HEIGHT * CELL;

function CellStackImg({ src, alt, className = "", style = {} }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`pointer-events-none select-none object-contain max-w-[90%] max-h-[90%] drop-shadow-md ${className}`}
      style={style}
    />
  );
}

export default function EditorMapGrid({
  mapState,
  selected,
  handleGridClick,
  boardData = null,
  showValoOverlay = false,
  monsters = [],
  equipment = [],
  heroes = [],
  treasureDeck = [],
  highlightedStructure = null,
  centerOnCellToken = 0,
  finalTreasureCoord = null,
}) {
  const viewportRef = useRef(null);
  const bgUrl = useMemo(
    () => editorTabelloneBackgroundUrl(boardData, mapState?.header?.matrsf),
    [boardData, mapState?.header?.matrsf]
  );

  const valoByCoord = useMemo(() => {
    const data = boardData?.data;
    if (!Array.isArray(data)) return null;
    const m = new Map();
    for (const c of data) {
      if (c && Number.isFinite(c.x) && Number.isFinite(c.y) && c.valo != null && c.valo !== "") {
        m.set(`${c.x},${c.y}`, String(c.valo));
      }
    }
    return m;
  }, [boardData]);

  const monsterById = useMemo(() => {
    const m = new Map();
    for (const mon of monsters || []) {
      if (mon && mon.id != null) m.set(mon.id, mon);
    }
    return m;
  }, [monsters]);

  const equipmentById = useMemo(() => {
    const m = new Map();
    for (const e of equipment || []) {
      if (e && e.id != null) m.set(e.id, e);
    }
    return m;
  }, [equipment]);

  const heroById = useMemo(() => {
    const m = new Map();
    for (const h of heroes || []) {
      if (h && h.id != null) m.set(h.id, h);
    }
    return m;
  }, [heroes]);

  const treasureImgByValore = useMemo(() => {
    const m = new Map();
    for (const c of treasureDeck || []) {
      if (c && c.valore != null && c.immagine) m.set(Number(c.valore), String(c.immagine));
    }
    return m;
  }, [treasureDeck]);

  useEffect(() => {
    if (!selected || !viewportRef.current) return;
    const viewport = viewportRef.current;
    const targetX = selected.x * CELL + CELL / 2;
    const targetY = selected.y * CELL + CELL / 2;
    const left = Math.max(0, targetX - viewport.clientWidth / 2);
    const top = Math.max(0, targetY - viewport.clientHeight / 2);
    viewport.scrollTo({ left, top, behavior: "smooth" });
  }, [centerOnCellToken, selected]);

  return (
    <div ref={viewportRef} className="flex-1 overflow-auto p-3 bg-stone-900/50">
      <div
        className="relative shrink-0 shadow-lg border border-stone-700"
        style={{ width: BOARD_W, height: BOARD_H }}
      >
        <img
          src={bgUrl}
          alt="Tabellone"
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none z-0"
          draggable={false}
        />
        <div className="absolute inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.06)_0%,rgba(0,0,0,0.25)_100%)]" />

        {(mapState.grid || []).map((cell) => {
          const wall = cell.arnt?.antroc === true;
          const mobImg =
            cell.mobili?.num != null && cell.mobili?.img
              ? String(cell.mobili.img).trim()
              : "";
          if (wall || !mobImg) return null;
          const flipStyle = furnitureFlipStyle(cell.mobili?.flpo, cell.mobili?.flpv);
          return (
            <img
              key={`mob-${cell.x}-${cell.y}`}
              src={`/img/mobili/${mobImg}`}
              alt="mobile"
              draggable={false}
              className="absolute z-[3] pointer-events-none select-none drop-shadow-md"
              style={{ left: cell.x * CELL, top: cell.y * CELL, ...flipStyle }}
            />
          );
        })}

        {(mapState.porte || []).map((d, i) => {
          const img = d.oriz ? "portao.png" : "portav.png";
          const isHL =
            highlightedStructure?.type === "door" &&
            highlightedStructure?.x === d.x &&
            highlightedStructure?.y === d.y;
          // Geometria direzionale (+1): la porta gestisce UN SOLO vicino,
          // (x, y+1) per oriz=true, (x+1, y) per oriz=false.
          const neighbor1Based = d.oriz
            ? { x: d.x, y: d.y + 1 }
            : { x: d.x + 1, y: d.y };
          const arrow = d.oriz ? "↓" : "→";
          return (
            <React.Fragment key={`door-${i}`}>
              <img
                src={`/img/cell/${img}`}
                alt="porta"
                draggable={false}
                className="absolute z-[5] w-[34px] h-[34px] pointer-events-none drop-shadow-md"
                style={{
                  left: (d.x - 1) * CELL,
                  top: (d.y - 1) * CELL,
                  ...doorPlaceholderStyle(d.oriz),
                }}
              />
              {/* Indicatore direzionale: una sola freccia sul lato +1 gestito */}
              <div
                className="absolute z-[6] pointer-events-none flex items-center justify-center text-amber-300/90 text-[14px] font-bold drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]"
                style={{
                  left: (neighbor1Based.x - 1) * CELL,
                  top: (neighbor1Based.y - 1) * CELL,
                  width: CELL,
                  height: CELL,
                }}
                title={`Lato gestito dalla porta (${d.x},${d.y})`}
              >
                {arrow}
              </div>
              {isHL && (
                <>
                  <div
                    className="absolute z-[14] pointer-events-none border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                    style={{ left: (d.x - 1) * CELL, top: (d.y - 1) * CELL, width: CELL, height: CELL }}
                  />
                  <div
                    className="absolute z-[14] pointer-events-none border-2 border-cyan-400/70 border-dashed"
                    style={{
                      left: (neighbor1Based.x - 1) * CELL,
                      top: (neighbor1Based.y - 1) * CELL,
                      width: CELL,
                      height: CELL,
                    }}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* Indicatore direzionale per i passaggi segreti (stessa convenzione delle porte, +1). */}
        {(mapState.grid || [])
          .filter(
            (c) =>
              c.psgg?.ps != null && c.psgg?.ps !== 0 && Number(c.psgg.ps) > 0
          )
          .map((cell) => {
            // mapState.grid è 0-based; il vicino direzionale è +1 sull'asse di orientamento.
            const neighbor0Based = cell.psgg?.oriz
              ? { x: cell.x, y: cell.y + 1 }
              : { x: cell.x + 1, y: cell.y };
            const arrow = cell.psgg?.oriz ? "↓" : "→";
            return (
              <div
                key={`psgg-arrow-${cell.x}-${cell.y}`}
                className="absolute z-[6] pointer-events-none flex items-center justify-center text-violet-300/90 text-[12px] font-bold drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]"
                style={{
                  left: neighbor0Based.x * CELL,
                  top: neighbor0Based.y * CELL,
                  width: CELL,
                  height: CELL,
                }}
                title={`Lato gestito dal passaggio segreto (${cell.x + 1},${cell.y + 1})`}
              >
                {arrow}
              </div>
            );
          })}

        {mapState.grid.map((cell) => {
          const wall = cell.arnt?.antroc === true;
          const magic = cell.arnt?.inv === true;
          const sel = selected?.x === cell.x && selected?.y === cell.y;
          const valoLabel =
            showValoOverlay && valoByCoord
              ? valoByCoord.get(`${cell.x + 1},${cell.y + 1}`)
              : null;

          const hasMon = cellHasMonster(cell);
          const monDef = hasMon ? monsterById.get(cell.mostab.mosid) : null;
          const showMonster = !!monDef;

          const trapSrc = editorTrapImage(cell.trpl?.tipo);
          const hasTes = cellHasTreasureLoot(cell);
          const eq = (cell.tes?.arma || 0) > 0 ? equipmentById.get(cell.tes.arma) : null;
          const eqSrc = eq ? equipmentImageUrl(eq) : null;
          const oggId = cell.tes?.ogg || 0;
          const oggCardImg = oggId > 0 ? treasureImgByValore.get(oggId) : null;
          const oggSrc = oggCardImg ? `/img/cartetesoro/${oggCardImg}` : null;
          const monN = cell.tes?.mon || 0;
          const trpN = cell.tes?.trp || 0;
          const showSecret =
            cell.psgg?.ps != null && cell.psgg?.ps !== 0 && Number(cell.psgg.ps) > 0;
          const secretImg = showSecret ? (cell.psgg?.oriz ? "pso.png" : "psv.png") : null;

          return (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              title={`(${cell.x + 1},${cell.y + 1})${valoLabel != null ? ` · valo ${valoLabel}` : ""}${
                cellAllowsMapExit(cell) ? " · uscita mappa (scale)" : ""
              }`}
              className={`absolute z-[10] box-border flex items-center justify-center p-0 overflow-visible ${
                wall ? "" : "bg-black/0 hover:bg-amber-400/15"
              } ${magic ? "ring-1 ring-violet-500/60 ring-inset" : ""} ${
                sel ? "ring-2 ring-amber-400 ring-inset z-[11] shadow-[0_0_8px_rgba(251,191,36,0.6)]" : ""
              }`}
              style={{
                left: cell.x * CELL,
                top: cell.y * CELL,
                width: CELL,
                height: CELL,
              }}
              onClick={() => handleGridClick(cell.x, cell.y)}
            >
              {wall && (
                <img
                  src="/img/cell/pietra.png"
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
                />
              )}
              {secretImg ? (
                <CellStackImg
                  src={`/img/cell/${secretImg}`}
                  alt="psg"
                  className="absolute bottom-0 right-0 max-w-[55%] max-h-[55%] z-[2] opacity-90"
                  style={furnitureFlipStyle(cell.psgg?.flpo, cell.psgg?.flpv)}
                />
              ) : null}
              {trapSrc ? (
                <CellStackImg src={trapSrc} alt="trappola" className="relative z-[3]" />
              ) : null}
              {hasTes ? (
                <CellStackImg
                  src="/img/cell/tesoro.png"
                  alt="tesoro"
                  className={`relative z-[4] ${trapSrc || showMonster ? "max-w-[55%] max-h-[55%]" : ""}`}
                />
              ) : null}
              {eqSrc ? (
                <CellStackImg
                  src={eqSrc}
                  alt="arma"
                  className="absolute top-0 right-0 max-w-[48%] max-h-[48%] z-[5]"
                />
              ) : null}
              {oggSrc ? (
                <CellStackImg
                  src={oggSrc}
                  alt="ogg"
                  className="absolute bottom-0 left-0 max-w-[48%] max-h-[48%] z-[5]"
                />
              ) : null}
              {monN > 0 ? (
                <CellStackImg
                  src="/img/cartetesoro/Oro10.png"
                  alt="oro"
                  className="absolute top-0 left-0 max-w-[44%] max-h-[44%] z-[5] opacity-95"
                />
              ) : null}
              {trpN > 0 ? (
                <CellStackImg
                  src="/img/cartetesoro/Scrigno.png"
                  alt="carte"
                  className="absolute bottom-0 right-0 max-w-[44%] max-h-[44%] z-[5] opacity-95"
                />
              ) : null}
              {showMonster && monDef?.immagine ? (
                <CellStackImg
                  src={`/img/mostri/${monDef.immagine}`}
                  alt={monDef.nome || "mostro"}
                  className="relative z-[6]"
                />
              ) : null}
              {cellAllowsMapExit(cell) && (
                <span
                  className="absolute top-0 left-0 pointer-events-none text-[8px] font-bold leading-none px-0.5 py-0.5 rounded-br bg-teal-700/95 text-teal-50 z-[9] shadow-sm"
                  title="Uscita dalla mappa"
                >
                  U
                </span>
              )}
              {valoLabel != null && (
                <span className="absolute bottom-0 left-0 right-0 pointer-events-none text-[6px] leading-none font-mono text-amber-200/95 text-center bg-black/50 z-[8]">
                  {valoLabel}
                </span>
              )}
            </button>
          );
        })}

        {(mapState.eroi_start || []).map((st) => {
          const h = heroById.get(st.id);
          if (!h?.miniature) return null;
          return (
            <div
              key={`spawn-${st.id}`}
              className="absolute z-[12] pointer-events-none"
              style={{ left: (st.x - 1) * CELL, top: (st.y - 1) * CELL, width: CELL, height: CELL }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={`/img/eroi/${h.miniature}`}
                  alt={`spawn ${st.id}`}
                  draggable={false}
                  className="max-w-[70%] max-h-[70%] object-contain opacity-90 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                />
              </div>
              <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-amber-600 text-black rounded px-0.5 leading-none">
                S
              </span>
            </div>
          );
        })}
        {finalTreasureCoord && (
          <div
            className="absolute z-[13] pointer-events-none border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.95)]"
            style={{
              left: (finalTreasureCoord.x - 1) * CELL,
              top: (finalTreasureCoord.y - 1) * CELL,
              width: CELL,
              height: CELL,
            }}
          >
            <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-amber-500 text-black rounded px-0.5 leading-none shadow">
              ★
            </span>
          </div>
        )}
        {highlightedStructure?.type === "script" && (
          <div
            className="absolute z-[14] pointer-events-none border-2 border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.9)]"
            style={{
              left: (highlightedStructure.x - 1) * CELL,
              top: (highlightedStructure.y - 1) * CELL,
              width: CELL,
              height: CELL,
            }}
          />
        )}
      </div>
    </div>
  );
}
