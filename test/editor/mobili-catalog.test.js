import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(here, "../../public/jsonData/mobili.json");
const raw = readFileSync(catalogPath, "utf8");
const data = JSON.parse(raw);

describe("public/jsonData/mobili.json", () => {
  it("has a non-empty mobili array", () => {
    expect(Array.isArray(data?.mobili)).toBe(true);
    expect(data.mobili.length).toBeGreaterThan(0);
  });

  it("each entry has id, name and at least one variant with non-empty img", () => {
    for (const entry of data.mobili) {
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.variants)).toBe(true);
      expect(entry.variants.length).toBeGreaterThan(0);
      for (const v of entry.variants) {
        expect(typeof v.key).toBe("string");
        expect(v.key.length).toBeGreaterThan(0);
        expect(typeof v.img).toBe("string");
        expect(v.img.length).toBeGreaterThan(0);
        expect(v.img.endsWith(".png")).toBe(true);
        expect(v.img.toLowerCase().includes("full")).toBe(false);
      }
    }
  });

  it("entry ids and variant keys are unique within scope", () => {
    const ids = new Set();
    for (const entry of data.mobili) {
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      const keys = new Set();
      for (const v of entry.variants) {
        expect(keys.has(v.key)).toBe(false);
        keys.add(v.key);
      }
    }
  });

  it("contains both single and dual-variant types", () => {
    const hasDual = data.mobili.some((m) => m.variants.length > 1);
    const hasSingle = data.mobili.some((m) => m.variants.length === 1);
    expect(hasDual).toBe(true);
    expect(hasSingle).toBe(true);
  });
});
