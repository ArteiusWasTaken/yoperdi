// Dirección del servidor de salas.
// Sin VITE_SYNC_URL (lo normal) la página y el worker van juntos en el mismo dominio.
// Con VITE_SYNC_URL (ver .env.example) la página puede estar en otro lado, p. ej. Cloudflare Pages.
const raw = String(import.meta.env.VITE_SYNC_URL ?? '').trim().replace(/\/+$/, '');

export const WS_BASE = raw
  ? raw.replace(/^http/, 'ws')
  : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;

export const API_BASE = raw ? raw.replace(/^ws/, 'http') : '';
