# TWIN SPIRITS
> *"Opposite paths. One goal."*

A dark, moonlit enchanted garden-castle puzzle game in authentic pixel art. Guide two twin spirits—**Ember** (the crimson witch) and **Tide** (the blue hooded mage)—through mirrored chambers, lethal hazards, and ancient trials. Built with vanilla HTML, CSS, and JavaScript for Pixathon.

---

## 🌟 Quick Start

Run as a static site using Python or any static web server:

```bash
# Option 1: Python HTTP server
python -m http.server 8000

# Then open in your browser:
# http://localhost:8000
```

Or open `index.html` directly in any modern desktop browser.

---

## 🎮 Controls

The game is designed for laptop and desktop keyboards, touchscreens, and mouse input:

| Action | Primary Keys | Diagonals | Numpad |
| :--- | :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys | `Q` (NW), `E` (NE), `Z` (SW), `C` (SE) | `8` (N), `9` (NE), `6` (E), `3` (SE), `2` (S), `1` (SW), `4` (W), `7` (NW) |
| **Arrow Chords** | Pressing two arrow keys within 80ms registers a diagonal move (e.g. `↑` + `→` = NE) | — | — |
| **On-Screen Joystick** | Drag and release the glowing gem knob to fire an 8-way step, or click the outer stone notches directly |
| **Pause / Resume** | `P` or `Escape` |
| **Restart Level** | `R` |
| **Mute Audio** | `M` (or click the moon / speaker icon top-right) |
| **Confirm / Start** | `Enter` or `Space` |

- **One step per press**: Each key press moves one tile; release and press again to move farther.
- **Input buffer**: 60ms buffer ensures quick inputs during tween hops are never dropped.
- **Auto-pause**: Pauses automatically when the game window loses focus.

---

## 📜 Game Mechanics & Levels

### Core Rules
- **15x15 Maze Board**: Both spirits begin on the central plaza adjacent to one another.
- **Linked Movement**: One control input moves **both** spirits according to the level's mirror law.
- **Wall Blocks & Desynchronization**: If one spirit hits a wall or closed gate, it remains still while its twin continues moving. Use walls to desync your positions!
- **Hearts & Hazards**: Each spirit has 5 hearts. Stepping into a hazard costs that spirit exactly 1 heart with screen shake and shattered heart particles. If either spirit reaches 0 hearts, it is Game Over.
- **Victory**: Ember must stand in the Red Gate and Tide in the Blue Gate simultaneously.
- **Star Ratings**:
  - ⭐⭐⭐ (3 Stars): Completed within Par + 20% moves with no hearts lost (5/5).
  - ⭐⭐ (2 Stars): Completed within Par + 50% moves.
  - ⭐ (1 Star): Completed level.

---

### Level Specifications

1. **Level 1: The Garden Gate**
   - *Mirror Law*: UP / DOWN are mirrored (Ember walks North, Tide walks South). LEFT / RIGHT move together.
   - *Hazards*: Introduces Flame Pillars (🔥), Bubbling Pools (💧), Electric Orbs (⚡), and Arrow Traps (🏹).
   - *Features*: Gentle loops, interactive speech bubble tutorial.

2. **Level 2: Looking-Glass Hedge**
   - *Mirror Law*: BOTH axes are mirrored (Up is Down, Left is Right).
   - *Features*: Narrower hedge corridors, fewer loops, dead ends requiring careful desync.

3. **Level 3: Compass Rose**
   - *Mirror Law*: 8 directions enabled with full point-reflection (every vector is inverted for Tide).
   - *Diagonal Rule*: Allowed only if the target tile is free and the two orthogonal tiles it passes between are not both walls (no squeezing through closed corners).
   - *Features*: Courtyards with wider diagonal chambers.

4. **Level 4: Turn by Turn**
   - *Mirror Law*: Automatic switching! Only ONE spirit moves per input, then control immediately hands over to the other spirit.
   - *Inversion*: On Tide's turn, input directions are inverted (`INVERT_ON_P2_TURN = true`).
   - *Visuals*: Active spirit has a bright glowing floor ring, bobbing golden turn arrow, and an active turn banner with switch chime.

5. **Level 5: The Sundered Keep**
   - *Castle Dungeon Theme*: Ancient stone walls, heavy middle stone divider splitting the keep into upper and lower chambers.
   - *Hidden Trap Doors*: Faint stone cracks that reveal permanently on entry (wooden creak SFX) and teleport that spirit across the divide. Magical shimmer sparkles appear on the floor when within 2 tiles as a hint.
   - *Colorless Gates*: Grey stone gates with dim runes until stepped upon. Stepping reveals the gate's true color and its twin by deduction. Entering the wrong gate inflicts 1 heart damage and pushes the spirit back.
   - *Collision Shockwave*: If Ember and Tide ever occupy the same tile or swap tiles, an instant Game Over is triggered with a deep boom and expanding white-purple shockwave.

---

## 🎨 Visuals & Art

- **Twilight Aesthetic**: Dark navy, midnight purple, moon gold, and glowing teal palette.
- **Stepped Pixel Borders**: Ornate UI panels with gold corner ornaments and inner glow.
- **Atmospheric Scenery**: Crescent moon, castle silhouettes, glowing lanterns with additive radial lighting (`globalCompositeOperation = 'lighter'`), animated black pixel cat (blinking & tail swishing) on a stone ledge bottom-left, stone bridge and lantern-lit river bottom-right.
- **Particles**: Wandering fireflies in gentle sine curves, falling leaves, heart pixel shards, and victory confetti.
- **Zero-Asset Procedural Fallback**: Built-in procedural pixel art generator ensures the game renders completely even without external image files. Spritesheet maps are fully documented in `js/assets.js`.

---

## 🔊 Sound Design (Web Audio API)

All audio is procedurally synthesized in real-time with zero audio files:
- **SFX**: Footstep ticks, wall thuds, fire crackles, water splashes, electric zaps, arrow whooshes, heart losses, heart shatters, game over arpeggios, trap door creaks, gate reveals, rising gate chords, turn chimes, collision boom & crash, level fanfare, and star dings.
- **Ambient Soundtrack**: Continuous atmospheric pad chords in D minor/A minor twilight progression with gentle arpeggio melodies.
- **Volume Sliders**: Master, Music, and SFX controls with persistence in `localStorage`.

---

## 🔬 Level Verification

To verify that all 5 levels are guaranteed solvable with zero hazard hits, valid par, and at least 3 desynchronizations:

Open the browser developer console (F12) and run:

```javascript
window.__verifyLevels()
```

This verifies the BFS joint-state solver on all 5 levels and prints `PASS` for each seed.
