// js/solver.js - Joint BFS State Solver & Level Verifier
import { CONFIG } from './config.js';
import { generateRawMaze, placeHazards, PRNG } from './levels.js';

export const DIRS_4 = [
  { name: 'N', dx: 0, dy: -1 },
  { name: 'S', dx: 0, dy: 1 },
  { name: 'W', dx: -1, dy: 0 },
  { name: 'E', dx: 1, dy: 0 }
];

export const DIRS_8 = [
  { name: 'N', dx: 0, dy: -1 },
  { name: 'NE', dx: 1, dy: -1 },
  { name: 'E', dx: 1, dy: 0 },
  { name: 'SE', dx: 1, dy: 1 },
  { name: 'S', dx: 0, dy: 1 },
  { name: 'SW', dx: -1, dy: 1 },
  { name: 'W', dx: -1, dy: 0 },
  { name: 'NW', dx: -1, dy: -1 }
];

export function canMove(curr, dir, grid, isDiagonal, gateSelf, gateOther) {
  const nx = curr.x + dir.dx;
  const ny = curr.y + dir.dy;
  const width = grid[0].length;
  const height = grid.length;

  if (nx < 0 || nx >= width || ny < 0 || ny >= height) return null;
  if (grid[ny][nx] === 1) return null; // Wall

  // Corner squeeze check for diagonals
  if (isDiagonal) {
    const c1 = grid[curr.y][nx];
    const c2 = grid[ny][curr.x];
    if (c1 === 1 && c2 === 1) return null; // Cannot squeeze through two diagonal walls
  }

  // Gate check: cannot enter the other spirit's gate
  if (gateOther && nx === gateOther.x && ny === gateOther.y) {
    return null; // Sealed
  }

  return { x: nx, y: ny };
}

export function solveLevel(levelData, levelNum, gateAssignment = { top: 'red', bottom: 'blue' }) {
  const { grid, startP1, startP2, trapUpper, trapLower } = levelData;
  const dirs = (levelNum <= 2) ? DIRS_4 : DIRS_8;

  const gateP1 = (gateAssignment.top === 'red') ? { x: 7, y: 0 } : { x: 7, y: 14 };
  const gateP2 = (gateAssignment.bottom === 'blue') ? { x: 7, y: 14 } : { x: 7, y: 0 };

  const queue = [];
  const visited = new Set();

  function stateKey(p1, p2, turn = 0) {
    if (levelNum === 4) return `${p1.x},${p1.y},${p2.x},${p2.y},${turn}`;
    return `${p1.x},${p1.y},${p2.x},${p2.y}`;
  }

  const initialKey = stateKey(startP1, startP2, 0);
  visited.add(initialKey);
  queue.push({
    p1: { ...startP1 },
    p2: { ...startP2 },
    turn: 0,
    cost: 0,
    desyncs: 0,
    path: []
  });

  let solution = null;

  while (queue.length > 0) {
    const curr = queue.shift();

    // Check goal: both spirits at their designated gate
    if (curr.p1.x === gateP1.x && curr.p1.y === gateP1.y &&
        curr.p2.x === gateP2.x && curr.p2.y === gateP2.y) {
      solution = curr;
      break;
    }

    for (const d of dirs) {
      const isDiag = Math.abs(d.dx) === 1 && Math.abs(d.dy) === 1;
      let nextP1 = { ...curr.p1 };
      let nextP2 = { ...curr.p2 };
      let nextTurn = curr.turn;
      let movedP1 = false;
      let movedP2 = false;

      if (levelNum === 1) {
        // P1: (dx, dy), P2: (dx, -dy)
        const d1 = { dx: d.dx, dy: d.dy };
        const d2 = { dx: d.dx, dy: -d.dy };
        if (!(curr.p1.x === gateP1.x && curr.p1.y === gateP1.y)) {
          const res1 = canMove(curr.p1, d1, grid, false, gateP1, gateP2);
          if (res1) { nextP1 = res1; movedP1 = true; }
        }
        if (!(curr.p2.x === gateP2.x && curr.p2.y === gateP2.y)) {
          const res2 = canMove(curr.p2, d2, grid, false, gateP2, gateP1);
          if (res2) { nextP2 = res2; movedP2 = true; }
        }
      } else if (levelNum === 2) {
        // P1: (dx, dy), P2: (-dx, -dy)
        const d1 = { dx: d.dx, dy: d.dy };
        const d2 = { dx: -d.dx, dy: -d.dy };
        if (!(curr.p1.x === gateP1.x && curr.p1.y === gateP1.y)) {
          const res1 = canMove(curr.p1, d1, grid, false, gateP1, gateP2);
          if (res1) { nextP1 = res1; movedP1 = true; }
        }
        if (!(curr.p2.x === gateP2.x && curr.p2.y === gateP2.y)) {
          const res2 = canMove(curr.p2, d2, grid, false, gateP2, gateP1);
          if (res2) { nextP2 = res2; movedP2 = true; }
        }
      } else if (levelNum === 3) {
        // 8-dir point reflection
        const d1 = { dx: d.dx, dy: d.dy };
        const d2 = { dx: -d.dx, dy: -d.dy };
        if (!(curr.p1.x === gateP1.x && curr.p1.y === gateP1.y)) {
          const res1 = canMove(curr.p1, d1, grid, isDiag, gateP1, gateP2);
          if (res1) { nextP1 = res1; movedP1 = true; }
        }
        if (!(curr.p2.x === gateP2.x && curr.p2.y === gateP2.y)) {
          const res2 = canMove(curr.p2, d2, grid, isDiag, gateP2, gateP1);
          if (res2) { nextP2 = res2; movedP2 = true; }
        }
      } else if (levelNum === 4) {
        // Automatic switching
        if (curr.turn === 0) {
          // P1's turn
          if (!(curr.p1.x === gateP1.x && curr.p1.y === gateP1.y)) {
            const res1 = canMove(curr.p1, d, grid, isDiag, gateP1, gateP2);
            if (res1) { nextP1 = res1; movedP1 = true; nextTurn = 1; }
          } else {
            nextTurn = 1; movedP1 = true;
          }
        } else {
          // P2's turn (inverted)
          const invD = CONFIG.INVERT_ON_P2_TURN ? { dx: -d.dx, dy: -d.dy } : { dx: d.dx, dy: d.dy };
          if (!(curr.p2.x === gateP2.x && curr.p2.y === gateP2.y)) {
            const res2 = canMove(curr.p2, invD, grid, isDiag, gateP2, gateP1);
            if (res2) { nextP2 = res2; movedP2 = true; nextTurn = 0; }
          } else {
            nextTurn = 0; movedP2 = true;
          }
        }
      } else if (levelNum === 5) {
        // Sundered Keep: 8-dir point reflection, trapdoors, collision game over
        const d1 = { dx: d.dx, dy: d.dy };
        const d2 = { dx: -d.dx, dy: -d.dy };
        if (!(curr.p1.x === gateP1.x && curr.p1.y === gateP1.y)) {
          const res1 = canMove(curr.p1, d1, grid, isDiag, gateP1, gateP2);
          if (res1) { nextP1 = res1; movedP1 = true; }
        }
        if (!(curr.p2.x === gateP2.x && curr.p2.y === gateP2.y)) {
          const res2 = canMove(curr.p2, d2, grid, isDiag, gateP2, gateP1);
          if (res2) { nextP2 = res2; movedP2 = true; }
        }

        // Trapdoor teleport check
        if (movedP1) {
          if (trapUpper && nextP1.x === trapUpper.x && nextP1.y === trapUpper.y) {
            nextP1 = { x: trapUpper.landingX, y: trapUpper.landingY };
          } else if (trapLower && nextP1.x === trapLower.x && nextP1.y === trapLower.y) {
            nextP1 = { x: trapLower.landingX, y: trapLower.landingY };
          }
        }
        if (movedP2) {
          if (trapUpper && nextP2.x === trapUpper.x && nextP2.y === trapUpper.y) {
            nextP2 = { x: trapUpper.landingX, y: trapUpper.landingY };
          } else if (trapLower && nextP2.x === trapLower.x && nextP2.y === trapLower.y) {
            nextP2 = { x: trapLower.landingX, y: trapLower.landingY };
          }
        }

        // Collision rule: forbidden collision
        if (nextP1.x === nextP2.x && nextP1.y === nextP2.y) continue;
        if (nextP1.x === curr.p2.x && nextP1.y === curr.p2.y &&
            nextP2.x === curr.p1.x && nextP2.y === curr.p1.y) continue;
      }

      // Blocked move check
      if (!movedP1 && !movedP2) continue;

      // Hazard check (for optimal path)
      if (grid[nextP1.y][nextP1.x] === 2 || grid[nextP2.y][nextP2.x] === 2) continue;

      const isDesync = (movedP1 && !movedP2) || (!movedP1 && movedP2);
      const key = stateKey(nextP1, nextP2, nextTurn);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          p1: nextP1,
          p2: nextP2,
          turn: nextTurn,
          cost: curr.cost + 1,
          desyncs: curr.desyncs + (isDesync ? 1 : 0),
          path: [...curr.path, { dir: d.name, p1: nextP1, p2: nextP2 }]
        });
      }
    }
  }

  return solution;
}

// Verification function exposed on window
export function verifyAllLevels() {
  console.log("%c[TWIN SPIRITS] Verifying All 5 Levels...", "color: #b794ff; font-weight: bold; font-size: 14px;");
  const results = [];

  for (let lvl = 1; lvl <= 5; lvl++) {
    const def = CONFIG.LEVELS[lvl - 1];
    const seed = def.seed;
    const [minPar, maxPar] = def.parRange;
    const levelData = generateRawMaze(lvl, seed);
    const rng = new PRNG(seed);

    if (lvl === 5) {
      const solA = solveLevel(levelData, lvl, { top: 'red', bottom: 'blue' });
      const solB = solveLevel(levelData, lvl, { top: 'blue', bottom: 'red' });
      const combined = [...(solA?.path || []), ...(solB?.path || [])];
      placeHazards(levelData, lvl, combined, rng);

      const testB = solveLevel(levelData, lvl, { top: 'blue', bottom: 'red' });
      const testA = solveLevel(levelData, lvl, { top: 'red', bottom: 'blue' });

      const pass = Boolean(testB && testA && testB.cost >= minPar && testB.cost <= maxPar && testB.desyncs >= 3 && testA.desyncs >= 3);
      const report = {
        level: 5,
        title: def.title,
        seed,
        par: testB?.cost,
        desyncs: testB?.desyncs,
        hazards: levelData.hazards.length,
        bothAssignmentsValid: Boolean(testA && testB),
        status: pass ? "PASS" : "FAIL"
      };
      results.push(report);
      console.log(`%cLevel 5 (seed ${seed}): ${report.status} | Par: ${report.par} (range ${minPar}-${maxPar}) | Desyncs: ${report.desyncs} | Hazards: ${report.hazards}`, pass ? "color: #5fd47e" : "color: #e63946");
    } else {
      const sol = solveLevel(levelData, lvl);
      placeHazards(levelData, lvl, sol?.path || [], rng);

      const test = solveLevel(levelData, lvl);
      const pass = Boolean(test && test.cost >= minPar && test.cost <= maxPar && test.desyncs >= 3);
      const report = {
        level: lvl,
        title: def.title,
        seed,
        par: test?.cost,
        desyncs: test?.desyncs,
        hazards: levelData.hazards.length,
        status: pass ? "PASS" : "FAIL"
      };
      results.push(report);
      console.log(`%cLevel ${lvl} (seed ${seed}): ${report.status} | Par: ${report.par} (range ${minPar}-${maxPar}) | Desyncs: ${report.desyncs} | Hazards: ${report.hazards}`, pass ? "color: #5fd47e" : "color: #e63946");
    }
  }

  const allPassed = results.every(r => r.status === "PASS");
  console.log(`%c[TWIN SPIRITS] Level Verification Result: ${allPassed ? "ALL 5 LEVELS VERIFIED (PASS)" : "SOME FAILED"}`, allPassed ? "color: #2ee6c5; font-weight: bold;" : "color: #ff3344; font-weight: bold;");
  return results;
}

if (typeof window !== 'undefined') {
  window.__verifyLevels = verifyAllLevels;
}
