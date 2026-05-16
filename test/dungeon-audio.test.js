import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  playDungeonSfx,
  playSpellCastSfx,
  startFootstepsLoop,
  stopFootstepsLoop,
  isFootstepsLoopPlaying,
  setDungeonAudioMuted,
  DUNGEON_SFX,
} from "../dungeon-audio.js";

describe("dungeon-audio", () => {
  let mockFootstepsAudio;

  beforeEach(() => {
    setDungeonAudioMuted(false);
    mockFootstepsAudio = {
      loop: false,
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    };
    vi.spyOn(globalThis, "Audio").mockImplementation(function MockAudio(src) {
      if (src === DUNGEON_SFX.footsteps) return mockFootstepsAudio;
      return { play: vi.fn().mockResolvedValue(undefined) };
    });
  });

  afterEach(() => {
    stopFootstepsLoop();
    vi.restoreAllMocks();
    setDungeonAudioMuted(false);
  });

  it("playDungeonSfx crea Audio e chiama play", () => {
    playDungeonSfx("/audio/test.wav");
    expect(Audio).toHaveBeenCalledWith("/audio/test.wav");
    expect(Audio.mock.results[0].value.play).toHaveBeenCalled();
  });

  it("non riproduce se audio muto", () => {
    setDungeonAudioMuted(true);
    playSpellCastSfx();
    startFootstepsLoop();
    expect(Audio).not.toHaveBeenCalled();
    expect(isFootstepsLoopPlaying()).toBe(false);
  });

  it("footsteps: un loop, play all'avvio e pause alla fine", () => {
    startFootstepsLoop();
    expect(mockFootstepsAudio.loop).toBe(true);
    expect(mockFootstepsAudio.play).toHaveBeenCalled();
    expect(isFootstepsLoopPlaying()).toBe(true);

    mockFootstepsAudio.play.mockClear();
    startFootstepsLoop();
    expect(mockFootstepsAudio.play).not.toHaveBeenCalled();

    stopFootstepsLoop();
    expect(mockFootstepsAudio.pause).toHaveBeenCalled();
    expect(mockFootstepsAudio.currentTime).toBe(0);
    expect(isFootstepsLoopPlaying()).toBe(false);

    startFootstepsLoop();
    expect(mockFootstepsAudio.play).toHaveBeenCalled();
  });

  it("playSpellCastSfx usa spell.wav", () => {
    playSpellCastSfx();
    expect(Audio).toHaveBeenCalledWith(DUNGEON_SFX.spell);
  });
});
