// js/levels.js - Seeded Maze Generator & Level Builder
import { CONFIG } from './config.js';
import { solveLevel } from './solver.js';

export class PRNG {
  constructor(seed) {
    this.s = (seed >>> 0) || 123456789;
  }
  next() {
    this.s = (this.s ^ (this.s << 13)) >>> 0;
    this.s = (this.s ^ (this.s >>> 17)) >>> 0;
    this.s = (this.s ^ (this.s << 5)) >>> 0;
    return (this.s >>> 0) / 4294967296;
  }
  range(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

const DIRS_4 = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
];

export function generateRawMaze(levelNum, seed) {
  const rng = new PRNG(seed);
  const width = CONFIG.GRID_WIDTH;
  const height = CONFIG.GRID_HEIGHT;
  const grid = Array.from({ length: height }, () => Array(width).fill(1));

  if (levelNum === 5) {
    // Sundered Keep: Upper chamber (1..5), Lower chamber (9..13), Row 7 is thick stone divider
    function carveChamber(yStart, yEnd, startX, startY) {
      const visited = Array.from({ length: height }, () => Array(width).fill(false));
      const stack = [];
      grid[startY][startX] = 0;
      visited[startY][startX] = true;
      stack.push([startX, startY]);

      while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];
        for (const d of DIRS_4) {
          const nx = cx + d.dx * 2;
          const ny = cy + d.dy * 2;
          if (nx >= 1 && nx < width - 1 && ny >= yStart && ny <= yEnd && !visited[ny][nx]) {
            neighbors.push({ nx, ny, wallX: cx + d.dx, wallY: cy + d.dy });
          }
        }
        if (neighbors.length > 0) {
          const chosen = neighbors[Math.floor(rng.next() * neighbors.length)];
          grid[chosen.wallY][chosen.wallX] = 0;
          grid[chosen.ny][chosen.nx] = 0;
          visited[chosen.ny][chosen.nx] = true;
          stack.push([chosen.nx, chosen.ny]);
        } else {
          stack.pop();
        }
      }

      // Knock out very few walls (only ~3%) for maximum wall density and intricate paths
      for (let y = yStart; y <= yEnd; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (grid[y][x] === 1 && rng.next() < 0.03) {
            if ((grid[y - 1]?.[x] === 0 && grid[y + 1]?.[x] === 0) ||
                (grid[y]?.[x - 1] === 0 && grid[y]?.[x + 1] === 0)) {
              grid[y][x] = 0;
            }
          }
        }
      }
    }

    carveChamber(1, 5, 1, 5);
    carveChamber(9, 13, 13, 9);

    // Row 7 divider wall
    for (let x = 0; x < width; x++) grid[7][x] = 1;
    // Rows 6 and 8 walls with specific connectors
    for (let x = 0; x < width; x++) {
      grid[6][x] = 1;
      grid[8][x] = 1;
    }
    grid[6][1] = 0; grid[5][1] = 0;
    grid[8][13] = 0; grid[9][13] = 0;

    // Gates
    grid[0][7] = 0; grid[1][7] = 0;
    grid[14][7] = 0; grid[13][7] = 0;

    // Start positions: P1 in upper chamber, P2 in lower chamber
    const startP1 = { x: 1, y: 5 };
    const startP2 = { x: 13, y: 9 };
    grid[startP1.y][startP1.x] = 0;
    grid[startP2.y][startP2.x] = 0;

    // Trapdoors
    const trapUpper = { x: 13, y: 1, landingX: 1, landingY: 9 };
    const trapLower = { x: 1, y: 13, landingX: 13, landingY: 5 };
    grid[trapUpper.y][trapUpper.x] = 0;
    grid[trapUpper.landingY][trapUpper.landingX] = 0;
    grid[trapLower.y][trapLower.x] = 0;
    grid[trapLower.landingY][trapLower.landingX] = 0;

    // Add corridor lanterns & decorative floor compasses
    const decor = generateDecor(grid, width, height, [startP1, startP2], rng);

    return {
      width,
      height,
      grid,
      startP1,
      startP2,
      gateTop: { x: 7, y: 0 },
      gateBottom: { x: 7, y: 14 },
      trapUpper,
      trapLower,
      hazards: [],
      decor
    };
  } else {
    // Levels 1 to 4: Dense recursive backtracker with complex walls
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const stack = [];
    grid[7][7] = 0;
    visited[7][7] = true;
    stack.push([7, 7]);

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors = [];
      for (const d of DIRS_4) {
        const nx = cx + d.dx * 2;
        const ny = cy + d.dy * 2;
        if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1 && !visited[ny][nx]) {
          neighbors.push({ nx, ny, wallX: cx + d.dx, wallY: cy + d.dy });
        }
      }
      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(rng.next() * neighbors.length)];
        grid[chosen.wallY][chosen.wallX] = 0;
        grid[chosen.ny][chosen.nx] = 0;
        visited[chosen.ny][chosen.nx] = true;
        stack.push([chosen.nx, chosen.ny]);
      } else {
        stack.pop();
      }
    }

    // Only knock out 4-8% of interior walls for high wall density and winding corridors
    const loopRate = levelNum === 1 ? 0.08 : 0.04;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 1 && rng.next() < loopRate) {
          if ((grid[y - 1][x] === 0 && grid[y + 1][x] === 0) ||
              (grid[y][x - 1] === 0 && grid[y][x + 1] === 0)) {
            grid[y][x] = 0;
          }
        }
      }
    }

    // Connect starting positions cleanly without hollowing out an empty 3x3 square
    grid[7][7] = 0;
    if (levelNum === 1) {
      grid[6][7] = 0;
      grid[8][7] = 0;
    } else {
      grid[6][6] = 0;
      grid[7][6] = 0;
      grid[8][8] = 0;
      grid[7][8] = 0;
    }

    // Top and bottom gate openings
    grid[0][7] = 0; grid[1][7] = 0;
    grid[14][7] = 0; grid[13][7] = 0;

    // Start positions
    const startP1 = levelNum === 1 ? { x: 7, y: 6 } : { x: 6, y: 6 };
    const startP2 = levelNum === 1 ? { x: 7, y: 8 } : { x: 8, y: 8 };

    // Corridor lanterns and floor compass runes
    const decor = generateDecor(grid, width, height, [startP1, startP2], rng);

    return {
      width,
      height,
      grid,
      startP1,
      startP2,
      gateTop: { x: 7, y: 0 },
      gateBottom: { x: 7, y: 14 },
      trapUpper: null,
      trapLower: null,
      hazards: [],
      decor
    };
  }
}

function generateDecor(grid, width, height, protectedPoints, rng) {
  const protectedSet = new Set(protectedPoints.map(p => `${p.x},${p.y}`));
  protectedSet.add('7,0');
  protectedSet.add('7,1');
  protectedSet.add('7,14');
  protectedSet.add('7,13');

  const floorCandidates = [];
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] === 0 && !protectedSet.has(`${x},${y}`)) {
        floorCandidates.push({ x, y });
      }
    }
  }

  rng.shuffle(floorCandidates);

  // Pick 4-6 corridor lanterns and 2 golden compass runes
  const lanterns = [];
  const runes = [];

  for (const c of floorCandidates) {
    if (lanterns.length < 5) {
      // Check distance from existing lanterns
      const tooClose = lanterns.some(l => Math.hypot(l.x - c.x, l.y - c.y) < 3.5);
      if (!tooClose) lanterns.push(c);
    } else if (runes.length < 2) {
      const tooClose = runes.some(r => Math.hypot(r.x - c.x, r.y - c.y) < 4);
      if (!tooClose) runes.push(c);
    }
    if (lanterns.length >= 5 && runes.length >= 2) break;
  }

  return { lanterns, runes };
}

export function placeHazards(levelData, levelNum, optimalPath, rng) {
  const { grid, width, height, startP1, startP2, gateTop, gateBottom, trapUpper, trapLower } = levelData;
  const count = levelNum === 1 ? 4 : levelNum === 2 ? 6 : levelNum === 3 ? 7 : levelNum === 4 ? 8 : 9;

  const protectedTiles = new Set();
  protectedTiles.add(`${startP1.x},${startP1.y}`);
  protectedTiles.add(`${startP2.x},${startP2.y}`);
  protectedTiles.add(`${gateTop.x},${gateTop.y}`);
  protectedTiles.add(`${gateBottom.x},${gateBottom.y}`);
  protectedTiles.add(`${gateTop.x},${gateTop.y + 1}`);
  protectedTiles.add(`${gateBottom.x},${gateBottom.y - 1}`);

  if (trapUpper) {
    protectedTiles.add(`${trapUpper.x},${trapUpper.y}`);
    protectedTiles.add(`${trapUpper.landingX},${trapUpper.landingY}`);
  }
  if (trapLower) {
    protectedTiles.add(`${trapLower.x},${trapLower.y}`);
    protectedTiles.add(`${trapLower.landingX},${trapLower.landingY}`);
  }

  // Protect all tiles used on the optimal hazard-free path
  if (optimalPath) {
    for (const step of optimalPath) {
      protectedTiles.add(`${step.p1.x},${step.p1.y}`);
      protectedTiles.add(`${step.p2.x},${step.p2.y}`);
    }
  }

  // Find candidate floor tiles
  const candidates = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 0 && !protectedTiles.has(`${x},${y}`)) {
        let floorNeighbors = 0;
        for (const d of DIRS_4) {
          if (grid[y + d.dy][x + d.dx] === 0) floorNeighbors++;
        }
        candidates.push({ x, y, score: floorNeighbors });
      }
    }
  }

  rng.shuffle(candidates);
  candidates.sort((a, b) => a.score - b.score);

  const hazardTypes = ['fire', 'water', 'electric', 'arrow'];
  const hazards = [];
  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    const c = candidates[i];
    grid[c.y][c.x] = 2; // Mark hazard tile in grid
    hazards.push({
      x: c.x,
      y: c.y,
      type: hazardTypes[i % hazardTypes.length]
    });
  }

  levelData.hazards = hazards;
}

export function buildVerifiedLevel(levelNum, preferredSeed = null) {
  const def = CONFIG.LEVELS[levelNum - 1];
  let seed = preferredSeed ?? def.seed;
  const [minPar, maxPar] = def.parRange;

  for (let attempt = 0; attempt < 500; attempt++) {
    const rng = new PRNG(seed);
    const levelData = generateRawMaze(levelNum, seed);

    if (levelNum === 5) {
      // Must be solvable under both gate assignments
      const solA = solveLevel(levelData, levelNum, { top: 'red', bottom: 'blue' });
      const solB = solveLevel(levelData, levelNum, { top: 'blue', bottom: 'red' });

      if (solA && solB && solB.cost >= minPar && solB.cost <= maxPar && solB.desyncs >= 3 && solA.desyncs >= 3) {
        // Place hazards protecting both paths
        const combinedPath = [...solA.path, ...solB.path];
        placeHazards(levelData, levelNum, combinedPath, rng);

        const testB = solveLevel(levelData, levelNum, { top: 'blue', bottom: 'red' });
        const testA = solveLevel(levelData, levelNum, { top: 'red', bottom: 'blue' });

        if (testB && testA && testB.cost >= minPar && testB.cost <= maxPar && testB.desyncs >= 3 && testA.desyncs >= 3) {
          levelData.seed = seed;
          levelData.par = testB.cost;
          levelData.optimalPath = testB.path;
          levelData.definition = def;
          return levelData;
        }
      }
    } else {
      const sol = solveLevel(levelData, levelNum);
      if (sol && sol.cost >= minPar && sol.cost <= maxPar && sol.desyncs >= 3) {
        placeHazards(levelData, levelNum, sol.path, rng);

        const test = solveLevel(levelData, levelNum);
        if (test && test.cost >= minPar && test.cost <= maxPar && test.desyncs >= 3) {
          levelData.seed = seed;
          levelData.par = test.cost;
          levelData.optimalPath = test.path;
          levelData.definition = def;
          return levelData;
        }
      }
    }

    seed++;
  }

  throw new Error(`Failed to verify level ${levelNum} after 500 attempts!`);
}
