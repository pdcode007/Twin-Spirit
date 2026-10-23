// js/main.js - Bootstrap, Game Loop & Entry Point
import { assets } from './assets.js';
import { audio } from './audio.js';
import { Renderer } from './renderer.js';
import { GameEngine } from './game.js';
import { verifyAllLevels } from './solver.js';

let game = null;

async function bootstrap() {
  console.log("%c✦ TWIN SPIRITS ✦ Opposite paths. One goal.", "color: #b794ff; font-weight: bold; font-size: 16px;");

  // 1. Initialize Asset Manager (Loads PNGs or procedural fallbacks)
  await assets.init();

  // 2. Setup Canvas & Renderer
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error("Canvas #game-canvas not found!");
    return;
  }
  const renderer = new Renderer(canvas);

  // 3. Setup Game Engine
  game = new GameEngine(renderer);
  game.init();

  // 4. Verify All Levels in console on boot
  verifyAllLevels();

  // 5. User gesture for Web Audio initialization
  const onFirstInteraction = () => {
    audio.ensureReady();
    window.removeEventListener('click', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
    window.removeEventListener('pointerdown', onFirstInteraction);
  };
  window.addEventListener('click', onFirstInteraction);
  window.addEventListener('keydown', onFirstInteraction);
  window.addEventListener('pointerdown', onFirstInteraction);

  // 6. Main Animation Loop
  function gameLoop(time) {
    game.update(time);
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
export { bootstrap, game };
