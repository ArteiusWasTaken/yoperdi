import React, { useEffect, useState } from 'react';
import { Logo, MusicPill } from './ui.jsx';
import Host from './Host.jsx';
import Player from './Player.jsx';
import Display from './Display.jsx';
import { store } from './useRoom.js';
import { getAudio } from './audio.js';
import { API_BASE } from './config.js';

function readParams() {
  const q = new URLSearchParams(location.search);
  return (q.get('sala') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}
const isTv = () => new URLSearchParams(location.search).get('tv') === '1';

// Botón de música de la pantalla de inicio: solo cambia la preferencia (sin sonar aquí).
function HomeMusic() {
  const audio = getAudio('host');
  const [, force] = useState(0);
  useEffect(() => audio.subscribe(() => force((n) => n + 1)), [audio]);
  return <div className="home-music"><MusicPill audio={audio} /></div>;
}

export default function App() {
  const [view, setView] = useState(null); // { role: 'host'|'player', code, name }
  const [code, setCode] = useState(readParams());
  const [name, setName] = useState(() => { try { return localStorage.getItem('rp_name') || ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Si la pantalla pública se recarga, retoma su sala.
  useEffect(() => {
    try {
      const last = localStorage.getItem('rp_last_host');
      const params = readParams();
      if (last && !params && store.getHost(last)) setView({ role: 'host', code: last });
    } catch { /* sin almacenamiento */ }
  }, []);

  const createRoom = async () => {
    getAudio('host').unlock(); // el clic es el gesto que permite que suene la música
    setBusy(true); setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/create`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { code: c, hostToken } = await res.json();
      store.setHost(c, hostToken);
      try { localStorage.setItem('rp_last_host', c); } catch { /* sin almacenamiento */ }
      setView({ role: 'host', code: c });
    } catch (e) {
      setErr(`No se pudo crear la sala (${e.message}). Servidor: ${API_BASE || location.origin}`);
    } finally { setBusy(false); }
  };

  const join = (e) => {
    e.preventDefault();
    if (code.length !== 4) return setErr('El código tiene 4 letras.');
    if (!name.trim()) return setErr('Escribe tu nombre.');
    try { localStorage.setItem('rp_name', name.trim()); } catch { /* sin almacenamiento */ }
    setErr('');
    setView({ role: 'player', code, name: name.trim() });
  };

  const leave = () => {
    try { localStorage.removeItem('rp_last_host'); } catch { /* sin almacenamiento */ }
    history.replaceState(null, '', location.pathname);
    setView(null);
    setCode('');
  };

  if (isTv() && code.length === 4) return <Display code={code} />;
  if (view?.role === 'host') return <Host code={view.code} onExit={leave} />;
  if (view?.role === 'player') return <Player code={view.code} name={view.name} onExit={leave} />;

  return (
    <main className="home">
      <HomeMusic />
      <Logo />

      <form className="card join" onSubmit={join}>
        <h2>Unirme a una sala</h2>
        <input
          className="input code"
          placeholder="CÓDIGO"
          value={code}
          maxLength={4}
          autoCapitalize="characters"
          autoComplete="off"
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
        />
        <input
          className="input"
          placeholder="Tu nombre"
          value={name}
          maxLength={14}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn gold" type="submit">Entrar</button>
      </form>

      <div className="or">o</div>

      <button className="btn ghost" onClick={createRoom} disabled={busy}>
        {busy ? 'Creando sala…' : 'Crear sala (soy el presentador)'}
      </button>
      {err && <p className="error">{err}</p>}
      <p className="hint">El presentador lleva el juego (ve las respuestas); la tele muestra el tablero; cada jugador usa su celular.</p>
    </main>
  );
}
