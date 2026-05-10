/**
 * Helper di rendering per i flag di mirror del mobilio.
 *
 * - `flpo` (flip orizzontale): applica scaleX(-1) → l'immagine viene specchiata
 *   sull'asse verticale (utile per mobili asimmetrici come la scrivania).
 * - `flpv` (flip verticale): applica scaleY(-1) → specchiatura sull'asse orizzontale.
 *
 * Il mirror avviene rispetto al centro dell'immagine (default transform-origin),
 * quindi il bounding box rimane ancorato alla stessa cella di origine.
 */
export function furnitureFlipTransform(flpo, flpv) {
  const parts = [];
  if (flpo) parts.push("scaleX(-1)");
  if (flpv) parts.push("scaleY(-1)");
  return parts.length === 0 ? "" : parts.join(" ");
}

/**
 * CSS style object da applicare a un <img> mobilio.
 * Restituisce un oggetto vuoto se non c'è alcun mirror attivo, così non
 * sovrascrive `transform` quando non serve.
 */
export function furnitureFlipStyle(flpo, flpv) {
  const t = furnitureFlipTransform(flpo, flpv);
  return t ? { transform: t } : {};
}

/**
 * Sprite porta in cella fissa (34×34): il PNG è più piccolo della cella;
 * ancoriamo al tabellone — orizzontali (`portao`) in basso, verticali (`portav`) a destra.
 */
export function doorPlaceholderStyle(oriz) {
  return {
    objectFit: "contain",
    objectPosition: oriz ? "center bottom" : "right center",
  };
}

/** Per il runtime dove abbiamo solo il nome file (`dungeon-use-doors`). */
export function doorPlaceholderStyleFromFilename(img) {
  return doorPlaceholderStyle(img === "portao.png");
}
