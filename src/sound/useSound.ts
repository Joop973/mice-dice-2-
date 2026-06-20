// React-Anbindung an den SoundManager. Ein einziger Manager wird als Singleton
// geteilt, damit Stummschaltung und AudioContext global konsistent sind.

import { useCallback, useEffect, useState } from 'react';
import { SoundManager } from './SoundManager';
import type { SoundEvent } from './events';

let singleton: SoundManager | null = null;

function getManager(): SoundManager {
  if (!singleton) singleton = new SoundManager();
  return singleton;
}

export interface UseSound {
  play: (event: SoundEvent) => void;
  muted: boolean;
  toggleMuted: () => void;
  /** Ist überhaupt ein Musik-Track hinterlegt? (sonst Schalter ausblenden) */
  musicAvailable: boolean;
  musicOn: boolean;
  toggleMusic: () => void;
}

export function useSound(): UseSound {
  const mgr = getManager();
  const [muted, setMuted] = useState(mgr.isMuted());
  const [musicOn, setMusicOn] = useState(mgr.isMusicOn());

  // AudioContext bei der ersten Nutzergeste freischalten (Autoplay-Richtlinie).
  useEffect(() => {
    const unlock = () => mgr.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [mgr]);

  const play = useCallback((event: SoundEvent) => mgr.play(event), [mgr]);
  const toggleMuted = useCallback(() => setMuted(mgr.toggleMuted()), [mgr]);
  const toggleMusic = useCallback(() => setMusicOn(mgr.toggleMusic()), [mgr]);

  return {
    play,
    muted,
    toggleMuted,
    musicAvailable: mgr.musicAvailable(),
    musicOn,
    toggleMusic,
  };
}
