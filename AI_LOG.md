# AI_LOG.md

## Tools
- Antigravity
- Claude

## Project
**Game:** Twin Spirits  
**Tagline:** “Opposite paths. One goal.”  
**Type:** Mystical, enchanted, pixel-art maze puzzle game featuring two characters.

## Key Prompt

Build a complete browser game called **TWIN SPIRITS** using plain HTML, CSS, and vanilla JavaScript ES modules. It must run as a static site with no frameworks, build step, backend, npm dependencies, or required external assets.

### Stack and files
- `index.html`
- `css/style.css`
- `js/main.js`
- `js/game.js`
- `js/levels.js`
- `js/solver.js`
- `js/renderer.js`
- `js/input.js`
- `js/audio.js`
- `js/ui.js`
- `js/assets.js`
- `js/config.js`
- `assets/`

Use a canvas for the maze and HTML/CSS for the HUD and panels. Design for 1920×1080 and scale cleanly to 1280×720. Persist progress, best times, stars, and settings in `localStorage`. Keep tunable values in `js/config.js` and comment the code clearly.

### Visual direction
Create a dark, moonlit enchanted garden-castle at twilight in pixel art. Include:
- An ornate title plaque in the top-left.
- A “THE RULES” panel on the left.
- A large framed maze in the centre, with a HUD above it showing level, timer, progress, moves, and par.
- A right panel with portraits of both spirits, heart rows, PAUSE and RESTART buttons, and an eight-way joystick.
- Hanging lanterns, drifting fireflies, vines, leaves, a black pixel cat on a stone ledge, a lantern-lit river and stone bridge, crescent moon, and distant castle spires.
- Settings gear and sound icon in the top-right.
- Dark navy panels with stepped pixel borders, gold corner ornaments, inner glow, and subtle grid texture.

Use the palette:
- Midnight `#0b0a1f`
- Indigo `#1a1642`
- Violet `#5b3fd1`
- Lilac `#b794ff`
- Moon gold `#ffd479`
- Teal `#2ee6c5`
- Hedge dark `#14522a`
- Hedge `#2f9e55`
- Hedge light `#5fd47e`
- Stone `#4a4a6a`
- Stone dark `#2b2b45`
- Spirit red `#e63946`
- Spirit blue `#3a86ff`
- Fire `#ff8a2b`
- Water `#35c9ff`
- Electric `#fff06a`

Typography:
- Pixelify Sans 700 for titles and level names, with stepped purple shadows and a faint gold outline.
- Silkscreen for labels, buttons, headings, and uppercase small caps.
- VT323 for timers and counters.
- Pixelify Sans 400 for body text, 16–18px with 1.5 line-height.
- Keep the pixel-art look crisp with pixelated rendering and reduced font smoothing.

### Characters
Create cute chibi pixel-art characters with four-direction sprites and four-frame walk cycles:
- **P1 — Ember:** tiny witch, pointed hat, crimson/red cloak, lilac hair, glowing red aura.
- **P2 — Tide:** hooded little mage, blue cloak, teal-glowing eyes, glowing blue aura.

Add idle bobbing, walking, hurt flash, death/poof, victory dance, squash-and-stretch, and short fading sparkle trails.

### Effects and lighting
Add flickering lantern pools, additive glow, vignette, bloom, parallax sky/stars/castle/fog, fireflies, magic dust, falling leaves, twinkling stars, screen shake on damage, shattering-heart particles, pulsing gates, animated hazards, UI hover/press bounce, and pixel-dissolve transitions. Respect `prefers-reduced-motion` and provide an effects toggle.

### Game board and movement
- Use one shared **15×15 tile maze** with walls and floors.
- Both spirits start on adjacent tiles in a central open 3×3 plaza.
- Levels 1–4 have a red gate at the top and blue gate at the bottom. Each spirit must exit through its matching gate; the wrong gate is sealed.
- One joystick controls both spirits. Each input attempts to move one tile according to that level’s mirror rule.
- If one spirit is blocked by a wall, it stays still while the other may still move. If both are blocked, the move does not count.
- A blocked move by one spirit while the other moves is a “desync” and should be considered by level verification.

### Hearts and hazards
Each spirit starts with five hearts. Entering a hazard tile costs that spirit exactly one heart, with hurt animation, screen shake, heart-shatter effect, and sound. If either spirit reaches zero hearts, show GAME OVER and allow the level to restart.

Include at least four hazard types per level:
- FIRE — flame pillar
- WATER — bubbling pool
- ELECTRIC — crackling orb
- ARROW TRAP — wall-mounted shooter that fires an arrow when triggered

Level hazard counts: L1 4–5, L2 6, L3 7, L4 8, L5 9. Level 1 introduces every hazard type with short tutorial speech bubbles. Place hazards on tempting shortcuts and decoy branches.

### Winning and scoring
When both spirits reach their correct gates, play a victory animation and show a level-complete screen with moves, time, remaining hearts, par, and a one-to-three-star rating:
- Three stars: moves ≤ par + 20% and no hearts lost.
- Two stars: moves ≤ par + 50%.
- Otherwise: one star.

Track moves, timer, and par, with par computed by the solver.

### Level specifications

#### Level 1 — The Garden Gate
- Tutorial level with a gentle hedge maze and many loops.
- UP/DOWN are mirrored: P1 moves north while P2 moves south when UP is pressed.
- LEFT/RIGHT move both spirits in the same direction.
- Introduce both spirits, the shared joystick, gates, hearts, and all hazard types.

#### Level 2 — Looking-Glass Hedge
- Both axes are mirrored: LEFT makes P1 go west and P2 east; UP makes P1 go north and P2 south.
- Four-direction movement.
- Trickier, narrower maze with fewer loops and more dead ends.

#### Level 3 — Compass Rose
- Eight directions: N, NE, E, SE, S, SW, W, NW.
- Full point-reflection: P2 moves in the exact opposite direction to P1.
- Diagonal movement is allowed only if the destination is free and the two orthogonal tiles between them are not both walls.
- Use wider chambers so diagonal movement matters.

#### Level 4 — Turn by Turn
- Eight-direction movement, but only one spirit moves per input.
- Switch the active spirit after every successful move; blocked moves do not switch turns.
- Show the active spirit with a glowing ring, arrow, and “P1’s turn / P2’s turn” banner.
- On P2’s turn, invert the input direction. Put this in a constant named `INVERT_ON_P2_TURN = true`.
- Use a medium-hard maze with hazards that require planning around alternating turns.

#### Level 5 — The Sundered Keep
- Castle dungeon theme with stone walls, torches, and runes.
- A solid stone divider runs across the middle row, splitting the board into upper and lower chambers.
- P1 and P2 start in different chambers and use Level 3’s full point-reflection rule.
- Each spirit’s gate is in the other spirit’s chamber. Each chamber has one hidden trapdoor that teleports a spirit to a landing tile in the other chamber.
- Trapdoors look like normal floor tiles, are permanently revealed when stepped on, and produce a creak and glow. Sparkles hint when a spirit is within two tiles.
- Gates begin colourless. On entry, reveal the gate’s colour. A matching spirit exits; a non-matching spirit loses one heart, is pushed back one tile, and reveals the other gate’s colour by deduction.
- Use sun and moon runes as colour-blind support.
- Randomize the red/blue gate assignment with a seed for each attempt.
- If the spirits occupy the same tile or swap tiles in one move, trigger instant GAME OVER with a white-purple shockwave and restart the level with full hearts.

### Maze generation and solver
- Use a seeded random generator with a fixed seed per level so layouts are repeatable.
- Generate mazes using recursive backtracking on odd-coordinate cells, remove 8–14% of interior walls to create loops, carve the central 3×3 plaza, open the top and bottom gates, add decorations, and place hazards on non-critical tiles.
- Use denser corridors for Levels 2 and 3, and wider chambers for Levels 3 and 5.
- Implement `js/solver.js` with BFS over the joint state of both spirits, including Level 4 turn order and Level 5 trapdoor/gate-colour state.
- The solver must use the exact same movement rules as the game, avoid Level 5 collisions, and find the shortest hazard-free solution.
- Accept a level only if it is solvable with zero hazard hits, meets the target par range, and at least three optimal moves contain a desync:
  - L1 par: 14–24
  - L2 par: 24–40
  - L3 par: 30–50
  - L4 par: 36–56
  - L5 par: 50–80
- Level 5 must be solvable under both gate-colour assignments.
- If a seed fails, increment it and retry automatically, up to 500 attempts, then store the accepted seed.
- Expose `window.__verifyLevels()` in the console to print each level’s seed, par, and PASS/FAIL. Run verification on boot in development mode and do not ship unsolvable levels.

### Controls
- WASD: N/W/S/E.
- Q, E, Z, C: NW, NE, SW, SE.
- Arrow keys: four straight directions. Two arrows pressed within 80ms register a diagonal.
- Numpad: 8=N, 9=NE, 6=E, 3=SE, 2=S, 1=SW, 4=W, 7=NW.
- On-screen joystick: stone base with eight notches and a glowing gem knob; drag to snap to the nearest direction and release to move. It must also be clickable.
- P or Esc: pause.
- R: restart level.
- M: mute.
- H: show rules.
- Enter/Space: confirm menu.
- One key press must equal exactly one tile move. Holding a key repeats every 180ms.
- Add a 60ms input buffer so presses during animations are not lost.
- Automatically pause when the window loses focus.

### Screens and flow
1. **Landing page:** moonlit castle-garden parallax, both spirits, title, tagline, blinking PRESS START, HOW TO PLAY, LEVELS, SETTINGS, and credits. Start ambient music after the first user gesture.
2. **Story page:** three or four typewriter-revealed lines about two spirits born from one flame and cursed to walk opposite roads. Include SKIP.
3. **How to Play:** mini demos of mirror rules, hazards, hearts, controls, and gate colours.
4. **Level Select:** five stone nodes connected by a glowing path; locked levels show padlocks, completed levels show stars, best time, and fewest moves.
5. **Level Intro:** title, one-line explanation of the new mechanic, and START button.
6. **Game screen:** maze, dynamic rules panel, HUD, hearts, controls, joystick, PAUSE and RESTART, plus the quote “Not all who wander are lost... some are just solving puzzles.”
7. **Pause menu, settings, level complete, game over, and final victory:** include retry/level-select options, a credits roll, star confetti, and total stats.
8. Show Level 1 tutorial hints once.

### Audio
Use the Web Audio API only; no audio files. Create the master AudioContext on the first user gesture. Synthesize:
- Footsteps, wall bump, fire crackle, water splash, electric zap, arrow whoosh/thunk.
- Heart loss and shatter, game-over arpeggio, trapdoor creak, gate reveal and open, turn-switch chime, collision boom/crash, level-win fanfare, star pops, UI hover/click sounds.
- Looping ambient castle music with dreamy pads, gentle arpeggio, wind, and cricket noise.

Separate music and SFX gain nodes. Persist their volumes and settings. Support M-key mute and a speaker icon.

### Assets and fallback art
Create an `assets/` folder with documented filenames such as `spirits.png`, `tiles.png`, `hazards.png`, `gates.png`, `ui.png`, `fx.png`, and `bg_*.png`, plus an asset loader in `js/assets.js`. If assets are missing, generate procedural pixel art from in-code pixel arrays so the game always runs. Include a clearly labelled spritesheet map describing frame size, rows, and columns to make art replacement easy.

### Acceptance checklist
Before finishing, test that:
- All five levels load and can be completed; `__verifyLevels()` reports PASS for every level.
- All mirror rules work exactly as specified, including blocked movement and desyncs.
- Hearts, hazards, game over, and restart work.
- Level 5 collision detection and gate-colour reveal work for both assignments.
- Level 4 switches turns correctly and always displays the active spirit.
- Keyboard controls, arrow chords, numpad, and joystick all produce the same eight directions.
- There are no console errors, the game targets a steady 60 FPS, and layouts remain readable at 1280×720 and 1920×1080.
- The game works with missing sprite assets using fallback art.

Build the game in one pass, run it, test it, and fix issues before presenting it.

## When AI Got It Wrong
Initially, the characters kept moving until they hit a wall. We changed the movement system so **each input moves a character exactly one tile/block at a time**. A blocked character stays still while the other character may still move, according to the level’s rules.

## Notes for the Team
- Keep this file updated with the tools used, key prompts, and important corrections made during development.
- Treat the game rules and acceptance checklist as requirements, not optional suggestions.
