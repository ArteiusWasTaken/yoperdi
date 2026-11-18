// Pruebas de la lógica con Node. Ejecuta: npm test
import assert from 'node:assert/strict';
import { Game, CONFIG } from './game.js';
import { BANK, FINALS } from './clues.js';

// ---- Banco de pistas ----
{
  const names = new Set();
  let cats = 0;
  for (const [group, list] of Object.entries(BANK)) {
    for (const c of list) {
      cats += 1;
      assert.ok(!names.has(c.name), `categoría repetida: ${c.name}`);
      names.add(c.name);
      assert.equal(c.clues.length, 5, `${c.name} debe tener 5 pistas`);
      for (const [q, a] of c.clues) {
        assert.ok(typeof q === 'string' && q.trim() && typeof a === 'string' && a.trim(), `pista vacía en ${c.name}`);
        assert.ok(q.length <= 140, `pista muy larga en ${c.name}: ${q}`);
        assert.ok(a.length <= 40, `respuesta muy larga en ${c.name}: ${a}`);
      }
    }
    assert.ok(list.length >= 2, `${group} necesita al menos 2 categorías`);
  }
  assert.ok(cats >= 24, 'debe haber suficientes categorías para dos rondas sin repetir');
  assert.ok(BANK.jalisco.length >= Math.max(...Object.entries(BANK).filter(([g]) => g !== 'jalisco').map(([, l]) => l.length)), 'Jalisco debe ser el grupo más grande');
  assert.ok(FINALS.length >= 8);
  console.log(`ok 0: banco con ${cats} categorías y ${FINALS.length} pistas finales`);
}

const cfg = { BUZZ_MS: 60000, ANSWER_MS: 60000, FINAL_MS: 60000 };
function room(n = 3) {
  const g = new Game({ code: 'TEST', config: cfg });
  const ps = [];
  for (let i = 0; i < n; i++) ps.push(g.join(null, `J${i + 1}`).player);
  return { g, ps };
}
const firstOpen = (g, daily = false) => {
  for (let ci = 0; ci < g.board().cats.length; ci++) for (let ri = 0; ri < 5; ri++) {
    const c = g.board().cats[ci].clues[ri];
    if (!c.used && !!c.daily === daily) return [ci, ri];
  }
  return null;
};

// 1) Tableros: 6 categorías x 5, dobles escondidos, sin repetir categorías entre rondas
{
  const { g } = room();
  g.start();
  assert.equal(g.phase, 'board');
  assert.equal(g.boards.length, 2);
  const n0 = g.boards[0].cats.map((c) => c.name), n1 = g.boards[1].cats.map((c) => c.name);
  assert.equal(n0.length, 6); assert.equal(n1.length, 6);
  assert.equal(new Set([...n0, ...n1]).size, 12, 'categorías distintas en las dos rondas');
  assert.equal(g.boards[0].cats.flatMap((c) => c.clues).filter((c) => c.daily).length, 1);
  assert.equal(g.boards[1].cats.flatMap((c) => c.clues).filter((c) => c.daily).length, 2);
  assert.ok(g.boards[0].cats.flatMap((c) => c.clues.filter((x, i) => x.daily && i < 2)).length === 0, 'Doble Daily no en las dos filas más fáciles');
  // El público no ve dónde están los dobles, el presentador sí
  const host = g.view('host');
  const disp = g.view('display');
  assert.ok(host.board.flatMap((c) => c.clues).some((c) => c.daily));
  assert.ok(!disp.board.flatMap((c) => c.clues).some((c) => c.daily), 'la tele no ve los dobles');
  assert.equal(disp.clue, null);
  console.log('ok 1: tableros');
}

// 2) Timbre: correcta suma, falla resta y reabre, nadie => se revela
{
  const { g, ps } = room(3);
  g.start();
  const [ci, ri] = firstOpen(g);
  g.pick(ci, ri);
  assert.equal(g.stage, 'read');
  g.buzz(ps[0].id);
  assert.equal(g.stage, 'read', 'no se puede timbrar antes de abrir el timbre');
  g.openBuzz();
  assert.equal(g.stage, 'buzz');
  assert.ok(g.view('player', ps[0].id).me.canBuzz);
  g.buzz(ps[1].id);
  assert.equal(g.stage, 'answer');
  assert.equal(g.cur.buzzerId, ps[1].id);
  g.buzz(ps[2].id); // ya hay quien contesta
  assert.equal(g.cur.buzzerId, ps[1].id);
  const val = g.cur.value;
  g.mark(false);
  assert.equal(ps[1].score, -val, 'fallar resta');
  assert.equal(g.stage, 'buzz', 'se reabre el timbre');
  g.buzz(ps[1].id); // bloqueado
  assert.equal(g.stage, 'buzz');
  g.buzz(ps[2].id);
  g.mark(true);
  assert.equal(ps[2].score, val);
  assert.equal(g.stage, 'reveal');
  assert.equal(g.pickerId, ps[2].id, 'elige quien acertó');
  assert.ok(g.view('display').clue.answer, 'la respuesta se ve al revelar');
  g.next();
  assert.equal(g.phase, 'board');
  assert.ok(g.board().cats[ci].clues[ri].used);

  // todos fallan
  const [c2, r2] = firstOpen(g);
  g.pick(c2, r2); g.openBuzz();
  for (const p of ps) { g.buzz(p.id); g.mark(false); if (g.stage === 'reveal') break; }
  assert.equal(g.stage, 'reveal');
  assert.equal(g.cur.why, 'todos fallaron');
  g.next();

  // nadie timbra: el presentador revela
  const [c3, r3] = firstOpen(g);
  g.pick(c3, r3); g.openBuzz();
  assert.equal(g.view('display').clue.answer, null, 'respuesta oculta mientras se juega');
  assert.ok(g.view('host').hostClue.answer, 'el presentador sí la ve');
  g.reveal();
  assert.equal(g.stage, 'reveal');
  g.next();
  console.log('ok 2: timbre y calificación');
}

// 3) El tiempo del timbre se agota
{
  const g = new Game({ code: 'TEST', config: { ...cfg, BUZZ_MS: 30 } });
  g.settings.buzzSeconds = 0.03;
  g.join(null, 'A'); g.join(null, 'B');
  g.start();
  const [ci, ri] = firstOpen(g);
  g.pick(ci, ri); g.openBuzz();
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(g.stage, 'reveal');
  assert.equal(g.cur.why, 'nadie');
  console.log('ok 3: tiempo agotado');
}

// 4) Doble Daily: apuesta limitada, acierto/fallo
{
  const { g, ps } = room(2);
  g.start();
  const pick = g.players.find((p) => p.id === g.pickerId);
  pick.score = 600;
  const [ci, ri] = firstOpen(g, true);
  g.pick(ci, ri);
  assert.equal(g.stage, 'dailybet');
  assert.equal(g.view('display').clue, null, 'la pista no se ve antes de apostar');
  assert.equal(g.view('host').dailyMax, 1000, 'tope = el mayor entre tu puntaje y el monto máximo');
  g.bet(ps.find((p) => p.id !== pick.id).id, 100); // otro jugador no puede apostar
  assert.equal(g.stage, 'dailybet');
  g.bet(pick.id, 1500);
  assert.equal(g.stage, 'dailybet', 'apuesta excesiva rechazada');
  g.bet(pick.id, 800);
  assert.equal(g.stage, 'dailyclue');
  assert.ok(g.view('display').clue.text);
  g.mark(true);
  assert.equal(pick.score, 1400);
  assert.equal(g.stage, 'reveal');
  g.next();
  // otra: fallo
  g.pickerId = pick.id;
  console.log('ok 4: doble daily');
}

// 5) Partida completa: dos rondas, Jeopardy final y ganador
{
  const { g, ps } = room(3);
  g.start();
  const clear = () => {
    for (;;) {
      const o = firstOpen(g);
      if (!o) { const d = firstOpen(g, true); if (!d) break; g.pick(...d); g.bet(0, 5, true); g.mark(true); g.next(); continue; }
      const [ci, ri] = o;
      g.pick(ci, ri);
      if (g.stage === 'dailybet') { g.bet(0, 5, true); g.mark(true); g.next(); continue; }
      g.openBuzz();
      const p = ps[(ci + ri) % 3];
      g.buzz(p.id); g.mark(true); g.next();
    }
  };
  clear();
  assert.equal(g.phase, 'roundIntro', 'después de la ronda 1');
  const low = ps.slice().sort((a, b) => a.score - b.score)[0];
  g.next();
  assert.equal(g.round, 1);
  assert.equal(g.pickerId, low.id, 'en la ronda 2 elige el último lugar');
  clear();
  assert.equal(g.phase, 'final');
  const before = ps.map((p) => p.score);
  // Final: elegibles = score > 0
  assert.deepEqual(g.fin.eligible.sort(), ps.filter((p) => p.score > 0).map((p) => p.id).sort());
  const e = g.fin.eligible;
  g.finalBet(e[0], 999999); // rechazada
  assert.equal(g.fin.bets[e[0]], undefined);
  for (const id of e) g.finalBet(id, g.player(id).score);
  assert.equal(g.view('display').final.clue, null, 'la pista final no se ve al apostar');
  g.finalShow();
  assert.equal(g.fin.stage, 'clue');
  assert.ok(g.view('display').final.clue);
  for (const id of e) g.finalAnswer(id, 'mi respuesta');
  assert.equal(g.view('display').final.reveal.length, 0, 'las respuestas no se ven mientras se escribe');
  assert.equal(g.view('display').final.answered.length, e.length, 'se ve quién ya respondió');
  assert.equal(g.view('display').final.myAnswer, '');
  g.finalClose();
  assert.equal(g.fin.stage, 'judge');
  // se califica de menor a mayor puntaje
  assert.equal(g.fin.order[0], e.slice().sort((a, b) => g.player(a).score - g.player(b).score)[0]);
  assert.equal(g.view('display').final.reveal.length, 1, 'solo se revela quien se está calificando');
  let i = 0;
  while (g.phase === 'final') g.finalMark(i++ % 2 === 0);
  assert.equal(g.phase, 'end');
  assert.ok(g.winners().length >= 1);
  const top = Math.max(...ps.map((p) => p.score));
  assert.ok(g.winners().every((id) => g.player(id).score === top));
  assert.ok(before.length === 3);
  g.reset();
  assert.equal(g.phase, 'lobby');
  assert.ok(g.players.every((p) => p.score === 0));
  console.log('ok 5: partida completa con final');
}

// 6) Final sin elegibles termina de inmediato; reglas de sala
{
  const { g, ps } = room(2);
  g.start();
  for (const p of ps) p.score = -500;
  g.phase = 'clue'; g.stage = 'reveal'; g.cur = { ci: 0, ri: 0, value: 200, locked: new Set(), buzzerId: null };
  for (const c of g.board().cats) for (const x of c.clues) x.used = true;
  g.round = 1; g.boards[1].cats.forEach((c) => c.clues.forEach((x) => { x.used = true; }));
  g.next();
  assert.equal(g.phase, 'end', 'si nadie tiene puntos positivos, no hay final');
  const g2 = new Game({ code: 'T2', config: cfg });
  assert.ok(g2.join(null, '').error, 'nombre vacío');
  g2.join(null, 'Ana');
  assert.ok(g2.join(null, 'ana').error, 'nombre repetido');
  g2.start();
  assert.equal(g2.phase, 'lobby', 'mínimo 2 jugadores');
  g2.join(null, 'Beto');
  g2.start();
  assert.equal(g2.phase, 'board');
  assert.ok(g2.join(null, 'Tarde').error, 'no se puede entrar a media partida');
  console.log('ok 6: reglas de sala');
}
process.exit(0);
