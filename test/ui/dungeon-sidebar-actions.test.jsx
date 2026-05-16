import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import DungeonSidebarActions from "../../dungeon-sidebar-actions.jsx";

const baseProps = {
  turnPhase: { HasMoved: false, HasPerformedAction: false },
  isTargeting: false,
  isMoving: false,
  canUseMagic: false,
  isDoorOpenable: false,
  canDisarmTrap: false,
  isActionDisabled: false,
  onEndTurn: () => {},
  onSearchPassages: () => {},
  onSearchTreasure: () => {},
  onSearchTraps: () => {},
};

describe("DungeonSidebarActions", () => {
  afterEach(() => cleanup());

  it("disables treasure shortcut when HasPerformedAction is true", () => {
    render(
      <DungeonSidebarActions
        {...baseProps}
        turnPhase={{ HasMoved: false, HasPerformedAction: true }}
      />
    );

    const shortcuts = screen.getByTestId("dungeon-sidebar-shortcuts");
    const treasureBtn = within(shortcuts).getByRole("button", {
      name: /Cerca tesori/i,
    });
    expect(treasureBtn).toBeDisabled();
  });

  it("shows Fine turno and exploration shortcuts", () => {
    render(<DungeonSidebarActions {...baseProps} />);
    expect(screen.getByTestId("dungeon-end-turn-btn")).toBeTruthy();
    expect(screen.getByText("Fine")).toBeTruthy();
    const shortcuts = screen.getByTestId("dungeon-sidebar-shortcuts");
    expect(within(shortcuts).getAllByRole("button")).toHaveLength(3);
  });

  it("opens menu on pointer enter without click", () => {
    render(<DungeonSidebarActions {...baseProps} />);
    const trigger = screen.getByRole("button", { name: /Menu azioni/i });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.pointerEnter(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menu", { name: /Azioni di turno/i })).toBeTruthy();
    expect(screen.getByText("Cerca passaggi")).toBeTruthy();
    expect(screen.queryByText(/Esci dalla mappa/i)).toBeNull();
  });
});
