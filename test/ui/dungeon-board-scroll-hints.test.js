import { describe, it, expect } from "vitest";
import { getBoardScrollEdges } from "../../dungeon-board-scroll-hints.jsx";

describe("getBoardScrollEdges", () => {
  it("returns all false when element is null", () => {
    expect(getBoardScrollEdges(null)).toEqual({
      up: false,
      down: false,
      left: false,
      right: false,
    });
  });

  it("detects scrollable right and bottom", () => {
    const el = {
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 500,
      scrollHeight: 400,
      clientWidth: 200,
      clientHeight: 150,
    };
    expect(getBoardScrollEdges(el)).toEqual({
      left: false,
      right: true,
      up: false,
      down: true,
    });
  });

  it("detects scrollable left and top", () => {
    const el = {
      scrollLeft: 50,
      scrollTop: 30,
      scrollWidth: 500,
      scrollHeight: 400,
      clientWidth: 200,
      clientHeight: 150,
    };
    expect(getBoardScrollEdges(el)).toEqual({
      left: true,
      right: true,
      up: true,
      down: true,
    });
  });
});
