/** SFX di gioco (rispetta mute impostato da dungeon.jsx). */

export const DUNGEON_SFX = {
  spell: "/audio/spell.wav",
  footsteps: "/audio/footsteps.wav",
};

const FOOTSTEPS_VOLUME = 0.9;
const SFX_VOLUME = 1;

let muted = false;
let footstepsAudio = null;
let footstepsPlaying = false;

function getFootstepsAudio() {
  if (!footstepsAudio) {
    footstepsAudio = new Audio(DUNGEON_SFX.footsteps);
    footstepsAudio.loop = true;
    footstepsAudio.volume = FOOTSTEPS_VOLUME;
    footstepsAudio.preload = "auto";
  }
  return footstepsAudio;
}

export function setDungeonAudioMuted(value) {
  muted = Boolean(value);
  if (muted) {
    stopFootstepsLoop();
  }
}

export function isDungeonAudioMuted() {
  return muted;
}

export function playDungeonSfx(src) {
  if (muted || !src) return;
  const audio = new Audio(src);
  audio.volume = SFX_VOLUME;
  audio.play().catch(() => {});
}

export function playSpellCastSfx() {
  playDungeonSfx(DUNGEON_SFX.spell);
}

/** Sblocca l'audio SFX dopo un gesto utente (policy browser). */
export function primeFootstepsAudio() {
  if (muted) return;
  const audio = getFootstepsAudio();
  audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      footstepsPlaying = false;
    })
    .catch(() => {});
}

/** Avvia footsteps.wav in loop (un'unica istanza). */
export function startFootstepsLoop() {
  if (muted) return;
  const audio = getFootstepsAudio();
  if (footstepsPlaying && !audio.paused) return;

  footstepsPlaying = true;
  audio.currentTime = 0;
  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      footstepsPlaying = false;
    });
  }
}

/** Ferma il loop dei passi. */
export function stopFootstepsLoop() {
  if (!footstepsAudio) {
    footstepsPlaying = false;
    return;
  }
  footstepsAudio.pause();
  footstepsAudio.currentTime = 0;
  footstepsPlaying = false;
}

export function isFootstepsLoopPlaying() {
  return footstepsPlaying;
}
