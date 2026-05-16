import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  computeFitScale,
  loadStoredZoomStepIndex,
  saveZoomStepIndex,
  getDefaultZoomStepIndex,
  BOARD_ZOOM_STORAGE_KEY,
  BOARD_ZOOM_STEPS,
} from "../use-board-viewport.js";
import {
  DUNGEON_BOARD_CHROME_WIDTH,
  DUNGEON_BOARD_CHROME_HEIGHT,
  DUNGEON_CELL_SIZE,
} from "../dungeon-board-constants.js";

describe("computeFitScale", () => {
  it("snaps cell size to whole pixels", () => {
    const availW = DUNGEON_BOARD_CHROME_WIDTH * 1.37;
    const availH = DUNGEON_BOARD_CHROME_HEIGHT * 1.37;
    const s = computeFitScale(availW, availH);
    const cellPx = DUNGEON_CELL_SIZE * s;
    expect(cellPx).toBe(Math.floor(cellPx));
    expect(cellPx).toBeGreaterThanOrEqual(10);
  });

  it("never exceeds available slot", () => {
    const availW = 400;
    const availH = 300;
    const s = computeFitScale(availW, availH);
    expect(DUNGEON_BOARD_CHROME_WIDTH * s).toBeLessThanOrEqual(availW + 0.01);
    expect(DUNGEON_BOARD_CHROME_HEIGHT * s).toBeLessThanOrEqual(availH + 0.01);
  });
});

describe("zoom localStorage", () => {
  beforeEach(() => {
    localStorage.removeItem(BOARD_ZOOM_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BOARD_ZOOM_STORAGE_KEY);
  });

  it("loads and saves zoom step index", () => {
    expect(loadStoredZoomStepIndex()).toBe(getDefaultZoomStepIndex());
    saveZoomStepIndex(2);
    expect(loadStoredZoomStepIndex()).toBe(2);
    expect(BOARD_ZOOM_STEPS[loadStoredZoomStepIndex()]).toBe(1.4);
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(BOARD_ZOOM_STORAGE_KEY, "99");
    expect(loadStoredZoomStepIndex()).toBe(0);
    localStorage.setItem(BOARD_ZOOM_STORAGE_KEY, "x");
    expect(loadStoredZoomStepIndex()).toBe(0);
  });
});
