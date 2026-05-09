import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EditorCatalogIdSelect } from "../../editor/EditorCatalogSelects.jsx";

describe("EditorCatalogIdSelect", () => {
  afterEach(() => cleanup());

  const catalog = [
    { id: 0, nome: "" },
    { id: 2, nome: "Pozione" },
  ];

  it("calls onChange with selected id", () => {
    const onChange = vi.fn();
    render(<EditorCatalogIdSelect catalog={catalog} value={0} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("renders noneOption and uses its value", () => {
    const onChange = vi.fn();
    render(
      <EditorCatalogIdSelect
        catalog={catalog}
        value={-1}
        onChange={onChange}
        noneOption={{ value: -1, label: "Nessuno" }}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("option", { name: "Nessuno" })).toBeTruthy();
  });

  it("shows orphan state when id not in catalog", () => {
    render(<EditorCatalogIdSelect catalog={catalog} value={99} onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("__orphan__");
    expect(screen.getByText(/99/)).toBeTruthy();
  });
});
