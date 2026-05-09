import { describe, it, expect } from "vitest";
import {
  validateScriptText,
  summarizeValidation,
  VALIDATOR_KEYWORDS,
} from "../../dungeon-script-validator.js";

describe("dungeon-script-validator", () => {
  it("script vuoto → info, nessun errore", () => {
    const r = summarizeValidation("");
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.infos.length).toBeGreaterThan(0);
  });

  it("script semplice valido → ok=true, niente errori, statement parsati", () => {
    const text = `msg "Benvenuto";\nfineturno;`;
    const r = summarizeValidation(text);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.statements.map((s) => s.cmd)).toEqual(["msg", "fineturno"]);
  });

  it("blocco condizionale ben formato → ok", () => {
    const text = `sestanza 4;
  msg "qualcosa si cela in questa stanza";
end;`;
    const r = summarizeValidation(text);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.statements.map((s) => s.cmd)).toEqual(["sestanza", "msg", "end"]);
  });

  it("end senza apertura → errore", () => {
    const r = summarizeValidation("end;");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/end.*senza un blocco/i);
  });

  it("blocco condizionale non chiuso → errore con riga", () => {
    const text = `sestanza 4;\n  msg "x";`;
    const r = summarizeValidation(text);
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/sestanza.*aperto.*mai chiuso/i);
    expect(r.errors[0].line).toBe(1);
  });

  it("comando sconosciuto → warning (verrà trattato come msg)", () => {
    const r = summarizeValidation("ciaoNonEsisto 1, 2;");
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0].message).toMatch(/non riconosciuto/i);
  });

  it("argomenti insufficienti → errore", () => {
    const r = summarizeValidation("posmostro 5;");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/posmostro.*attende 3.*trovati 1/i);
  });

  it("argomenti in eccesso → errore", () => {
    const r = summarizeValidation("aggoro 10, 20;");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/aggoro.*attende 1.*trovati 2/i);
  });

  it("virgolette non bilanciate → errore", () => {
    const r = summarizeValidation('msg "incompleto;');
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => /virgolette/i.test(e.message))).toBeTruthy();
  });

  it("validateScriptText espone numero riga per ogni statement", () => {
    const text = `sestanza 4;\n  msg "x";\n  posroc 2,3;\nend;`;
    const r = validateScriptText(text);
    expect(r.statements.map((s) => s.line)).toEqual([1, 2, 3, 4]);
  });

  it("VALIDATOR_KEYWORDS coincide con il set runtime (sanity check)", () => {
    expect(VALIDATOR_KEYWORDS.has("msg")).toBe(true);
    expect(VALIDATOR_KEYWORDS.has("sestanza")).toBe(true);
    expect(VALIDATOR_KEYWORDS.has("end")).toBe(true);
  });
});
