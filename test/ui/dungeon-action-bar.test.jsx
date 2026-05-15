import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import DungeonActionBar from "../../dungeon-action-bar.jsx";

const baseProps = {
  movementPoints: 5,
  turnPhase: { HasMoved: false, HasPerformedAction: false },
  canOpenDoor: false,
  isTargeting: false,
  isMoving: false,
  onEndTurn: () => {},
  onSearchPassages: () => {},
  onSearchTreasure: () => {},
  onSearchTraps: () => {},
};

describe("DungeonActionBar", () => {
  afterEach(() => cleanup());

  it("disables treasure search when HasPerformedAction is true", () => {
    render(
      <DungeonActionBar
        {...baseProps}
        turnPhase={{ HasMoved: false, HasPerformedAction: true }}
      />
    );

    const bar = screen.getByTestId("dungeon-action-bar");
    const treasureBtn = within(bar).getByRole("button", { name: /Tesori/i });
    expect(treasureBtn).toBeDisabled();
  });

  it("shows PM badge and Fine without Muovi button", () => {
    render(<DungeonActionBar {...baseProps} />);
    const bar = screen.getByTestId("dungeon-action-bar");
    expect(within(bar).getByTestId("dungeon-movement-points")).toHaveTextContent(
      "PM 5"
    );
    expect(within(bar).getByRole("button", { name: /Fine/i })).toBeTruthy();
    expect(within(bar).queryByRole("button", { name: /Muovi/i })).toBeNull();
  });

  it("does not use position fixed on action bar", () => {
    const { container } = render(<DungeonActionBar {...baseProps} />);
    const bar = container.querySelector(".dungeon-action-bar");
    expect(getComputedStyle(bar).position).not.toBe("fixed");
  });
});
