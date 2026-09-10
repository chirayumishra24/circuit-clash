/**
 * A small, deliberately classical circuit model shared by Build Battle, Ammeter Showdown and
 * Sabotage & Repair. Keeping one engine means the three rounds can never disagree about what
 * a circuit does — a bulb that dims in one round dims in the others for the same reason.
 *
 * Shape: a battery drives a `main` series section, which feeds a block of parallel `branches`.
 * One branch and no main section is a plain series circuit; several branches is a parallel one.
 */

export type ComponentType = 'bulb' | 'resistor' | 'switch' | 'wire'

export interface Component {
  id: string
  type: ComponentType
  /** Switches only. An open switch breaks whatever it sits in. */
  closed?: boolean
}

export interface Branch {
  id: string
  /** Components in series within this branch. */
  components: Component[]
}

export interface Circuit {
  /** Number of 1.5 V cells in series. */
  cells: number
  /** Series section shared by every branch — where a master switch belongs. */
  main: Component[]
  branches: Branch[]
}

export const CELL_VOLTS = 1.5
export const BULB_OHMS = 6
export const RESISTOR_OHMS = 10

/** Current through one bulb on one cell — the reference for "normal brightness". */
export const NOMINAL_AMPS = CELL_VOLTS / BULB_OHMS

const INFINITE = Number.POSITIVE_INFINITY

export function componentOhms(c: Component): number {
  switch (c.type) {
    case 'bulb':
      return BULB_OHMS
    case 'resistor':
      return RESISTOR_OHMS
    case 'switch':
      return c.closed === false ? INFINITE : 0
    case 'wire':
      return 0
  }
}

const seriesOhms = (parts: Component[]) =>
  parts.reduce((sum, c) => sum + componentOhms(c), 0)

export interface SimResult {
  voltage: number
  totalResistance: number
  /** Amps drawn from the battery. */
  totalCurrent: number
  /** Amps in each branch, keyed by branch id. */
  branchCurrent: Record<string, number>
  /** 0 = dark, 1 = normal brightness, >1 = overdriven. Keyed by component id. */
  brightness: Record<string, number>
  /** No path at all — an open switch, or no branches. */
  open: boolean
  /** A branch with no resistance across the battery. Current would be unlimited. */
  shortCircuit: boolean
}

export function simulate(circuit: Circuit): SimResult {
  const voltage = circuit.cells * CELL_VOLTS
  const mainOhms = seriesOhms(circuit.main)

  const branchOhms = new Map<string, number>()
  for (const b of circuit.branches) branchOhms.set(b.id, seriesOhms(b.components))

  const liveBranches = circuit.branches.filter((b) => Number.isFinite(branchOhms.get(b.id)!))

  const brightness: Record<string, number> = {}
  const branchCurrent: Record<string, number> = {}
  for (const b of circuit.branches) branchCurrent[b.id] = 0
  for (const b of circuit.branches) {
    for (const c of b.components) if (c.type === 'bulb') brightness[c.id] = 0
  }
  for (const c of circuit.main) if (c.type === 'bulb') brightness[c.id] = 0

  const dead: SimResult = {
    voltage,
    totalResistance: INFINITE,
    totalCurrent: 0,
    branchCurrent,
    brightness,
    open: true,
    shortCircuit: false,
  }

  // An open switch in the main line kills everything downstream, however the branches are wired.
  if (!Number.isFinite(mainOhms)) return dead
  if (liveBranches.length === 0) return dead

  // Parallel branches: 1/Rp = sum of 1/Rb. A zero-ohm branch shorts the whole block.
  const anyZeroBranch = liveBranches.some((b) => branchOhms.get(b.id) === 0)
  const parallelOhms = anyZeroBranch
    ? 0
    : 1 / liveBranches.reduce((sum, b) => sum + 1 / branchOhms.get(b.id)!, 0)

  const totalResistance = mainOhms + parallelOhms

  if (totalResistance === 0) {
    return {
      voltage,
      totalResistance: 0,
      totalCurrent: INFINITE,
      branchCurrent,
      brightness,
      open: false,
      shortCircuit: true,
    }
  }

  const totalCurrent = voltage / totalResistance
  // Voltage left across the parallel block after the main section takes its share.
  const parallelVolts = voltage - totalCurrent * mainOhms

  for (const b of liveBranches) {
    const r = branchOhms.get(b.id)!
    const i = r === 0 ? INFINITE : parallelVolts / r
    branchCurrent[b.id] = i
    for (const c of b.components) {
      if (c.type === 'bulb') brightness[c.id] = i / NOMINAL_AMPS
    }
  }
  for (const c of circuit.main) {
    if (c.type === 'bulb') brightness[c.id] = totalCurrent / NOMINAL_AMPS
  }

  return {
    voltage,
    totalResistance,
    totalCurrent,
    branchCurrent,
    brightness,
    open: totalCurrent === 0,
    shortCircuit: anyZeroBranch && mainOhms === 0,
  }
}

// ---------------------------------------------------------------------------
// Helpers used by the rounds
// ---------------------------------------------------------------------------

export const allBulbs = (circuit: Circuit): Component[] => [
  ...circuit.main.filter((c) => c.type === 'bulb'),
  ...circuit.branches.flatMap((b) => b.components.filter((c) => c.type === 'bulb')),
]

export const isSeries = (circuit: Circuit) => circuit.branches.length === 1
export const isParallel = (circuit: Circuit) => circuit.branches.length > 1

/** Deep copy — rounds mutate working copies freely. */
export const cloneCircuit = (c: Circuit): Circuit => ({
  cells: c.cells,
  main: c.main.map((x) => ({ ...x })),
  branches: c.branches.map((b) => ({ id: b.id, components: b.components.map((x) => ({ ...x })) })),
})

/**
 * Removes one bulb and reports which of the remaining bulbs still light. This is the question
 * series-versus-parallel actually answers, so both Build Battle and Sabotage lean on it.
 */
export function survivesRemoval(circuit: Circuit, bulbId: string): string[] {
  const test = cloneCircuit(circuit)

  // Taking a bulb out of its holder leaves an OPEN GAP where it stood — it does not splice the
  // chain back together. That is the whole reason one dead bulb in series kills the string,
  // so the removed bulb becomes an open switch rather than disappearing.
  const gap = (): Component => ({ id: `${bulbId}-gap`, type: 'switch', closed: false })
  test.main = test.main.map((c) => (c.id === bulbId ? gap() : c))
  for (const b of test.branches) {
    b.components = b.components.map((c) => (c.id === bulbId ? gap() : c))
  }

  const res = simulate(test)
  return allBulbs(test)
    .filter((c) => (res.brightness[c.id] ?? 0) > 0.05)
    .map((c) => c.id)
}
