import { useState, useEffect, useCallback, useRef } from "react";
import {
  DUNGEON_BOARD_CHROME_WIDTH,
  DUNGEON_BOARD_CHROME_HEIGHT,
  DUNGEON_CELL_SIZE,
} from "./dungeon-board-constants.js";

export const BOARD_ZOOM_STORAGE_KEY = "dungeonBoardZoomStepIndex";

/** Moltiplicatori sopra la scala "fit" (1 = solo adattamento allo slot). */
export const BOARD_ZOOM_STEPS = [1, 1.2, 1.4, 1.6, 1.85];

const MIN_CELL_PX = 10;
const PINCH_ZOOM_IN_RATIO = 1.18;
const PINCH_ZOOM_OUT_RATIO = 0.82;

/**
 * Scala massima che mantiene celle intere (pixel interi per lato cella).
 */
export function computeFitScale(availW, availH) {
  const raw = Math.min(
    availW / DUNGEON_BOARD_CHROME_WIDTH,
    availH / DUNGEON_BOARD_CHROME_HEIGHT
  );
  if (!Number.isFinite(raw) || raw <= 0) return 1;

  const snappedCell = Math.floor(DUNGEON_CELL_SIZE * raw);
  const cellPx = Math.max(MIN_CELL_PX, snappedCell);
  return cellPx / DUNGEON_CELL_SIZE;
}

export function loadStoredZoomStepIndex() {
  try {
    const raw = localStorage.getItem(BOARD_ZOOM_STORAGE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 0 && n < BOARD_ZOOM_STEPS.length) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

export function saveZoomStepIndex(index) {
  try {
    localStorage.setItem(BOARD_ZOOM_STORAGE_KEY, String(index));
  } catch {
    /* ignore */
  }
}

function touchDistance(touches) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

/**
 * Pinch su #board-slot: allarga → zoom in, stringe → zoom out (step discreti).
 */
export function useBoardPinchZoom(
  boardSlotRef,
  { zoomIn, zoomOut, canZoomIn, canZoomOut }
) {
  const pinchRef = useRef({ startDist: null, lastStepAt: 0 });

  useEffect(() => {
    const el = boardSlotRef?.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchRef.current.startDist = touchDistance(e.touches);
        pinchRef.current.lastStepAt = performance.now();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || pinchRef.current.startDist == null) return;

      e.preventDefault();

      const dist = touchDistance(e.touches);
      const ratio = dist / pinchRef.current.startDist;
      const now = performance.now();
      if (now - pinchRef.current.lastStepAt < 120) return;

      if (ratio >= PINCH_ZOOM_IN_RATIO && canZoomIn) {
        zoomIn();
        pinchRef.current.startDist = dist;
        pinchRef.current.lastStepAt = now;
      } else if (ratio <= PINCH_ZOOM_OUT_RATIO && canZoomOut) {
        zoomOut();
        pinchRef.current.startDist = dist;
        pinchRef.current.lastStepAt = now;
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        pinchRef.current.startDist = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [boardSlotRef, zoomIn, zoomOut, canZoomIn, canZoomOut]);
}

/**
 * Fit allo slot + zoom opzionale; oltre il fit attiva pan via scroll sul contenitore.
 */
export function useBoardViewport(boardSlotRef) {
  const [fitScale, setFitScale] = useState(1);
  const [zoomStepIndex, setZoomStepIndex] = useState(loadStoredZoomStepIndex);

  useEffect(() => {
    const el = boardSlotRef?.current;
    if (!el) return;

    const update = () => {
      const availW = Math.max(80, el.clientWidth);
      const availH = Math.max(80, el.clientHeight);
      setFitScale(computeFitScale(availW, availH));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [boardSlotRef]);

  useEffect(() => {
    saveZoomStepIndex(zoomStepIndex);
  }, [zoomStepIndex]);

  const zoomMultiplier = BOARD_ZOOM_STEPS[zoomStepIndex] ?? 1;
  const displayScale = fitScale * zoomMultiplier;
  const isPannable = zoomStepIndex > 0;

  const zoomIn = useCallback(() => {
    setZoomStepIndex((i) => Math.min(i + 1, BOARD_ZOOM_STEPS.length - 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const resetZoom = useCallback(() => setZoomStepIndex(0), []);

  useBoardPinchZoom(boardSlotRef, {
    zoomIn,
    zoomOut,
    canZoomIn: zoomStepIndex < BOARD_ZOOM_STEPS.length - 1,
    canZoomOut: zoomStepIndex > 0,
  });

  return {
    fitScale,
    displayScale,
    zoomStepIndex,
    zoomMultiplier,
    isPannable,
    canZoomIn: zoomStepIndex < BOARD_ZOOM_STEPS.length - 1,
    canZoomOut: zoomStepIndex > 0,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
