import React, { useMemo } from "react";

export const editorCatalogSelectClass =
  "w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 mt-0.5 text-sm";

/**
 * Select per id numerici (oggetti, armi, …) con voci da catalogo JSON.
 * @param {{ value: number, label: string } | null} noneOption — se presente, prima voce (es. -1 = nessuno per header missione)
 */
export function EditorCatalogIdSelect({
  catalog = [],
  value,
  onChange,
  noneOption = null,
  className = editorCatalogSelectClass,
}) {
  const sorted = useMemo(() => {
    return [...catalog]
      .filter((x) => x != null && typeof x.id === "number")
      .sort((a, b) => a.id - b.id);
  }, [catalog]);

  const idSet = useMemo(() => new Set(sorted.map((r) => r.id)), [sorted]);

  const vRaw = value == null || Number.isNaN(Number(value)) ? (noneOption?.value ?? 0) : Number(value);
  const matchesNone = noneOption != null && vRaw === noneOption.value;
  const matchesRow = idSet.has(vRaw);
  const orphan = !matchesNone && !matchesRow;

  return (
    <select
      className={className}
      value={orphan ? "__orphan__" : String(vRaw)}
      onChange={(e) => {
        const s = e.target.value;
        if (s === "__orphan__") return;
        onChange(Number(s));
      }}
    >
      {orphan && (
        <option value="__orphan__">⚠ id {vRaw} (non in lista)</option>
      )}
      {noneOption != null && (
        <option value={String(noneOption.value)}>{noneOption.label}</option>
      )}
      {sorted.map((row) => (
        <option key={row.id} value={String(row.id)}>
          {row.id} — {typeof row.nome === "string" && row.nome.trim() ? row.nome : "(vuoto)"}
        </option>
      ))}
    </select>
  );
}
