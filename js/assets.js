// js/assets.js - Asset Loader, Spritesheet Registry & Procedural Pixel Art Fallback

export const SPRITESHEET_MAP = {
  spirits: {
    src: 'assets/spirits.png',
    frameWidth: 16,
    frameHeight: 16,
    cols: 8,
    rows: 10
  },
  tiles: {
    src: 'assets/tiles.png',
    frameWidth: 16,
    frameHeight: 16,
    cols: 8,
    rows: 4
  },
  hazards: {
    src: 'assets/hazards.png',
    frameWidth: 16,
    frameHeight: 16,
    cols: 4,
    rows: 4
  },
  gates: {
    src: 'assets/gates.png',
    frameWidth: 16,
    frameHeight: 16,
    cols: 6,
    rows: 4
  },
  ui: {
    src: 'assets/ui.png',
    frameWidth: 32,
    frameHeight: 32,
    cols: 4,
    rows: 4
  }
};

class AssetManager {
  constructor() {
    this.images = {};
    this.fallbackCanvases = {};
    this.loaded = false;
  }

  async init() {
    this.generateProceduralArt();

    const loadPromises = Object.entries(SPRITESHEET_MAP).map(([key, def]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images[key] = img;
          resolve(true);
        };
        img.onerror = () => {
          this.images[key] = this.fallbackCanvases[key];
          resolve(false);
        };
        img.src = def.src;
      });
    });

    await Promise.all(loadPromises);
    this.loaded = true;
  }

  getImage(key) {
    return this.images[key] || this.fallbackCanvases[key];
  }

  generateProceduralArt() {
    if (typeof document === 'undefined') return;
    this.fallbackCanvases.spirits = this.buildSpiritsSheet();
    this.fallbackCanvases.tiles = this.buildTilesSheet();
    this.fallbackCanvases.hazards = this.buildHazardsSheet();
    this.fallbackCanvases.gates = this.buildGatesSheet();
    this.fallbackCanvases.ui = this.buildUiSheet();
  }

  createCanvas(w, h) {
    if (typeof document === 'undefined') {
      return { canvas: null, ctx: null };
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx };
  }

  // Draw Cute Chibi Witch (Ember) & Chibi Mage (Tide) holding glowing magical orbs
  buildSpiritsSheet() {
    const { canvas, ctx } = this.createCanvas(128, 160);
    this.drawChibiSpirit(ctx, 0, 0, 'ember');
    this.drawChibiSpirit(ctx, 0, 80, 'tide');
    return canvas;
  }

  drawChibiSpirit(ctx, originX, originY, type) {
    const isEmber = type === 'ember';
    const robeMain = isEmber ? '#382559' : '#143c3f';
    const robeDark = isEmber ? '#211538' : '#0c2224';
    const hairOrEye = isEmber ? '#b794ff' : '#2ee6c5';
    const skinColor = '#ffe7d6';
    const hatOrHood = isEmber ? '#23183b' : '#102e30';
    const hatBand = isEmber ? '#ffd479' : '#38bdf8';
    const orbColor = isEmber ? '#d8b4fe' : '#67e8f9';
    const orbGlow = isEmber ? '#9333ea' : '#06b6d4';

    // 4 directions: 0=Down, 1=Up, 2=Side, 3=Idle bob
    for (let dir = 0; dir < 4; dir++) {
      for (let f = 0; f < 4; f++) {
        const x = originX + f * 16;
        const y = originY + dir * 16;
        const bob = (dir === 3) ? (f % 2 === 0 ? 0 : 1) : (f === 1 || f === 3 ? 1 : 0);
        const legOff = (dir < 3 && f % 2 !== 0) ? 1 : 0;

        // Aura glow behind character
        ctx.fillStyle = isEmber ? 'rgba(183, 148, 255, 0.22)' : 'rgba(46, 230, 197, 0.22)';
        ctx.fillRect(x + 2, y + 2 + bob, 12, 12);

        // Legs / Shoes
        ctx.fillStyle = '#0b0a1a';
        if (dir === 2) {
          ctx.fillRect(x + 6 + (f % 2 === 0 ? 1 : -1), y + 14, 2, 2);
          ctx.fillRect(x + 8 - (f % 2 === 0 ? 1 : -1), y + 14, 2, 2);
        } else {
          ctx.fillRect(x + 5, y + 14 - (legOff && f === 1 ? 1 : 0), 2, 2);
          ctx.fillRect(x + 9, y + 14 - (legOff && f === 3 ? 1 : 0), 2, 2);
        }

        // Robe / Dress Body
        ctx.fillStyle = robeMain;
        ctx.fillRect(x + 4, y + 8 + bob, 8, 6);
        ctx.fillStyle = robeDark;
        ctx.fillRect(x + 4, y + 12 + bob, 8, 2);

        if (isEmber) {
          // Ember: Chibi Witch with Lilac Hair & Pointed Hat
          if (dir !== 1) { // Facing down or side
            // Face
            ctx.fillStyle = skinColor;
            ctx.fillRect(x + 5, y + 4 + bob, 6, 4);
            // Lilac Hair bangs
            ctx.fillStyle = hairOrEye;
            ctx.fillRect(x + 4, y + 4 + bob, 2, 4);
            ctx.fillRect(x + 10, y + 4 + bob, 2, 4);
            ctx.fillRect(x + 5, y + 3 + bob, 6, 2);
            // Cute Anime Eyes
            ctx.fillStyle = '#1e1136';
            if (dir === 2) {
              ctx.fillRect(x + 8, y + 5 + bob, 2, 2);
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(x + 8, y + 6 + bob, 1, 1);
            } else {
              ctx.fillRect(x + 6, y + 5 + bob, 1, 2);
              ctx.fillRect(x + 9, y + 5 + bob, 1, 2);
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(x + 6, y + 6 + bob, 1, 1);
              ctx.fillRect(x + 9, y + 6 + bob, 1, 1);
            }
          } else {
            // Facing Up: Lilac hair cascading down
            ctx.fillStyle = hairOrEye;
            ctx.fillRect(x + 4, y + 4 + bob, 8, 6);
          }

          // Witch Hat: Brim, Cone, and Tip
          ctx.fillStyle = hatOrHood;
          ctx.fillRect(x + 2, y + 2 + bob, 12, 2); // Brim
          ctx.fillRect(x + 4, y + 0 + bob, 8, 2); // Base
          ctx.fillRect(x + 5, y - 2 + bob, 6, 2); // Mid
          ctx.fillRect(x + 6, y - 4 + bob, 4, 2); // Upper
          ctx.fillRect(x + 8, y - 5 + bob, 2, 2); // Tilted tip
          // Gold Hat Band
          ctx.fillStyle = hatBand;
          ctx.fillRect(x + 4, y + 1 + bob, 8, 1);

          // Held Glowing Violet Orb in right hand!
          const orbX = (dir === 2) ? x + 11 : x + 10;
          const orbY = y + 7 + bob;
          ctx.fillStyle = orbGlow;
          ctx.fillRect(orbX - 1, orbY - 1, 4, 4);
          ctx.fillStyle = orbColor;
          ctx.fillRect(orbX, orbY, 2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(orbX, orbY, 1, 1);

        } else {
          // Tide: Chibi Hooded Mage with Cyan Eyes & Hood
          ctx.fillStyle = hatOrHood;
          ctx.fillRect(x + 3, y + 1 + bob, 10, 8); // Hood dome
          ctx.fillStyle = robeDark;
          ctx.fillRect(x + 3, y + 3 + bob, 1, 6);
          ctx.fillRect(x + 12, y + 3 + bob, 1, 6);

          if (dir !== 1) { // Face opening
            ctx.fillStyle = '#061617'; // Shadowed face inside cowl
            ctx.fillRect(x + 5, y + 4 + bob, 6, 4);
            // Glowing Cyan Eyes
            ctx.fillStyle = hairOrEye;
            if (dir === 2) {
              ctx.fillRect(x + 8, y + 5 + bob, 2, 2);
            } else {
              ctx.fillRect(x + 6, y + 5 + bob, 1, 2);
              ctx.fillRect(x + 9, y + 5 + bob, 1, 2);
            }
          }

          // Held Glowing Cyan Orb in hand!
          const orbX = (dir === 2) ? x + 11 : x + 10;
          const orbY = y + 7 + bob;
          ctx.fillStyle = orbGlow;
          ctx.fillRect(orbX - 1, orbY - 1, 4, 4);
          ctx.fillStyle = orbColor;
          ctx.fillRect(orbX, orbY, 2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(orbX, orbY, 1, 1);
        }
      }
    }

    // Row 4: Hurt flash, Poof particles, Victory dance
    const actionY = originY + 4 * 16;
    for (let hf = 0; hf < 2; hf++) {
      const hx = originX + hf * 16;
      ctx.fillStyle = hf === 0 ? '#ffffff' : (isEmber ? '#9333ea' : '#06b6d4');
      ctx.fillRect(hx + 3, actionY + 3, 10, 10);
    }
    for (let pf = 0; pf < 5; pf++) {
      const px = originX + (2 + pf) * 16;
      ctx.fillStyle = `rgba(207, 198, 240, ${1 - pf * 0.2})`;
      ctx.fillRect(px + 4, actionY + 4, 8, 8);
    }
    for (let vf = 0; vf < 4; vf++) {
      const vx = originX + (7 + vf) * 16;
      const jump = (vf % 2 === 0) ? -3 : 0;
      ctx.fillStyle = isEmber ? '#b794ff' : '#2ee6c5';
      ctx.fillRect(vx + 4, actionY + 4 + jump, 8, 8);
      ctx.fillRect(vx + 2, actionY + 3 + jump, 2, 4);
      ctx.fillRect(vx + 12, actionY + 3 + jump, 2, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(vx + 1, actionY + 1 + jump, 2, 2);
      ctx.fillRect(vx + 13, actionY + 1 + jump, 2, 2);
    }
  }

  // Draw Lush Flowering Hedge Walls, Dark Blue Flagstones, Inlaid Runes & Lanterns
  buildTilesSheet() {
    const { canvas, ctx } = this.createCanvas(128, 64);

    // Col 0: Lush Flowering Hedge Wall
    ctx.fillStyle = '#0d2814';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#14522a';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#2f9e55';
    ctx.fillRect(2, 2, 5, 4);
    ctx.fillRect(8, 2, 6, 5);
    ctx.fillRect(3, 7, 10, 6);
    ctx.fillStyle = '#5fd47e';
    ctx.fillRect(3, 2, 3, 2);
    ctx.fillRect(9, 3, 3, 2);
    ctx.fillRect(5, 8, 4, 2);
    // Flowering blossoms
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(4, 5, 2, 2);
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(8, 10, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 5, 1, 1);
    ctx.fillRect(8, 10, 1, 1);

    // Col 1: Ancient Castle Stone Brick Wall
    ctx.fillStyle = '#1a1833';
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillStyle = '#2b274c';
    ctx.fillRect(17, 1, 14, 14);
    ctx.fillStyle = '#3f396b';
    ctx.fillRect(18, 2, 5, 4);
    ctx.fillRect(25, 8, 5, 4);
    ctx.fillStyle = '#110f24';
    ctx.fillRect(16, 7, 16, 1);
    ctx.fillRect(23, 0, 1, 7);
    ctx.fillRect(21, 8, 1, 7);

    // Col 2: Deep Blue-Slate Flagstone Floor
    ctx.fillStyle = '#0c0e22';
    ctx.fillRect(32, 0, 16, 16);
    ctx.fillStyle = '#151936';
    ctx.fillRect(33, 1, 14, 14);
    ctx.fillStyle = '#20264d';
    ctx.fillRect(33, 1, 13, 2);
    ctx.fillRect(33, 1, 2, 13);
    ctx.fillStyle = '#11142e';
    ctx.fillRect(38, 7, 4, 1);
    ctx.fillRect(41, 8, 3, 1);

    // Col 3: Castle Courtyard Flagstone Floor
    ctx.fillStyle = '#0b0a1f';
    ctx.fillRect(48, 0, 16, 16);
    ctx.fillStyle = '#1a1838';
    ctx.fillRect(49, 1, 14, 14);
    ctx.fillStyle = '#26244f';
    ctx.fillRect(50, 2, 12, 3);

    // Col 4: Heavy Carved Divider Stone (Level 5)
    ctx.fillStyle = '#181229';
    ctx.fillRect(64, 0, 16, 16);
    ctx.fillStyle = '#2c224a';
    ctx.fillRect(65, 1, 14, 14);
    ctx.fillStyle = '#ffd479';
    ctx.fillRect(68, 7, 8, 2);
    ctx.fillRect(71, 4, 2, 8);

    // Col 5: Dungeon Floor
    ctx.fillStyle = '#090814';
    ctx.fillRect(80, 0, 16, 16);
    ctx.fillStyle = '#151426';
    ctx.fillRect(81, 1, 14, 14);

    return canvas;
  }

  buildHazardsSheet() {
    const { canvas, ctx } = this.createCanvas(64, 64);
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      ctx.fillStyle = '#ff8a2b';
      ctx.fillRect(x + 4, 4 - (f % 2), 8, 12);
      ctx.fillStyle = '#ffd479';
      ctx.fillRect(x + 6, 6 - (f % 2), 4, 8);
      ctx.fillStyle = '#ff3344';
      ctx.fillRect(x + 5, 11, 6, 4);
    }
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      const y = 16;
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x + 2, y + 2, 12, 12);
      ctx.fillStyle = '#35c9ff';
      ctx.fillRect(x + 3, y + 3, 10, 10);
      ctx.fillStyle = '#ffffff';
      const bx = x + 4 + (f * 3) % 8;
      const by = y + 10 - (f * 2) % 6;
      ctx.fillRect(bx, by, 2, 2);
    }
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      const y = 32;
      ctx.fillStyle = 'rgba(255, 240, 106, 0.3)';
      ctx.fillRect(x + 2, y + 2, 12, 12);
      ctx.fillStyle = '#fff06a';
      ctx.fillRect(x + 5, y + 5, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, y + 7, 2, 2);
    }
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      const y = 48;
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(x + 3, y + 3, 10, 10);
      ctx.fillStyle = '#ffd479';
      ctx.fillRect(x + 4 + f * 2, y + 7, 6, 2);
    }
    return canvas;
  }

  buildGatesSheet() {
    const { canvas, ctx } = this.createCanvas(96, 64);
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      ctx.fillStyle = '#22183b';
      ctx.fillRect(x + 1, 1, 14, 14);
      ctx.fillStyle = '#3e2e66';
      ctx.fillRect(x + 2, 1, 12, 3);
      ctx.fillRect(x + 1, 2, 3, 13);
      ctx.fillRect(x + 12, 2, 3, 13);
      ctx.fillStyle = '#ffd479';
      ctx.fillRect(x + 7, 1, 2, 2);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + 4, 4, 8, 11);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(x + 5, 5, 6, 9);
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(x + 6, 6 + (f % 2), 4, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, 8, 2, 3);
    }
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      const y = 16;
      ctx.fillStyle = '#0f2338';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#1b3f61';
      ctx.fillRect(x + 2, y + 1, 12, 3);
      ctx.fillRect(x + 1, y + 2, 3, 13);
      ctx.fillRect(x + 12, y + 2, 3, 13);
      ctx.fillStyle = '#2ee6c5';
      ctx.fillRect(x + 7, y + 1, 2, 2);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(x + 4, y + 4, 8, 11);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x + 5, y + 5, 6, 9);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(x + 6, y + 6 + (f % 2), 4, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, y + 8, 2, 3);
    }
    for (let f = 0; f < 4; f++) {
      const x = f * 16;
      const y = 32;
      ctx.fillStyle = '#1e1c2b';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#39364f';
      ctx.fillRect(x + 2, y + 1, 12, 3);
      ctx.fillRect(x + 1, y + 2, 3, 13);
      ctx.fillRect(x + 12, y + 2, 3, 13);
      ctx.fillStyle = 'rgba(183, 148, 255, 0.3)';
      ctx.fillRect(x + 7, y + 6, 2, 4);
    }
    ctx.fillStyle = '#2b2b45';
    ctx.fillRect(0, 48, 16, 16);
    ctx.fillStyle = '#1a1642';
    ctx.fillRect(4, 52, 4, 1);
    ctx.fillRect(7, 53, 3, 1);
    ctx.fillStyle = '#1a1642';
    ctx.fillRect(16, 48, 16, 16);
    ctx.fillStyle = 'rgba(183, 148, 255, 0.5)';
    ctx.fillRect(18, 50, 12, 12);
    ctx.fillStyle = '#b794ff';
    ctx.fillRect(20, 52, 8, 8);
    return canvas;
  }

  buildUiSheet() {
    const { canvas, ctx } = this.createCanvas(128, 128);
    ctx.fillStyle = '#b794ff';
    ctx.fillRect(6, 6, 20, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 8, 6, 6);
    return canvas;
  }
}

export const assets = new AssetManager();
