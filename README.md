# Yoperdí (Jeopardy familiar)

Concurso estilo Jeopardy: **muchos juegan y gana uno** (ideal para dar premios en Navidad).
React + Cloudflare Worker (una sala = un Durable Object), igual que Doble Cara.

## Cómo se usa

Tres pantallas:

| Quién | Dispositivo | Qué ve |
|---|---|---|
| **Presentador** | Computadora o tablet | Tablero, la pista **con su respuesta** y los botones ✔ / ✘. |
| **Tele** | La tele o computadora conectada | Tablero, pista, marcador. Nunca la respuesta antes de tiempo. |
| **Jugadores** | Su celular | El timbre grande, apuestas y respuesta final. |

1. El presentador abre el sitio → **Crear sala**. Sale un código de 4 letras y un QR.
2. Los jugadores escanean el QR (o escriben el código) y ponen su nombre (2 a 12 jugadores).
3. En la tele se abre la dirección "Pantalla para la tele" que muestra el presentador (`?sala=CODIGO&tv=1`).
4. **Empezar partida.**

## Reglas

- 2 rondas de 6 categorías × 5 pistas. La ronda 2 vale el doble.
  Cada tablero lleva **2 categorías de Jalisco**, 1 de México y el resto de cine, tele, música, ciencia, deportes y cultura general.
- Elige categoría quien va ganando la última pista (al inicio, al azar; en la ronda 2, el que va en último lugar).
  El jugador le dice al presentador qué casilla quiere y el presentador la toca.
- El presentador lee la pista y pulsa **Abrir timbre**. Los celulares se activan; el primero en timbrar responde en voz alta.
  - ✔ correcta: suma el valor y elige la siguiente.
  - ✘ incorrecta: resta el valor, queda fuera de esa pista y el timbre se reabre para los demás.
- **Doble Daily** (1 en la ronda 1, 2 en la ronda 2, ocultos): solo contesta quien eligió; apuesta de $5 hasta lo que tenga (o el valor máximo del tablero).
- **Jeopardy final**: solo juegan los que tienen puntos. Cada uno apuesta en su celular (0 a todo lo que tiene), ve la pista,
  escribe su respuesta (45 s) y el presentador califica de menor a mayor puntaje. Gana quien termine con más; si empatan, comparten.

Atajos del presentador: `Espacio` abre timbre / continúa · `Enter` o `→` correcta · `Retroceso` o `←` incorrecta.

## Desarrollo

```bash
npm install
npm run dev      # en una terminal: página (http://localhost:5173)
npm start        # en otra: worker local en 8787 (compila y levanta todo junto)
npm test         # pruebas de la lógica del juego
```

Para jugar en local con celulares usa `npm start` y abre `http://IP-DE-TU-PC:8787` (misma red).

## Publicar

```bash
npm install
npx wrangler login      # solo la primera vez
npm run deploy          # compila y publica página + worker juntos
```

Queda en `https://yoperdi.TU-SUBDOMINIO.workers.dev`. Nada más que configurar.

## Personalizar las preguntas

Todo está en `worker/clues/`: un archivo por grupo (`jalisco.js`, `mexico.js`, `cine.js`, …) y `final.js` para el Jeopardy final.
Cada categoría tiene exactamente 5 pistas, de más fácil (la de $200) a más difícil (la de $1,000):

```js
{ name: 'Tapatíos famosos', clues: [
  { q: 'Pista...', a: 'Respuesta' },   // ×5
] }
```

`npm test` valida que cada categoría tenga 5 pistas con pregunta y respuesta. Valores, tiempos y número de Daily: `CONFIG` en `worker/game.js`.
