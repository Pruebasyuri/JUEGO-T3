# Operación Extracción – Videojuego FPS 3D (Three.js)

Evaluación T3 – Computación Gráfica y Visual (UPN, semana 13).

Un mundo infestado de zombis. Atraviesa la zona, administra tu munición y llega a la zona de extracción antes de que te atrapen.
Está hecho con HTML5, JavaScript y Three.js, y parte de lo visto en clase (demo FPS con `PointerLockControls` y arma hija de la cámara).

## Cómo ejecutar

Necesita un servidor local (por los módulos ES y los archivos GLB) y conexión a internet (Three.js se carga desde el CDN jsDelivr, igual que en clase).

1. Abre una terminal en esta carpeta.
2. Ejecuta: `python -m http.server 5500`
3. Abre en el navegador: http://localhost:5500/
4. Haz clic en la pantalla para entrar al juego (ESC para pausar).

Alternativa: extensión *Live Server* de VS Code.

## Controles

| Control | Acción |
|---|---|
| W / S | Avanzar / retroceder |
| A / D | Desplazarse a la izquierda / derecha |
| Mouse | Orientar la cámara |
| Clic izquierdo | Un disparo (mantener presionado no dispara en automático) |
| 1 / 2 | Pistola / Escopeta |
| F | Linterna |
| R | Reiniciar (tras GAME OVER o victoria) |

## Cómo se juega

- Empiezas en la **zona segura** (círculo azul) con la pistola (12 balas) y la escopeta (6 balas).
- Cada arma tiene su propio contador. Con 0 balas no dispara.
- La única forma de recuperar munición es **recoger cajas** en el escenario: amarilla = pistola (+10), roja = escopeta (+4).
- Cada zombi resiste **2 impactos**. Los zombis permanecen inactivos hasta que entras en su rango de detección.
- Si un zombi te toca: **GAME OVER**. Si llegas a la zona verde del final: **¡MISIÓN COMPLETADA!**
- Puedes enfrentarte a los zombis o evitarlos: los caminantes son lentos, los corredores son rápidos.

## Estructura

```
operacion-extraccion/
├── index.html            Página, importmap de Three.js, HUD y menú
├── styles.css            Estilos del HUD y de los mensajes
├── js/
│   ├── main.js           Ciclo de juego, estados (menú, jugando, game over, victoria)
│   ├── config.js         Armas, munición, zombis (velocidad y rango de detección), velocidades
│   ├── level.js          Datos del nivel: paredes, autos, contenedores, zombis, cajas, señales
│   ├── world.js          Escena, cámara, luces, linterna, piso, edificios, zona de extracción
│   ├── player.js         Movimiento WASD + PointerLockControls + colisión con paredes
│   ├── weapons.js        Armas GLB, cambio 1/2, disparo con raycasting, munición por arma
│   ├── zombies.js        Zombis GLB: estados, persecución, 2 de vida, muerte, ataque
│   ├── pickups.js        Cajas de munición recogibles
│   ├── collision.js      Colisión círculo-caja (jugador y zombis contra paredes)
│   ├── hud.js            Munición, zombis restantes, mensajes
│   └── audio.js          Efectos de sonido sintetizados (Web Audio)
├── models/               arma1.glb (pistola), arma2.glb (escopeta), zombie.glb
├── textures/             asfalto.jpg, concreto.jpg
└── tools/
    ├── generar_modelos.py    Genera los tres modelos GLB (solo requiere numpy)
    ├── generar_texturas.py   Genera las texturas (numpy + pillow)
    └── verificar_nivel.mjs   Comprueba con Node que el nivel se puede completar
```

## Requerimientos → dónde se cumplen

| Requerimiento | Implementación |
|---|---|
| RF01 Armas | `weapons.js`: dos GLB (`arma1.glb`, `arma2.glb`) hijos de la cámara; teclas 1 y 2; un disparo por `mousedown` |
| RF02 Municiones | `weapons.js` (contador por arma, bloqueo en 0) y `pickups.js` (única forma de recuperar) |
| RF03 Mundo 3D | `level.js` + `world.js`: calle, almacén, plaza de contenedores y pasillo final; ~250 unidades de recorrido |
| RF04 Zombis GLB | `zombies.js` carga `zombie.glb` y lo clona por cada zombi |
| RF05 Comportamiento | `zombies.js`: estado `idle` hasta entrar en `detect` (configurable en `config.js`), luego `active` y persecución |
| RF06 Cámara FPS | `player.js` (WASD, `PointerLockControls`) y `weapons.js` (arma acompaña la cámara) |
| RF07 Disparos y colisiones | `weapons.js`: `Raycaster` contra zombis y paredes; `zombies.js`: 2 de vida, muere al 2.º impacto |
| RF08 Progresión | Inicio (zona segura), desarrollo (4 zonas) y final (zona de extracción); mensaje de victoria en `main.js` |
| RF09 Game Over | `zombies.js` detecta el contacto; `main.js` detiene la partida y muestra GAME OVER (R reinicia) |
| RF10 Coleccionables | `pickups.js`: cajas de munición |
| RF11 Dificultad | Munición limitada, 19 zombis de 3 tipos, laberintos de pasillos y contenedores |
| RF12 Repositorio | Ver sección siguiente |

## Subir a GitHub

```
git init
git add .
git commit -m "Operación Extracción - T3"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/operacion-extraccion.git
git push -u origin main
```

(Antes crea el repositorio vacío y público en github.com. Opcional: activar GitHub Pages en Settings > Pages para jugar desde el navegador.)

## Fuentes de recursos

- Three.js (MIT): https://threejs.org
- Los modelos GLB (armas y zombi) y las texturas fueron creados con los scripts de `tools/`. No usan recursos de terceros.
- Puedes reemplazar `models/arma1.glb`, `arma2.glb` y `zombie.glb` por modelos propios con el mismo nombre. El zombi debe mirar hacia +Z; si tiene nodos llamados `BrazoIzq`, `BrazoDer`, `PiernaIzq`, `PiernaDer` y `Cabeza`, se animan.
