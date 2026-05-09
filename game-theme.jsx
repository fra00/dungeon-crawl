/**
 * Shared full-game backdrop (not generated from ISL).
 * Path must match `public/img/background.png`.
 */

import React from 'react';

export const GAME_BACKGROUND_URL = '/img/background.png';

export function GameBackgroundLayer() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GAME_BACKGROUND_URL})` }}
      aria-hidden
    />
  );
}
