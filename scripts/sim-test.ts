import { simulate, survivesRemoval, NOMINAL_AMPS } from '../src/sim/circuit.ts'

let fails = 0
const check = (name, cond, extra = '') => {
  if (cond) console.log(`ok   ${name}`)
  else { console.log(`FAIL ${name} ${extra}`); fails++ }
}
const near = (a, b, tol = 1e-6) => Math.abs(a - b) < tol

const bulb = (id) => ({ id, type: 'bulb' })
const sw = (id, closed) => ({ id, type: 'switch', closed })

// 1. One cell, one bulb = the reference case: normal brightness.
{
  const c = { cells: 1, main: [], branches: [{ id: 'b1', components: [bulb('L1')] }] }
  const r = simulate(c)
  check('single bulb draws nominal current', near(r.totalCurrent, NOMINAL_AMPS), `got ${r.totalCurrent}`)
  check('single bulb is at brightness 1', near(r.brightness.L1, 1), `got ${r.brightness.L1}`)
}

// 2. Two bulbs in series are dimmer; two in parallel are not.
{
  const series = { cells: 1, main: [], branches: [{ id: 'b1', components: [bulb('L1'), bulb('L2')] }] }
  const rs = simulate(series)
  check('two bulbs in series are half brightness', near(rs.brightness.L1, 0.5), `got ${rs.brightness.L1}`)

  const parallel = {
    cells: 1,
    main: [],
    branches: [
      { id: 'b1', components: [bulb('L1')] },
      { id: 'b2', components: [bulb('L2')] },
    ],
  }
  const rp = simulate(parallel)
  check('two bulbs in parallel stay at full brightness', near(rp.brightness.L1, 1) && near(rp.brightness.L2, 1))
  check('parallel draws twice the total current', near(rp.totalCurrent, 2 * NOMINAL_AMPS))
}

// 3. More cells = brighter.
{
  const one = simulate({ cells: 1, main: [], branches: [{ id: 'b', components: [bulb('L')] }] })
  const two = simulate({ cells: 2, main: [], branches: [{ id: 'b', components: [bulb('L')] }] })
  check('a second cell doubles brightness', near(two.brightness.L, 2 * one.brightness.L))
}

// 4. An open switch in the main line kills every branch.
{
  const c = {
    cells: 1,
    main: [sw('S', false)],
    branches: [
      { id: 'b1', components: [bulb('L1')] },
      { id: 'b2', components: [bulb('L2')] },
    ],
  }
  const r = simulate(c)
  check('open master switch opens the circuit', r.open && r.brightness.L1 === 0 && r.brightness.L2 === 0)

  const closed = simulate({ ...c, main: [sw('S', true)] })
  check('closing the master switch lights both', near(closed.brightness.L1, 1) && near(closed.brightness.L2, 1))
}

// 5. An open switch in ONE parallel branch leaves the other lit.
{
  const c = {
    cells: 1,
    main: [],
    branches: [
      { id: 'b1', components: [bulb('L1'), sw('S1', false)] },
      { id: 'b2', components: [bulb('L2')] },
    ],
  }
  const r = simulate(c)
  check('open branch switch only kills its own branch', r.brightness.L1 === 0 && near(r.brightness.L2, 1))
}

// 6. Removing a bulb: series kills all, parallel spares the rest.
{
  const series = {
    cells: 1,
    main: [],
    branches: [{ id: 'b1', components: [bulb('L1'), bulb('L2'), bulb('L3')] }],
  }
  check('series: removing one bulb kills all', survivesRemoval(series, 'L2').length === 0,
        `survivors ${survivesRemoval(series, 'L2')}`)

  const parallel = {
    cells: 1,
    main: [],
    branches: [
      { id: 'b1', components: [bulb('L1')] },
      { id: 'b2', components: [bulb('L2')] },
      { id: 'b3', components: [bulb('L3')] },
    ],
  }
  const survivors = survivesRemoval(parallel, 'L2')
  check('parallel: removing one bulb leaves two lit',
        survivors.length === 2 && survivors.includes('L1') && survivors.includes('L3'),
        `survivors ${survivors}`)
}

// 7. A bare wire branch across the battery is a short circuit, not a working circuit.
{
  const c = { cells: 1, main: [], branches: [{ id: 'b1', components: [{ id: 'w', type: 'wire' }] }] }
  const r = simulate(c)
  check('bare wire across the cell is flagged as a short', r.shortCircuit === true)
}

// 8. A resistor added in series reduces the current.
{
  const plain = simulate({ cells: 1, main: [], branches: [{ id: 'b', components: [bulb('L')] }] })
  const withR = simulate({
    cells: 1,
    main: [],
    branches: [{ id: 'b', components: [bulb('L'), { id: 'R', type: 'resistor' }] }],
  })
  check('adding a resistor lowers the current', withR.totalCurrent < plain.totalCurrent)
  check('adding a resistor dims the bulb', withR.brightness.L < plain.brightness.L)
}

// 9. Main-line bulb carries the total current of the parallel block behind it.
{
  const c = {
    cells: 2,
    main: [bulb('M')],
    branches: [
      { id: 'b1', components: [bulb('L1')] },
      { id: 'b2', components: [bulb('L2')] },
    ],
  }
  const r = simulate(c)
  check('main bulb is brighter than the parallel pair behind it',
        r.brightness.M > r.brightness.L1, `M=${r.brightness.M} L1=${r.brightness.L1}`)
  check('branch currents sum to the total',
        near(r.branchCurrent.b1 + r.branchCurrent.b2, r.totalCurrent, 1e-9))
}

console.log(fails === 0 ? '\nALL SIM CHECKS PASSED' : `\n${fails} CHECK(S) FAILED`)
process.exit(fails === 0 ? 0 : 1)
