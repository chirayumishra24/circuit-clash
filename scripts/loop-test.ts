import { PUZZLES, solve, cloneCells, isRotatable, wrongCells } from '../src/rounds/CloseTheLoop/puzzles.ts'

let failures = 0

for (const p of PUZZLES) {
  // 1. As authored, the puzzle must NOT already be solved.
  const asAuthored = solve(cloneCells(p.cells))
  if (asAuthored.closed) {
    console.log(`FAIL ${p.id}: starts already solved`)
    failures++
  }

  // 2. Applying every solution rotation (and closing switches) must complete the circuit.
  const solved = cloneCells(p.cells)
  for (const row of solved) {
    for (const cell of row) {
      if (cell.solRot !== undefined) cell.rot = cell.solRot
      if (cell.type === 'switch') cell.closed = true
    }
  }
  const res = solve(solved)
  if (!res.closed) {
    console.log(`FAIL ${p.id}: solution rotations do not close the circuit`)
    failures++
  } else {
    console.log(`ok   ${p.id}: closes, path length ${res.path.length}`)
  }

  // 3. Breaking one wire must open the circuit again.
  const broken = cloneCells(solved)
  outer: for (const row of broken) {
    for (const cell of row) {
      if (isRotatable(cell) && cell.type !== 'switch') {
        cell.rot = (cell.rot + 1) % 4
        break outer
      }
    }
  }
  if (solve(broken).closed) {
    console.log(`FAIL ${p.id}: still closed after rotating a wire out of place`)
    failures++
  }

  // 4. Hint list must be empty once solved, non-empty as authored.
  if (wrongCells(solved).length !== 0) {
    console.log(`FAIL ${p.id}: wrongCells not empty on a solved board`)
    failures++
  }
  if (wrongCells(cloneCells(p.cells)).length === 0) {
    console.log(`FAIL ${p.id}: wrongCells empty on the authored board`)
    failures++
  }
}

// 5. Level 3's decoy branch must not be counted as part of the live path.
const l3 = PUZZLES.find((p) => p.id === 'l3')
const l3solved = cloneCells(l3.cells)
for (const row of l3solved) for (const cell of row) if (cell.solRot !== undefined) cell.rot = cell.solRot
const l3res = solve(l3solved)
if (l3res.path.includes('1,2')) {
  console.log('FAIL l3: decoy branch (1,2) is on the live path')
  failures++
} else {
  console.log('ok   l3: decoy branch excluded from the live path')
}

console.log(failures === 0 ? '\nALL PUZZLE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
