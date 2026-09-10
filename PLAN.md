# Power Play: Circuit Clash — Build Plan

**Topic:** Electricity
**Format:** Two-team competitive game show, single shared screen (projector / smartboard), teacher-hosted
**Audience:** Grades 6–8
**Duration:** 35–45 minutes for the full 5 rounds + final
**Stack:** Vite 8 + React 19 + TypeScript + Tailwind v4 + Framer Motion + canvas-confetti, deployed to Vercel

---

## 1. Concept

Two teams — **Team Volt** (amber) vs **Team Ampere** (cyan) — compete across five rounds, one per
subtopic, then a final wager round. Score is displayed thematically as a **charging battery** per
team: points are "charge", and the win screen fires when a team's battery completes.

Everything runs client-side. No backend, no logins, no student devices. The teacher drives it from
one keyboard; teams buzz in with `A` (Team Volt) and `L` (Team Ampere).

---

## 2. Subtopic → Round mapping

| # | Subtopic | Round name | Core mechanic | Learning objective |
|---|----------|-----------|---------------|--------------------|
| 1 | Flow of Electricity | Close the Loop | Rotate wire tiles to complete a circuit path | Current needs a closed path; a break anywhere stops everything |
| 2 | Electrical Circuits | Build Battle | Drag-and-drop circuit bench with live simulation | Series vs parallel, by consequence not definition |
| 3 | Measuring the Flow of Current | Ammeter Showdown | Place the meter in series, then blind-predict the reading | Ammeter in series, voltmeter in parallel; amperes and milliamperes |
| 4 | Conductors and Insulators | Sorting Belt | 60-second timed sort with streak multiplier | Classify materials; test the ambiguous ones in a real circuit |
| 5 | Adding or Removing a Component | Sabotage & Repair | Head-to-head: one team breaks a circuit, the other predicts and repairs | Cause and effect of changing a circuit |
| — | All | Lightning Round | Buzzer quiz with a points wager | Mixed recall under pressure |

---

## 3. Round specifications

### Round 1 — Close the Loop (Flow of Electricity)
- Grid of wire tiles (straight, elbow, T, blank) between a cell and a bulb. Tap a tile to rotate 90°.
- Path is validated by graph traversal from the cell's + terminal to the − terminal through the bulb.
- On close: animated electrons travel the path, bulb lights, cheer sound.
- 3 levels of escalating difficulty: L1 plain path, L2 adds an open switch that must be closed,
  L3 adds a dead-end decoy branch that looks correct.
- **Scoring:** 100 per level solved, +up to 50 speed bonus, −25 per hint used.
- **Turn structure:** teams alternate levels; both teams play all 3.

### Round 2 — Build Battle (Electrical Circuits)
- Component tray: cell, wires, bulbs (×3), switch. Drop zones on a bench. Live simulation.
- Briefs, e.g. *"Wire 3 bulbs so removing one keeps the other two lit."*
- Simulation model: compute series vs parallel topology, set per-bulb brightness accordingly
  (series = dimmer with more bulbs; parallel = full brightness, independent).
- **Scoring:** 150 correct build, +50 elegance bonus for fewest components.
- **Steal:** the opposing team may challenge a build; if the sim rejects it, they take the points.

### Round 3 — Ammeter Showdown (Measuring Current)
- **Phase A (placement):** drag the ammeter into the circuit. In series → needle reads. In parallel
  → short-circuit warning and zero points for the phase.
- **Phase B (prediction):** both teams lock a numeric guess *before* the needle swings.
  Closest wins; exact match doubles.
- Animated analogue dial with a swinging needle; readings in both A and mA.
- **Scoring:** 100 placement, 100 closest prediction, 200 on exact.
- Both teams play every question — no dead time.

### Round 4 — Sorting Belt (Conductors and Insulators)
- 60-second conveyor. Items slide past; swipe/arrow **up = conductor**, **down = insulator**.
- Item set: copper wire, rubber band, glass, aluminium foil, wood, plastic ruler, iron nail,
  graphite pencil lead, salt water, tap water, cotton cloth, steel spoon, ceramic, gold ring.
- Streak multiplier from 5 correct in a row.
- Final 15s: **Test It** items (graphite, tap water, salt water) — drop the material into a live
  test circuit and read the bulb before deciding.
- **Scoring:** 25 per correct × multiplier, −15 per wrong. Teams run the belt back-to-back on the
  same item order; higher score takes the round.

### Round 5 — Sabotage & Repair (Adding or Removing a Component)
- Team A is shown a working circuit and secretly applies **one sabotage**: add a resistor, remove a
  bulb, cut a wire, or reverse a cell. Sabotages are validated by the sim so nothing is unfixable.
- Team B gets 45 seconds to (a) **predict the effect** in multiple choice, then (b) **repair** the
  circuit back to working.
- Roles swap for a second pass.
- **Scoring:** 150 to the saboteur if the repair fails, 100 prediction + 150 repair to the defender.

### Final — Lightning Round
- Each team wagers any portion of their current charge before the question is revealed.
- Buzzer question spanning all five subtopics. Correct = wager gained, wrong = wager lost.
- Keeps a trailing team mathematically alive to the last second.

---

## 4. Shell features

- **Setup screen:** team names (defaults Team Volt / Team Ampere), colour lock-in, round count.
- **Round map:** game-show board between rounds showing progress and current scores.
- **Battery scoreboard:** persistent top bar, animated charge fill, score deltas float up.
- **Buzzer:** `A` = Team Volt, `L` = Team Ampere. Lockout, sound, visual slam.
- **Power-ups**, earned on streaks:
  - `⚡ Surge` — double points on the next round
  - `🛡 Insulate` — block one steal attempt
  - `🔍 Probe` — reveal one wrong option
- **Host controls:** pause, manual score adjust (±), skip round, restart. Teachers always need this.
- **Win screen:** confetti, circuit completing across both teams, final battery animation.
- **Debrief screen:** per-subtopic breakdown of where each team lost points, print-friendly.
- **Sound:** buzzer, correct, wrong, electric hum, victory. All mutable.

---

## 5. Architecture

```
Circuit-Clash/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ vercel.json
├─ PLAN.md
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ index.css
   ├─ constants.ts            // colours, timings, point values
   ├─ types.ts                // GameState, Team, Round, Sabotage, ...
   ├─ context/
   │  └─ GameContext.tsx      // reducer-backed global game state
   ├─ hooks/
   │  ├─ useBuzzer.ts
   │  ├─ useCountdown.ts
   │  └─ useSound.ts
   ├─ components/
   │  ├─ Scoreboard.tsx       // battery meters
   │  ├─ HostBar.tsx          // pause / adjust / skip
   │  ├─ Timer.tsx
   │  ├─ PowerUpTray.tsx
   │  └─ ui/                  // Button, Panel, Modal, Badge
   ├─ screens/
   │  ├─ SetupScreen.tsx
   │  ├─ RoundMap.tsx
   │  ├─ WinScreen.tsx
   │  └─ DebriefScreen.tsx
   ├─ rounds/
   │  ├─ CloseTheLoop/
   │  ├─ BuildBattle/
   │  ├─ AmmeterShowdown/
   │  ├─ SortingBelt/
   │  ├─ SabotageRepair/
   │  └─ LightningRound/
   ├─ sim/
   │  └─ circuit.ts           // shared topology + brightness engine
   └─ data/
      ├─ materials.ts
      ├─ briefs.ts
      └─ questions.ts
```

**State:** one `useReducer` in `GameContext` holding teams, scores, current round/phase, power-ups,
and a per-subtopic score log for the debrief. Rounds dispatch `AWARD_POINTS` and `ADVANCE_PHASE`;
they never own score state themselves.

**Shared circuit sim (`src/sim/circuit.ts`):** used by Build Battle, Ammeter Showdown and
Sabotage & Repair. Nodes and edges, series/parallel detection, per-bulb brightness, continuity
check. Writing this once keeps the three rounds physically consistent.

---

## 6. Build order — status

All six rounds are built, wired and verified in a browser.

1. ✅ **Scaffold** — Vite + React + TS + Tailwind v4, `vercel.json`, fonts, favicon, theme.
2. ✅ **Shell** — GameContext reducer, battery Scoreboard, HostBar, Timer, SetupScreen, RoundMap.
3. ✅ **Sim** — `src/sim/circuit.ts`, covered by 16 checks in `scripts/sim-test.ts`.
4. ✅ **Round 1** Close the Loop — puzzle model covered by 13 checks in `scripts/loop-test.ts`.
5. ✅ **Round 4** Sorting Belt.
6. ✅ **Round 2** Build Battle.
7. ✅ **Round 3** Ammeter Showdown.
8. ✅ **Round 5** Sabotage & Repair.
9. ✅ **Round 6** Lightning Round + wager.
10. ✅ **Polish** — WinScreen, DebriefScreen, synthesised sound, Surge power-up, transitions.
11. ✅ **Verify** — every round played through in a browser; `npm run build` and `npm test` pass.

### Deviations from the plan above, and why

- **Build Battle is click-to-build, not HTML5 drag-and-drop.** Drag events are unreliable on
  smartboards and touch displays, which is exactly where this runs. Clicking "＋ Bulb" on a rail,
  and clicking a component to remove it, gives the same control with none of the fragility.
- **No animation library.** framer-motion was used at first and then removed: its entrances start
  at `opacity: 0` and only reach full opacity once animation frames arrive. In a backgrounded tab
  that left the screen blank. Entrances are now CSS animations with no fill-mode, so the resting
  state is always visible. Nothing about the look changed.
- **One power-up, not three.** Surge (double your next points) works in every round and is wired to
  the scoreboard. Insulate and Probe would each only have applied to a single round, so rather than
  ship two inert badges they were cut.
- **Round 2's steal replaces the "challenge".** A team that fails its brief hands the other team
  30 seconds on the same brief, which is simpler to run in a classroom than adjudicating a
  challenge and gives the trailing team a way back in.

## 7. Assumptions

- Grades 6–8. If younger, Round 3's numeric prediction becomes a pick-one from four readings.
- One shared screen, teacher-hosted. Multi-device play would need a host/player sync layer and is
  out of scope for this build.
- English only.
- No persistence between sessions — a game is one sitting.
