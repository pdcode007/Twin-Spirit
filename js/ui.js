// js/ui.js - HUD, Modals, Speech Bubbles & Screen Router
import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { assets } from './assets.js';

export class UIManager {
  constructor() {
    this.game = null;
    this.dom = {};
  }

  init(gameInstance) {
    this.game = gameInstance;
    this.cacheDom();
    this.bindEvents();
    this.updateAudioIcons();
    this.setupPortraits();
  }

  setupPortraits() {
    const p1Box = document.getElementById('p1-portrait');
    const p2Box = document.getElementById('p2-portrait');
    if (!p1Box || !p2Box) return;

    const spirits = assets.getImage('spirits');
    if (!spirits) return;

    const createPortraitCanvas = (row) => {
      const c = document.createElement('canvas');
      c.width = 36;
      c.height = 36;
      c.className = 'portrait-canvas';
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spirits, 0, row * 16, 16, 16, 0, 0, 36, 36);
      }
      return c;
    };

    p1Box.innerHTML = '';
    p1Box.appendChild(createPortraitCanvas(3)); // Ember
    p2Box.innerHTML = '';
    p2Box.appendChild(createPortraitCanvas(8)); // Tide

    // Landing screen floating spirits
    const emberLanding = document.querySelector('.floating-spirit.ember');
    const tideLanding = document.querySelector('.floating-spirit.tide');
    if (emberLanding && tideLanding) {
      const c1 = document.createElement('canvas');
      c1.width = 64; c1.height = 64;
      const ctx1 = c1.getContext('2d');
      if (ctx1) {
        ctx1.imageSmoothingEnabled = false;
        ctx1.drawImage(spirits, 0, 3 * 16, 16, 16, 0, 0, 64, 64);
        emberLanding.innerHTML = '';
        emberLanding.appendChild(c1);
      }

      const c2 = document.createElement('canvas');
      c2.width = 64; c2.height = 64;
      const ctx2 = c2.getContext('2d');
      if (ctx2) {
        ctx2.imageSmoothingEnabled = false;
        ctx2.drawImage(spirits, 0, 8 * 16, 16, 16, 0, 0, 64, 64);
        tideLanding.innerHTML = '';
        tideLanding.appendChild(c2);
      }
    }
  }

  cacheDom() {
    this.dom = {
      // Screens / Modals
      landingModal: document.getElementById('modal-landing'),
      storyModal: document.getElementById('modal-story'),
      howToModal: document.getElementById('modal-how-to'),
      levelSelectModal: document.getElementById('modal-level-select'),
      levelIntroModal: document.getElementById('modal-level-intro'),
      pauseModal: document.getElementById('modal-pause'),
      settingsModal: document.getElementById('modal-settings'),
      levelCompleteModal: document.getElementById('modal-level-complete'),
      gameOverModal: document.getElementById('modal-game-over'),
      victoryModal: document.getElementById('modal-victory'),

      // HUD elements
      hudLevelText: document.getElementById('hud-level-text'),
      hudDiamonds: document.getElementById('hud-diamonds'),
      hudTimer: document.getElementById('hud-timer'),
      hudMoves: document.getElementById('hud-moves'),
      hudPar: document.getElementById('hud-par'),
      hudTurnBanner: document.getElementById('hud-turn-banner'),

      // Rules Left Panel
      rulesLevelTitle: document.getElementById('rules-level-title'),
      rulesMirrorDesc: document.getElementById('rules-mirror-desc'),
      rulesKeysDesc: document.getElementById('rules-keys-desc'),
      hazardList: document.getElementById('hazard-list'),

      // Right Panel Portraits & Hearts
      p1Hearts: document.getElementById('p1-hearts'),
      p2Hearts: document.getElementById('p2-hearts'),
      p1Portrait: document.getElementById('p1-portrait'),
      p2Portrait: document.getElementById('p2-portrait'),

      // Top Right Icons
      btnSettings: document.getElementById('btn-top-settings'),
      btnAudio: document.getElementById('btn-top-audio'),

      // Tutorial Speech Bubble
      speechBubble: document.getElementById('tutorial-speech-bubble'),
      speechText: document.getElementById('tutorial-speech-text'),
      speechBtnClose: document.getElementById('tutorial-speech-close'),

      // Sliders in Settings
      sliderMaster: document.getElementById('slider-master'),
      sliderMusic: document.getElementById('slider-music'),
      sliderSfx: document.getElementById('slider-sfx'),
      toggleMute: document.getElementById('toggle-mute'),
      toggleEffects: document.getElementById('toggle-effects'),
      toggleGrid: document.getElementById('toggle-grid'),

      // Level Complete Stats
      starsContainer: document.getElementById('complete-stars'),
      statMoves: document.getElementById('complete-moves'),
      statPar: document.getElementById('complete-par'),
      statTime: document.getElementById('complete-time'),
      statHearts: document.getElementById('complete-hearts'),

      // Level Select Grid
      levelSelectGrid: document.getElementById('level-nodes-container')
    };
  }

  bindEvents() {
    // Top Right icons
    this.dom.btnSettings?.addEventListener('click', () => {
      audio.playUiClick();
      this.openModal('settingsModal');
    });

    this.dom.btnAudio?.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      this.updateAudioIcons();
      audio.playUiClick();
    });

    // Right panel buttons
    document.getElementById('btn-panel-pause')?.addEventListener('click', () => {
      audio.playUiClick();
      this.game.togglePause();
    });

    document.getElementById('btn-panel-restart')?.addEventListener('click', () => {
      audio.playUiClick();
      this.game.restartLevel();
    });

    // Landing Buttons
    document.getElementById('btn-landing-start')?.addEventListener('click', () => {
      audio.ensureReady();
      audio.playUiClick();
      // Show story on first run, or level select
      if (!this.game.saveData.storySeen) {
        this.openStory();
      } else {
        this.openLevelSelect();
      }
    });

    document.getElementById('btn-landing-howto')?.addEventListener('click', () => {
      audio.ensureReady();
      audio.playUiClick();
      this.openModal('howToModal');
    });

    document.getElementById('btn-landing-levels')?.addEventListener('click', () => {
      audio.ensureReady();
      audio.playUiClick();
      this.openLevelSelect();
    });

    document.getElementById('btn-landing-settings')?.addEventListener('click', () => {
      audio.ensureReady();
      audio.playUiClick();
      this.openModal('settingsModal');
    });

    // Story buttons
    document.getElementById('btn-story-skip')?.addEventListener('click', () => {
      audio.playUiClick();
      this.game.saveData.storySeen = true;
      this.game.saveProgress();
      this.closeModal('storyModal');
      this.game.startLevel(1);
    });

    // How to Play back
    document.getElementById('btn-howto-close')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('howToModal');
    });

    // Level Select close
    document.getElementById('btn-levelselect-close')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('levelSelectModal');
    });

    // Level Intro start
    document.getElementById('btn-intro-start')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('levelIntroModal');
      this.game.resumeGameLoop();
    });

    // Pause menu buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      audio.playUiClick();
      this.game.togglePause();
    });

    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('pauseModal');
      this.game.restartLevel();
    });

    document.getElementById('btn-pause-levels')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('pauseModal');
      this.openLevelSelect();
    });

    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      audio.playUiClick();
      this.openModal('settingsModal');
    });

    // Settings Modal buttons & sliders
    document.getElementById('btn-settings-close')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('settingsModal');
    });

    this.dom.sliderMaster?.addEventListener('input', (e) => {
      audio.setMasterVolume(parseFloat(e.target.value));
      this.game.saveSettings();
    });

    this.dom.sliderMusic?.addEventListener('input', (e) => {
      audio.setMusicVolume(parseFloat(e.target.value));
      this.game.saveSettings();
    });

    this.dom.sliderSfx?.addEventListener('input', (e) => {
      audio.setSfxVolume(parseFloat(e.target.value));
      this.game.saveSettings();
    });

    this.dom.toggleMute?.addEventListener('change', (e) => {
      audio.isMuted = e.target.checked;
      audio.setMasterVolume(audio.masterVolume);
      this.updateAudioIcons();
      this.game.saveSettings();
    });

    this.dom.toggleEffects?.addEventListener('change', (e) => {
      this.game.renderer.enableEffects = e.target.checked;
      this.game.saveSettings();
    });

    this.dom.toggleGrid?.addEventListener('change', (e) => {
      this.game.renderer.showGrid = e.target.checked;
      this.game.saveSettings();
    });

    // Level Complete buttons
    document.getElementById('btn-complete-next')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('levelCompleteModal');
      if (this.game.currentLevelNum < 5) {
        this.game.startLevel(this.game.currentLevelNum + 1);
      } else {
        this.openFinalVictory();
      }
    });

    document.getElementById('btn-complete-select')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('levelCompleteModal');
      this.openLevelSelect();
    });

    // Game Over buttons
    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('gameOverModal');
      this.game.restartLevel();
    });

    document.getElementById('btn-gameover-select')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('gameOverModal');
      this.openLevelSelect();
    });

    // Final Victory button
    document.getElementById('btn-victory-restart')?.addEventListener('click', () => {
      audio.playUiClick();
      this.closeModal('victoryModal');
      this.openModal('landingModal');
    });

    // Speech bubble close
    this.dom.speechBtnClose?.addEventListener('click', () => {
      audio.playUiClick();
      this.hideTutorialBubble();
    });
  }

  openModal(modalKey) {
    if (this.dom[modalKey]) {
      this.dom[modalKey].classList.add('active');
    }
  }

  closeModal(modalKey) {
    if (this.dom[modalKey]) {
      this.dom[modalKey].classList.remove('active');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  updateAudioIcons() {
    if (this.dom.btnAudio) {
      this.dom.btnAudio.textContent = audio.isMuted ? '🔇' : '🌙';
    }
    if (this.dom.toggleMute) {
      this.dom.toggleMute.checked = audio.isMuted;
    }
  }

  // --- STORY SCREEN TYPEWRITER ---
  openStory() {
    this.closeAllModals();
    this.openModal('storyModal');
    const storyTextEl = document.getElementById('story-typewriter-text');
    if (!storyTextEl) return;

    storyTextEl.innerHTML = '';
    const tale = [
      "Two spirits, born from one twilight flame...",
      "Cursed to walk opposite roads, bound by mirror magic.",
      "Only together, through the garden's sundered halls,",
      "Can they unlock the sealed gates and return home."
    ];

    let lineIdx = 0;
    let charIdx = 0;

    const typeNext = () => {
      if (lineIdx >= tale.length) return;
      const curLine = tale[lineIdx];
      if (charIdx < curLine.length) {
        storyTextEl.innerHTML += curLine.charAt(charIdx);
        charIdx++;
        setTimeout(typeNext, 28);
      } else {
        storyTextEl.innerHTML += '<br><br>';
        lineIdx++;
        charIdx = 0;
        setTimeout(typeNext, 400);
      }
    };
    typeNext();
  }

  // --- LEVEL SELECT SCREEN ---
  openLevelSelect() {
    this.closeAllModals();
    this.openModal('levelSelectModal');
    this.renderLevelSelectGrid();
  }

  renderLevelSelectGrid() {
    const container = this.dom.levelSelectGrid;
    if (!container) return;
    container.innerHTML = '';

    const highestUnlocked = this.game.saveData.highestUnlocked || 1;

    CONFIG.LEVELS.forEach(lvl => {
      const isUnlocked = lvl.id <= highestUnlocked;
      const stats = this.game.saveData.levels[lvl.id] || { stars: 0, bestMoves: '--', bestTime: '--' };

      const node = document.createElement('div');
      node.className = `level-node ${isUnlocked ? 'unlocked' : 'locked'}`;

      node.innerHTML = `
        <div class="node-id">${isUnlocked ? lvl.id : '🔒'}</div>
        <div class="node-name">${lvl.title}</div>
        <div class="node-stars">
          ${'⭐'.repeat(stats.stars)}${'☆'.repeat(3 - stats.stars)}
        </div>
        <div class="node-best">
          Best: ${stats.bestMoves} moves | ${stats.bestTime}
        </div>
      `;

      if (isUnlocked) {
        node.addEventListener('click', () => {
          audio.playUiClick();
          this.closeModal('levelSelectModal');
          this.game.startLevel(lvl.id);
        });
      }

      container.appendChild(node);
    });
  }

  // --- LEVEL INTRO CARD TYPEWRITER ---
  showLevelIntroCard(levelDef, onStart) {
    this.closeAllModals();
    this.openModal('levelIntroModal');

    const titleEl = document.getElementById('intro-card-title');
    const twistEl = document.getElementById('intro-card-twist');
    const flavorEl = document.getElementById('intro-card-flavor');

    if (titleEl) titleEl.textContent = `LEVEL ${levelDef.id}: ${levelDef.title.toUpperCase()}`;
    if (flavorEl) flavorEl.textContent = levelDef.flavor;
    if (twistEl) {
      twistEl.textContent = '';
      let i = 0;
      const txt = levelDef.twist;
      const typeTwist = () => {
        if (i < txt.length) {
          twistEl.textContent += txt.charAt(i);
          i++;
          setTimeout(typeTwist, 24);
        }
      };
      typeTwist();
    }
  }

  // --- HUD & RULES REFRESH ---
  updateHud(gameState) {
    const { currentLevelNum, moveCount, timeElapsed, level, activeTurn } = gameState;

    // Level indicator
    if (this.dom.hudLevelText) {
      this.dom.hudLevelText.textContent = `✦ Level ${currentLevelNum} / 5`;
    }

    // Progress diamonds
    if (this.dom.hudDiamonds) {
      this.dom.hudDiamonds.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const d = document.createElement('span');
        d.className = `hud-diamond-pip ${i === currentLevelNum ? 'current' : (i < currentLevelNum ? 'completed' : 'future')}`;
        d.textContent = '◆';
        this.dom.hudDiamonds.appendChild(d);
      }
    }

    // Timer (VT323)
    if (this.dom.hudTimer) {
      const mins = Math.floor(timeElapsed / 60);
      const secs = Math.floor(timeElapsed % 60);
      this.dom.hudTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Moves and Par
    if (this.dom.hudMoves) {
      this.dom.hudMoves.textContent = `MOVES: ${moveCount}`;
    }
    if (this.dom.hudPar && level) {
      this.dom.hudPar.textContent = `PAR: ${level.par}`;
    }

    // Level 4 Turn Banner
    if (this.dom.hudTurnBanner) {
      if (currentLevelNum === 4) {
        this.dom.hudTurnBanner.style.display = 'block';
        if (activeTurn === 0) {
          this.dom.hudTurnBanner.className = 'turn-banner ember';
          this.dom.hudTurnBanner.textContent = "EMBER'S TURN (WASD / JOYSTICK)";
        } else {
          this.dom.hudTurnBanner.className = 'turn-banner tide';
          this.dom.hudTurnBanner.textContent = "TIDE'S TURN (DIRECTIONS INVERTED!)";
        }
      } else {
        this.dom.hudTurnBanner.style.display = 'none';
      }
    }

    // Update Hearts in Right Panel
    this.updateHearts(gameState.p1.hearts, gameState.p2.hearts);
  }

  updateHearts(p1Count, p2Count) {
    if (this.dom.p1Hearts) {
      this.dom.p1Hearts.innerHTML = '';
      for (let i = 0; i < CONFIG.MAX_HEARTS; i++) {
        const heart = document.createElement('span');
        heart.className = `heart-gem ${i < p1Count ? 'full p1' : 'empty'}`;
        heart.textContent = i < p1Count ? '♥' : '♡';
        this.dom.p1Hearts.appendChild(heart);
      }
    }
    if (this.dom.p2Hearts) {
      this.dom.p2Hearts.innerHTML = '';
      for (let i = 0; i < CONFIG.MAX_HEARTS; i++) {
        const heart = document.createElement('span');
        heart.className = `heart-gem ${i < p2Count ? 'full p2' : 'empty'}`;
        heart.textContent = i < p2Count ? '♥' : '♡';
        this.dom.p2Hearts.appendChild(heart);
      }
    }
  }

  updateRulesPanel(levelDef) {
    if (this.dom.rulesLevelTitle) {
      this.dom.rulesLevelTitle.textContent = `${levelDef.title.toUpperCase()}`;
    }
    if (this.dom.rulesMirrorDesc) {
      this.dom.rulesMirrorDesc.textContent = levelDef.twist;
    }
    if (this.dom.rulesKeysDesc) {
      if (levelDef.directions === 4) {
        this.dom.rulesKeysDesc.textContent = "CONTROLS: WASD or Arrow Keys. 1 joystick moves both spirits.";
      } else {
        this.dom.rulesKeysDesc.textContent = "CONTROLS: WASD + QEZC for diagonals, Numpad, or on-screen 8-way joystick.";
      }
    }

    // Populate Hazard Legend
    if (this.dom.hazardList) {
      this.dom.hazardList.innerHTML = '';
      Object.values(CONFIG.HAZARD_TYPES).forEach(hz => {
        const item = document.createElement('div');
        item.className = 'hazard-legend-item';
        item.innerHTML = `
          <div class="hazard-legend-icon" style="color: ${hz.color}">${hz.icon}</div>
          <div class="hazard-legend-info">
            <span class="hazard-name">${hz.name}</span>
            <span class="hazard-desc">${hz.desc}</span>
          </div>
        `;
        this.dom.hazardList.appendChild(item);
      });
    }
  }

  // --- TUTORIAL SPEECH BUBBLES ---
  showTutorialBubble(text) {
    if (!this.dom.speechBubble || !this.dom.speechText) return;
    this.dom.speechText.textContent = text;
    this.dom.speechBubble.classList.add('active');
  }

  hideTutorialBubble() {
    if (this.dom.speechBubble) {
      this.dom.speechBubble.classList.remove('active');
    }
  }

  // --- LEVEL COMPLETE MODAL WITH STAR FANFARE ---
  showLevelComplete(result) {
    this.closeAllModals();
    this.openModal('levelCompleteModal');

    const { moves, par, timeStr, heartsLeft, stars } = result;

    if (this.dom.statMoves) this.dom.statMoves.textContent = moves;
    if (this.dom.statPar) this.dom.statPar.textContent = par;
    if (this.dom.statTime) this.dom.statTime.textContent = timeStr;
    if (this.dom.statHearts) this.dom.statHearts.textContent = `${heartsLeft} / 5`;

    // Render stars with sequential pop
    if (this.dom.starsContainer) {
      this.dom.starsContainer.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const starEl = document.createElement('span');
        starEl.className = 'star-icon';
        starEl.textContent = '⭐';
        if (s <= stars) {
          setTimeout(() => {
            starEl.classList.add('popped');
            audio.playStarPop(s);
          }, 350 * s);
        } else {
          starEl.classList.add('dimmed');
          starEl.textContent = '☆';
        }
        this.dom.starsContainer.appendChild(starEl);
      }
    }

    audio.playLevelWin();
  }

  // --- GAME OVER MODAL ---
  showGameOver(reason = 'hearts') {
    this.closeAllModals();
    this.openModal('gameOverModal');

    const descEl = document.getElementById('gameover-reason');
    if (descEl) {
      if (reason === 'collision') {
        descEl.textContent = "COLLISION DISASTER: Ember and Tide occupied the same tile! The twin energies merged in a sundered shockwave.";
      } else {
        descEl.textContent = "HEARTS DEPLETED: A spirit fell to the enchanted hazards. The garden seals shut once more.";
      }
    }
    audio.playGameOver();
  }

  // --- FINAL VICTORY MODAL ---
  openFinalVictory() {
    this.closeAllModals();
    this.openModal('victoryModal');

    let totalStars = 0;
    let totalMoves = 0;
    Object.values(this.game.saveData.levels).forEach(l => {
      totalStars += l.stars || 0;
      if (typeof l.bestMoves === 'number') totalMoves += l.bestMoves;
    });

    const starsEl = document.getElementById('victory-total-stars');
    const movesEl = document.getElementById('victory-total-moves');
    if (starsEl) starsEl.textContent = `${totalStars} / 15`;
    if (movesEl) movesEl.textContent = `${totalMoves}`;

    audio.playLevelWin();
  }
}

export const ui = new UIManager();
