import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useCountdown } from './useRoom.js';

export const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n ?? 0).toLocaleString('es-MX')}`;

export function Logo({ small }) {
  return (
    <div className={`logo ${small ? 'small' : 'big'}`}>
      <span className="logo-a">YO</span>
      <span className="logo-b">PERDÍ</span>
    </div>
  );
}

export function QrCode({ text, size = 180 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let ok = true;
    QRCode.toDataURL(text, { margin: 1, width: size * 2, color: { dark: '#0a1240', light: '#ffffff' } })
      .then((u) => ok && setSrc(u)).catch(() => {});
    return () => { ok = false; };
  }, [text, size]);
  return src ? <img className="qr" src={src} width={size} height={size} alt="Código QR" /> : <div className="qr" style={{ width: size, height: size }} />;
}

export function MusicPill({ audio, icon }) {
  let text;
  if (!audio.on) text = icon ? '🔇' : '🔇 Música: no';
  else if (!audio.running) text = icon ? '🔈' : '🔈 Toca para activar la música';
  else text = icon ? '🎵' : '🎵 Música: sí';
  return (
    <button type="button" className={`pill ${audio.on && audio.running ? 'on' : ''}`} onClick={() => audio.toggle()} aria-label="Música">
      {text}
    </button>
  );
}

export function TimerBar({ deadline, total, offset }) {
  const left = useCountdown(deadline, offset);
  const pct = total ? Math.min(100, (left / total) * 100) : 0;
  return (
    <div className={`timer ${left < 2000 ? 'urgent' : ''}`}>
      <div className="timer-fill" style={{ width: `${pct}%` }} />
      <span className="timer-n">{Math.ceil(left / 1000)}</span>
    </div>
  );
}

// Marcador de jugadores. Resalta a quien elige y a quien timbró.
export function Scores({ s, big }) {
  return (
    <div className={`scores ${big ? 'big' : ''}`}>
      {s.players.map((p) => (
        <div key={p.id} className={`score ${p.id === s.pickerId ? 'picker' : ''} ${p.id === s.buzzerId ? 'buzzer' : ''} ${s.lockedIds.includes(p.id) ? 'locked' : ''} ${p.connected ? '' : 'off'}`}>
          <span className="score-name">{p.name}</span>
          <span className={`score-n ${p.score < 0 ? 'neg' : ''}`}>{money(p.score)}</span>
        </div>
      ))}
    </div>
  );
}

// Tablero de 6 columnas. `onPick` solo lo usa el presentador.
export function BoardGrid({ s, onPick }) {
  if (!s.board) return null;
  const rows = s.board[0].clues.length;
  return (
    <div className="board" style={{ gridTemplateColumns: `repeat(${s.board.length}, 1fr)` }}>
      {s.board.map((c, ci) => <div key={`h${ci}`} className="board-cat">{c.name}</div>)}
      {Array.from({ length: rows }).map((_, ri) =>
        s.board.map((c, ci) => {
          const x = c.clues[ri];
          const cur = s.cur && s.cur.ci === ci && s.cur.ri === ri && s.phase === 'clue';
          return (
            <button
              key={`${ci}-${ri}`}
              type="button"
              className={`cell ${x.used ? 'used' : ''} ${x.daily ? 'daily' : ''} ${cur ? 'cur' : ''}`}
              disabled={x.used || !onPick}
              onClick={() => onPick?.(ci, ri)}
            >
              {x.used ? '' : money(x.value)}
              {x.daily && <small>★</small>}
            </button>
          );
        }),
      )}
    </div>
  );
}

export function nameOf(s, id) { return s.players.find((p) => p.id === id)?.name ?? '—'; }

// Clave que cambia cada vez que se califica una respuesta (para sonidos).
export function resultKey(s) {
  return s.result ? [s.result.playerId, s.result.delta, s.cur?.ci, s.cur?.ri, s.lockedIds.length].join('-') : '';
}
