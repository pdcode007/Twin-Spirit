// js/config.js - Game Configuration & Tunable Parameters

export const CONFIG = {
  // Grid and Board
  GRID_WIDTH: 15,
  GRID_HEIGHT: 15,
  BASE_TILE_SIZE: 16,

  // Player Stats
  MAX_HEARTS: 5,

  // Movement & Input Timing
  TILE_MOVE_DURATION: 120,    // 120ms tweened tile hop
  CHORD_BUFFER_TIME: 80,      // 80ms chord window for arrow diagonals
  INPUT_BUFFER_TIME: 60,      // 60ms input buffer during animations

  // Level Specific Mechanics
  INVERT_ON_P2_TURN: true,    // Level 4: invert direction on Tide's turn

  // Level Definitions & Target Par Ranges
  LEVELS: [
    {
      id: 1,
      title: "The Garden Gate",
      subtitle: "Opposite paths. One goal.",
      flavor: "Two spirits, born from one twilight flame. Walk in harmony, though your steps mirror across the garden.",
      twist: "UP and DOWN are mirrored. LEFT and RIGHT move together.",
      theme: "garden",
      directions: 4,
      seed: 103,
      parRange: [14, 24],
      hazardCount: 4,
      wallStyle: "hedge",
      showTutorial: true
    },
    {
      id: 2,
      title: "Looking-Glass Hedge",
      subtitle: "Through the Mirror Realm",
      flavor: "The reflections deepen. Every axis is inverted in the twilight looking glass.",
      twist: "BOTH axes are mirrored. Up is Down, Left is Right.",
      theme: "garden",
      directions: 4,
      seed: 100,
      parRange: [24, 40],
      hazardCount: 6,
      wallStyle: "hedge",
      showTutorial: false
    },
    {
      id: 3,
      title: "Compass Rose",
      subtitle: "The Eight-Wind Court",
      flavor: "Ancient winds blow through the castle courtyards. Eight paths open, bound in point-reflection.",
      twist: "8 directions enabled. Full point-reflection: every step pushes your twin in the exact opposite direction.",
      theme: "castle",
      directions: 8,
      seed: 127,
      parRange: [30, 50],
      hazardCount: 7,
      wallStyle: "stone",
      showTutorial: false
    },
    {
      id: 4,
      title: "Turn by Turn",
      subtitle: "The Cadence of Solitude",
      flavor: "The spirits can no longer move as one. You must take turns stepping through the ruins.",
      twist: "Automatic switching: only one spirit moves at a time. Tide's directions are inverted!",
      theme: "castle",
      directions: 8,
      seed: 100,
      parRange: [36, 56],
      hazardCount: 8,
      wallStyle: "stone",
      showTutorial: false
    },
    {
      id: 5,
      title: "The Sundered Keep",
      subtitle: "Beyond the Great Divide",
      flavor: "A monolithic barrier splits the keep. Hidden trap doors and colorless gates guard freedom.",
      twist: "Divided keep. Hidden trap doors teleport between chambers. Colorless gates reveal on touch. Avoid collision!",
      theme: "dungeon",
      directions: 8,
      seed: 110,
      parRange: [50, 80],
      hazardCount: 9,
      wallStyle: "dungeon",
      showTutorial: false
    }
  ],

  // Palette (CSS / Canvas Hex Codes)
  PALETTE: {
    midnight: '#0b0a1f',
    indigo: '#1a1642',
    violet: '#5b3fd1',
    lilac: '#b794ff',
    moonGold: '#ffd479',
    teal: '#2ee6c5',
    hedgeDark: '#14522a',
    hedge: '#2f9e55',
    hedgeLight: '#5fd47e',
    stone: '#4a4a6a',
    stoneDark: '#2b2b45',
    stoneLight: '#78789e',
    spiritRed: '#e63946',
    spiritBlue: '#3a86ff',
    fire: '#ff8a2b',
    water: '#35c9ff',
    electric: '#fff06a',
    white: '#ffffff',
    textMain: '#cfc6f0',
    titleColor: '#efe6ff'
  },

  // Hazard Types
  HAZARD_TYPES: {
    FIRE: {
      id: 'fire',
      name: 'Flame Pillar',
      color: '#ff8a2b',
      icon: '🔥',
      desc: 'Spits columns of dancing flame. Deals 1 heart.'
    },
    WATER: {
      id: 'water',
      name: 'Bubbling Pool',
      color: '#35c9ff',
      icon: '💧',
      desc: 'Deep bubbling currents. Extinguishes spirit flame (1 heart).'
    },
    ELECTRIC: {
      id: 'electric',
      name: 'Crackling Orb',
      color: '#fff06a',
      icon: '⚡',
      desc: 'Crackling magical discharge. Shocks for 1 heart.'
    },
    ARROW: {
      id: 'arrow',
      name: 'Arrow Trap',
      color: '#ffd479',
      icon: '🏹',
      desc: 'Tripwire wall trap. Shoots a high-velocity bolt upon entry (1 heart).'
    }
  },

  // Audio Settings Defaults
  AUDIO: {
    masterVolume: 0.8,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    muted: false
  },

  // Storage Keys
  STORAGE_KEY_SAVE: 'twin_spirits_save_v1',
  STORAGE_KEY_SETTINGS: 'twin_spirits_settings_v1'
};
