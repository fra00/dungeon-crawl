import { describe, it, expect } from "vitest";
import {
  furnitureFlipTransform,
  furnitureFlipStyle,
} from "../../furniture-flip.js";

describe("furnitureFlipTransform", () => {
  it("nessun flag → stringa vuota", () => {
    expect(furnitureFlipTransform(false, false)).toBe("");
    expect(furnitureFlipTransform(undefined, undefined)).toBe("");
    expect(furnitureFlipTransform(null, null)).toBe("");
  });

  it("solo flpo → scaleX(-1)", () => {
    expect(furnitureFlipTransform(true, false)).toBe("scaleX(-1)");
  });

  it("solo flpv → scaleY(-1)", () => {
    expect(furnitureFlipTransform(false, true)).toBe("scaleY(-1)");
  });

  it("entrambi → scaleX(-1) scaleY(-1)", () => {
    expect(furnitureFlipTransform(true, true)).toBe("scaleX(-1) scaleY(-1)");
  });
});

describe("furnitureFlipStyle", () => {
  it("nessun flag → oggetto vuoto (così non sovrascrive transform)", () => {
    expect(furnitureFlipStyle(false, false)).toEqual({});
    expect(furnitureFlipStyle()).toEqual({});
  });

  it("flpo → { transform: 'scaleX(-1)' }", () => {
    expect(furnitureFlipStyle(true, false)).toEqual({ transform: "scaleX(-1)" });
  });

  it("flpv → { transform: 'scaleY(-1)' }", () => {
    expect(furnitureFlipStyle(false, true)).toEqual({ transform: "scaleY(-1)" });
  });

  it("entrambi → { transform: 'scaleX(-1) scaleY(-1)' }", () => {
    expect(furnitureFlipStyle(true, true)).toEqual({
      transform: "scaleX(-1) scaleY(-1)",
    });
  });
});
