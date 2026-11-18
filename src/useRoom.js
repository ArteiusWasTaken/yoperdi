import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_BASE } from './config.js';

const playerKey = (code) => `rp_player_${code}`;
const hostKey = (code) => `rp_host_${code}`;

export const store = {
  getHost: (code) => { try { return localStorage.getItem(hostKey(code)); } catch { return null; } },
  setHost: (code, t) => { try { localStorage.setItem(hostKey(code), t); } catch { /* sin almacenamiento */ } },
  getPlayer: (code) => { try { return JSON.parse(localStorage.getItem(playerKey(code)) || 'null'); } catch { return null; } },
  setPlayer: (code, v) => { try { localStorage.setItem(playerKey(code), JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  clearPlayer: (code) => { try { localStorage.removeItem(playerKey(code)); } catch { /* sin almacenamiento */ } },
};

// Conexión WebSocket con reconexión automática. `offset` = hora del servidor - hora local.
export function useRoom({ code, role, name }) {
  const [state, setState] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [fatal, setFatal] = useState(null);
  const wsRef = useRef(null);
  const offset = useRef(0);

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let retryTimer;
    let pingTimer;

    const open = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/${code}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setStatus('online');
        if (role === 'host') {
          ws.send(JSON.stringify({ t: 'hello', role: 'host', token: store.getHost(code) }));
        } else if (role === 'display') {
          ws.send(JSON.stringify({ t: 'hello', role: 'display' }));
        } else {
          const saved = store.getPlayer(code);
          ws.send(JSON.stringify({ t: 'hello', role: 'player', token: saved?.token ?? null, name: name || saved?.name }));
        }
        pingTimer = setInterval(() => ws.readyState === 1 && ws.send('{"t":"ping"}'), 20000);
      };

      ws.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        if (m.t === 'state') {
          offset.current = m.s.serverNow - Date.now();
          setState(m.s);
        } else if (m.t === 'welcome' && m.role === 'player') {
          store.setPlayer(code, { token: m.token, name: m.name });
        } else if (m.t === 'error') {
          if (m.fatal) { closed = true; setFatal(m.msg); if (role === 'player') store.clearPlayer(code); }
        }
      };

      ws.onclose = () => {
        clearInterval(pingTimer);
        if (closed) return;
        setStatus('offline');
        retry += 1;
        retryTimer = setTimeout(open, Math.min(800 * retry, 5000));
      };
    };

    open();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      wsRef.current?.close();
    };
  }, [code, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback((msg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }, []);

  return { state, status, fatal, send, offset };
}

// Tiempo restante (ms) hacia `deadline`, ajustado al reloj del servidor.
export function useCountdown(deadline, offset) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) { setLeft(0); return undefined; }
    const tick = () => setLeft(Math.max(0, deadline - (Date.now() + offset.current)));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline, offset]);
  return left;
}
