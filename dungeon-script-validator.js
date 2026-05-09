/**
 * Validatore sintattico per gli script di missione.
 *
 * Controlla che ciò che l'utente scrive in editor sia interpretabile dal
 * runtime (`dungeon-script-runtime.js`):
 * - parsing per statement (terminatore `;` o newline davanti a keyword nota);
 * - keyword conosciute (alias `KNOWN_KEYWORDS`);
 * - bilanciamento dei blocchi condizionali (`serand`/`sestanza`/`seogg`/
 *   `searma` aprono, `end` chiude);
 * - aritmetica argomenti (numero e tipo per i comandi più frequenti);
 * - quote bilanciate per messaggi `msg`.
 *
 * NON è un validatore semantico: non sa se l'`idstanza` esiste, se l'item
 * `aggogg N` punta a un oggetto valido, ecc. Solo "almeno è digeribile dal
 * parser".
 *
 * Output: `{ statements: [], issues: [{severity, message, statementIndex?}] }`
 * dove `severity` ∈ `'error' | 'warning' | 'info'`.
 */

export const VALIDATOR_KEYWORDS = new Set([
  "serand", "sestanza", "seogg", "searma", "pospsg", "possta", "msg",
  "posroc", "img", "posrocinv", "posmostro", "posps", "posporta",
  "aggogg", "aggarma", "aggoroid", "rimogg", "rrndogg", "fineturno",
  "aggoro", "agghppsg", "agghp", "att", "noatt", "noattarma", "end",
]);

const OPENERS = new Set(["serand", "sestanza", "seogg", "searma"]);

/**
 * Numero argomenti atteso (separati da `,`). `null` = qualsiasi.
 * Controlla solo argc minimo, non i tipi (gestiti caso-per-caso).
 */
const ARG_RULES = {
  serand: { min: 3, max: 3, desc: "serand <id>, <max>, <atteso>" },
  sestanza: { min: 1, max: 1, desc: "sestanza <idStanza>" },
  seogg: { min: 1, max: 1, desc: "seogg <idOggetto>" },
  searma: { min: 1, max: 1, desc: "searma <idArma>" },
  pospsg: { min: 2, max: 3, desc: "pospsg <x>, <y>[, <consenti_overlap>]" },
  possta: { min: 2, max: 2, desc: "possta <x>, <y>" },
  msg: { min: 1, max: null, desc: "msg <testo>" },
  posroc: { min: 2, max: 2, desc: "posroc <x>, <y>" },
  img: { min: 3, max: 3, desc: "img <path>, <x>, <y>" },
  posrocinv: { min: 2, max: 2, desc: "posrocinv <x>, <y>" },
  posmostro: { min: 3, max: 3, desc: "posmostro <idMostro>, <x>, <y>" },
  posps: { min: 3, max: 3, desc: "posps <oriz 0|1>, <x>, <y>" },
  posporta: { min: 3, max: 3, desc: "posporta <oriz 0|1>, <x>, <y>" },
  aggogg: { min: 1, max: 1, desc: "aggogg <idOggetto>" },
  aggarma: { min: 1, max: 1, desc: "aggarma <idArma>" },
  aggoroid: { min: 2, max: 2, desc: "aggoroid <indiceEroe>, <delta>" },
  rimogg: { min: 1, max: 1, desc: "rimogg <idOggetto>" },
  rrndogg: { min: 0, max: 0, desc: "rrndogg" },
  fineturno: { min: 0, max: 0, desc: "fineturno" },
  aggoro: { min: 1, max: 1, desc: "aggoro <delta>" },
  agghppsg: { min: 2, max: 2, desc: "agghppsg <indiceEroe>, <delta>" },
  agghp: { min: 1, max: 1, desc: "agghp <delta>" },
  att: { min: 0, max: 0, desc: "att" },
  noatt: { min: 0, max: 0, desc: "noatt" },
  noattarma: { min: 1, max: 1, desc: "noattarma <idArma>" },
  end: { min: 0, max: 0, desc: "end" },
};

/**
 * Tokenizza il testo in statement seguendo le stesse regole del parser
 * runtime, così se il validatore dice OK la macchina riesce davvero a
 * eseguirlo.
 */
function splitStatements(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const statements = [];
  let cur = "";
  let line = 1;
  let startLine = 1;
  let i = 0;
  while (i < normalized.length) {
    const ch = normalized[i];
    if (ch === ";") {
      const trimmed = cur.trim();
      if (trimmed) statements.push({ raw: trimmed, line: startLine });
      cur = "";
      i++;
      startLine = line;
      continue;
    }
    if (ch === "\n") {
      line++;
      const next = normalized.slice(i + 1).match(/^\s*([a-zA-Z]+)/);
      if (next && VALIDATOR_KEYWORDS.has(next[1].toLowerCase())) {
        const trimmed = cur.trim();
        if (trimmed) statements.push({ raw: trimmed, line: startLine });
        cur = "";
        i++;
        startLine = line;
        continue;
      }
    }
    cur += ch;
    i++;
  }
  const trimmed = cur.trim();
  if (trimmed) statements.push({ raw: trimmed, line: startLine });
  return statements;
}

function countCommas(s) {
  // Conta virgole IGNORANDO quelle dentro stringhe ".."
  let inside = false;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') inside = !inside;
    else if (ch === "," && !inside) n++;
  }
  return n;
}

function quotesBalanced(s) {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') count++;
  }
  return count % 2 === 0;
}

/**
 * Esegue la validazione.
 * @param {string} text  Sorgente dello script.
 * @returns {{ statements: Array, issues: Array }}
 */
export function validateScriptText(text) {
  const issues = [];
  const trimmed = String(text || "").trim();
  if (trimmed === "") {
    return {
      statements: [],
      issues: [{ severity: "info", message: "Script vuoto: nessuna istruzione." }],
    };
  }

  const stmts = splitStatements(text);
  if (stmts.length === 0) {
    issues.push({ severity: "warning", message: "Nessuno statement riconosciuto. Manca il `;` finale?" });
  }

  // Stack per blocchi condizionali (per poter dire dove manca `end`).
  const stack = [];
  const parsedStatements = [];

  stmts.forEach((stmt, idx) => {
    const match = stmt.raw.match(/^(\S+)(?:\s+([\s\S]*))?$/);
    if (!match) {
      issues.push({ severity: "error", message: `Statement n. ${idx + 1} non parsabile: "${stmt.raw}"`, statementIndex: idx, line: stmt.line });
      return;
    }
    const cmd = match[1].toLowerCase();
    const argsText = match[2] ? match[2].trim() : "";
    const knownCmd = VALIDATOR_KEYWORDS.has(cmd);

    parsedStatements.push({ index: idx, line: stmt.line, cmd, argsText, raw: stmt.raw, known: knownCmd });

    if (!knownCmd) {
      // Il runtime cade qui in un "msg" implicito: avvisiamo perché
      // probabilmente è un typo.
      issues.push({
        severity: "warning",
        message: `Statement n. ${idx + 1}: comando "${match[1]}" non riconosciuto. Verrà trattato come "msg" (testo libero).`,
        statementIndex: idx,
        line: stmt.line,
      });
      return;
    }

    // Quote bilanciate (utile per msg "...")
    if (!quotesBalanced(stmt.raw)) {
      issues.push({
        severity: "error",
        message: `Statement n. ${idx + 1}: virgolette non bilanciate.`,
        statementIndex: idx,
        line: stmt.line,
      });
    }

    // Argomenti
    const rule = ARG_RULES[cmd];
    if (rule) {
      let argc;
      if (cmd === "msg") {
        argc = argsText === "" ? 0 : 1;
      } else {
        argc = argsText === "" ? 0 : countCommas(argsText) + 1;
      }
      if (argc < rule.min || (rule.max != null && argc > rule.max)) {
        issues.push({
          severity: "error",
          message: `Statement n. ${idx + 1}: "${cmd}" attende ${rule.min}${rule.max != null && rule.max !== rule.min ? `–${rule.max}` : ""} argomenti, trovati ${argc}. Sintassi: ${rule.desc}`,
          statementIndex: idx,
          line: stmt.line,
        });
      }
    }

    // Bilanciamento blocchi
    if (OPENERS.has(cmd)) {
      stack.push({ cmd, idx, line: stmt.line });
    } else if (cmd === "end") {
      if (stack.length === 0) {
        issues.push({
          severity: "error",
          message: `Statement n. ${idx + 1}: "end" senza un blocco condizionale aperto.`,
          statementIndex: idx,
          line: stmt.line,
        });
      } else {
        stack.pop();
      }
    }
  });

  // Blocchi non chiusi
  for (const open of stack) {
    issues.push({
      severity: "error",
      message: `Statement n. ${open.idx + 1}: blocco "${open.cmd}" aperto a riga ${open.line} mai chiuso da "end".`,
      statementIndex: open.idx,
      line: open.line,
    });
  }

  return { statements: parsedStatements, issues };
}

/**
 * Helper per UI: ritorna `{ ok, errors, warnings, infos }` derivato da
 * `validateScriptText`.
 */
export function summarizeValidation(text) {
  const { issues, statements } = validateScriptText(text);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  return {
    ok: errors.length === 0,
    statements,
    issues,
    errors,
    warnings,
    infos,
  };
}
