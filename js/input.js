// js/input.js - Keyboard, Arrow Chord Buffering & On-Screen 8-Way Joystick
import { CONFIG } from './config.js';

export const DIRECTIONS = {
  N:  { name: 'N',  dx:  0, dy: -1, angle: -Math.PI / 2 },
  NE: { name: 'NE', dx:  1, dy: -1, angle: -Math.PI / 4 },
  E:  { name: 'E',  dx:  1, dy:  0, angle: 0 },
  SE: { name: 'SE', dx:  1, dy:  1, angle: Math.PI / 4 },
  S:  { name: 'S',  dx:  0, dy:  1, angle: Math.PI / 2 },
  SW: { name: 'SW', dx: -1, dy:  1, angle: 3 * Math.PI / 4 },
  W:  { name: 'W',  dx: -1, dy:  0, angle: Math.PI },
  NW: { name: 'NW', dx: -1, dy: -1, angle: -3 * Math.PI / 4 }
};

export class InputManager {
  constructor() {
    this.onMoveCallback = null;
    this.onActionCallback = null;

    // Chord buffer for arrow keys
    this.pressedArrows = new Map(); // key -> timestamp
    this.chordTimer = null;

    // Input buffer for animation tweening
    this.bufferedDirection = null;
    this.bufferTimestamp = 0;

    // Joystick state
    this.joystickBase = null;
    this.joystickKnob = null;
    this.isDraggingJoystick = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickRadius = 45;
    this.selectedDirection = null;

    this.enabled = true;
  }

  init({ onMove, onAction }) {
    this.onMoveCallback = onMove;
    this.onActionCallback = onAction;

    this.setupKeyboard();
    this.setupJoystick();
    this.setupFocusLoss();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Prevent scrolling with arrows/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      // Actions
      if (code === 'KeyP' || code === 'Escape') {
        this.triggerAction('pause');
        return;
      }
      if (code === 'KeyR') {
        this.triggerAction('restart');
        return;
      }
      if (code === 'KeyM') {
        this.triggerAction('mute');
        return;
      }
      if (code === 'KeyH') {
        this.triggerAction('rules');
        return;
      }
      if (code === 'Enter' || code === 'Space') {
        this.triggerAction('confirm');
        return;
      }

      // Direct 8-way WASD / QEZC keys
      const directMap = {
        KeyW: DIRECTIONS.N,
        KeyS: DIRECTIONS.S,
        KeyA: DIRECTIONS.W,
        KeyD: DIRECTIONS.E,
        KeyQ: DIRECTIONS.NW,
        KeyE: DIRECTIONS.NE,
        KeyZ: DIRECTIONS.SW,
        KeyC: DIRECTIONS.SE,
        // Numpad
        Numpad8: DIRECTIONS.N,
        Numpad9: DIRECTIONS.NE,
        Numpad6: DIRECTIONS.E,
        Numpad3: DIRECTIONS.SE,
        Numpad2: DIRECTIONS.S,
        Numpad1: DIRECTIONS.SW,
        Numpad4: DIRECTIONS.W,
        Numpad7: DIRECTIONS.NW
      };

      if (directMap[code]) {
        if (e.repeat) return;
        this.handleMoveInput(directMap[code]);
        return;
      }

      // Arrow keys with chord window
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        if (!this.pressedArrows.has(code)) {
          this.pressedArrows.set(code, performance.now());
          this.processArrowChords();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;

      if (this.pressedArrows.has(code)) {
        this.pressedArrows.delete(code);
      }
    });
  }

  processArrowChords() {
    if (this.chordTimer) clearTimeout(this.chordTimer);

    // Wait 80ms chord window to detect diagonal simultaneous press
    this.chordTimer = setTimeout(() => {
      const up = this.pressedArrows.has('ArrowUp');
      const down = this.pressedArrows.has('ArrowDown');
      const left = this.pressedArrows.has('ArrowLeft');
      const right = this.pressedArrows.has('ArrowRight');

      let dir = null;
      if (up && right) dir = DIRECTIONS.NE;
      else if (up && left) dir = DIRECTIONS.NW;
      else if (down && right) dir = DIRECTIONS.SE;
      else if (down && left) dir = DIRECTIONS.SW;
      else if (up) dir = DIRECTIONS.N;
      else if (down) dir = DIRECTIONS.S;
      else if (left) dir = DIRECTIONS.W;
      else if (right) dir = DIRECTIONS.E;

      if (dir) {
        this.handleMoveInput(dir);
      }
    }, CONFIG.CHORD_BUFFER_TIME);
  }

  handleMoveInput(dir) {
    if (!this.enabled || !dir) return;

    if (this.onMoveCallback) {
      const accepted = this.onMoveCallback(dir);
      if (!accepted) {
        // Buffer move if currently animating
        this.bufferedDirection = dir;
        this.bufferTimestamp = performance.now();
      } else {
        this.bufferedDirection = null;
      }
    }
  }

  checkBufferedInput() {
    if (this.bufferedDirection && (performance.now() - this.bufferTimestamp <= CONFIG.INPUT_BUFFER_TIME)) {
      const dir = this.bufferedDirection;
      this.bufferedDirection = null;
      if (this.onMoveCallback) {
        this.onMoveCallback(dir);
      }
    } else {
      this.bufferedDirection = null;
    }
  }

  triggerAction(action) {
    if (this.onActionCallback) {
      this.onActionCallback(action);
    }
  }

  setupJoystick() {
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');
    if (!this.joystickBase || !this.joystickKnob) return;

    const onPointerDown = (e) => {
      this.isDraggingJoystick = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.updateJoystickPosition(e.clientX, e.clientY);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isDraggingJoystick) return;
      this.updateJoystickPosition(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      if (!this.isDraggingJoystick) return;
      this.isDraggingJoystick = false;

      // Release fires the move!
      if (this.selectedDirection) {
        this.handleMoveInput(this.selectedDirection);
      }

      // Reset knob to center
      this.joystickKnob.style.transform = 'translate(-50%, -50%)';
      this.selectedDirection = null;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    this.joystickBase.addEventListener('pointerdown', onPointerDown);

    // Also support clicking directional notches directly
    const notches = document.querySelectorAll('.joystick-notch');
    notches.forEach(notch => {
      notch.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      notch.addEventListener('click', (e) => {
        e.stopPropagation();
        const dirName = notch.dataset.dir;
        if (DIRECTIONS[dirName]) {
          this.handleMoveInput(DIRECTIONS[dirName]);
        }
      });
    });
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      this.selectedDirection = null;
      this.joystickKnob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
      return;
    }

    const angle = Math.atan2(dy, dx);
    // Snap to closest of 8 directions (PI/4 steps)
    const octant = Math.round(angle / (Math.PI / 4));
    const snappedAngle = octant * (Math.PI / 4);

    const maxDist = Math.min(dist, this.joystickRadius);
    const knobX = Math.cos(snappedAngle) * maxDist;
    const knobY = Math.sin(snappedAngle) * maxDist;

    this.joystickKnob.style.transform = `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`;

    // Find matching direction
    const dirMap = {
      0: DIRECTIONS.E,
      1: DIRECTIONS.SE,
      2: DIRECTIONS.S,
      3: DIRECTIONS.SW,
      4: DIRECTIONS.W,
      '-4': DIRECTIONS.W,
      '-3': DIRECTIONS.NW,
      '-2': DIRECTIONS.N,
      '-1': DIRECTIONS.NE
    };

    this.selectedDirection = dirMap[octant] || null;
  }

  setupFocusLoss() {
    window.addEventListener('blur', () => {
      this.triggerAction('pause_focus_lost');
    });
  }
}

export const input = new InputManager();
