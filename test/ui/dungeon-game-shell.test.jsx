import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import DungeonGameShell from "../../dungeon-game-shell.jsx";

describe("DungeonGameShell", () => {
  afterEach(() => cleanup());

  it("renders board slot without bottom action footer row", () => {
    render(<DungeonGameShell board={<div data-testid="mock-board">board</div>} />);

    expect(document.getElementById("board-slot")).toBeTruthy();
    expect(screen.getByTestId("mock-board")).toBeTruthy();
    expect(document.querySelector(".dungeon-shell-actions")).toBeNull();
  });
});
