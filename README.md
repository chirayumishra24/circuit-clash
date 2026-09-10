# Power Play: Circuit Clash

A two-team electricity game show for the classroom. Six rounds, one shared screen, one keyboard.
Built for SkilliZee.

**Topic:** Electricity · **Audience:** Grades 6–8 · **Runtime:** 35–45 minutes

---

## Running it

```bash
npm install
npm run dev
```

Then open the printed URL on the projector. `npm run build` produces a static `dist/` folder;
`vercel.json` is already set up for SPA routing.

If port 5173 is busy (several SkilliZee activities default to it), set `PORT` first:

```bash
PORT=5180 npm run dev
```

## Running it in class

1. **Setup screen** — type both team names. Defaults are Team Volt (amber) and Team Ampere (cyan).
2. **The Board** — six rounds. Play in order, or pick any round.
3. **Teams buzz on one keyboard**: `A` for Team Volt, `L` for Team Ampere.
4. **Host controls** live behind the `⚙ Host` button at the bottom: pause, adjust either score by
   ±25, skip a round, jump back to the board, mute, restart.
5. **Debrief** — after the final round, the results screen leads to a printable per-subtopic
   breakdown showing which topic each team lost points on.

Score is shown as a **charging battery** per team. 2000 points fills it.

## The rounds

| # | Round | Subtopic | What teams do |
|---|-------|----------|----------------|
| 1 | Close the Loop | Flow of Electricity | Rotate wire tiles to complete a circuit through the bulb. 3 levels, 90s per team. |
| 2 | Build Battle | Electrical Circuits | Build a circuit to a brief on a live-simulated bench. Each team gets a different brief — one only solvable in parallel, one only in series. |
| 3 | Ammeter Showdown | Measuring the Flow of Current | Place the meter correctly, then both teams predict the reading before the needle swings. |
| 4 | Sorting Belt | Conductors and Insulators | 60-second sort. Materials can be tested in a real circuit at a 3-second cost. |
| 5 | Sabotage & Repair | Adding or Removing a Component | One team breaks the circuit; the other predicts the effect and repairs it. Roles swap. |
| 6 | Lightning Round | All | Five buzzer questions, then a wagered Final Charge. |

**Power-up:** three correct answers in a row earns ⚡ Surge. Click it on the scoreboard to arm it —
the team's next points are doubled.

## How the physics works

Rounds 2, 3 and 5 share one simulator (`src/sim/circuit.ts`) so they can never disagree about what
a circuit does. It models a battery driving a series `main` section feeding parallel branches:

- 1.5 V per cell, 6 Ω per bulb, 10 Ω per resistor, open switch = infinite resistance
- Branch currents from Ohm's law; bulb brightness relative to one bulb on one cell
- Removing a bulb leaves an **open gap**, not a splice — which is why one bulb out kills a series
  string but not a parallel one

Round 1's grid puzzle has its own model (`src/rounds/CloseTheLoop/puzzles.ts`): it exhausts every
simple path between the two battery terminals, so it can tell "no complete loop" apart from "a
complete loop that bypasses the bulb".

Both are covered by tests:

```bash
npm test
```

16 simulator checks and 13 puzzle checks, run directly by Node's TypeScript support — no test
framework to install.

## Adding content

- **Materials** for the Sorting Belt: `src/data/materials.ts`
- **Questions** for the Lightning Round: `src/data/questions.ts`
- **Puzzle levels** for Close the Loop: `PUZZLES` in `src/rounds/CloseTheLoop/puzzles.ts`
  (run `npm run test:puzzles` after editing — it checks a new level is solvable and not
  already solved)
- **Briefs** for Build Battle: `src/rounds/BuildBattle/briefs.ts`
- **Points**: `POINTS` in `src/constants.ts`

## Notes on the build

- Vite 8 + React 19 + TypeScript + Tailwind v4. No component library.
- **No animation library.** Entrances are CSS animations with no fill-mode, so if animation frames
  never arrive — a backgrounded tab, a projector waking from sleep — content is still visible.
  A JS-driven `opacity: 0` start would leave a blank screen in front of the class.
- Sounds are synthesised with the Web Audio API, so there are no audio files to ship.
- No backend, no storage, no student devices. A game is one sitting.
