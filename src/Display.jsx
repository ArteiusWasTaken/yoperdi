import React, { useEffect, useRef } from 'react';
import { useRoom } from './useRoom.js';
import { useAudio } from './useAudio.js';
import { Logo, MusicPill, QrCode, TimerBar, Scores, BoardGrid, money, nameOf, resultKey } from './ui.jsx';

// Pantalla pública (tele): tablero, pista, marcador. Nunca recibe respuestas antes de tiempo.
export default function Display({ code }) {
  const { state: s, status, fatal, offset } = useRoom({ code, role: 'display' });
  const audio = useAudio('tv', s?.phase);
  const first = useRef(true);
  const rk = s ? resultKey(s) : '';

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!rk || !s?.result) return;
    if (s.result.correct) audio.right(); else audio.wrong();
  }, [rk]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (s?.phase === 'end') audio.fanfare(); }, [s?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (fatal) return <main className="tv center"><p className="error">{fatal}</p></main>;
  if (!s) return <main className="tv center"><Logo /><p className="hint">{status === 'online' ? 'Cargando…' : 'Conectando…'}</p></main>;

  const joinUrl = `${location.origin}${location.pathname}?sala=${code}`;
  const tools = (
    <div className="tv-tools">
      <MusicPill audio={audio} icon />
      <button className="pill" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>⛶</button>
    </div>
  );

  if (s.phase === 'lobby') {
    return (
      <main className="tv center">
        {tools}
        <Logo />
        <div className="tv-join">
          <QrCode text={joinUrl} size={240} />
          <div>
            <p className="eyebrow">Entra desde tu celular con el código</p>
            <div className="bigcode huge">{code}</div>
          </div>
        </div>
        <Scores s={s} big />
        <p className="hint">{s.players.length === 0 ? 'Esperando jugadores…' : 'Esperando a que el presentador empiece…'}</p>
      </main>
    );
  }

  if (s.phase === 'end') {
    const names = s.winners.map((id) => nameOf(s, id)).join(' y ');
    return (
      <main className="tv center">
        {tools}
        <p className="eyebrow">{s.winners.length > 1 ? '¡Empate!' : '¡Tenemos ganador!'}</p>
        <h1 className="winner huge">{names}</h1>
        <Scores s={s} big />
      </main>
    );
  }

  if (s.phase === 'roundIntro') {
    return (
      <main className="tv center">
        {tools}
        <p className="eyebrow">Fin de la ronda {s.round + 1}</p>
        <h1 className="huge">Doble Rosas</h1>
        <p className="hint">Los valores se duplican</p>
        <Scores s={s} big />
      </main>
    );
  }

  if (s.phase === 'board') {
    return (
      <main className="tv">
        {tools}
        <Scores s={s} big />
        <p className="turn big">Elige <b>{nameOf(s, s.pickerId)}</b></p>
        <BoardGrid s={s} />
      </main>
    );
  }

  if (s.phase === 'clue') {
    const st = s.stage;
    const value = s.cur.daily && s.cur.bet ? s.cur.bet : s.cur.value;
    return (
      <main className="tv">
        {tools}
        <Scores s={s} big />
        <section className="tv-clue">
          <p className="eyebrow">{s.cur.category} · {s.cur.daily && st === 'dailybet' ? '' : money(value)}</p>
          {s.cur.daily && <div className="daily-banner">★ DOBLE DAILY ★</div>}
          {st === 'dailybet' ? (
            <p className="clue-text">{nameOf(s, s.pickerId)} está haciendo su apuesta…</p>
          ) : (
            <p className="clue-text">{s.clue?.text}</p>
          )}
          {st === 'buzz' && <TimerBar deadline={s.deadline} total={s.phaseMs} offset={offset} />}
          {st === 'buzz' && <p className="status go">¡TIMBRE ABIERTO!</p>}
          {st === 'answer' && <p className="status">Responde <b>{nameOf(s, s.buzzerId)}</b></p>}
          {st === 'dailyclue' && <p className="status">Responde <b>{nameOf(s, s.pickerId)}</b></p>}
          {st === 'reveal' && (
            <>
              <p className="clue-answer">{s.clue?.answer}</p>
              {s.result && <p className={`verdict ${s.result.correct ? 'ok' : 'no'}`}>{nameOf(s, s.result.playerId)} {s.result.delta > 0 ? '+' : ''}{money(s.result.delta)}</p>}
              {!s.result?.correct && s.cur.why === 'nadie' && <p className="hint">Nadie timbró</p>}
            </>
          )}
        </section>
      </main>
    );
  }

  // final
  const f = s.final;
  return (
    <main className="tv">
      {tools}
      <Scores s={s} big />
      <section className="tv-clue">
        <p className="eyebrow">Jeopardy final · {f?.category}</p>
        {f?.stage === 'bets' && <p className="clue-text">Apuesten en su celular…<br /><small>{f.betted.length} de {f.eligible.length} listos</small></p>}
        {f?.stage === 'clue' && (
          <>
            <p className="clue-text">{f.clue}</p>
            <TimerBar deadline={s.deadline} total={s.phaseMs} offset={offset} />
            <p className="hint">Respuestas: {f.answered.length}/{f.eligible.length}</p>
          </>
        )}
        {f?.stage === 'judge' && (
          <>
            <p className="clue-text small">{f.clue}</p>
            <ul className="reveal-list">
              {f.reveal.map((r, i) => (
                <li key={r.id} className={r.correct === true ? 'ok' : r.correct === false ? 'no' : 'now'}>
                  <b>{nameOf(s, r.id)}</b> · apostó {money(r.bet)} · “{r.answer || '—'}”
                  {r.correct === true && ' ✔'}{r.correct === false && ' ✘'}
                  {i === f.idx && r.correct === null ? ' …' : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
