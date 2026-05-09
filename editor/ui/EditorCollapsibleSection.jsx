import React, { useState } from "react";

export default function EditorCollapsibleSection({
  title,
  defaultOpen = true,
  /** Se impostato, la sezione è controllata dall'esterno (es. pulsante "Apri guida"). */
  open: openProp,
  onOpenChange,
  id,
  badge = null,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (controlled) {
      onOpenChange?.(next);
    } else {
      setUncontrolledOpen(next);
    }
  };

  return (
    <section id={id} className="rounded border border-stone-700/80 bg-stone-900/70">
      <button
        type="button"
        className="w-full flex items-center justify-between px-2 py-1.5 text-left"
        onClick={toggle}
      >
        <span className="text-xs uppercase tracking-wide text-amber-500/90">{title}</span>
        <span className="flex items-center gap-2">
          {badge}
          <span className="text-stone-400 text-xs">{open ? "▾" : "▸"}</span>
        </span>
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </section>
  );
}
