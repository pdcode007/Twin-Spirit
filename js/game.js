// js/game.js - Core State Machine, Move Resolution & Persistence
import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { ui } from './ui.js';
import { buildVerifiedLevel } from './levels.js';
import { canMove } from './solver.js';

export class GameEngine {
  constructor(renderer) {
    this.renderer = renderer;

    this.state = 'LANDING'; // LANDING, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, VICTORY
    this.currentLevelNum = 1;
    this.level = null;

    this.moveCount = 0;
    this.timeElapsed = 0;
    this.timerInterval = null;

    // Spirits state
    this.p1 = null;
    this.p2 = null;

    // Level 4 turn state (0: Ember, 1: Tide)
    this.activeTurn = 0;

    // Level 5 colorless gate state
    this.gateRevealedTop = false;
    this.gateRevealedBottom = false;
    this.gateAssignment = { top: 'red', bottom: 'blue' };
    this.revealedTrapDoors = new Set();

    // Tutorial state for Level 1
    this.tutorialStep = 0;

    // Animation tweening
    this.isTweening = false;
    this.tweenStartTime = 0;

    // Persistence
    this.saveData = this.loadProgress();
  }

  init() {
    this.loadSettings();

    // Hook up input callbacks
    input.init({
      onMove: (dir) => this.handleMove(dir),
      onAction: (action) => this.handleAction(action)
    });

    ui.init(this);

    // Initial resize
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_SAVE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
      highestUnlocked: 1,
      storySeen: false,
      levels: {}
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_SAVE, JSON.stringify(this.saveData));
    } catch (e) {}
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_SETTINGS);
      if (raw) {
        const s = JSON.parse(raw);
        audio.masterVolume = s.masterVolume ?? 0.8;
        audio.musicVolume = s.musicVolume ?? 0.45;
        audio.sfxVolume = s.sfxVolume ?? 0.8;
        audio.isMuted = s.muted ?? false;
        this.renderer.enableEffects = s.effects ?? true;
        this.renderer.showGrid = s.showGrid ?? false;

        const sm = document.getElementById('slider-master');
        const smu = document.getElementById('slider-music');
        const ss = document.getElementById('slider-sfx');
        const tm = document.getElementById('toggle-mute');
        const te = document.getElementById('toggle-effects');
        const tg = document.getElementById('toggle-grid');

        if (sm) sm.value = audio.masterVolume;
        if (smu) smu.value = audio.musicVolume;
        if (ss) ss.value = audio.sfxVolume;
        if (tm) tm.checked = audio.isMuted;
        if (te) te.checked = this.renderer.enableEffects;
        if (tg) tg.checked = this.renderer.showGrid;
      }
    } catch (e) {}
  }

  saveSettings() {
    try {
      const s = {
        masterVolume: audio.masterVolume,
        musicVolume: audio.musicVolume,
        sfxVolume: audio.sfxVolume,
        muted: audio.isMuted,
        effects: this.renderer.enableEffects,
        showGrid: this.renderer.showGrid
      };
      localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(s));
    } catch (e) {}
  }

  startLevel(levelNum) {
    this.currentLevelNum = levelNum;
    this.level = buildVerifiedLevel(levelNum);

    this.moveCount = 0;
    this.timeElapsed = 0;
    this.activeTurn = 0;
    this.revealedTrapDoors.clear();
    this.isTweening = false;

    // Level 5 gate randomization
    if (levelNum === 5) {
      this.gateRevealedTop = false;
      this.gateRevealedBottom = false;
      // Randomize whether top is red or blue per attempt
      const isTopRed = Math.random() > 0.5;
      this.gateAssignment = isTopRed ? { top: 'red', bottom: 'blue' } : { top: 'blue', bottom: 'red' };
    } else {
      this.gateRevealedTop = true;
      this.gateRevealedBottom = true;
      this.gateAssignment = { top: 'red', bottom: 'blue' };
    }

    // Initialize spirits
    this.p1 = {
      x: this.level.startP1.x,
      y: this.level.startP1.y,
      prevX: this.level.startP1.x,
      prevY: this.level.startP1.y,
      hearts: CONFIG.MAX_HEARTS,
      facing: 'S',
      isTweening: false,
      tweenProgress: 0,
      isHurt: false
    };

    this.p2 = {
      x: this.level.startP2.x,
      y: this.level.startP2.y,
      prevX: this.level.startP2.x,
      prevY: this.level.startP2.y,
      hearts: CONFIG.MAX_HEARTS,
      facing: 'N',
      isTweening: false,
      tweenProgress: 0,
      isHurt: false
    };

    // Update UI panels & HUD
    ui.updateRulesPanel(this.level.definition);
    ui.updateHud(this);

    // Show level intro card
    this.state = 'LEVEL_INTRO';
    ui.showLevelIntroCard(this.level.definition);

    // Tutorial step
    this.tutorialStep = 0;
    if (levelNum === 1) {
      setTimeout(() => {
        ui.showTutorialBubble("Welcome, Twin Spirits! Press UP or W: Ember walks North while Tide walks South! One joystick links both.");
      }, 700);
    } else {
      ui.hideTutorialBubble();
    }
  }

  resumeGameLoop() {
    this.state = 'PLAYING';
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state === 'PLAYING') {
        this.timeElapsed += 1;
        ui.updateHud(this);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  restartLevel() {
    this.renderer.startDissolveWipe(() => {
      this.startLevel(this.currentLevelNum);
      this.resumeGameLoop();
    });
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.stopTimer();
      ui.openModal('pauseModal');
    } else if (this.state === 'PAUSED') {
      ui.closeModal('pauseModal');
      this.state = 'PLAYING';
      this.startTimer();
    }
  }

  handleAction(action) {
    if (action === 'pause') {
      this.togglePause();
    } else if (action === 'pause_focus_lost') {
      if (this.state === 'PLAYING') {
        this.togglePause();
      }
    } else if (action === 'restart') {
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.restartLevel();
      }
    } else if (action === 'mute') {
      audio.toggleMute();
      ui.updateAudioIcons();
    } else if (action === 'rules') {
      // Toggle rules focus or modal
      audio.playUiClick();
    }
  }

  handleMove(dir) {
    if (this.state !== 'PLAYING') return false;

    // Animation lockout check
    if (this.isTweening) {
      return false; // Will be captured by input buffer
    }

    const lvlNum = this.currentLevelNum;
    const isDiag = Math.abs(dir.dx) === 1 && Math.abs(dir.dy) === 1;

    // Disallow diagonals on Level 1 and Level 2
    if (lvlNum <= 2 && isDiag) {
      return false;
    }

    let nextP1 = { ...this.p1 };
    let nextP2 = { ...this.p2 };
    let movedP1 = false;
    let movedP2 = false;

    const gateP1 = (this.gateAssignment.top === 'red') ? this.level.gateTop : this.level.gateBottom;
    const gateP2 = (this.gateAssignment.bottom === 'blue') ? this.level.gateBottom : this.level.gateTop;

    if (lvlNum === 1) {
      // UP/DOWN mirrored, LEFT/RIGHT same
      const d1 = { dx: dir.dx, dy: dir.dy };
      const d2 = { dx: dir.dx, dy: -dir.dy };

      if (!(this.p1.x === gateP1.x && this.p1.y === gateP1.y)) {
        const r1 = canMove(this.p1, d1, this.level.grid, false, gateP1, gateP2);
        if (r1) { nextP1.x = r1.x; nextP1.y = r1.y; movedP1 = true; }
      }
      if (!(this.p2.x === gateP2.x && this.p2.y === gateP2.y)) {
        const r2 = canMove(this.p2, d2, this.level.grid, false, gateP2, gateP1);
        if (r2) { nextP2.x = r2.x; nextP2.y = r2.y; movedP2 = true; }
      }
      if (d1.dx > 0) this.p1.facing = 'E'; else if (d1.dx < 0) this.p1.facing = 'W'; else if (d1.dy > 0) this.p1.facing = 'S'; else this.p1.facing = 'N';
      if (d2.dx > 0) this.p2.facing = 'E'; else if (d2.dx < 0) this.p2.facing = 'W'; else if (d2.dy > 0) this.p2.facing = 'S'; else this.p2.facing = 'N';

    } else if (lvlNum === 2) {
      // Both axes mirrored
      const d1 = { dx: dir.dx, dy: dir.dy };
      const d2 = { dx: -dir.dx, dy: -dir.dy };

      if (!(this.p1.x === gateP1.x && this.p1.y === gateP1.y)) {
        const r1 = canMove(this.p1, d1, this.level.grid, false, gateP1, gateP2);
        if (r1) { nextP1.x = r1.x; nextP1.y = r1.y; movedP1 = true; }
      }
      if (!(this.p2.x === gateP2.x && this.p2.y === gateP2.y)) {
        const r2 = canMove(this.p2, d2, this.level.grid, false, gateP2, gateP1);
        if (r2) { nextP2.x = r2.x; nextP2.y = r2.y; movedP2 = true; }
      }
      this.p1.facing = dir.name;
      const invMap = { N: 'S', S: 'N', E: 'W', W: 'E' };
      this.p2.facing = invMap[dir.name] || 'N';

    } else if (lvlNum === 3) {
      // 8 directions, point-reflection
      const d1 = { dx: dir.dx, dy: dir.dy };
      const d2 = { dx: -dir.dx, dy: -dir.dy };

      if (!(this.p1.x === gateP1.x && this.p1.y === gateP1.y)) {
        const r1 = canMove(this.p1, d1, this.level.grid, isDiag, gateP1, gateP2);
        if (r1) { nextP1.x = r1.x; nextP1.y = r1.y; movedP1 = true; }
      }
      if (!(this.p2.x === gateP2.x && this.p2.y === gateP2.y)) {
        const r2 = canMove(this.p2, d2, this.level.grid, isDiag, gateP2, gateP1);
        if (r2) { nextP2.x = r2.x; nextP2.y = r2.y; movedP2 = true; }
      }
      this.p1.facing = dir.name;
      const invMap8 = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };
      this.p2.facing = invMap8[dir.name] || 'N';

    } else if (lvlNum === 4) {
      // Turn by turn
      if (this.activeTurn === 0) {
        // Ember's turn
        if (!(this.p1.x === gateP1.x && this.p1.y === gateP1.y)) {
          const r1 = canMove(this.p1, dir, this.level.grid, isDiag, gateP1, gateP2);
          if (r1) {
            nextP1.x = r1.x; nextP1.y = r1.y; movedP1 = true;
            this.activeTurn = 1; // Hand over to Tide
            audio.playTurnSwitch();
          }
        } else {
          this.activeTurn = 1;
          movedP1 = true;
          audio.playTurnSwitch();
        }
        this.p1.facing = dir.name;
      } else {
        // Tide's turn (inverted)
        const invD = CONFIG.INVERT_ON_P2_TURN ? { dx: -dir.dx, dy: -dir.dy } : { dx: dir.dx, dy: dir.dy };
        const invMap8 = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };
        if (!(this.p2.x === gateP2.x && this.p2.y === gateP2.y)) {
          const r2 = canMove(this.p2, invD, this.level.grid, isDiag, gateP2, gateP1);
          if (r2) {
            nextP2.x = r2.x; nextP2.y = r2.y; movedP2 = true;
            this.activeTurn = 0; // Hand over to Ember
            audio.playTurnSwitch();
          }
        } else {
          this.activeTurn = 0;
          movedP2 = true;
          audio.playTurnSwitch();
        }
        this.p2.facing = CONFIG.INVERT_ON_P2_TURN ? (invMap8[dir.name] || 'N') : dir.name;
      }

    } else if (lvlNum === 5) {
      // Sundered keep: point-reflection, trapdoors, colorless gate reveal, collision check
      const d1 = { dx: dir.dx, dy: dir.dy };
      const d2 = { dx: -dir.dx, dy: -dir.dy };

      if (!(this.p1.x === gateP1.x && this.p1.y === gateP1.y)) {
        const r1 = canMove(this.p1, d1, this.level.grid, isDiag, null, null);
        if (r1) { nextP1.x = r1.x; nextP1.y = r1.y; movedP1 = true; }
      }
      if (!(this.p2.x === gateP2.x && this.p2.y === gateP2.y)) {
        const r2 = canMove(this.p2, d2, this.level.grid, isDiag, null, null);
        if (r2) { nextP2.x = r2.x; nextP2.y = r2.y; movedP2 = true; }
      }

      this.p1.facing = dir.name;
      const invMap8 = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };
      this.p2.facing = invMap8[dir.name] || 'N';

      // Collision Check: instant game over if occupying same tile or swapped
      if ((nextP1.x === nextP2.x && nextP1.y === nextP2.y) ||
          (nextP1.x === this.p2.x && nextP1.y === this.p2.y && nextP2.x === this.p1.x && nextP2.y === this.p1.y)) {
        audio.playCollision();
        this.renderer.triggerShockwave(nextP1.x * this.renderer.tileSize, nextP1.y * this.renderer.tileSize);
        this.renderer.triggerScreenShake(14, 500);
        this.state = 'GAME_OVER';
        this.stopTimer();
        setTimeout(() => ui.showGameOver('collision'), 600);
        return true;
      }

      // Trapdoor teleport check for P1
      if (movedP1) {
        if (this.level.trapUpper && nextP1.x === this.level.trapUpper.x && nextP1.y === this.level.trapUpper.y) {
          this.revealedTrapDoors.add(`${this.level.trapUpper.x},${this.level.trapUpper.y}`);
          audio.playTrapDoor();
          nextP1.x = this.level.trapUpper.landingX;
          nextP1.y = this.level.trapUpper.landingY;
        } else if (this.level.trapLower && nextP1.x === this.level.trapLower.x && nextP1.y === this.level.trapLower.y) {
          this.revealedTrapDoors.add(`${this.level.trapLower.x},${this.level.trapLower.y}`);
          audio.playTrapDoor();
          nextP1.x = this.level.trapLower.landingX;
          nextP1.y = this.level.trapLower.landingY;
        }
      }

      // Trapdoor teleport check for P2
      if (movedP2) {
        if (this.level.trapUpper && nextP2.x === this.level.trapUpper.x && nextP2.y === this.level.trapUpper.y) {
          this.revealedTrapDoors.add(`${this.level.trapUpper.x},${this.level.trapUpper.y}`);
          audio.playTrapDoor();
          nextP2.x = this.level.trapUpper.landingX;
          nextP2.y = this.level.trapUpper.landingY;
        } else if (this.level.trapLower && nextP2.x === this.level.trapLower.x && nextP2.y === this.level.trapLower.y) {
          this.revealedTrapDoors.add(`${this.level.trapLower.x},${this.level.trapLower.y}`);
          audio.playTrapDoor();
          nextP2.x = this.level.trapLower.landingX;
          nextP2.y = this.level.trapLower.landingY;
        }
      }

      // Colorless gate step check for P1
      if (movedP1) {
        const onTopGate = (nextP1.x === this.level.gateTop.x && nextP1.y === this.level.gateTop.y);
        const onBottomGate = (nextP1.x === this.level.gateBottom.x && nextP1.y === this.level.gateBottom.y);

        if (onTopGate || onBottomGate) {
          const isMatch = onTopGate ? (this.gateAssignment.top === 'red') : (this.gateAssignment.bottom === 'red');
          this.gateRevealedTop = true;
          this.gateRevealedBottom = true;
          audio.playGateReveal();

          if (!isMatch) {
            // Mismatch: 1 heart damage, bounce back 1 tile!
            this.p1.hearts = Math.max(0, this.p1.hearts - 1);
            this.p1.isHurt = true;
            setTimeout(() => { this.p1.isHurt = false; }, 350);
            this.renderer.triggerHeartShatter(this.p1.x * this.renderer.tileSize, this.p1.y * this.renderer.tileSize, '#e63946');
            audio.playHeartLost();
            nextP1.x = this.p1.x; // bounce back
            nextP1.y = this.p1.y;
          } else {
            audio.playGateOpen();
          }
        }
      }

      // Colorless gate step check for P2
      if (movedP2) {
        const onTopGate = (nextP2.x === this.level.gateTop.x && nextP2.y === this.level.gateTop.y);
        const onBottomGate = (nextP2.x === this.level.gateBottom.x && nextP2.y === this.level.gateBottom.y);

        if (onTopGate || onBottomGate) {
          const isMatch = onTopGate ? (this.gateAssignment.top === 'blue') : (this.gateAssignment.bottom === 'blue');
          this.gateRevealedTop = true;
          this.gateRevealedBottom = true;
          audio.playGateReveal();

          if (!isMatch) {
            this.p2.hearts = Math.max(0, this.p2.hearts - 1);
            this.p2.isHurt = true;
            setTimeout(() => { this.p2.isHurt = false; }, 350);
            this.renderer.triggerHeartShatter(this.p2.x * this.renderer.tileSize, this.p2.y * this.renderer.tileSize, '#3a86ff');
            audio.playHeartLost();
            nextP2.x = this.p2.x; // bounce back
            nextP2.y = this.p2.y;
          } else {
            audio.playGateOpen();
          }
        }
      }
    }

    // Both blocked: does not count as move!
    if (!movedP1 && !movedP2) {
      audio.playWallBump();
      return false;
    }

    // Valid move!
    this.moveCount++;

    // Start 120ms tween hop
    this.p1.prevX = this.p1.x;
    this.p1.prevY = this.p1.y;
    this.p1.x = nextP1.x;
    this.p1.y = nextP1.y;
    this.p1.isTweening = movedP1;
    this.p1.tweenProgress = 0;

    this.p2.prevX = this.p2.x;
    this.p2.prevY = this.p2.y;
    this.p2.x = nextP2.x;
    this.p2.y = nextP2.y;
    this.p2.isTweening = movedP2;
    this.p2.tweenProgress = 0;

    this.isTweening = true;
    this.tweenStartTime = performance.now();

    // Play footstep
    if (movedP1) audio.playFootstep('ember');
    else if (movedP2) audio.playFootstep('tide');

    // Hazard collision check
    this.checkHazards();

    // Check Tutorial triggers (Level 1)
    if (lvlNum === 1) {
      if (this.moveCount === 1) {
        ui.showTutorialBubble("Notice how moving LEFT and RIGHT moves you both horizontally, but UP/DOWN mirror!");
      } else if (this.moveCount === 5) {
        ui.showTutorialBubble("Warning: Fire, Water, Electric orbs, and Arrows deal 1 heart damage. Watch your step!");
      }
    }

    // Update HUD
    ui.updateHud(this);

    // Check Win
    this.checkWinCondition();

    return true;
  }

  checkHazards() {
    const hazards = this.level.hazards;
    if (!hazards) return;

    // P1 hazard check
    const h1 = hazards.find(h => h.x === this.p1.x && h.y === this.p1.y);
    if (h1) {
      this.p1.hearts = Math.max(0, this.p1.hearts - 1);
      this.p1.isHurt = true;
      setTimeout(() => { this.p1.isHurt = false; }, 350);
      this.renderer.triggerScreenShake(7, 280);
      this.renderer.triggerHeartShatter(this.p1.x * this.renderer.tileSize, this.p1.y * this.renderer.tileSize, '#e63946');
      audio.playHeartLost();
      if (h1.type === 'fire') audio.playHazardFire();
      else if (h1.type === 'water') audio.playHazardWater();
      else if (h1.type === 'electric') audio.playHazardElectric();
      else if (h1.type === 'arrow') audio.playHazardArrow();
    }

    // P2 hazard check
    const h2 = hazards.find(h => h.x === this.p2.x && h.y === this.p2.y);
    if (h2) {
      this.p2.hearts = Math.max(0, this.p2.hearts - 1);
      this.p2.isHurt = true;
      setTimeout(() => { this.p2.isHurt = false; }, 350);
      this.renderer.triggerScreenShake(7, 280);
      this.renderer.triggerHeartShatter(this.p2.x * this.renderer.tileSize, this.p2.y * this.renderer.tileSize, '#3a86ff');
      audio.playHeartLost();
      if (h2.type === 'fire') audio.playHazardFire();
      else if (h2.type === 'water') audio.playHazardWater();
      else if (h2.type === 'electric') audio.playHazardElectric();
      else if (h2.type === 'arrow') audio.playHazardArrow();
    }

    // Check Game Over (0 hearts)
    if (this.p1.hearts <= 0 || this.p2.hearts <= 0) {
      this.state = 'GAME_OVER';
      this.stopTimer();
      setTimeout(() => ui.showGameOver('hearts'), 400);
    }
  }

  checkWinCondition() {
    const gateP1 = (this.gateAssignment.top === 'red') ? this.level.gateTop : this.level.gateBottom;
    const gateP2 = (this.gateAssignment.bottom === 'blue') ? this.level.gateBottom : this.level.gateTop;

    const p1InGate = (this.p1.x === gateP1.x && this.p1.y === gateP1.y);
    const p2InGate = (this.p2.x === gateP2.x && this.p2.y === gateP2.y);

    if (p1InGate && p2InGate && this.state === 'PLAYING') {
      this.state = 'LEVEL_COMPLETE';
      this.stopTimer();

      // Calculate Stars
      // 3 stars = moves <= par * 1.2 and no hearts lost (both at 5)
      // 2 stars = moves <= par * 1.5
      // 1 star = otherwise
      const par = this.level.par;
      const noHeartsLost = (this.p1.hearts === CONFIG.MAX_HEARTS && this.p2.hearts === CONFIG.MAX_HEARTS);

      let stars = 1;
      if (this.moveCount <= par * 1.2 && noHeartsLost) {
        stars = 3;
      } else if (this.moveCount <= par * 1.5) {
        stars = 2;
      }

      // Format time
      const mins = Math.floor(this.timeElapsed / 60);
      const secs = Math.floor(this.timeElapsed % 60);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Update save data
      const lvlId = this.currentLevelNum;
      const prevData = this.saveData.levels[lvlId] || { stars: 0, bestMoves: 9999, bestTime: '99:99' };

      const bestMoves = Math.min(this.moveCount, typeof prevData.bestMoves === 'number' ? prevData.bestMoves : this.moveCount);
      const bestStars = Math.max(stars, prevData.stars || 0);

      this.saveData.levels[lvlId] = {
        stars: bestStars,
        bestMoves,
        bestTime: timeStr
      };

      if (this.currentLevelNum >= this.saveData.highestUnlocked && this.currentLevelNum < 5) {
        this.saveData.highestUnlocked = this.currentLevelNum + 1;
      }

      this.saveProgress();

      // Show Complete Modal
      setTimeout(() => {
        ui.showLevelComplete({
          moves: this.moveCount,
          par,
          timeStr,
          heartsLeft: Math.min(this.p1.hearts, this.p2.hearts),
          stars
        });
      }, 500);
    }
  }

  update(time) {
    // Tween interpolation
    if (this.isTweening) {
      const elapsed = performance.now() - this.tweenStartTime;
      const progress = Math.min(1.0, elapsed / CONFIG.TILE_MOVE_DURATION);

      if (this.p1) this.p1.tweenProgress = progress;
      if (this.p2) this.p2.tweenProgress = progress;

      if (progress >= 1.0) {
        this.isTweening = false;
        if (this.p1) {
          this.p1.isTweening = false;
          this.p1.prevX = this.p1.x;
          this.p1.prevY = this.p1.y;
        }
        if (this.p2) {
          this.p2.isTweening = false;
          this.p2.prevX = this.p2.x;
          this.p2.prevY = this.p2.y;
        }
        // Check if there is a buffered input move waiting!
        input.checkBufferedInput();
      }
    }

    // Render frame
    this.renderer.render(this, time);
  }
}
