// Junta las categorías y arma los tableros de cada partida.
import jalisco from './clues/jalisco.js';
import mexico from './clues/mexico.js';
import cine from './clues/cine.js';
import tv from './clues/tv.js';
import musica from './clues/musica.js';
import ciencia from './clues/ciencia.js';
import deportes from './clues/deportes.js';
import general from './clues/general.js';
import finals from './clues/final.js';
import { MORE, MORE_FINALS } from './clues/more.js';

const base = { jalisco, mexico, cine, tv, musica, ciencia, deportes, general };
export const BANK = Object.fromEntries(Object.entries(base).map(([g, cats]) => [g, [...cats, ...(MORE[g] || [])]]));
export const FINALS = [...finals, ...MORE_FINALS];

// Cuántas categorías de cada grupo salen por ronda (Jalisco y México tienen prioridad).
const PER_ROUND = { jalisco: 2, mexico: 1 };
const CATS_PER_ROUND = 6;

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const all = () => Object.entries(BANK).flatMap(([group, cats]) => cats.map((c) => ({ ...c, group })));

// Devuelve un tablero por ronda: [{ cats: [{ name, group, clues: [{q,a,used,daily}] }] }]
export function pickBoards(cfg, rnd = Math.random) {
  const rounds = cfg.VALUES.length;
  const taken = new Set();
  const boards = [];
  for (let r = 0; r < rounds; r++) {
    const chosen = [];
    const take = (c) => { taken.add(c.name); chosen.push(c); };
    for (const [group, n] of Object.entries(PER_ROUND)) {
      const pool = shuffle(BANK[group].filter((c) => !taken.has(c.name)).map((c) => ({ ...c, group })), rnd);
      pool.slice(0, n).forEach(take);
    }
    const rest = shuffle(all().filter((c) => !taken.has(c.name)), rnd);
    // Evita que una misma materia domine el tablero: máximo 2 categorías por grupo (salvo Jalisco).
    for (const c of rest) {
      if (chosen.length >= CATS_PER_ROUND) break;
      const same = chosen.filter((x) => x.group === c.group).length;
      if (c.group !== 'jalisco' && same >= 2) continue;
      take(c);
    }
    const cats = shuffle(chosen, rnd).map((c) => ({
      name: c.name,
      group: c.group,
      clues: c.clues.map(([q, a]) => ({ q, a, used: false, daily: false })),
    }));
    // "Doble Daily": uno en la ronda 1, dos en la ronda 2, en las filas 3 a 5 y en categorías distintas.
    const nDaily = cfg.DAILIES[r] ?? 1;
    const colOrder = shuffle(cats.map((_, i) => i), rnd).slice(0, nDaily);
    for (const ci of colOrder) {
      const ri = 2 + Math.floor(rnd() * 3);
      cats[ci].clues[ri].daily = true;
    }
    boards.push({ cats });
  }
  return boards;
}

export function pickFinal(rnd = Math.random) {
  const [category, q, a] = FINALS[Math.floor(rnd() * FINALS.length)];
  return { category, q, a };
}
