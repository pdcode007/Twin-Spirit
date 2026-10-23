// js/renderer.js - Pixel-Perfect Canvas Renderer, 2.5D Cast Shadows & Dynamic Lighting
import { CONFIG } from './config.js';
import { assets } from './assets.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.tileSize = 32;
    this.gridWidth = CONFIG.GRID_WIDTH;
    this.gridHeight = CONFIG.GRID_HEIGHT;

    // Settings
    this.enableEffects = true;
    this.showGrid = false;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeStartTime = 0;

    // Dissolve Wipe
    this.dissolveProgress = 0;
    this.dissolving = false;
    this.dissolveCallback = null;

    // Ambient Particles
    this.fireflies = [];
    this.leaves = [];
    this.sparkles = [];
    this.heartShards = [];
    this.shockwaves = [];
    this.stars = [];

    this.initAtmosphere();
  }

  initAtmosphere() {
    // 32 Drifting Fireflies
    for (let i = 0; i < 32; i++) {
      this.fireflies.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseAlpha: 0.35 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() > 0.6 ? 2 : 1
      });
    }

    // 16 Falling Leaves & Blossoms
    for (let i = 0; i < 18; i++) {
      this.leaves.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        vx: 0.25 + Math.random() * 0.45,
        vy: 0.35 + Math.random() * 0.55,
        color: Math.random() > 0.4 ? '#2f9e55' : (Math.random() > 0.5 ? '#b794ff' : '#14522a')
      });
    }

    // Stars
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.45,
        size: Math.random() > 0.8 ? 2 : 1,
        speed: 1 + Math.random() * 2
      });
    }
  }

  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const availableW = rect.width;
    const availableH = rect.height;

    // Pixel-perfect integer tile size
    const factor = Math.floor(Math.min(availableW, availableH) / this.gridWidth);
    this.tileSize = Math.max(16, factor);

    const targetW = this.tileSize * this.gridWidth;
    const targetH = this.tileSize * this.gridHeight;

    this.canvas.width = targetW;
    this.canvas.height = targetH;
    this.ctx.imageSmoothingEnabled = false;
  }

  triggerScreenShake(intensity = 8, durationMs = 300) {
    if (!this.enableEffects) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs;
    this.shakeStartTime = performance.now();
  }

  triggerHeartShatter(pixelX, pixelY, color = '#e63946') {
    if (!this.enableEffects) return;
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.heartShards.push({
        x: pixelX,
        y: pixelY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? color : '#ffd479',
        size: 2 + Math.floor(Math.random() * 3),
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  triggerShockwave(pixelX, pixelY) {
    if (!this.enableEffects) return;
    this.shockwaves.push({
      x: pixelX,
      y: pixelY,
      radius: 4,
      maxRadius: 180,
      alpha: 1.0
    });
  }

  addSparkle(pixelX, pixelY, color) {
    if (!this.enableEffects) return;
    this.sparkles.push({
      x: pixelX + (Math.random() - 0.5) * 8,
      y: pixelY + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.4 - Math.random() * 0.5,
      color,
      alpha: 1.0,
      decay: 0.03 + Math.random() * 0.04
    });
  }

  startDissolveWipe(onMidpoint) {
    this.dissolving = true;
    this.dissolveProgress = 0;
    this.dissolveCallback = onMidpoint;
  }

  render(gameState, time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ts = this.tileSize;

    ctx.save();

    // 1. Screen Shake
    if (this.shakeIntensity > 0) {
      const elapsed = performance.now() - this.shakeStartTime;
      if (elapsed < this.shakeDuration) {
        const decay = 1 - (elapsed / this.shakeDuration);
        const sx = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
        const sy = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
        ctx.translate(sx, sy);
      } else {
        this.shakeIntensity = 0;
      }
    }

    ctx.clearRect(0, 0, w, h);

    if (!gameState || !gameState.level) {
      ctx.restore();
      return;
    }

    const { level, p1, p2, activeTurn } = gameState;
    const animFrame = Math.floor(time / 160) % 4;
    const flicker = 0.88 + Math.sin(time * 0.007) * 0.08 + Math.cos(time * 0.018) * 0.04;

    // 2. Parallax Sky & Castle Silhouette Background
    this.drawBackground(ctx, w, h, time);

    // 3. Render Floor Tiles & Inlaid Compass Runes
    this.drawFloor(ctx, level, ts, time);

    // 4. Render Mystical 2.5D Cast Shadows from Hedge Walls onto Floor
    this.drawWallCastShadows(ctx, level, ts);

    // 5. Render Trapdoors (Level 5)
    if (level.trapUpper && level.trapLower) {
      this.drawTrapDoors(ctx, level, gameState, ts, time);
    }

    // 6. Render Hazards
    this.drawHazards(ctx, level.hazards, ts, animFrame, time);

    // 7. Render Corridor Lantern Posts
    if (level.decor && level.decor.lanterns) {
      this.drawCorridorLanterns(ctx, level.decor.lanterns, ts, time, flicker);
    }

    // 8. Render Exits / Glowing Arched Portals
    this.drawPortals(ctx, level, gameState, ts, animFrame, time);

    // 9. Render Flowering Hedge Walls / Castle Walls
    this.drawWalls(ctx, level, ts, time);

    // 10. Render Spirits (Ember & Tide with glowing orbs)
    this.drawSpirits(ctx, gameState, ts, time, animFrame);

    // 11. Dynamic Lighting Layer (Additive radial glow & shadows)
    if (this.enableEffects) {
      this.drawLightingLayer(ctx, gameState, ts, time, flicker);
    }

    // 12. Ambient Particles (Fireflies, Leaves, Shards, Shockwaves)
    this.drawParticles(ctx, w, h, time);

    // 13. Vignette
    if (this.enableEffects) {
      this.drawVignette(ctx, w, h);
    }

    // 14. Grid Lines (if enabled in settings)
    if (this.showGrid) {
      this.drawGridOverlay(ctx, w, h, ts);
    }

    // 15. Screen Transition Dissolve Wipe
    if (this.dissolving) {
      this.drawDissolveWipe(ctx, w, h);
    }

    ctx.restore();
  }

  drawBackground(ctx, w, h, time) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a091c');
    skyGrad.addColorStop(0.5, '#161338');
    skyGrad.addColorStop(1, '#0e0c24');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars
    ctx.fillStyle = '#efe6ff';
    this.stars.forEach(s => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.002 * s.speed + s.x * 20));
      ctx.globalAlpha = alpha;
      ctx.fillRect(s.x * w, s.y * h, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;
  }

  drawFloor(ctx, level, ts, time) {
    const tilesImg = assets.getImage('tiles');
    const isGarden = level.definition.theme === 'garden';
    const isDungeon = level.definition.theme === 'dungeon';
    const colIdx = isGarden ? 2 : (isDungeon ? 5 : 3);
    const sx = colIdx * 16;

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.grid[y][x] !== 1) { // Floor
          const px = x * ts;
          const py = y * ts;

          if (tilesImg) {
            ctx.drawImage(tilesImg, sx, 0, 16, 16, px, py, ts, ts);
          } else {
            ctx.fillStyle = isGarden ? '#151936' : '#110f26';
            ctx.fillRect(px, py, ts, ts);
          }

          // Subtle checker texture
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(px, py, ts, ts);
          }
        }
      }
    }

    // Draw Inlaid Golden Compass / Sun Rune Plates
    if (level.decor && level.decor.runes) {
      level.decor.runes.forEach(rune => {
        const rx = rune.x * ts;
        const ry = rune.y * ts;
        this.drawFloorCompassRune(ctx, rx, ry, ts, time);
      });
    }
  }

  drawFloorCompassRune(ctx, x, y, ts, time) {
    const pad = Math.floor(ts * 0.15);
    const size = ts - pad * 2;
    const cx = x + ts / 2;
    const cy = y + ts / 2;

    // Golden plate border
    ctx.fillStyle = 'rgba(30, 22, 54, 0.9)';
    ctx.fillRect(x + pad, y + pad, size, size);
    ctx.strokeStyle = '#ffd479';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + pad, y + pad, size, size);

    // Celestial Sun / Compass Star
    ctx.strokeStyle = 'rgba(255, 212, 121, 0.85)';
    ctx.fillStyle = '#ffd479';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Compass points
    const arm = size * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx, cy - arm);
    ctx.lineTo(cx, cy + arm);
    ctx.moveTo(cx - arm, cy);
    ctx.lineTo(cx + arm, cy);
    ctx.stroke();

    // Subtle magical pulse
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + x);
    ctx.fillStyle = `rgba(255, 212, 121, ${0.3 * pulse})`;
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  }

  // Mystical 2.5D Cast Shadows: hedges cast realistic shadows down and to the right!
  drawWallCastShadows(ctx, level, ts) {
    ctx.fillStyle = 'rgba(5, 4, 18, 0.65)';
    const shadowH = Math.floor(ts * 0.35);

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.grid[y][x] === 1) { // Wall
          const px = x * ts;
          const py = y * ts;

          // Shadow cast to south (y + 1)
          if (y < level.height - 1 && level.grid[y + 1][x] !== 1) {
            ctx.fillRect(px, py + ts, ts, shadowH);
          }
          // Shadow cast to south-east diagonal
          if (x < level.width - 1 && y < level.height - 1 && level.grid[y + 1][x + 1] !== 1 && level.grid[y][x + 1] !== 1) {
            ctx.fillRect(px + ts, py + ts, Math.floor(ts * 0.3), shadowH);
          }
        }
      }
    }
  }

  drawWalls(ctx, level, ts, time) {
    const tilesImg = assets.getImage('tiles');
    const isHedge = level.definition.wallStyle === 'hedge';
    const isDungeon = level.definition.wallStyle === 'dungeon';

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.grid[y][x] === 1) { // Wall
          const px = x * ts;
          const py = y * ts;
          const isDivider = (level.definition.id === 5 && y === 7);

          if (isHedge) {
            this.drawFloweringHedgeTile(ctx, px, py, ts, x, y, tilesImg);
          } else {
            const colIdx = isDivider ? 4 : (isDungeon ? 1 : 1);
            if (tilesImg) {
              ctx.drawImage(tilesImg, colIdx * 16, 0, 16, 16, px, py, ts, ts);
            } else {
              ctx.fillStyle = isDivider ? '#3f395c' : '#2b274c';
              ctx.fillRect(px, py, ts, ts);
            }
          }

          // Top rim subtle highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(px, py, ts, 2);
        }
      }
    }
  }

  // Custom lush flowering hedge tile renderer matching the reference image!
  drawFloweringHedgeTile(ctx, px, py, ts, gx, gy, tilesImg) {
    if (tilesImg) {
      ctx.drawImage(tilesImg, 0, 0, 16, 16, px, py, ts, ts);
    } else {
      ctx.fillStyle = '#0e381b';
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#1b6e36';
      ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
      ctx.fillStyle = '#2f9e55';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
    }

    // Additional organic leaf bumps on top edge
    ctx.fillStyle = '#5fd47e';
    ctx.fillRect(px + Math.floor(ts * 0.2), py, Math.floor(ts * 0.3), 2);
    ctx.fillRect(px + Math.floor(ts * 0.6), py, Math.floor(ts * 0.3), 2);

    // Scattered purple & cyan flowers on hedges (seeded by grid coords)
    const seed = (gx * 37 + gy * 71) % 100;
    if (seed > 20) {
      const fx1 = px + (seed % Math.max(4, ts - 8)) + 3;
      const fy1 = py + ((seed * 7) % Math.max(4, ts - 8)) + 3;
      ctx.fillStyle = (seed % 2 === 0) ? '#c084fc' : '#67e8f9';
      ctx.fillRect(fx1, fy1, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx1 + 1, fy1 + 1, 1, 1);
    }
  }

  // Freestanding Wrought-Iron Corridor Lantern Posts (like in the picture!)
  drawCorridorLanterns(ctx, lanterns, ts, time, flicker) {
    lanterns.forEach((l, idx) => {
      const lx = (l.x + 0.5) * ts;
      const ly = (l.y + 0.5) * ts;

      // Dark iron post
      ctx.fillStyle = '#110e21';
      ctx.fillRect(lx - 1, ly - 4, 3, ts * 0.4);

      // Iron base
      ctx.fillStyle = '#1b1733';
      ctx.fillRect(lx - 3, ly + ts * 0.35, 7, 3);

      // Lantern cage
      const cageY = ly - 12;
      ctx.fillStyle = '#282245';
      ctx.fillRect(lx - 5, cageY, 11, 10);
      ctx.fillStyle = '#ffd479'; // Glowing glass
      ctx.fillRect(lx - 3, cageY + 2, 7, 6);
      ctx.fillStyle = '#ffffff'; // Flame core
      ctx.fillRect(lx - 1, cageY + 4, 3, 3);

      // Lantern peaked cap
      ctx.fillStyle = '#110e21';
      ctx.beginPath();
      ctx.moveTo(lx, cageY - 3);
      ctx.lineTo(lx - 6, cageY);
      ctx.lineTo(lx + 6, cageY);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Glowing Arched Portals (Matching the reference picture!)
  drawPortals(ctx, level, gameState, ts, animFrame, time) {
    const { gateTop, gateBottom } = level;
    const isL5 = level.definition.id === 5;
    const revealedA = gameState.gateRevealedTop;
    const revealedB = gameState.gateRevealedBottom;
    const assignTop = gameState.gateAssignment.top;
    const assignBottom = gameState.gateAssignment.bottom;

    this.drawPortalArch(ctx, gateTop, isL5 && !revealedA ? 'colorless' : assignTop, ts, time, 'top');
    this.drawPortalArch(ctx, gateBottom, isL5 && !revealedB ? 'colorless' : assignBottom, ts, time, 'bottom');
  }

  drawPortalArch(ctx, gate, type, ts, time, position) {
    const px = gate.x * ts;
    const py = gate.y * ts;
    const isViolet = type === 'red' || type === 'ember';
    const isCyan = type === 'blue' || type === 'tide';
    const isColorless = type === 'colorless';

    const archColor = isViolet ? '#2a1b47' : (isCyan ? '#0f2338' : '#222030');
    const stoneTrim = isViolet ? '#581c87' : (isCyan ? '#0e7490' : '#47435e');
    const vortexMain = isViolet ? '#9333ea' : (isCyan ? '#06b6d4' : '#6b668a');
    const vortexLight = isViolet ? '#d8b4fe' : (isCyan ? '#67e8f9' : '#a5a0c2');

    // Stone Carved Arch Pillars & Frame
    ctx.fillStyle = archColor;
    ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
    ctx.fillStyle = stoneTrim;
    ctx.fillRect(px + 2, py + 2, 4, ts - 4);
    ctx.fillRect(px + ts - 6, py + 2, 4, ts - 4);
    ctx.fillRect(px + 4, py + 2, ts - 8, 4);

    // Keystone rune
    ctx.fillStyle = '#ffd479';
    ctx.fillRect(px + ts / 2 - 2, py + 1, 4, 3);

    // Glowing Swirling Energy Vortex inside Arch
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 5, py + 5, ts - 10, ts - 7);
    ctx.clip();

    ctx.fillStyle = isColorless ? '#191724' : '#100c22';
    ctx.fillRect(px + 5, py + 5, ts - 10, ts - 7);

    if (!isColorless) {
      // Swirling portal rings
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
      const grad = ctx.createRadialGradient(px + ts / 2, py + ts / 2, 2, px + ts / 2, py + ts / 2, ts * 0.45);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, vortexLight);
      grad.addColorStop(0.7, vortexMain);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(px + 5, py + 5, ts - 10, ts - 7);

      // Rotating starry sparkles inside vortex
      for (let i = 0; i < 3; i++) {
        const ang = time * 0.004 + (i * Math.PI * 2) / 3;
        const dist = 3 + Math.sin(time * 0.008 + i) * 3;
        const sx = px + ts / 2 + Math.cos(ang) * dist;
        const sy = py + ts / 2 + Math.sin(ang) * dist;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      // Mystery dim rune
      ctx.fillStyle = 'rgba(183, 148, 255, 0.4)';
      ctx.fillRect(px + ts / 2 - 1, py + ts / 2 - 3, 2, 6);
    }
    ctx.restore();

    // Outer radiant arch rim glow
    if (!isColorless) {
      ctx.strokeStyle = isViolet ? 'rgba(192, 132, 252, 0.6)' : 'rgba(103, 232, 249, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
    }
  }

  drawHazards(ctx, hazards, ts, animFrame, time) {
    if (!hazards) return;
    const hazardsImg = assets.getImage('hazards');

    hazards.forEach(h => {
      const px = h.x * ts;
      const py = h.y * ts;
      const typeRow = h.type === 'fire' ? 0 : h.type === 'water' ? 1 : h.type === 'electric' ? 2 : 3;

      if (hazardsImg) {
        ctx.drawImage(hazardsImg, animFrame * 16, typeRow * 16, 16, 16, px, py, ts, ts);
      } else {
        const colors = { fire: '#ff8a2b', water: '#35c9ff', electric: '#fff06a', arrow: '#ffd479' };
        ctx.fillStyle = colors[h.type] || '#ff8a2b';
        ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
      }
    });
  }

  drawTrapDoors(ctx, level, gameState, ts, time) {
    const gatesImg = assets.getImage('gates');
    const traps = [level.trapUpper, level.trapLower];

    traps.forEach(trap => {
      const px = trap.x * ts;
      const py = trap.y * ts;
      const isRevealed = gameState.revealedTrapDoors.has(`${trap.x},${trap.y}`);

      if (gatesImg) {
        ctx.drawImage(gatesImg, isRevealed ? 16 : 0, 48, 16, 16, px, py, ts, ts);
      }

      // Proximity shimmer hint
      if (!isRevealed) {
        const d1 = Math.hypot(gameState.p1.x - trap.x, gameState.p1.y - trap.y);
        const d2 = Math.hypot(gameState.p2.x - trap.x, gameState.p2.y - trap.y);
        if (d1 <= 2.2 || d2 <= 2.2) {
          ctx.fillStyle = 'rgba(255, 212, 121, 0.55)';
          const shimmer = Math.sin(time * 0.01 + trap.x) * 2;
          ctx.fillRect(px + 4 + shimmer, py + 4, 3, 3);
          ctx.fillRect(px + 10 - shimmer, py + 10, 2, 2);
        }
      }
    });
  }

  drawSpirits(ctx, gameState, ts, time, animFrame) {
    const { p1, p2, activeTurn, level } = gameState;
    const spiritsImg = assets.getImage('spirits');

    this.drawSpiritInstance(ctx, spiritsImg, p1, 'ember', ts, time, animFrame, activeTurn === 0, level.definition.id === 4);
    this.drawSpiritInstance(ctx, spiritsImg, p2, 'tide', ts, time, animFrame, activeTurn === 1, level.definition.id === 4);
  }

  drawSpiritInstance(ctx, spiritsImg, spirit, type, ts, time, animFrame, isActiveTurn, isLevel4) {
    const isEmber = type === 'ember';
    const isMoving = spirit.isTweening;
    const progress = spirit.tweenProgress || 0;

    const currPx = spirit.x * ts;
    const currPy = spirit.y * ts;
    const prevPx = (spirit.prevX ?? spirit.x) * ts;
    const prevPy = (spirit.prevY ?? spirit.y) * ts;

    const lerpX = prevPx + (currPx - prevPx) * progress;
    const lerpY = prevPy + (currPy - prevPy) * progress;

    // Hop arc: 6px arc
    const hop = isMoving ? -Math.sin(progress * Math.PI) * Math.min(8, ts * 0.25) : 0;
    // Squash & stretch scale
    const scaleX = isMoving ? (1 + 0.14 * Math.sin(progress * Math.PI * 2)) : 1;
    const scaleY = isMoving ? (1 - 0.14 * Math.sin(progress * Math.PI * 2)) : 1;

    const drawX = lerpX + ts / 2;
    const drawY = lerpY + ts / 2 + hop;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(scaleX, scaleY);

    let row = 3; // idle bob
    if (isMoving) {
      if (spirit.facing === 'N' || spirit.facing === 'NE' || spirit.facing === 'NW') row = 1;
      else if (spirit.facing === 'S' || spirit.facing === 'SE' || spirit.facing === 'SW') row = 0;
      else row = 2; // Side
    }
    const baseRow = isEmber ? 0 : 5;
    const finalRow = baseRow + row;
    const flipX = (spirit.facing === 'W' || spirit.facing === 'NW' || spirit.facing === 'SW');

    // Level 4: Active spirit glowing ring & bobbing arrow
    if (isLevel4 && isActiveTurn) {
      const ringAlpha = 0.5 + 0.3 * Math.sin(time * 0.008);
      ctx.strokeStyle = isEmber ? `rgba(183, 148, 255, ${ringAlpha})` : `rgba(46, 230, 197, ${ringAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, ts * 0.35, ts * 0.42, ts * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();

      const arrowBob = Math.sin(time * 0.01) * 4;
      ctx.fillStyle = '#ffd479';
      ctx.beginPath();
      ctx.moveTo(0, -ts * 0.65 + arrowBob);
      ctx.lineTo(-5, -ts * 0.85 + arrowBob);
      ctx.lineTo(5, -ts * 0.85 + arrowBob);
      ctx.closePath();
      ctx.fill();
    }

    if (spirit.isHurt) {
      ctx.filter = (Math.floor(time / 80) % 2 === 0) ? 'brightness(3)' : 'brightness(1.5) drop-shadow(0 0 6px red)';
    }

    if (flipX) ctx.scale(-1, 1);

    if (spiritsImg) {
      const frameCol = isMoving ? animFrame : (Math.floor(time / 200) % 4);
      ctx.drawImage(spiritsImg, frameCol * 16, finalRow * 16, 16, 16, -ts / 2, -ts / 2, ts, ts);
    } else {
      ctx.fillStyle = isEmber ? '#b794ff' : '#2ee6c5';
      ctx.fillRect(-ts / 3, -ts / 3, (ts * 2) / 3, (ts * 2) / 3);
    }

    ctx.restore();

    // Floating orb sparkle trails
    if (Math.random() > 0.4) {
      const orbColor = isEmber ? '#c084fc' : '#67e8f9';
      this.addSparkle(drawX + (isEmber ? 6 : 5), drawY, orbColor);
    }
  }

  // Mystical Lighting Layer: Additive light pools around lanterns, portals & spirit orbs!
  drawLightingLayer(ctx, gameState, ts, time, flicker) {
    const { p1, p2, level } = gameState;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = w;
    lightCanvas.height = h;
    const lctx = lightCanvas.getContext('2d');

    // Ambient twilight darkness
    lctx.fillStyle = 'rgba(11, 10, 31, 0.46)';
    lctx.fillRect(0, 0, w, h);

    // Subtract darkness for all light emitters
    lctx.globalCompositeOperation = 'destination-out';

    // 1. Ember's Violet Orb Light Pool
    const p1x = (p1.x + 0.5) * ts;
    const p1y = (p1.y + 0.5) * ts;
    const rad1 = ts * 2.8 * flicker;
    const g1 = lctx.createRadialGradient(p1x, p1y, 4, p1x, p1y, rad1);
    g1.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    g1.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = g1;
    lctx.beginPath();
    lctx.arc(p1x, p1y, rad1, 0, Math.PI * 2);
    lctx.fill();

    // 2. Tide's Cyan Orb Light Pool
    const p2x = (p2.x + 0.5) * ts;
    const p2y = (p2.y + 0.5) * ts;
    const rad2 = ts * 2.8 * (flicker * 0.96 + 0.04);
    const g2 = lctx.createRadialGradient(p2x, p2y, 4, p2x, p2y, rad2);
    g2.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    g2.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = g2;
    lctx.beginPath();
    lctx.arc(p2x, p2y, rad2, 0, Math.PI * 2);
    lctx.fill();

    // 3. Corridor Lanterns Light Pools (Warm golden light!)
    if (level.decor && level.decor.lanterns) {
      level.decor.lanterns.forEach((l, idx) => {
        const lx = (l.x + 0.5) * ts;
        const ly = (l.y + 0.5) * ts;
        const f = flicker + Math.sin(time * 0.01 + idx) * 0.05;
        const grad = lctx.createRadialGradient(lx, ly, 4, lx, ly, ts * 2.2 * f);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lctx.fillStyle = grad;
        lctx.beginPath();
        lctx.arc(lx, ly, ts * 2.2 * f, 0, Math.PI * 2);
        lctx.fill();
      });
    }

    // 4. Portal Beacon Light Pools
    [level.gateTop, level.gateBottom].forEach(gate => {
      const gx = (gate.x + 0.5) * ts;
      const gy = (gate.y + 0.5) * ts;
      const grad = lctx.createRadialGradient(gx, gy, 6, gx, gy, ts * 2.6);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(gx, gy, ts * 2.6, 0, Math.PI * 2);
      lctx.fill();
    });

    // Blend darkness layer onto main canvas
    ctx.drawImage(lightCanvas, 0, 0);

    // Add colored glowing haloes using 'lighter'
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Ember violet halo
    const rg = ctx.createRadialGradient(p1x, p1y, 2, p1x, p1y, ts * 2.4);
    rg.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
    rg.addColorStop(1, 'rgba(147, 51, 234, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(p1x, p1y, ts * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Tide cyan halo
    const bg = ctx.createRadialGradient(p2x, p2y, 2, p2x, p2y, ts * 2.4);
    bg.addColorStop(0, 'rgba(103, 232, 249, 0.35)');
    bg.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(p2x, p2y, ts * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Golden halo around corridor lanterns
    if (level.decor && level.decor.lanterns) {
      level.decor.lanterns.forEach(l => {
        const lx = (l.x + 0.5) * ts;
        const ly = (l.y + 0.5) * ts;
        const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, ts * 1.8 * flicker);
        lg.addColorStop(0, 'rgba(255, 212, 121, 0.3)');
        lg.addColorStop(1, 'rgba(255, 138, 43, 0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(lx, ly, ts * 1.8 * flicker, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  drawParticles(ctx, w, h, time) {
    // Fireflies
    this.fireflies.forEach(f => {
      f.x = (f.x + f.vx + w) % w;
      f.y = (f.y + f.vy + h) % h;
      const alpha = f.baseAlpha + 0.3 * Math.sin(time * 0.003 + f.phase);
      ctx.fillStyle = `rgba(255, 230, 100, ${Math.max(0, alpha)})`;
      ctx.fillRect(f.x, f.y, f.size, f.size);
    });

    // Leaves & petals
    this.leaves.forEach(l => {
      l.x = (l.x + l.vx) % w;
      l.y = (l.y + l.vy) % h;
      ctx.fillStyle = l.color;
      ctx.fillRect(l.x, l.y, 2, 3);
    });

    // Sparkle trails
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;

      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      } else {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fillRect(s.x, s.y, 2, 2);
      }
    }
    ctx.globalAlpha = 1.0;

    // Heart Shards
    for (let i = this.heartShards.length - 1; i >= 0; i--) {
      const h = this.heartShards[i];
      h.x += h.vx;
      h.y += h.vy;
      h.life -= h.decay;
      if (h.life <= 0) {
        this.heartShards.splice(i, 1);
      } else {
        ctx.fillStyle = h.color;
        ctx.globalAlpha = h.life;
        ctx.fillRect(h.x, h.y, h.size, h.size);
      }
    }
    ctx.globalAlpha = 1.0;

    // Shockwaves (Collision)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 5;
      sw.alpha -= 0.035;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      } else {
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(192, 132, 252, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawVignette(ctx, w, h) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.38, w / 2, h / 2, w * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(11, 10, 31, 0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  drawGridOverlay(ctx, w, h, ts) {
    ctx.strokeStyle = 'rgba(183, 148, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += ts) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  drawDissolveWipe(ctx, w, h) {
    this.dissolveProgress += 0.05;
    const p = this.dissolveProgress;
    const blockSize = 16;
    ctx.fillStyle = '#0b0a1f';

    const cols = Math.ceil(w / blockSize);
    const rows = Math.ceil(h / blockSize);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const threshold = ((c * 17 + r * 31) % 100) / 100;
        if (p < 0.5) {
          if (threshold < p * 2) {
            ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
          }
        } else {
          if (threshold > (p - 0.5) * 2) {
            ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
          }
        }
      }
    }

    if (p >= 0.5 && this.dissolveCallback) {
      this.dissolveCallback();
      this.dissolveCallback = null;
    }

    if (p >= 1.0) {
      this.dissolving = false;
      this.dissolveProgress = 0;
    }
  }
}
