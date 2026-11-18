import React, { useEffect, useState } from 'react';
import { useRoom } from './useRoom.js';
import { useAudio } from './useAudio.js';
import { Logo, MusicPill, Scores, money, nameOf } from './ui.jsx';

export default function Player({ code, name, onExit }) {
  const { state: s, status, fatal, send } = useRoom({ code, role: 'player', name });
  const audio = useAudio('player', s?.phase);
  const [bet, setBet] = useState('');
  const [ans, setAns] = useState('');

  // Vibra al abrirse el timbre.
  useEffect(() => { if (s?.me?.canBuzz) try { navigator.vibrate?.(60); } catch { /* sin vibración */ } }, [s?.me?.canBuzz]);
  useEffect(() => { setBet(''); }, [s?.cur?.ci, s?.cur?.ri, s?.phase]);
  useEffect(() => { if (s?.final?.stage !== 'clue') setAns(''); }, [s?.final?.stage]);

  if (fatal) return <main className="home"><p className="error">{fatal}</p><button className="btn gold" onClick={onExit}>Volver</button></main>;
  if (!s || !s.me) return <main className="home"><Logo /><p className="hint">{status === 'online' ? 'Entrando…' : 'Conectando…'}</p></main>;

  const { me } = s;
  const top = (
    <header className="topbar">
      <Logo small />
      <div className="top-right">
        <span className="pill"><b>{me.name}</b> {money(me.score)}</span>
        <MusicPill audio={audio} icon />
      </div>
    </header>
  );
  const f = s.final;

  let body;
  if (s.phase === 'lobby') {
    body = <section className="card center"><h2>¡Listo, {me.name}!</h2><p>Esperando a que el presentador empiece…</p><Scores s={s} /></section>;
  } else if (s.phase === 'end') {
    const won = s.winners.includes(me.id);
    body = <section className="card center"><h1 className={won ? 'winner' : ''}>{won ? '¡GANASTE! 🎉' : 'Fin de la partida'}</h1><p>Ganó: <b>{s.winners.map((id) => nameOf(s, id)).join(' y ')}</b></p><Scores s={s} /></section>;
  } else if (s.phase === 'roundIntro') {
    body = <section className="card center"><h2>Fin de la ronda {s.round + 1}</h2><p>Ahora los valores se duplican.</p><Scores s={s} /></section>;
  } else if (s.phase === 'board') {
    body = (
      <section className="card center">
        {me.isPicker ? <h2 className="pulse">¡Te toca elegir!</h2> : <h2>Elige {nameOf(s, s.pickerId)}</h2>}
        <p>{me.isPicker ? 'Dile al presentador categoría y valor.' : 'Mira la tele.'}</p>
        <Scores s={s} />
      </section>
    );
  } else if (s.phase === 'clue') {
    const st = s.stage;
    let action;
    if (st === 'dailybet') {
      action = me.isPicker ? (
        <div className="actions">
          <h2>★ ¡DOBLE DAILY!</h2>
          <p>Apuesta entre $5 y {money(s.dailyMax)}</p>
          <input className="input" type="number" inputMode="numeric" value={bet} onChange={(e) => setBet(e.target.value)} placeholder="Tu apuesta" />
          <button className="btn gold big" onClick={() => send({ t: 'bet', amount: Number(bet) })}>Apostar</button>
        </div>
      ) : <p>{nameOf(s, s.pickerId)} tiene un Doble Daily…</p>;
    } else if (st === 'read') {
      action = <p className="hint">Escucha la pista…</p>;
    } else if (st === 'buzz') {
      action = me.canBuzz
        ? <button className="buzzer" onClick={() => send({ t: 'buzz' })}>¡TIMBRAR!</button>
        : <button className="buzzer off" disabled>{me.locked ? 'Ya fallaste' : 'Espera…'}</button>;
    } else if (st === 'answer') {
      action = s.buzzerId === me.id ? <h2 className="pulse">¡Responde en voz alta!</h2> : <p>Responde <b>{nameOf(s, s.buzzerId)}</b></p>;
    } else if (st === 'dailyclue') {
      action = me.isPicker ? <h2 className="pulse">¡Responde en voz alta!</h2> : <p>Responde <b>{nameOf(s, s.pickerId)}</b></p>;
    } else if (st === 'reveal') {
      action = (
        <div className="actions">
          <p className="clue-answer">{s.clue?.answer}</p>
          {s.result && <p className={`verdict ${s.result.correct ? 'ok' : 'no'}`}>{nameOf(s, s.result.playerId)} {s.result.delta > 0 ? '+' : ''}{money(s.result.delta)}</p>}
        </div>
      );
    }
    body = (
      <section className="card center">
        <p className="eyebrow">{s.cur.category} · {money(s.cur.value)}</p>
        {st !== 'dailybet' && <p className="clue-text small">{s.clue?.text}</p>}
        {action}
      </section>
    );
  } else {
    // final
    const eligible = f?.eligible.includes(me.id);
    let inner;
    if (!eligible) inner = <p>No tienes puntos para el Jeopardy final. ¡Mira la tele!</p>;
    else if (f.stage === 'bets') {
      inner = f.myBet !== null ? <p>Apostaste <b>{money(f.myBet)}</b>. Espera a los demás…</p> : (
        <div className="actions">
          <p>Categoría: <b>{f.category}</b>. Apuesta de $0 a {money(me.score)}</p>
          <input className="input" type="number" inputMode="numeric" value={bet} onChange={(e) => setBet(e.target.value)} placeholder="Tu apuesta" />
          <button className="btn gold big" onClick={() => send({ t: 'finalBet', amount: Number(bet === '' ? 0 : bet) })}>Apostar</button>
        </div>
      );
    } else if (f.stage === 'clue') {
      inner = (
        <div className="actions">
          <p className="clue-text small">{f.clue}</p>
          <input className="input" maxLength={80} value={ans || f.myAnswer} onChange={(e) => setAns(e.target.value)} placeholder="Tu respuesta" />
          <button className="btn gold big" onClick={() => send({ t: 'finalAnswer', text: ans || f.myAnswer })}>{f.myAnswer ? 'Actualizar respuesta' : 'Enviar respuesta'}</button>
          {f.myAnswer && <p className="hint">Enviada: {f.myAnswer}</p>}
        </div>
      );
    } else inner = <p>El presentador está calificando… ¡Mira la tele!</p>;
    body = <section className="card center"><p className="eyebrow">Jeopardy final</p>{inner}</section>;
  }

  return <main className="player">{top}{body}</main>;
}
