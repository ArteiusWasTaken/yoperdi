// Lógica pura del juego (estilo Jeopardy). No depende de Cloudflare: se prueba con Node.
import { pickBoards, pickFinal } from './clues.js';

export const CONFIG = {
  VALUES: [
    [200, 400, 600, 800, 1000], // ronda 1
    [400, 800, 1200, 1600, 2000], // ronda 2 (montos dobles)
  ],
  DAILIES: [1, 2], // "Doble Daily" escondidos por ronda
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 12,
  BUZZ_MS: 10000, // tiempo para timbrar después de que el presentador abre el timbre
  ANSWER_MS: 12000, // tiempo para contestar (solo informativo: el presentador califica)
  FINAL_MS: 45000, // tiempo para escribir la respuesta del Jeopardy final
  BUZZ_OPTIONS: [8, 10, 15],
};

function cleanName(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 14);
}

export class Game {
  constructor({ code, onChange = () => {}, now = () => Date.now(), rnd = Math.random, config = {} }) {
    this.cfg = { ...CONFIG, ...config };
    this.code = code;
    this.onChange = onChange;
    this.now = now;
    this.rnd = rnd;
    this.timer = null;
    this.settings = { buzzSeconds: this.cfg.BUZZ_MS / 1000 };
    this.players = [];
    this.#resetRun();
  }

  #resetRun() {
    this.phase = 'lobby'; // lobby | board | clue | roundIntro | final | end
    this.stage = null;
    this.round = -1;
    this.boards = [];
    this.final = null;
    this.pickerId = null;
    this.cur = null; // { ci, ri, value, daily, locked:Set, buzzerId, bet }
    this.fin = null; // estado del Jeopardy final
    this.deadline = null;
    this.phaseMs = 0;
    this.result = null; // última calificación (para mostrar en pantalla)
  }

  // ---------- utilidades ----------
  changed() { this.onChange(); }

  setTimer(ms, fn) {
    clearTimeout(this.timer);
    this.deadline = this.now() + ms;
    this.phaseMs = ms;
    this.timer = setTimeout(() => { this.timer = null; fn(); }, ms);
  }

  clearTimer() {
    clearTimeout(this.timer);
    this.timer = null;
    this.deadline = null;
    this.phaseMs = 0;
  }

  player(id) { return this.players.find((p) => p.id === id); }
  board() { return this.boards[this.round]; }
  cell() { return this.cur ? this.board().cats[this.cur.ci].clues[this.cur.ri] : null; }
  roundMax() { return this.cfg.VALUES[this.round][this.cfg.VALUES[this.round].length - 1]; }

  // ---------- sala ----------
  join(token, name) {
    let p = token && this.players.find((x) => x.token === token);
    if (p) { p.connected = true; this.changed(); return { player: p }; }
    if (this.phase !== 'lobby') return { error: 'La partida ya empezó. Espera a la siguiente.' };
    name = cleanName(name);
    if (!name) return { error: 'Escribe tu nombre.' };
    if (this.players.length >= this.cfg.MAX_PLAYERS) return { error: `La sala está llena (máx. ${this.cfg.MAX_PLAYERS}).` };
    if (this.players.some((x) => x.name.toLowerCase() === name.toLowerCase())) return { error: 'Ese nombre ya está en uso.' };
    p = { id: crypto.randomUUID().slice(0, 8), token: crypto.randomUUID(), name, connected: true, score: 0 };
    this.players.push(p);
    this.changed();
    return { player: p };
  }

  setConnected(id, connected) {
    const p = this.player(id);
    if (!p) return;
    if (!connected && this.phase === 'lobby') this.players = this.players.filter((x) => x.id !== id);
    else p.connected = connected;
    this.changed();
  }

  kick(id) {
    if (this.phase !== 'lobby') return;
    this.players = this.players.filter((x) => x.id !== id);
    this.changed();
  }

  setSettings({ buzzSeconds } = {}) {
    if (this.cfg.BUZZ_OPTIONS.includes(buzzSeconds) && this.phase === 'lobby') this.settings.buzzSeconds = buzzSeconds;
    this.changed();
  }

  // ---------- inicio y tablero ----------
  start() {
    if (this.phase !== 'lobby') return;
    this.players = this.players.filter((p) => p.connected);
    if (this.players.length < this.cfg.MIN_PLAYERS) return;
    for (const p of this.players) p.score = 0;
    this.boards = pickBoards(this.cfg, this.rnd);
    this.final = pickFinal(this.rnd);
    this.round = 0;
    this.pickerId = this.players[Math.floor(this.rnd() * this.players.length)].id;
    this.#toBoard();
  }

  #toBoard() {
    this.phase = 'board';
    this.stage = null;
    this.cur = null;
    this.clearTimer();
    this.changed();
  }

  // El presentador elige la casilla que dijo el jugador (columna `ci`, fila `ri`).
  pick(ci, ri) {
    if (this.phase !== 'board') return;
    const cell = this.board().cats[ci]?.clues[ri];
    if (!cell || cell.used) return;
    this.cur = { ci, ri, value: this.cfg.VALUES[this.round][ri], daily: !!cell.daily, locked: new Set(), buzzerId: null, bet: null };
    this.phase = 'clue';
    this.result = null;
    this.stage = cell.daily ? 'dailybet' : 'read';
    this.clearTimer();
    this.changed();
  }

  // ---------- timbre ----------
  openBuzz() {
    if (this.phase !== 'clue' || this.stage !== 'read') return;
    this.#startBuzz();
  }

  #startBuzz() {
    this.stage = 'buzz';
    this.cur.buzzerId = null;
    this.setTimer(this.settings.buzzSeconds * 1000, () => this.#reveal('nadie'));
    this.changed();
  }

  buzz(id) {
    if (this.phase !== 'clue' || this.stage !== 'buzz') return;
    const p = this.player(id);
    if (!p || !p.connected || this.cur.locked.has(id)) return;
    this.cur.buzzerId = id;
    this.stage = 'answer';
    this.setTimer(this.cfg.ANSWER_MS, () => this.changed());
    this.changed();
  }

  // Califica la respuesta del jugador que timbró (o del Doble Daily).
  mark(correct) {
    if (this.phase !== 'clue') return;
    if (this.stage === 'answer') {
      const p = this.player(this.cur.buzzerId);
      if (!p) return;
      if (correct) {
        p.score += this.cur.value;
        this.pickerId = p.id;
        this.result = { playerId: p.id, correct: true, delta: this.cur.value };
        this.#reveal('correcta');
      } else {
        p.score -= this.cur.value;
        this.cur.locked.add(p.id);
        this.result = { playerId: p.id, correct: false, delta: -this.cur.value };
        const left = this.players.some((x) => x.connected && !this.cur.locked.has(x.id));
        if (left) this.#startBuzz();
        else this.#reveal('todos fallaron');
      }
    } else if (this.stage === 'dailyclue') {
      const p = this.player(this.pickerId);
      const delta = correct ? this.cur.bet : -this.cur.bet;
      p.score += delta;
      this.result = { playerId: p.id, correct: !!correct, delta };
      this.#reveal(correct ? 'correcta' : 'incorrecta');
    }
  }

  // Doble Daily: el jugador que eligió apuesta (también puede fijarla el presentador).
  bet(id, amount, byHost = false) {
    if (this.phase !== 'clue' || this.stage !== 'dailybet') return;
    if (!byHost && id !== this.pickerId) return;
    const p = this.player(this.pickerId);
    const max = Math.max(p.score, this.roundMax());
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n < 5 || n > max) return;
    this.cur.bet = n;
    this.cur.value = n;
    this.stage = 'dailyclue';
    this.clearTimer();
    this.changed();
  }

  // El presentador salta o revela la respuesta de la pista actual.
  reveal() {
    if (this.phase === 'clue' && this.stage !== 'reveal') {
      if (this.stage === 'dailybet' || this.stage === 'dailyclue') {
        // Doble Daily sin contestar: cuenta como fallo de la apuesta (si ya apostó).
        if (this.stage === 'dailyclue') this.mark(false);
        else this.#reveal('saltada');
      } else this.#reveal('saltada');
    }
  }

  #reveal(why) {
    this.stage = 'reveal';
    this.cur.why = why;
    this.cell().used = true;
    this.clearTimer();
    this.changed();
  }

  // El presentador continúa después de revelar la respuesta.
  next() {
    if (this.phase === 'clue' && this.stage === 'reveal') {
      const left = this.board().cats.some((c) => c.clues.some((x) => !x.used));
      if (left) return this.#toBoard();
      if (this.round < this.cfg.VALUES.length - 1) {
        this.phase = 'roundIntro';
        this.stage = null;
        this.cur = null;
        this.changed();
        return undefined;
      }
      return this.#startFinal();
    }
    if (this.phase === 'roundIntro') {
      this.round += 1;
      // En la ronda 2 empieza quien va en último lugar.
      const low = this.players.slice().sort((a, b) => a.score - b.score)[0];
      this.pickerId = low.id;
      return this.#toBoard();
    }
    return undefined;
  }

  // ---------- Jeopardy final ----------
  #startFinal() {
    this.phase = 'final';
    this.cur = null;
    this.clearTimer();
    const eligible = this.players.filter((p) => p.score > 0).map((p) => p.id);
    this.fin = { stage: 'bets', eligible, bets: {}, answers: {}, order: [], idx: 0, judged: {} };
    if (eligible.length === 0) return this.#end();
    this.changed();
    return undefined;
  }

  finalBet(id, amount) {
    if (this.phase !== 'final' || this.fin.stage !== 'bets') return;
    if (!this.fin.eligible.includes(id)) return;
    const p = this.player(id);
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n < 0 || n > p.score) return;
    this.fin.bets[id] = n;
    this.changed();
  }

  finalAnswer(id, text) {
    if (this.phase !== 'final' || this.fin.stage !== 'clue') return;
    if (!this.fin.eligible.includes(id)) return;
    this.fin.answers[id] = String(text ?? '').trim().slice(0, 80);
    this.changed();
  }

  // El presentador muestra la pista final (después de que todos apostaron).
  finalShow() {
    if (this.phase !== 'final' || this.fin.stage !== 'bets') return;
    for (const id of this.fin.eligible) if (this.fin.bets[id] === undefined) this.fin.bets[id] = 0;
    this.fin.stage = 'clue';
    this.setTimer(this.cfg.FINAL_MS, () => this.finalClose());
    this.changed();
  }

  // Cierra las respuestas y pasa a calificar, empezando por el de menos puntos.
  finalClose() {
    if (this.phase !== 'final' || this.fin.stage !== 'clue') return;
    this.clearTimer();
    this.fin.stage = 'judge';
    this.fin.order = this.fin.eligible.slice().sort((a, b) => this.player(a).score - this.player(b).score);
    this.fin.idx = 0;
    this.changed();
  }

  finalMark(correct) {
    if (this.phase !== 'final' || this.fin.stage !== 'judge') return;
    const id = this.fin.order[this.fin.idx];
    const p = this.player(id);
    const bet = this.fin.bets[id] ?? 0;
    p.score += correct ? bet : -bet;
    this.fin.judged[id] = !!correct;
    this.fin.idx += 1;
    if (this.fin.idx >= this.fin.order.length) this.#end();
    else this.changed();
  }

  #end() {
    this.phase = 'end';
    this.stage = null;
    this.clearTimer();
    this.changed();
  }

  winners() {
    if (!this.players.length) return [];
    const top = Math.max(...this.players.map((p) => p.score));
    return this.players.filter((p) => p.score === top).map((p) => p.id);
  }

  reset() {
    this.clearTimer();
    this.players = this.players.filter((p) => p.connected);
    for (const p of this.players) p.score = 0;
    this.#resetRun();
    this.changed();
  }

  // ---------- vistas ----------
  // role: 'host' (ve las respuestas), 'display' (tele) o 'player' (celular).
  view(role = 'display', forId = null) {
    const host = role === 'host';
    const showClue = this.phase === 'clue' && ['read', 'buzz', 'answer', 'dailyclue', 'reveal'].includes(this.stage);
    const revealed = this.phase === 'clue' && this.stage === 'reveal';
    const cell = this.cur ? this.cell() : null;
    const base = {
      code: this.code,
      role,
      phase: this.phase,
      stage: this.phase === 'final' ? this.fin?.stage : this.stage,
      settings: this.settings,
      serverNow: this.now(),
      deadline: this.deadline,
      phaseMs: this.phaseMs,
      round: this.round,
      rounds: this.cfg.VALUES.length,
      limits: { min: this.cfg.MIN_PLAYERS, max: this.cfg.MAX_PLAYERS, buzz: this.cfg.BUZZ_OPTIONS },
      pickerId: this.pickerId,
      players: this.players.map((p) => ({ id: p.id, name: p.name, connected: p.connected, score: p.score })),
      winners: this.phase === 'end' ? this.winners() : null,
      result: this.result,
      board: this.phase === 'board' || this.phase === 'clue' || this.phase === 'roundIntro'
        ? this.board()?.cats.map((c) => ({
            name: c.name,
            group: c.group,
            clues: c.clues.map((x, ri) => ({ value: this.cfg.VALUES[this.round][ri], used: !!x.used, daily: host && !!x.daily && !x.used })),
          })) ?? null
        : null,
      clue: null,
      buzzerId: this.cur?.buzzerId ?? null,
      lockedIds: this.cur ? [...this.cur.locked] : [],
    };

    if (this.cur) {
      base.cur = {
        ci: this.cur.ci,
        ri: this.cur.ri,
        value: this.cur.value,
        daily: this.cur.daily,
        bet: this.cur.bet,
        category: this.board().cats[this.cur.ci].name,
        why: this.cur.why ?? null,
      };
    }
    if (showClue && cell) {
      base.clue = { text: cell.q, answer: host || revealed ? cell.a : null };
    }
    // El presentador ve la respuesta aunque aún no se revele (para poder calificar).
    if (host && cell && ['dailybet', 'read', 'buzz', 'answer', 'dailyclue', 'reveal'].includes(this.stage) && this.phase === 'clue') {
      base.hostClue = { text: cell.q, answer: cell.a, note: cell.n ?? null };
    }
    if (this.phase === 'clue' && this.stage === 'dailybet') {
      const p = this.player(this.pickerId);
      base.dailyMax = p ? Math.max(p.score, this.roundMax()) : this.roundMax();
    }

    if (this.phase === 'final' || this.phase === 'end') {
      const f = this.fin;
      base.final = f
        ? {
            category: this.final.category,
            stage: f.stage,
            eligible: f.eligible,
            betted: f.eligible.filter((id) => f.bets[id] !== undefined),
            answered: f.eligible.filter((id) => !!f.answers[id]),
            clue: ['clue', 'judge'].includes(f.stage) || this.phase === 'end' ? this.final.q : null,
            order: f.order,
            idx: f.idx,
            judged: f.judged,
            // Se muestran apuesta y respuesta solo de quien ya está siendo calificado (o ya calificado).
            reveal: f.order.slice(0, f.stage === 'judge' ? f.idx + 1 : f.order.length).map((id) => ({
              id,
              bet: f.bets[id] ?? 0,
              answer: f.answers[id] ?? '',
              correct: f.judged[id] ?? null,
            })),
            answer: host || this.phase === 'end' ? this.final.a : null,
            hostAnswer: host ? this.final.a : null,
            myBet: forId ? f.bets[forId] ?? null : null,
            myAnswer: forId ? f.answers[forId] ?? '' : '',
          }
        : null;
    }

    if (role === 'player' && forId) {
      const me = this.player(forId);
      if (me) {
        base.me = {
          id: me.id,
          name: me.name,
          score: me.score,
          canBuzz: this.phase === 'clue' && this.stage === 'buzz' && me.connected && !this.cur.locked.has(me.id),
          locked: !!this.cur?.locked.has(me.id),
          isPicker: this.pickerId === me.id,
        };
      }
    }
    return base;
  }
}
