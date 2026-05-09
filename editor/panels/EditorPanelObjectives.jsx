import React from "react";
import { EditorCatalogIdSelect, editorCatalogSelectClass } from "../EditorCatalogSelects.jsx";

const noneItem = { value: -1, label: "— nessun oggetto" };
const noneEquip = { value: -1, label: "— nessuna arma" };
const noneMonster = { value: -1, label: "— nessun mostro" };

export default function EditorPanelObjectives({
  mapState,
  setMapState,
  items = [],
  equipment = [],
  monsters = [],
  finalTreasureCoord = null,
  onFocusCell = () => {},
  onClearFinalTreasure = () => {},
}) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-amber-600/90 mb-2">Obiettivi</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="col-span-2">
          <span className="block">Mostro da uccidere (mostro_uscita)</span>
          <EditorCatalogIdSelect
            catalog={monsters}
            value={mapState.header.mostro_uscita}
            onChange={(id) =>
              setMapState((s) => ({
                ...s,
                header: { ...s.header, mostro_uscita: id },
              }))
            }
            noneOption={noneMonster}
            className={`mt-0.5 ${editorCatalogSelectClass}`}
          />
        </label>
        <div className="col-span-2 rounded border border-stone-700 bg-stone-900/60 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-amber-500/90">★ Tesoro finale</span>
            {finalTreasureCoord ? (
              <span className="text-xs text-amber-200">
                cella ({finalTreasureCoord.x},{finalTreasureCoord.y})
              </span>
            ) : (
              <span className="text-xs text-stone-500">nessuno</span>
            )}
          </div>
          {finalTreasureCoord ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-amber-900/50 hover:bg-amber-800/60"
                onClick={() => onFocusCell(finalTreasureCoord.x, finalTreasureCoord.y)}
              >
                Vai alla cella
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                onClick={() => onClearFinalTreasure()}
              >
                Rimuovi
              </button>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-stone-500">
              Per impostarlo: seleziona una cella sulla mappa, apri la sezione «Tesoro» e
              attiva «Tesoro finale della missione».
            </p>
          )}
        </div>
        <label className="col-span-2">
          oggetto_f / arma_f (missione)
          <div className="flex gap-2 mt-0.5 items-start">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-stone-500 block mb-0.5">Oggetto (item id)</span>
              <EditorCatalogIdSelect
                catalog={items}
                value={mapState.header.oggetto_f}
                onChange={(id) =>
                  setMapState((s) => ({
                    ...s,
                    header: { ...s.header, oggetto_f: id },
                  }))
                }
                noneOption={noneItem}
                className={`flex-1 ${editorCatalogSelectClass}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-stone-500 block mb-0.5">Arma (equip id)</span>
              <EditorCatalogIdSelect
                catalog={equipment}
                value={mapState.header.arma_f}
                onChange={(id) =>
                  setMapState((s) => ({
                    ...s,
                    header: { ...s.header, arma_f: id },
                  }))
                }
                noneOption={noneEquip}
                className={`flex-1 ${editorCatalogSelectClass}`}
              />
            </div>
          </div>
        </label>
      </div>
    </section>
  );
}
