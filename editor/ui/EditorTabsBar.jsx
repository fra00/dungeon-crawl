import React from "react";

export default function EditorTabsBar({ tabs, activeTab, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1 p-1 rounded bg-stone-950/70 border border-stone-700">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-2 py-1.5 text-[11px] rounded uppercase tracking-wide ${
            activeTab === t.id
              ? "bg-amber-800 text-white"
              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
