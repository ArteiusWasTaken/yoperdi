// Música de fondo y efectos generados con Web Audio (sin archivos de audio).
// Los navegadores solo dejan sonar después de un toque/clic: `unlock()` se llama en el primer gesto.

const hz = (m) => 440 * 2 ** ((m - 69) / 12);

// Cada "mood" es un loop de 4 compases (16 pasos por compás). Notas en MIDI.
const MOODS = {
  // Sala de espera / resúmenes: alegre, estilo concurso.
  lobby: {
    bpm: 112,
    chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], // C, Am, F, G
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    arp: [0, null, 1, null, 2, null, 1, null, 3, null, 2, null, 1, null, 2, null],
    wave: 'triangle', arpGain: 0.5,
  },
  // Preguntas: más pulso, algo de urgencia.
  question: {
    bpm: 132,
    chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]], // Am, F, C, G
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    bass: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
    arp: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2],
    wave: 'square', arpGain: 0.22,
  },
  // Destape: suspenso, lento, notas graves y latido.
  destape: {
    bpm: 84,
    chords: [[45, 48, 51], [45, 48, 51], [44, 47, 50], [43, 46, 50]], // Am con tritono, Ab, G
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    arp: [null, null, null, null, 2, null, null, null, null, null, null, null, 1, null, null, null],
    wave: 'sawtooth', arpGain: 0.12,
  },
  // Final: festivo.
  final: {
    bpm: 124,
    chords: [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]], // C, G, Am, F
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    arp: [0, 1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 3, 4, 5, 4, 3],
    wave: 'triangle', arpGain: 0.55,
  },
};

const MOOD_BY_PHASE = {
  lobby: 'lobby',
  board: 'lobby',
  roundIntro: 'final',
  clue: 'question',
  final: 'destape',
  end: 'final',
};

// Si existe public/audio/<nombre>.mp3 se usa en lugar de la pista generada.
const FILE_NAMES = { lobby: 'intro', question: 'ronda', destape: 'destape', final: 'final' };

class AudioEngine {
  constructor(storageKey, defaultOn) {
    this.key = storageKey;
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.timer = null;
    this.mood = null;
    this.step = 0;
    this.nextTime = 0;
    this.listeners = new Set();
    this.filePromises = {};
    this.fileSource = null;
    this.useFile = false;
    this.on = defaultOn;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) this.on = saved === '1';
    } catch { /* sin almacenamiento */ }
  }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((fn) => fn()); }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  // Llamar desde un gesto del usuario (clic/toque).
  unlock() {
    if (this.ctx && this.running && this.timer) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.on ? 0.5 : 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5200;
      this.master.connect(lp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state !== 'running') this.ctx.resume().then(() => { this.#startLoop(); this.#applyMood(); this.emit(); }).catch(() => {});
    else { this.#startLoop(); this.#applyMood(); }
    this.emit();
  }

  setOn(on) {
    this.on = on;
    try { localStorage.setItem(this.key, on ? '1' : '0'); } catch { /* sin almacenamiento */ }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(on ? 0.5 : 0, t, 0.08);
    }
    this.emit();
  }

  toggle() {
    if (this.on && !this.running) { this.unlock(); return; } // estaba "activada" pero faltaba el toque
    this.unlock();
    this.setOn(!this.on);
  }

  setPhase(phase) {
    const mood = MOOD_BY_PHASE[phase] ?? 'lobby';
    if (mood === this.mood) return;
    this.mood = mood;
    this.step = 0;
    if (this.ctx) {
      this.nextTime = this.ctx.currentTime + 0.05;
      this.#applyMood();
    }
  }

  #loadFile(mood) {
    if (!this.filePromises[mood]) {
      this.filePromises[mood] = (async () => {
        try {
          const r = await fetch(`/audio/${FILE_NAMES[mood]}.mp3`);
          if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) return null;
          return await this.ctx.decodeAudioData(await r.arrayBuffer());
        } catch { return null; }
      })();
    }
    return this.filePromises[mood];
  }

  // Cambia entre la pista generada y un mp3 propio (si existe) según el momento del juego.
  async #applyMood() {
    if (!this.ctx || !this.mood) return;
    const mood = this.mood;
    if (this.fileSource) { try { this.fileSource.stop(); } catch { /* ya detenido */ } this.fileSource = null; }
    this.useFile = false;
    const buf = await this.#loadFile(mood);
    if (!buf || this.mood !== mood || !this.running) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.master);
    src.start();
    this.fileSource = src;
    this.useFile = true;
  }

  #startLoop() {
    if (this.timer || !this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.#schedule(), 30);
  }

  #schedule() {
    if (!this.running || !this.mood) return;
    const m = MOODS[this.mood];
    const stepLen = 60 / m.bpm / 4;
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05; // pestaña dormida
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      if (this.on && !this.useFile) this.#playStep(m, this.step, this.nextTime, stepLen);
      this.step = (this.step + 1) % (16 * m.chords.length);
      this.nextTime += stepLen;
    }
  }

  #env(gainNode, t, peak, attack, release) {
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  #tone(type, freq, t, peak, attack, release, dest = this.master) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    this.#env(g, t, peak, attack, release);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + attack + release + 0.05);
    return o;
  }

  #playStep(m, step, t, stepLen) {
    const bar = Math.floor(step / 16) % m.chords.length;
    const s = step % 16;
    const chord = m.chords[bar];
    if (m.kick[s]) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      this.#env(g, t, 0.55, 0.005, 0.16);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.25);
    }
    if (m.hat[s]) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const g = this.ctx.createGain();
      this.#env(g, t, 0.12, 0.002, 0.04);
      src.connect(hp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + 0.1);
    }
    if (m.bass[s]) this.#tone('sine', hz(chord[0] - 12), t, 0.5, 0.01, stepLen * 1.8);
    const a = m.arp[s];
    if (a !== null && a !== undefined) {
      const note = chord[a % 3] + 12 * (1 + Math.floor(a / 3));
      this.#tone(m.wave, hz(note), t, m.arpGain * 0.35, 0.008, stepLen * 1.5);
    }
    if (s === 0 && m === MOODS.destape) this.#tone('sine', hz(chord[0] - 24), t, 0.35, 0.05, stepLen * 12);
  }

  // ---- efectos ----
  #fx(fn) {
    if (!this.ctx || !this.running || !this.on) return;
    fn(this.ctx.currentTime + 0.01);
  }

  right() { this.#fx((t) => { this.#tone('sine', hz(84), t, 0.35, 0.005, 0.18); this.#tone('sine', hz(91), t + 0.1, 0.35, 0.005, 0.3); }); }
  wrong() { this.#fx((t) => { const o = this.#tone('sawtooth', hz(55), t, 0.25, 0.01, 0.35); o.frequency.exponentialRampToValueAtTime(hz(43), t + 0.35); }); }
  coin() { this.#fx((t) => { this.#tone('square', hz(88), t, 0.18, 0.003, 0.08); this.#tone('square', hz(95), t + 0.08, 0.18, 0.003, 0.5); }); }
  fanfare() { this.#fx((t) => { [72, 76, 79, 84, 79, 84].forEach((n, i) => this.#tone('triangle', hz(n), t + i * 0.13, 0.4, 0.01, i === 5 ? 0.9 : 0.2)); }); }
}

const engines = {};
export function getAudio(kind) {
  if (!engines[kind]) engines[kind] = new AudioEngine(`rp_music_${kind}`, kind !== 'player'); // presentador y tele suenan por defecto; los celulares no
  return engines[kind];
}
