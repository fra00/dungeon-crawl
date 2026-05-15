import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import DungeonGameShell from "../../dungeon-game-shell.jsx";
import DungeonActionBar from "../../dungeon-action-bar.jsx";

const actionProps = {
  currentHero: { hero: { classe: "Guerriero" } },
  movementPoints: 4,
  turnPhase: {},
  canOpenDoor: false,
  isTargeting: false,
  isMoving: false,
  onEndTurn: () => {},
  onSearchPassages: () => {},
  onSearchTreasure: () => {},
  onSearchTraps: () => {},
};

describe("DungeonGameShell", () => {
  afterEach(() => cleanup());

  it("renders board slot and action buttons without fixed HUD", () => {
    render(
      <DungeonGameShell
        board={<div data-testid="mock-board">board</div>}
        actions={<DungeonActionBar {...actionProps} />}
      />
    );

    expect(document.getElementById("board-slot")).toBeTruthy();
    expect(screen.getByTestId("mock-board")).toBeTruthy();

    const bar = screen.getByTestId("dungeon-action-bar");
    expect(within(bar).getByTestId("dungeon-movement-points")).toBeTruthy();
    expect(within(bar).getByRole("button", { name: /Fine/i })).toBeTruthy();
    expect(getComputedStyle(bar).position).not.toBe("fixed");
  });
});
