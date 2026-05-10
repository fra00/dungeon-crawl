import React from "react";

const EVENTS = [
  {
    id: 1,
    name: "Movimento eroe",
    desc:
      "Si attiva quando l'eroe attivo entra nella casella (x,y) dello script (matching su posizione precedente del movimento).",
    context: "previousPosition",
  },
  {
    id: 2,
    name: "Combattimento mostro",
    desc:
      "Si attiva quando un mostro di tipo idmosc viene attaccato. Se 'morto' è true scatta solo alla morte del mostro, altrimenti ad ogni colpo subìto.",
    context: "monsterTypeId, onDeath",
  },
  {
    id: 3,
    name: "Ricerca tesoro nella stanza",
    desc:
      "Si attiva quando l'eroe attivo cerca tesori nella stessa stanza dello script. In corridoio (valo=1) richiede linea di tiro lungo l'asse, senza muri.",
    context: "stessa stanza dello script",
  },
  {
    id: 4,
    name: "Disinnesco / attivazione trappola",
    desc:
      "Si attiva quando una trappola viene tirata/disinnescata nella stessa stanza dello script. Stessa regola di prossimità di evento 3.",
    context: "stessa stanza dello script",
  },
  {
    id: 5,
    name: "Ricerca passaggio segreto",
    desc:
      "Si attiva quando l'eroe cerca passaggi segreti nella stessa stanza dello script. Stessa regola di prossimità di evento 3.",
    context: "stessa stanza dello script",
  },
  {
    id: 6,
    name: "Inizio missione",
    desc:
      "Si attiva una sola volta all'avvio della missione, dopo l'inizializzazione della sessione.",
    context: "—",
  },
  {
    id: 7,
    name: "Fine missione",
    desc:
      "Si attiva al termine della missione (vittoria o sconfitta). Disponibile context.isVictory.",
    context: "isVictory",
  },
  {
    id: 8,
    name: "Cambio stanza",
    desc:
      "Si attiva quando l'eroe attivo entra in una nuova stanza (cambio di valo). Utile insieme a 'sestanza'.",
    context: "—",
  },
];

const CONDITIONS = [
  { cmd: "serand <chiave>,<max>,<valore>", desc: "Esegue il blocco se Math.random() ⋅ (max+1) memoizzato per <chiave> == <valore>. La chiave è memoizzata per script-run, così più rami possono confrontare lo stesso lancio." },
  { cmd: "sestanza <roomId>", desc: "Esegue il blocco solo se l'eroe attivo è nella stanza con valo = roomId (oppure se context.roomId == roomId)." },
  { cmd: "seogg <itemId>", desc: "Esegue il blocco solo se l'eroe attivo ha l'oggetto con id <itemId> nell'inventario." },
  { cmd: "searma <equipId>", desc: "Esegue il blocco solo se l'eroe attivo ha l'arma/equip con id <equipId> in equipment o equipped." },
  { cmd: "end", desc: "Chiude il blocco condizionale aperto più di recente." },
];

const COMMANDS_MOVE = [
  { cmd: "pospsg <x>,<y>[,<allowOverlap>]", desc: "Teletrasporta l'eroe attivo in (x,y). Ferma il movimento e decrementa di 1. Se (x,y) è occupato e allowOverlap=1, l'occupante subisce 1 di danno; altrimenti l'azione è bloccata." },
  { cmd: "possta <x>,<y>", desc: "Aggiunge un punto di rivelazione (svelamento mappa/fog) in (x,y)." },
  { cmd: "fineturno", desc: "Forza la fine del turno dell'eroe attivo (stop movimento + finishTurn)." },
];

const COMMANDS_MAP = [
  { cmd: "posroc <x>,<y>", desc: "Posiziona una pietra/parete in (x,y) (cell.arnt.antroc = true)." },
  { cmd: "posrocinv <x>,<y>", desc: "Posiziona una pietra invisibile/magica in (x,y) (cell.arnt.inv = true)." },
  { cmd: "posmostro <monsterId>,<x>,<y>", desc: "Crea un mostro di tipo <monsterId> in (x,y). Rimuove eventuali script-image sulla stessa cella." },
  { cmd: "posps <oriz>,<x>,<y>", desc: "Crea un passaggio segreto in (x,y). oriz=1 orizzontale, 0 verticale." },
  { cmd: "posporta <oriz>,<x>,<y>", desc: "Crea una porta in (x,y). oriz=1 orizzontale, 0 verticale." },
];

const COMMANDS_HERO = [
  { cmd: "aggogg <itemId>", desc: "Aggiunge un oggetto all'inventario dell'eroe attivo." },
  { cmd: "aggarma <equipId>", desc: "Aggiunge un equip all'inventario equipment dell'eroe attivo." },
  { cmd: "rimogg <itemId>", desc: "Rimuove (prima occorrenza) l'oggetto <itemId> dall'inventario dell'eroe attivo." },
  { cmd: "rrndogg", desc: "Rimuove un oggetto casuale dall'inventario dell'eroe attivo." },
  { cmd: "aggoro <amount>", desc: "Aggiunge oro all'eroe attivo. amount può essere negativo." },
  { cmd: "aggoroid <heroIndex>,<amount>", desc: "Aggiunge oro all'eroe in posizione <heroIndex> (0..3)." },
  { cmd: "agghp <delta>", desc: "Modifica il currentBody dell'eroe attivo (se vivo)." },
  { cmd: "agghppsg <heroIndex>,<delta>", desc: "Modifica il currentBody dell'eroe in posizione <heroIndex>." },
];

const COMMANDS_UI = [
  { cmd: "msg <testo>", desc: "Mostra una notifica testuale (toast). È anche il fallback per le righe non riconosciute come comandi (utile per descrizioni narrative)." },
  { cmd: "dlg <testo>", desc: "Apre una finestra modale con il testo e il pulsante «Chiudi»; resta aperta finché il giocatore non chiude. Interrompe l'esecuzione dello script corrente: i comandi scritti dopo dlg nello stesso script non vengono eseguiti." },
  { cmd: "img <src>,<x>,<y>", desc: "Sovrappone un'immagine (es. /img/...) sulla cella (x,y) come scriptImage." },
];

const COMMANDS_COMBAT = [
  { cmd: "att", desc: "Sblocca l'attacco (annulla un precedente noatt)." },
  { cmd: "noatt", desc: "Blocca l'attacco dell'eroe attivo." },
  { cmd: "noattarma <equipId>", desc: "Blocca l'attacco a meno che l'eroe attivo abbia <equipId> in equipped." },
];

function CmdTable({ rows }) {
  return (
    <table className="w-full text-[11px] table-fixed">
      <tbody>
        {rows.map((r) => (
          <tr key={r.cmd} className="align-top border-b border-stone-800/60 last:border-0">
            <td className="py-1 pr-2 font-mono text-amber-200/90 whitespace-nowrap w-[42%] break-words">
              {r.cmd}
            </td>
            <td className="py-1 text-stone-300 break-words">{r.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HelpDetails({ summary, defaultOpen = false, children }) {
  return (
    <details
      className="rounded border border-stone-700/70 bg-stone-900/40 px-2 py-1"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none text-xs uppercase tracking-wide text-amber-500/80 py-1">
        {summary}
      </summary>
      <div className="pt-1 pb-2">{children}</div>
    </details>
  );
}

export default function EditorScriptHelp() {
  return (
    <div className="space-y-2 text-[11px] text-stone-300 leading-snug">
      <p className="text-stone-300">
        Gli script sono sequenze di comandi attivati da un <em>evento</em> sulla cella (x,y). Le
        coordinate sono in <strong>base 1</strong> (come nel file della mappa). Le istruzioni si
        separano con <code className="text-amber-200">;</code> oppure con un a-capo seguito da una
        parola chiave conosciuta. Le righe non riconosciute diventano automaticamente{" "}
        <code className="text-amber-200">msg</code>.
      </p>

      <HelpDetails summary="Eventi (campo 'evento')" defaultOpen>
        <table className="w-full text-[11px] table-fixed">
          <thead>
            <tr className="text-amber-300/80 border-b border-stone-700">
              <th className="text-left py-1 pr-2 w-[8%]">id</th>
              <th className="text-left py-1 pr-2 w-[28%]">nome</th>
              <th className="text-left py-1">descrizione</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((ev) => (
              <tr key={ev.id} className="align-top border-b border-stone-800/60 last:border-0">
                <td className="py-1 pr-2 font-mono text-amber-200/90">{ev.id}</td>
                <td className="py-1 pr-2 text-amber-100/90 break-words">{ev.name}</td>
                <td className="py-1 text-stone-300 break-words">{ev.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-stone-400">
          Per gli eventi 3,4,5 lo script si attiva solo se l'eroe attivo è nella stessa stanza dello
          script (valo). In corridoio (valo=1) script ed eroe devono essere allineati su asse x o y
          senza muri tra di loro.
        </p>
      </HelpDetails>

      <HelpDetails summary="Condizioni (blocchi)">
        <CmdTable rows={CONDITIONS} />
        <p className="mt-2 text-stone-400">
          I blocchi condizionali si chiudono con <code className="text-amber-200">end</code>. Se
          dimenticato, il blocco resta aperto fino alla fine dello script.
        </p>
      </HelpDetails>

      <HelpDetails summary="Movimento e turno">
        <CmdTable rows={COMMANDS_MOVE} />
      </HelpDetails>

      <HelpDetails summary="Mappa (mostri, porte, passaggi, blocchi)">
        <CmdTable rows={COMMANDS_MAP} />
      </HelpDetails>

      <HelpDetails summary="Inventario / Eroe">
        <CmdTable rows={COMMANDS_HERO} />
      </HelpDetails>

      <HelpDetails summary="Interfaccia (messaggi, dialogo e immagini)">
        <CmdTable rows={COMMANDS_UI} />
        <p className="mt-2 text-stone-400">
          Usa <code className="text-amber-200">dlg</code> quando serve che il giocatore legga e confermi con «Chiudi»; usa{" "}
          <code className="text-amber-200">msg</code> per messaggi brevi non bloccanti. Se più script combaciano con lo
          stesso evento e il primo esegue <code className="text-amber-200">dlg</code>, gli script successivi in coda non
          partono fino al prossimo trigger dell&apos;evento (in pratica vengono saltati in quell&apos;invocazione).
        </p>
      </HelpDetails>

      <HelpDetails summary="Combattimento">
        <CmdTable rows={COMMANDS_COMBAT} />
      </HelpDetails>

      <HelpDetails summary="Esempi">
        <div className="space-y-2">
          <div>
            <p className="text-stone-400 mb-1">Messaggio quando l'eroe entra in stanza 13:</p>
            <pre className="bg-stone-950/80 border border-stone-700 rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap">{`sestanza 13;
msg Una luce strana filtra dalle pareti...;
end;`}</pre>
          </div>
          <div>
            <p className="text-stone-400 mb-1">Dialogo modale obbligatorio (lettura + Chiudi):</p>
            <pre className="bg-stone-950/80 border border-stone-700 rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap">{`dlg Leggi questo messaggio prima di proseguire.;
possta 10,10;`}</pre>
            <p className="text-stone-500 mt-1 text-[10px]">
              Nota: dopo dlg lo script si interrompe; qui <code className="text-amber-200/80">possta</code> non viene
              eseguito. Metti i comandi prima di dlg se devono applicarsi insieme.
            </p>
          </div>
          <div>
            <p className="text-stone-400 mb-1">
              Spawn casuale di un mostro in due possibili posizioni (1/2):
            </p>
            <pre className="bg-stone-950/80 border border-stone-700 rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap">{`serand spawn,1,0;
posmostro 5,12,7;
end;
serand spawn,1,1;
posmostro 5,3,7;
end;`}</pre>
          </div>
          <div>
            <p className="text-stone-400 mb-1">
              Trappola che ferisce e blocca chi possiede un certo oggetto:
            </p>
            <pre className="bg-stone-950/80 border border-stone-700 rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap">{`seogg 7;
msg La pergamena maledetta brucia tra le mani!;
agghp -1;
fineturno;
end;`}</pre>
          </div>
        </div>
      </HelpDetails>
    </div>
  );
}
