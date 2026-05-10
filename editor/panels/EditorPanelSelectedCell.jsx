import React, { useMemo } from "react";
import { EditorCatalogIdSelect, editorCatalogSelectClass } from "../EditorCatalogSelects.jsx";
import EditorCollapsibleSection from "../ui/EditorCollapsibleSection.jsx";
import { cellHasMonster, findMobileEntryByImg } from "../editor-map-visual.js";
import { cellAllowsMapExit } from "../../editor-map-model.js";

const cellSelectClass = `${editorCatalogSelectClass} px-1`;

export default function EditorPanelSelectedCell({
  selectedCell,
  applyCellPatch,
  monsters = [],
  items = [],
  equipment = [],
  hasDoorAtCell = false,
  doorOrientation = true,
  onToggleDoorAtCell = () => {},
  onSetDoorOrientationAtCell = () => {},
  mobili = [],
  onSetCellFurniture = () => {},
  isFinalTreasure = false,
  onToggleFinalTreasure = () => {},
}) {
  const mobileMatch = useMemo(
    () => findMobileEntryByImg(mobili, selectedCell?.mobili?.img),
    [mobili, selectedCell?.mobili?.img]
  );
  if (!selectedCell) {
    return (
      <section className="rounded border border-dashed border-stone-700 p-3 text-xs text-stone-400">
        Seleziona una cella sulla mappa per modificarne le proprietà.
      </section>
    );
  }
  const hasMonster = cellHasMonster(selectedCell);
  const hasTreasure =
    (selectedCell.tes?.mon || 0) > 0 ||
    (selectedCell.tes?.trp || 0) > 0 ||
    (selectedCell.tes?.ogg || 0) > 0 ||
    (selectedCell.tes?.arma || 0) > 0;
  const hasTrap = (selectedCell.trpl?.tipo || 0) > 0;
  const hasMobile = selectedCell.mobili?.num != null;
  const hasStructure =
    selectedCell.arnt?.antroc === true ||
    selectedCell.arnt?.inv === true ||
    hasMobile ||
    (selectedCell.psgg?.ps || 0) > 0;
  const currentTypeId = mobileMatch?.typeEntry?.id ?? "";
  const currentVariantKey = mobileMatch?.variant?.key ?? "";
  const variantsForCurrent = mobileMatch?.typeEntry?.variants ?? [];
  return (
    <section className="space-y-2">
      <div className="rounded border border-stone-700 bg-stone-900/70 p-2">
        <h3 className="text-xs uppercase tracking-wide text-amber-500/90">
          Cella ({selectedCell.x + 1},{selectedCell.y + 1})
        </h3>
        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
          {hasMonster && <span className="px-1 py-0.5 rounded bg-red-900/60 text-red-200">Mostro</span>}
          {hasTreasure && <span className="px-1 py-0.5 rounded bg-yellow-900/60 text-yellow-200">Tesoro</span>}
          {hasTrap && <span className="px-1 py-0.5 rounded bg-orange-900/60 text-orange-200">Trappola</span>}
          {hasMobile && <span className="px-1 py-0.5 rounded bg-emerald-900/60 text-emerald-200">Mobile</span>}
          {isFinalTreasure && (
            <span
              className="px-1 py-0.5 rounded bg-amber-700/80 text-amber-100 ring-1 ring-amber-300/60"
              title="Questa cella è il tesoro finale della missione"
            >
              ★ Tesoro finale
            </span>
          )}
          {hasStructure && <span className="px-1 py-0.5 rounded bg-blue-900/60 text-blue-200">Struttura</span>}
          {cellAllowsMapExit(selectedCell) && (
            <span
              className="px-1 py-0.5 rounded bg-teal-900/70 text-teal-100 ring-1 ring-teal-500/50"
              title="Uscita dalla missione (scale)"
            >
              Uscita
            </span>
          )}
          {!hasMonster &&
            !hasTreasure &&
            !hasTrap &&
            !hasStructure &&
            !cellAllowsMapExit(selectedCell) && (
            <span className="px-1 py-0.5 rounded bg-stone-800 text-stone-300">Vuota</span>
          )}
        </div>
      </div>

      <EditorCollapsibleSection title="Base & Struttura" defaultOpen>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!selectedCell.arnt?.inv}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  arnt: { ...selectedCell.arnt, inv: e.target.checked },
                })
              }
            />
            arnt.inv (blocco magico)
          </label>
          <div className="rounded border border-teal-800/50 bg-teal-950/25 px-2 py-2 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 shrink-0"
                checked={cellAllowsMapExit(selectedCell)}
                onChange={(e) =>
                  applyCellPatch(selectedCell.x, selectedCell.y, {
                    fine: e.target.checked ? 1 : 0,
                  })
                }
              />
              <span>
                <span className="text-teal-100/95 font-medium">Uscita dalla mappa (scale)</span>
                <span className="block text-[11px] text-stone-400 mt-0.5 leading-snug">
                  Se attiva, l&apos;eroe può uscire dal dungeon da questa cella (come nelle mappe HQ). Di solito si
                  collocano sulle celle delle scale; al massimo 4 uscite sono tipiche. Nel JSON il campo è{" "}
                  <code className="text-amber-200/90">fine</code> (0 = no, ≠0 = sì).
                </span>
              </span>
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedCell.psgg?.ps != null && selectedCell.psgg?.ps !== 0}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  psgg: {
                    ...selectedCell.psgg,
                    ps: e.target.checked ? 1 : null,
                  },
                })
              }
            />
            Passaggio segreto (psgg.ps)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!selectedCell.psgg?.oriz}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  psgg: { ...selectedCell.psgg, oriz: e.target.checked },
                })
              }
            />
            Passaggio orizzontale
          </label>
          {selectedCell.psgg?.ps != null && Number(selectedCell.psgg.ps) > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 pl-1">
                <label
                  className="flex items-center gap-2 text-xs"
                  title="Specchia orizzontalmente l'icona del passaggio segreto"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedCell.psgg?.flpo}
                    onChange={(e) =>
                      applyCellPatch(selectedCell.x, selectedCell.y, {
                        psgg: { ...selectedCell.psgg, flpo: e.target.checked },
                      })
                    }
                  />
                  Mirror orizzontale (flpo)
                </label>
                <label
                  className="flex items-center gap-2 text-xs"
                  title="Specchia verticalmente l'icona del passaggio segreto"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedCell.psgg?.flpv}
                    onChange={(e) =>
                      applyCellPatch(selectedCell.x, selectedCell.y, {
                        psgg: { ...selectedCell.psgg, flpv: e.target.checked },
                      })
                    }
                  />
                  Mirror verticale (flpv)
                </label>
              </div>
              <div
                className="text-[11px] leading-snug rounded border border-violet-700/40 bg-violet-900/20 px-2 py-1 text-violet-200/90"
                title="Il passaggio segreto è direzionale: collega la propria cella con il vicino al lato +1 dell'asse di orientamento."
              >
                Collega ({selectedCell.x + 1},{selectedCell.y + 1}) con {selectedCell.psgg?.oriz
                  ? `(${selectedCell.x + 1},${selectedCell.y + 2})`
                  : `(${selectedCell.x + 2},${selectedCell.y + 1})`}
                <div className="text-[10px] text-violet-400/70 mt-0.5">
                  Geometria direzionale (+1): l'apertura è {selectedCell.psgg?.oriz ? "verticale (asse Y, lato sud)" : "orizzontale (asse X, lato est)"}. Per gating dal lato opposto serve un secondo passaggio.
                </div>
              </div>
            </>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasDoorAtCell}
              onChange={(e) => onToggleDoorAtCell(selectedCell.x, selectedCell.y, e.target.checked)}
            />
            Porta su questa cella
          </label>
          {hasDoorAtCell && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!doorOrientation}
                  onChange={(e) =>
                    onSetDoorOrientationAtCell(selectedCell.x, selectedCell.y, e.target.checked)
                  }
                />
                Porta orizzontale (oriz)
              </label>
              <div
                className="text-[11px] leading-snug rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-amber-200/90"
                title="La porta è direzionale: collega la propria cella con il vicino al lato +1 dell'asse di orientamento."
              >
                Collega ({selectedCell.x + 1},{selectedCell.y + 1}) con {doorOrientation
                  ? `(${selectedCell.x + 1},${selectedCell.y + 2})`
                  : `(${selectedCell.x + 2},${selectedCell.y + 1})`}
                <div className="text-[10px] text-amber-400/70 mt-0.5">
                  Geometria direzionale (+1): l'apertura è {doorOrientation ? "verticale (asse Y, lato sud)" : "orizzontale (asse X, lato est)"}. Per gating dal lato opposto serve una seconda porta.
                </div>
              </div>
            </>
          )}
        </div>
      </EditorCollapsibleSection>

      <EditorCollapsibleSection title="Mobile" defaultOpen={hasMobile}>
        <div className="space-y-2 text-sm">
          <label className="block">
            Tipo
            <select
              className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5"
              value={currentTypeId}
              onChange={(e) => {
                const next = e.target.value;
                if (!next) {
                  onSetCellFurniture(selectedCell.x, selectedCell.y, { typeId: null });
                  return;
                }
                const entry = mobili.find((t) => t?.id === next);
                const firstVariant = entry?.variants?.[0]?.key ?? null;
                onSetCellFurniture(selectedCell.x, selectedCell.y, {
                  typeId: next,
                  variantKey: firstVariant,
                });
              }}
            >
              <option value="">Nessuno</option>
              {mobili.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          {currentTypeId && variantsForCurrent.length > 1 && (
            <label className="block">
              Orientamento
              <select
                className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5"
                value={currentVariantKey}
                onChange={(e) =>
                  onSetCellFurniture(selectedCell.x, selectedCell.y, {
                    typeId: currentTypeId,
                    variantKey: e.target.value,
                  })
                }
              >
                {variantsForCurrent.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {hasMobile && (
            <div className="text-xs text-stone-400">
              ID: <span className="text-stone-200 font-mono">{selectedCell.mobili?.num}</span>
              {selectedCell.mobili?.img && (
                <span className="ml-2 text-stone-500">({selectedCell.mobili.img})</span>
              )}
            </div>
          )}
          {currentTypeId && !mobileMatch && selectedCell.mobili?.img && (
            <p className="text-[11px] text-amber-300">
              ⚠ Immagine «{selectedCell.mobili.img}» non trovata nel catalogo.
            </p>
          )}
          {hasMobile && (
            <div className="flex flex-wrap gap-3 text-xs pt-1">
              <label
                className="flex items-center gap-1"
                title="Specchia l'immagine sull'asse verticale (flip orizzontale)"
              >
                <input
                  type="checkbox"
                  checked={!!selectedCell.mobili?.flpo}
                  onChange={(e) =>
                    applyCellPatch(selectedCell.x, selectedCell.y, {
                      mobili: { ...selectedCell.mobili, flpo: e.target.checked },
                    })
                  }
                />
                Mirror orizzontale (flpo)
              </label>
              <label
                className="flex items-center gap-1"
                title="Specchia l'immagine sull'asse orizzontale (flip verticale)"
              >
                <input
                  type="checkbox"
                  checked={!!selectedCell.mobili?.flpv}
                  onChange={(e) =>
                    applyCellPatch(selectedCell.x, selectedCell.y, {
                      mobili: { ...selectedCell.mobili, flpv: e.target.checked },
                    })
                  }
                />
                Mirror verticale (flpv)
              </label>
            </div>
          )}
        </div>
      </EditorCollapsibleSection>

      <EditorCollapsibleSection title="Mostro" defaultOpen={hasMonster}>
        <div className="space-y-2 text-sm">
          <label className="block">
            Mostro
            <select
              className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5"
              value={hasMonster ? String(selectedCell.mostab?.mosid ?? "") : ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  applyCellPatch(selectedCell.x, selectedCell.y, {
                    mostab: { ...selectedCell.mostab, mos: false },
                  });
                  return;
                }
                const existingCorpo = Number(selectedCell.mostab?.corpo) || 0;
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  mostab: {
                    ...selectedCell.mostab,
                    mosid: Number(raw),
                    mos: true,
                    // Default corpo = 1 quando si attiva un mostro, se non già impostato.
                    corpo: existingCorpo > 0 ? existingCorpo : 1,
                  },
                });
              }}
            >
              <option value="">— nessun mostro</option>
              {monsters.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.id} — {m.nome ?? ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Mostro corpo
            <input
              type="number"
              min={1}
              className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5"
              value={hasMonster ? (selectedCell.mostab?.corpo ?? 1) : (selectedCell.mostab?.corpo ?? 0)}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  mostab: { ...selectedCell.mostab, corpo: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
      </EditorCollapsibleSection>

      <EditorCollapsibleSection title="Tesoro" defaultOpen={hasTreasure || isFinalTreasure}>
        <label
          className={`col-span-2 flex items-center gap-2 text-sm mb-2 px-2 py-1 rounded border ${
            isFinalTreasure
              ? "bg-amber-900/40 border-amber-700/70 text-amber-100"
              : "bg-stone-800/60 border-stone-700 text-stone-300"
          }`}
        >
          <input
            type="checkbox"
            checked={isFinalTreasure}
            onChange={(e) =>
              onToggleFinalTreasure(selectedCell.x, selectedCell.y, e.target.checked)
            }
          />
          <span>★ Tesoro finale della missione</span>
        </label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label>
            tes mon
            <input
              type="number"
              className="w-full bg-stone-800 border border-stone-600 rounded px-1"
              value={selectedCell.tes?.mon ?? 0}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  tes: { ...selectedCell.tes, mon: Number(e.target.value) },
                })
              }
            />
          </label>
          <label>
            tes trp
            <input
              type="number"
              className="w-full bg-stone-800 border border-stone-600 rounded px-1"
              value={selectedCell.tes?.trp ?? 0}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  tes: { ...selectedCell.tes, trp: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="col-span-2">
            tes ogg (item)
            <EditorCatalogIdSelect
              catalog={items}
              value={selectedCell.tes?.ogg ?? 0}
              onChange={(id) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  tes: { ...selectedCell.tes, ogg: id },
                })
              }
              className={cellSelectClass}
            />
          </label>
          <label className="col-span-2">
            tes arma (equip)
            <EditorCatalogIdSelect
              catalog={equipment}
              value={selectedCell.tes?.arma ?? 0}
              onChange={(id) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  tes: { ...selectedCell.tes, arma: id },
                })
              }
              className={cellSelectClass}
            />
          </label>
        </div>
      </EditorCollapsibleSection>

      <EditorCollapsibleSection title="Trappola" defaultOpen={hasTrap}>
        <div className="space-y-2 text-sm">
          <label className="block">
            Trappola tipo (0 = none)
            <select
              className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5"
              value={selectedCell.trpl?.tipo ?? 0}
              onChange={(e) =>
                applyCellPatch(selectedCell.x, selectedCell.y, {
                  trpl: { ...selectedCell.trpl, tipo: Number(e.target.value) },
                })
              }
            >
              <option value={0}>Nessuna</option>
              <option value={1}>Abisso (caduta)</option>
              <option value={2}>Lancia</option>
              <option value={3}>Roccia cadente</option>
            </select>
          </label>
          <div className="flex gap-2">
            <label className="flex-1">
              rccade x
              <input
                type="number"
                className="w-full bg-stone-800 border border-stone-600 rounded px-1"
                value={selectedCell.trpl?.rccadex ?? 0}
                onChange={(e) =>
                  applyCellPatch(selectedCell.x, selectedCell.y, {
                    trpl: { ...selectedCell.trpl, rccadex: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label className="flex-1">
              rccade y
              <input
                type="number"
                className="w-full bg-stone-800 border border-stone-600 rounded px-1"
                value={selectedCell.trpl?.rccadey ?? 0}
                onChange={(e) =>
                  applyCellPatch(selectedCell.x, selectedCell.y, {
                    trpl: { ...selectedCell.trpl, rccadey: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        </div>
      </EditorCollapsibleSection>
    </section>
  );
}
