import { useEffect, useState } from 'react';
import { getAudio } from './audio.js';

// Conecta la música con la fase del juego y la desbloquea en el primer toque/clic de la página.
export function useAudio(kind, phase) {
  const audio = getAudio(kind);
  const [, force] = useState(0);

  useEffect(() => audio.subscribe(() => force((n) => n + 1)), [audio]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audio]);

  useEffect(() => { audio.setPhase(phase ?? 'lobby'); }, [audio, phase]);

  return audio;
}
