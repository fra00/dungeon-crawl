import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import DungeonBoardFabs from "../../dungeon-board-fabs.jsx";

describe("DungeonBoardFabs", () => {
  afterEach(() => cleanup());

  it("shows door FAB when door is openable", () => {
    render(
      <DungeonBoardFabs
        isDoorOpenable
        onOpenDoor={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /Apri porta/i })).toBeTruthy();
  });

  it("renders nothing when no contextual actions", () => {
    const { container } = render(<DungeonBoardFabs />);
    expect(container.firstChild).toBeNull();
  });
});
