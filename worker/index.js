import { Game } from './game.js';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // sin I, L, O para no confundir

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS: permite que la página esté en otro dominio (p. ej. Cloudflare Pages con VITE_SYNC_URL).
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

    if (url.pathname === '/api/create') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: cors });
      for (let i = 0; i < 8; i++) {
        const code = makeCode();
        const stub = env.ROOM.get(env.ROOM.idFromName(code));
        const res = await stub.fetch(`https://room/init?code=${code}`, { method: 'POST' });
        if (res.ok) {
          const { hostToken } = await res.json();
          return Response.json({ code, hostToken }, { headers: cors });
        }
      }
      return new Response('No se pudo crear la sala', { status: 503, headers: cors });
    }

    const m = url.pathname.match(/^\/ws\/([A-Za-z]{4})$/);
    if (m) {
      const code = m[1].toUpperCase();
      const stub = env.ROOM.get(env.ROOM.idFromName(code));
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

// Un Durable Object por sala: guarda la partida en memoria y habla con todos por WebSocket.
// Roles: host (presentador, ve las respuestas), display (tele, solo ve) y player (celular).
export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.game = null;
    this.hostToken = null;
    this.conns = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/init') {
      if (this.game) return new Response('exists', { status: 409 });
      this.hostToken = crypto.randomUUID();
      this.game = new Game({ code: url.searchParams.get('code'), onChange: () => this.broadcast() });
      return Response.json({ hostToken: this.hostToken });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Se esperaba WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    if (!this.game) {
      server.send(JSON.stringify({ t: 'error', fatal: true, msg: 'La sala no existe o ya terminó.' }));
      server.close(1000, 'no room');
      return new Response(null, { status: 101, webSocket: client });
    }

    const conn = { ws: server, role: null, playerId: null };
    this.conns.add(conn);
    server.addEventListener('message', (ev) => this.onMessage(conn, ev.data));
    server.addEventListener('close', () => this.onClose(conn));
    server.addEventListener('error', () => this.onClose(conn));
    return new Response(null, { status: 101, webSocket: client });
  }

  send(conn, msg) {
    try { conn.ws.send(JSON.stringify(msg)); } catch { /* conexión caída */ }
  }

  broadcast() {
    for (const c of this.conns) {
      if (!c.role) continue;
      this.send(c, { t: 'state', s: this.game.view(c.role, c.playerId) });
    }
  }

  onMessage(conn, raw) {
    if (typeof raw !== 'string' || raw.length > 2000) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const g = this.game;

    if (m.t === 'ping') return;

    if (m.t === 'hello') {
      if (m.role === 'host') {
        if (m.token !== this.hostToken) {
          this.send(conn, { t: 'error', fatal: true, msg: 'No tienes permiso para controlar esta sala.' });
          return conn.ws.close(1000, 'unauthorized');
        }
        conn.role = 'host';
        this.send(conn, { t: 'welcome', role: 'host' });
        this.broadcast();
        return;
      }
      if (m.role === 'display') {
        conn.role = 'display';
        this.send(conn, { t: 'welcome', role: 'display' });
        this.broadcast();
        return;
      }
      const res = g.join(m.token, m.name);
      if (res.error) {
        this.send(conn, { t: 'error', fatal: true, msg: res.error });
        return conn.ws.close(1000, 'join failed');
      }
      conn.role = 'player';
      conn.playerId = res.player.id;
      this.send(conn, { t: 'welcome', role: 'player', id: res.player.id, token: res.player.token, name: res.player.name });
      this.broadcast();
      return;
    }

    if (conn.role === 'host') {
      switch (m.t) {
        case 'start': return g.start();
        case 'settings': return g.setSettings(m);
        case 'kick': return g.kick(m.id);
        case 'pick': return g.pick(m.ci, m.ri);
        case 'openBuzz': return g.openBuzz();
        case 'mark': return g.mark(!!m.correct);
        case 'bet': return g.bet(null, m.amount, true);
        case 'reveal': return g.reveal();
        case 'next': return g.next();
        case 'finalShow': return g.finalShow();
        case 'finalClose': return g.finalClose();
        case 'finalMark': return g.finalMark(!!m.correct);
        case 'reset': return g.reset();
      }
    } else if (conn.role === 'player') {
      switch (m.t) {
        case 'buzz': return g.buzz(conn.playerId);
        case 'bet': return g.bet(conn.playerId, m.amount);
        case 'finalBet': return g.finalBet(conn.playerId, m.amount);
        case 'finalAnswer': return g.finalAnswer(conn.playerId, m.text);
        case 'leave': return g.setConnected(conn.playerId, false);
      }
    }
  }

  onClose(conn) {
    if (!this.conns.delete(conn)) return;
    if (conn.role === 'player' && conn.playerId) {
      const stillThere = [...this.conns].some((c) => c.playerId === conn.playerId);
      if (!stillThere) this.game.setConnected(conn.playerId, false);
    }
  }
}
