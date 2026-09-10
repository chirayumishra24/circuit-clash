export interface Question {
  id: string
  subtopic: string
  prompt: string
  options: string[]
  /** Index into `options`. */
  answer: number
  explain: string
}

/** Rapid buzzer questions, spread across all five subtopics. */
export const BUZZER_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subtopic: 'Flow of Electricity',
    prompt: 'A wire in the circuit is cut. What happens to the bulb?',
    options: ['It gets brighter', 'It goes out', 'It flickers on and off', 'Nothing changes'],
    answer: 1,
    explain: 'Current needs a complete path. Break the loop anywhere and the flow stops everywhere.',
  },
  {
    id: 'q2',
    subtopic: 'Electrical Circuits',
    prompt: 'Three bulbs are wired in series. One bulb is removed. What happens?',
    options: [
      'The other two stay lit',
      'The other two get brighter',
      'All the bulbs go out',
      'Only the middle one goes out',
    ],
    answer: 2,
    explain: 'In series there is only one path, so removing any bulb breaks the circuit for all of them.',
  },
  {
    id: 'q3',
    subtopic: 'Measuring the Flow of Current',
    prompt: 'How must an ammeter be connected to measure the current in a circuit?',
    options: ['In parallel with the bulb', 'In series with the circuit', 'Across the battery', 'Any way at all'],
    answer: 1,
    explain: 'An ammeter goes in series so all the current flows through it. In parallel it short-circuits.',
  },
  {
    id: 'q4',
    subtopic: 'Conductors and Insulators',
    prompt: 'Which of these will let the bulb light up?',
    options: ['A rubber band', 'A glass rod', 'A pencil lead', 'A dry wooden ruler'],
    answer: 2,
    explain: 'Pencil "lead" is graphite — a non-metal that conducts.',
  },
  {
    id: 'q5',
    subtopic: 'Electrical Circuits',
    prompt: 'Two bulbs are wired in parallel. One is unscrewed. What happens to the other?',
    options: ['It goes out too', 'It stays lit', 'It burns out', 'It dims to half'],
    answer: 1,
    explain: 'Parallel gives each bulb its own path, so the rest keep working — like the lights in a house.',
  },
  {
    id: 'q6',
    subtopic: 'Measuring the Flow of Current',
    prompt: 'Current is measured in which unit?',
    options: ['Volts', 'Watts', 'Amperes', 'Ohms'],
    answer: 2,
    explain: 'Amperes, or amps. Volts measure the push, ohms the resistance, watts the power.',
  },
  {
    id: 'q7',
    subtopic: 'Adding or Removing a Component',
    prompt: 'A second identical cell is added in series to a simple circuit. The bulb will…',
    options: ['Get brighter', 'Get dimmer', 'Stay exactly the same', 'Go out'],
    answer: 0,
    explain: 'More cells in series means more voltage pushing the current, so the bulb glows brighter.',
  },
  {
    id: 'q8',
    subtopic: 'Flow of Electricity',
    prompt: 'What does a switch actually do in a circuit?',
    options: [
      'It stores the electricity',
      'It makes or breaks the path',
      'It slows the current down',
      'It changes the current into light',
    ],
    answer: 1,
    explain: 'A switch is just a controlled gap: closed makes the path, open breaks it.',
  },
  {
    id: 'q9',
    subtopic: 'Adding or Removing a Component',
    prompt: 'A resistor is added to a circuit. What happens to the current?',
    options: ['It increases', 'It decreases', 'It reverses direction', 'It stays the same'],
    answer: 1,
    explain: 'Resistance opposes the flow, so the current drops and the bulb dims.',
  },
  {
    id: 'q10',
    subtopic: 'Conductors and Insulators',
    prompt: 'Why are electrical wires coated in plastic?',
    options: [
      'To make them look neat',
      'Because plastic conducts better than air',
      'To insulate them so current stays in the wire',
      'To make the current travel faster',
    ],
    answer: 2,
    explain: 'The plastic is an insulator — it keeps the current in the copper and away from you.',
  },
]

/** Higher-stakes questions for the wagered final. */
export const FINAL_QUESTIONS: Question[] = [
  {
    id: 'f1',
    subtopic: 'All Subtopics',
    prompt:
      'A circuit has a cell, a switch and two bulbs in series. You close the switch and nothing lights. Which single fault explains it best?',
    options: [
      'One bulb has blown, breaking the path',
      'The bulbs are wired in parallel',
      'The ammeter is reading in milliamperes',
      'The cell is too strong for the bulbs',
    ],
    answer: 0,
    explain:
      'In series there is one path only, so a single blown filament is an open circuit and both bulbs stay dark.',
  },
  {
    id: 'f2',
    subtopic: 'All Subtopics',
    prompt:
      'You measure 0.5 A flowing through a bulb. You then add a second identical bulb in series. The new reading will be…',
    options: ['More than 0.5 A', 'Still exactly 0.5 A', 'Less than 0.5 A', 'Zero'],
    answer: 2,
    explain:
      'A second bulb adds resistance to the single path, so less current flows and both bulbs are dimmer.',
  },
  {
    id: 'f3',
    subtopic: 'All Subtopics',
    prompt:
      'Which change would make a bulb in a simple circuit glow brighter?',
    options: [
      'Adding a resistor in series',
      'Adding a second cell in series',
      'Adding a second bulb in series',
      'Opening the switch',
    ],
    answer: 1,
    explain: 'More cells means more voltage, more current, and a brighter bulb.',
  },
]
