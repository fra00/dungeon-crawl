import { useBoardViewport } from "./use-board-viewport.js";

export { computeFitScale } from "./use-board-viewport.js";

/** @deprecated Usare useBoardViewport. Restituisce solo la scala fit (senza moltiplicatore zoom). */
export function useBoardFitScale(boardSlotRef) {
  const { fitScale } = useBoardViewport(boardSlotRef);
  return fitScale;
}
