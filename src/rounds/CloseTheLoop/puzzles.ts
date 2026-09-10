/**
 * Close the Loop — grid puzzle model.
 *
 * Directions are indices: 0 = North, 1 = East, 2 = South, 3 = West.
 * A tile exposes connectors on some of those sides; two neighbouring tiles are joined only
 * when BOTH expose a connector on the edge they share. Current flows out of one battery
 * terminal, through the wires, and must arrive back at the other terminal having passed
 * through the bulb — an incomplete or bulb-less path lights nothing.
 */

export type TileType =
  | 'empty'
  | 'straight'
  | 'elbow'
  | 'tee'
  | 'cross'
  | 'bulb'
  | 'switch'
  | 'source'

export interface Cell {
  type: TileType
  /** Quarter-turns clockwise, 0-3. */
  rot: number
  /** Solution rotation, used by the hint button. */
  solRot?: number
  /** Rotation is locked (batteries and pre-placed parts). */
  fixed?: boolean
  /** Switches only: an open switch breaks the connection. */
  closed?: boolean
}

export interface Puzzle {
  id: string
  label: string
  brief: string
  rows: number
  cols: number
  cells: Cell[][]
}

/** Connector sides for a tile at rotation 0. */
export const BASE_SIDES: Record<TileType, number[]> = {
  empty: [],
  straight: [0, 2],
  elbow: [0, 1],
  tee: [3, 0, 1],
  cross: [0, 1, 2, 3],
  bulb: [3, 1],
  switch: [3, 1],
  source: [3, 1],
}

export function connectors(cell: Cell): number[] {
  if (cell.type === 'switch' && cell.closed === false) return []
  return BASE_SIDES[cell.type].map((d) => (d + cell.rot) % 4)
}

export function isRotatable(cell: Cell): boolean {
  return !cell.fixed && cell.type !== 'empty' && cell.type !== 'source'
}

const DELTA: Record<number, [number, number]> = {
  0: [-1, 0],
  1: [0, 1],
  2: [1, 0],
  3: [0, -1],
}

const opposite = (d: number) => (d + 2) % 4

function findType(cells: Cell[][], type: TileType): [number, number] | null {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (cells[r][c].type === type) return [r, c]
    }
  }
  return null
}

const key = (r: number, c: number) => `${r},${c}`

export interface SolveResult {
  closed: boolean
  /** Cell keys on the live current path, in order, for the electron animation. */
  path: string[]
  /** True when a complete loop exists but skips the bulb. */
  loopMissesBulb: boolean
}

/**
 * Looks for a simple path from one battery terminal back to the other. Grids are small
 * (at most 20 tiles), so exhausting every simple path is cheap and exact — and it lets us
 * distinguish "no loop at all" from "a loop that bypasses the bulb", which is the more
 * interesting mistake to give feedback on.
 */
export function solve(cells: Cell[][]): SolveResult {
  const empty: SolveResult = { closed: false, path: [], loopMissesBulb: false }

  const src = findType(cells, 'source')
  const bulbPos = findType(cells, 'bulb')
  if (!src || !bulbPos) return empty

  const [sr, sc] = src
  const [br, bc] = bulbPos
  const bulbKey = key(br, bc)
  const srcConns = connectors(cells[sr][sc])
  if (srcConns.length < 2) return empty

  const inBounds = (r: number, c: number) =>
    r >= 0 && r < cells.length && c >= 0 && c < cells[0].length

  /** The tile reached by leaving the source on side `dir`, if the two actually join. */
  const terminalNeighbour = (dir: number): [number, number] | null => {
    const [dr, dc] = DELTA[dir]
    const r = sr + dr
    const c = sc + dc
    if (!inBounds(r, c)) return null
    if (!connectors(cells[r][c]).includes(opposite(dir))) return null
    return [r, c]
  }

  const start = terminalNeighbour(srcConns[0])
  const end = terminalNeighbour(srcConns[1])
  if (!start || !end) return empty

  const endKey = key(end[0], end[1])
  let bestWithoutBulb: string[] | null = null

  const visited = new Set<string>()
  const path: string[] = []

  const dfs = (r: number, c: number): string[] | null => {
    const k = key(r, c)
    visited.add(k)
    path.push(k)

    // Every valid path terminates at the far terminal, so stop and backtrack on arrival
    // rather than routing through it.
    if (k === endKey) {
      const found = [...path]
      visited.delete(k)
      path.pop()
      if (found.includes(bulbKey)) return found
      if (!bestWithoutBulb) bestWithoutBulb = found
      return null
    }

    for (const dir of connectors(cells[r][c])) {
      const [dr, dc] = DELTA[dir]
      const nr = r + dr
      const nc = c + dc
      if (!inBounds(nr, nc)) continue
      if (nr === sr && nc === sc) continue // the battery is the endpoint, never a through-route
      if (visited.has(key(nr, nc))) continue
      if (!connectors(cells[nr][nc]).includes(opposite(dir))) continue

      const found = dfs(nr, nc)
      if (found) {
        visited.delete(k)
        path.pop()
        return found
      }
    }

    visited.delete(k)
    path.pop()
    return null
  }

  const withBulb = dfs(start[0], start[1])
  if (withBulb) {
    return { closed: true, path: [key(sr, sc), ...withBulb, key(sr, sc)], loopMissesBulb: false }
  }
  return { closed: false, path: [], loopMissesBulb: bestWithoutBulb !== null }
}

/** Cells whose rotation differs from the solution — the hint button picks from these. */
export function wrongCells(cells: Cell[][]): [number, number][] {
  const out: [number, number][] = []
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = cells[r][c]
      if (!isRotatable(cell)) continue
      if (cell.type === 'switch' && cell.closed === false) {
        out.push([r, c])
        continue
      }
      // Compare the connector sides, not the raw rotation: a straight wire at 0° and at 180°
      // are the same circuit, and a hint that points at one of those would be wrong.
      if (cell.solRot === undefined) continue
      const now = connectors(cell).slice().sort().join()
      const want = connectors({ ...cell, rot: cell.solRot, closed: true }).slice().sort().join()
      if (now !== want) out.push([r, c])
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

const E = (): Cell => ({ type: 'empty', rot: 0, fixed: true })
const t = (type: TileType, rot: number, solRot: number, extra: Partial<Cell> = {}): Cell => ({
  type,
  rot,
  solRot,
  ...extra,
})

export const PUZZLES: Puzzle[] = [
  {
    id: 'l1',
    label: 'Level 1',
    brief: 'Turn the wires until the current can run all the way round and back.',
    rows: 3,
    cols: 5,
    cells: [
      [E(), t('elbow', 0, 1), t('bulb', 0, 0, { fixed: true }), t('elbow', 0, 2), E()],
      [E(), t('straight', 1, 0), E(), t('straight', 1, 0), E()],
      [E(), t('elbow', 2, 0), { type: 'source', rot: 0, fixed: true }, t('elbow', 1, 3), E()],
    ],
  },
  {
    id: 'l2',
    label: 'Level 2',
    brief: 'Same idea — but this circuit has a switch, and an open switch is a broken circuit.',
    rows: 3,
    cols: 5,
    cells: [
      [
        t('elbow', 0, 1),
        t('straight', 0, 1),
        t('bulb', 0, 0, { fixed: true }),
        t('straight', 0, 1),
        t('elbow', 1, 2),
      ],
      [t('straight', 1, 0), E(), E(), E(), t('straight', 1, 0)],
      [
        t('elbow', 1, 0),
        t('switch', 0, 0, { closed: false }),
        { type: 'source', rot: 0, fixed: true },
        t('straight', 0, 1),
        t('elbow', 0, 3),
      ],
    ],
  },
  {
    id: 'l3',
    label: 'Level 3',
    brief: 'One branch leads nowhere. Find the path that actually returns to the battery.',
    rows: 3,
    cols: 5,
    cells: [
      [
        t('elbow', 3, 1),
        t('straight', 1, 1),
        t('bulb', 1, 0),
        t('straight', 1, 1),
        t('elbow', 0, 2),
      ],
      [t('straight', 0, 0), E(), t('straight', 1, 0), E(), t('straight', 1, 0)],
      [
        t('elbow', 3, 0),
        { type: 'source', rot: 0, fixed: true },
        t('tee', 1, 0),
        t('straight', 1, 1),
        t('elbow', 2, 3),
      ],
    ],
  },
]

export const cloneCells = (cells: Cell[][]): Cell[][] => cells.map((row) => row.map((c) => ({ ...c })))
