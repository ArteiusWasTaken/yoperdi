import React, { useEffect, useMemo, useState } from 'react';
import { useRoom } from './useRoom.js';
import { useAudio } from './useAudio.js';
import { Logo, MusicPill, QrCode, TimerBar, Scores, BoardGrid, money, nameOf, resultKey } from './ui.jsx';

function Rank({ s }) {
  const sorted = [...s.players].sort((a, b) => b.score - a.score);
  return (
    <ol className="rank">
      {sorted.map((p) => (
        <li key={p.id} className={s.winners?.includes(p.id) ? 'win' : ''}>
          <span>{p.name}</span><b>{money(p.score)}</b>
        </li>
      ))}
    </ol>
  );
}

export default function Host({ code, onExit }) {
  const { state: s, status, fatal, send, offset } = useRoom({ code, role: 'host' });
  const audio = useAudio('host', s?.phase);
  const [betInput, setBetInput] = useState('');

  const joinUrl = `${location.origin}${location.pathname}?sala=${code}`;
  const tvUrl = `${joinUrl}&tv=1`;

  // Efectos de sonido al calificar.
  const rk = s ? resultKey(s) : '';
  useEffect(() => {
    if (!rk || !s?.result) return;
    if (s.result.correct) audio.right(); else audio.wrong();
  }, [rk]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (s?.phase === 'end') audio.fanfare(); }, [s?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atajos de teclado: espacio avanza, Enter/→ correcta, Retroceso/← incorrecta.
  useEffect(() => {
    if (!s) return undefined;
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = e.key;
      const stage = s.stage;
      if (k === ' ') {
        e.preventDefault();
        if (s.phase === 'clue' && stage === 'read') send({ t: 'openBuzz' });
        else if ((s.phase === 'clue' && stage === 'reveal') || s.phase === 'roundIntro') send({ t: 'next' });
        else if (s.phase === 'final' && stage === 'bets') send({ t: 'finalShow' });
        else if (s.phase === 'final' && stage === 'clue') send({ t: 'finalClose' });
      } else if (k === 'Enter' || k === 'ArrowRight') {
        if (s.phase === 'clue' && ['answer', 'dailyclue'].includes(stage)) send({ t: 'mark', correct: true });
        else if (s.phase === 'final' && stage === 'judge') send({ t: 'finalMark', correct: true });
      } else if (k === 'Backspace' || k === 'ArrowLeft') {
        if (s.phase === 'clue' && ['answer', 'dailyclue'].includes(stage)) send({ t: 'mark', correct: false });
        else if (s.phase === 'final' && stage === 'judge') send({ t: 'finalMark', correct: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s, send]);

  if (fatal) return <main className="home"><p className="error">{fatal}</p><button className="btn gold" onClick={onExit}>Salir</button></main>;
  if (!s) return <main className="home"><Logo /><p className="hint">{status === 'online' ? 'Cargando…' : 'Conectando con la sala…'}</p></main>;

  const picker = nameOf(s, s.pickerId);
  const top = (
    <header className="topbar">
      <Logo small />
      <div className="top-right">
        <span className="pill">Sala <b>{code}</b></span>
        <MusicPill audio={audio} icon />
        <button className="pill" onClick={() => { if (confirm('¿Salir? La sala sigue activa y puedes volver a entrar.')) onExit(); }}>Salir</button>
      </div>
    </header>
  );

  // ---------- sala de espera ----------
  if (s.phase === 'lobby') {
    const ready = s.players.filter((p) => p.connected).length;
    return (
      <main className="host">
        {top}
        <section className="card lobby">
          <div className="lobby-join">
            <div>
              <h2>Que entren todos</h2>
              <p>Escaneen el QR con su celular o abran la dirección y escriban el código.</p>
              <div className="bigcode">{code}</div>
              <p className="url">{joinUrl}</p>
            </div>
            <QrCode text={joinUrl} size={170} />
          </div>
          <div className="tvbox">
            <b>📺 Pantalla para la tele</b>
            <p>Abre esta dirección en la tele o computadora conectada (se ve el tablero y los puntos, nunca las respuestas):</p>
            <p className="url">{tvUrl}</p>
            <a className="btn ghost sm" href={tvUrl} target="_blank" rel="noreferrer">Abrir pantalla de TV</a>
          </div>
          <h3>Jugadores ({ready}/{s.limits.max})</h3>
          <ul className="plist">
            {s.players.length === 0 && <li className="hint">Esperando jugadores…</li>}
            {s.players.map((p) => (
              <li key={p.id} className={p.connected ? '' : 'off'}>
                {p.name}
                <button className="x" onClick={() => send({ t: 'kick', id: p.id })} aria-label={`Quitar a ${p.name}`}>✕</button>
              </li>
            ))}
          </ul>
          <label className="setting">
            Tiempo para timbrar
            <select value={s.settings.buzzSeconds} onChange={(e) => send({ t: 'settings', buzzSeconds: Number(e.target.value) })}>
              {s.limits.buzz.map((n) => <option key={n} value={n}>{n} segundos</option>)}
            </select>
          </label>
          <button className="btn gold big" disabled={ready < s.limits.min} onClick={() => { audio.unlock(); send({ t: 'start' }); }}>
            {ready < s.limits.min ? `Faltan jugadores (mínimo ${s.limits.min})` : 'Empezar partida'}
          </button>
        </section>
      </main>
    );
  }

  // ---------- fin ----------
  if (s.phase === 'end') {
    const names = s.winners.map((id) => nameOf(s, id)).join(' y ');
    return (
      <main className="host">
        {top}
        <section className="card center">
          <p className="eyebrow">{s.winners.length > 1 ? 'Empate' : 'Ganador'}</p>
          <h1 className="winner">{names}</h1>
          <Rank s={s} />
          {s.final?.answer && <p className="hint">Respuesta final: <b>{s.final.answer}</b></p>}
          <button className="btn gold" onClick={() => send({ t: 'reset' })}>Otra partida (misma sala)</button>
        </section>
      </main>
    );
  }

  // ---------- cambio de ronda ----------
  if (s.phase === 'roundIntro') {
    return (
      <main className="host">
        {top}
        <section className="card center">
          <p className="eyebrow">Fin de la ronda {s.round + 1}</p>
          <h2>Siguiente: Doble Rosas, los valores se duplican</h2>
          <Rank s={s} />
          <p className="hint">Empieza eligiendo quien va en último lugar.</p>
          <button className="btn gold big" onClick={() => send({ t: 'next' })}>Empezar ronda {s.round + 2} (espacio)</button>
        </section>
      </main>
    );
  }

  // ---------- tablero ----------
  if (s.phase === 'board') {
    return (
      <main className="host">
        {top}
        <Scores s={s} />
        <p className="turn">Elige <b>{picker}</b>. Toca la casilla que diga.</p>
        <BoardGrid s={s} onPick={(ci, ri) => send({ t: 'pick', ci, ri })} />
        <p className="hint">★ = Doble Daily (solo lo ves tú).</p>
      </main>
    );
  }

  // ---------- pista ----------
  if (s.phase === 'clue') {
    const hc = s.hostClue;
    const st = s.stage;
    const max = s.dailyMax;
    return (
      <main className="host">
        {top}
        <Scores s={s} />
        <section className="card clue">
          <p className="eyebrow">{s.cur.category} · {money(s.cur.daily && s.cur.bet ? s.cur.bet : s.cur.value)}{s.cur.daily ? ' · ★ DOBLE DAILY' : ''}</p>
          <div className="chuleta">
            <p className="q">{hc?.text}</p>
            <p className="a">✔ {hc?.answer}</p>
            {hc?.note && <p className="note">{hc.note}</p>}
          </div>

          {st === 'dailybet' && (
            <div className="actions">
              <p><b>{picker}</b> está apostando (de $5 a {money(max)}).</p>
              <div className="row">
                <input className="input" type="number" inputMode="numeric" min="5" max={max} placeholder="Apuesta" value={betInput} onChange={(e) => setBetInput(e.target.value)} />
                <button className="btn gold" onClick={() => { send({ t: 'bet', amount: Number(betInput) }); setBetInput(''); }}>Fijar apuesta</button>
              </div>
            </div>
          )}
          {st === 'read' && (
            <div className="actions">
              <button className="btn gold big" onClick={() => send({ t: 'openBuzz' })}>Abrir timbre (espacio)</button>
              <button className="btn ghost" onClick={() => send({ t: 'reveal' })}>Saltar pista</button>
            </div>
          )}
          {st === 'buzz' && (
            <div className="actions">
              <TimerBar deadline={s.deadline} total={s.phaseMs} offset={offset} />
              <p>Timbre abierto… {s.lockedIds.length > 0 && `(fallaron: ${s.lockedIds.map((id) => nameOf(s, id)).join(', ')})`}</p>
              <button className="btn ghost" onClick={() => send({ t: 'reveal' })}>Nadie sabe · mostrar respuesta</button>
            </div>
          )}
          {(st === 'answer' || st === 'dailyclue') && (
            <div className="actions">
              <p className="who">Responde <b>{nameOf(s, st === 'answer' ? s.buzzerId : s.pickerId)}</b></p>
              <div className="row">
                <button className="btn good big" onClick={() => send({ t: 'mark', correct: true })}>✔ Correcta</button>
                <button className="btn bad big" onClick={() => send({ t: 'mark', correct: false })}>✘ Incorrecta</button>
              </div>
            </div>
          )}
          {st === 'reveal' && (
            <div className="actions">
              {s.result && <p className={`verdict ${s.result.correct ? 'ok' : 'no'}`}>{nameOf(s, s.result.playerId)}: {s.result.delta > 0 ? '+' : ''}{money(s.result.delta)}</p>}
              <button className="btn gold big" onClick={() => send({ t: 'next' })}>Continuar (espacio)</button>
            </div>
          )}
        </section>
        <p className="hint">Atajos: espacio avanza · Enter correcta · Retroceso incorrecta.</p>
      </main>
    );
  }

  // ---------- jeopardy final ----------
  const f = s.final;
  const st = f?.stage;
  return (
    <main className="host">
      {top}
      <Scores s={s} />
      <section className="card clue">
        <p className="eyebrow">Jeopardy final · {f?.category}</p>
        <div className="chuleta">
          <p className="q">{f?.clue ?? '(La pista aparece cuando todos apuesten)'}</p>
          <p className="a">✔ {f?.hostAnswer}</p>
        </div>
        {st === 'bets' && (
          <div className="actions">
            <p>Apuestas: {f.betted.length}/{f.eligible.length} · {f.eligible.map((id) => `${nameOf(s, id)}${f.betted.includes(id) ? ' ✓' : ''}`).join(', ')}</p>
            <button className="btn gold big" onClick={() => send({ t: 'finalShow' })}>Mostrar pista (espacio)</button>
          </div>
        )}
        {st === 'clue' && (
          <div className="actions">
            <TimerBar deadline={s.deadline} total={s.phaseMs} offset={offset} />
            <p>Respuestas: {f.answered.length}/{f.eligible.length}</p>
            <button className="btn gold" onClick={() => send({ t: 'finalClose' })}>Cerrar respuestas (espacio)</button>
          </div>
        )}
        {st === 'judge' && (() => {
          const cur = f.reveal[f.idx];
          return (
            <div className="actions">
              <p className="who"><b>{nameOf(s, cur.id)}</b> apostó {money(cur.bet)} y escribió:</p>
              <p className="typed">{cur.answer || '(sin respuesta)'}</p>
              <div className="row">
                <button className="btn good big" onClick={() => send({ t: 'finalMark', correct: true })}>✔ Correcta</button>
                <button className="btn bad big" onClick={() => send({ t: 'finalMark', correct: false })}>✘ Incorrecta</button>
              </div>
            </div>
          );
        })()}
      </section>
    </main>
  );
}
