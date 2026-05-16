import React, { useCallback, useEffect, useState } from "react";

const EPS = 3;

/** Quali lati dello slot hanno ancora contenuto scrollabile. */
export function getBoardScrollEdges(el, epsilon = EPS) {
  if (!el) {
    return { up: false, down: false, left: false, right: false };
  }
  const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } =
    el;
  return {
    left: scrollLeft > epsilon,
    right: scrollLeft + clientWidth < scrollWidth - epsilon,
    up: scrollTop > epsilon,
    down: scrollTop + clientHeight < scrollHeight - epsilon,
  };
}

const hintBase =
  "dungeon-board-scroll-hint absolute z-20 flex items-center justify-center pointer-events-none text-amber-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none motion-reduce:opacity-80";

function EdgeHint({ show, className, label, children }) {
  if (!show) return null;
  return (
    <div className={`${hintBase} ${className}`} aria-hidden title={label}>
      {children}
    </div>
  );
}

/**
 * Frecce ai bordi del frame quando la mappa è scrollabile (zoom > fit).
 * pointer-events: none — non bloccano tap sulle celle.
 */
export default function DungeonBoardScrollHints({ boardSlotRef, isPannable = false }) {
  const [edges, setEdges] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const update = useCallback(() => {
    const el = boardSlotRef?.current;
    if (!el || !isPannable) {
      setEdges({ up: false, down: false, left: false, right: false });
      return;
    }
    setEdges(getBoardScrollEdges(el));
  }, [boardSlotRef, isPannable]);

  useEffect(() => {
    update();
    const el = boardSlotRef?.current;
    if (!el || !isPannable) return;

    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const inner = el.querySelector(".dungeon-board-scaled");
    if (inner) ro.observe(inner);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [boardSlotRef, isPannable, update]);

  if (!isPannable) return null;

  const any = edges.up || edges.down || edges.left || edges.right;
  if (!any) return null;

  const chevron = "text-lg sm:text-xl font-bold leading-none";

  return (
    <>
      <EdgeHint
        show={edges.left}
        className="left-0.5 top-1/2 -translate-y-1/2 w-5"
        label="Scorri a sinistra"
      >
        <span className={chevron}>‹</span>
      </EdgeHint>
      <EdgeHint
        show={edges.right}
        className="right-0.5 top-1/2 -translate-y-1/2 w-5"
        label="Scorri a destra"
      >
        <span className={chevron}>›</span>
      </EdgeHint>
      <EdgeHint
        show={edges.up}
        className="top-0.5 left-1/2 -translate-x-1/2 h-5"
        label="Scorri in alto"
      >
        <span className={chevron}>⌃</span>
      </EdgeHint>
      <EdgeHint
        show={edges.down}
        className="bottom-0.5 left-1/2 -translate-x-1/2 h-5"
        label="Scorri in basso"
      >
        <span className={chevron}>⌄</span>
      </EdgeHint>
    </>
  );
}
