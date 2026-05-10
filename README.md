# dungeon

## Script di missione (editor)

Le missioni possono includere script sulla mappa (eventi, comandi `msg`, `dlg`, ecc.). Nel progetto la **guida completa** ai comandi è nel pannello dell’editor mappa: scheda script → aiuto integrato (`editor/panels/EditorScriptHelp.jsx`).

- **`msg`** — notifica non bloccante (toast).
- **`dlg`** — modale con testo e pulsante «Chiudi»; blocca finché il giocatore non chiude e **interrompe** l’esecuzione degli altri comandi nello stesso script dopo `dlg`.
