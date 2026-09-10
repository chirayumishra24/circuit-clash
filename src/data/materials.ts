export interface Material {
  id: string
  name: string
  icon: string
  conductor: boolean
  /** Materials students routinely get wrong — worth testing before committing. */
  tricky?: boolean
  why: string
}

export const MATERIALS: Material[] = [
  {
    id: 'copper',
    name: 'Copper wire',
    icon: '🧵',
    conductor: true,
    why: 'Copper has free electrons that move easily, which is why almost every wire is made of it.',
  },
  {
    id: 'rubber',
    name: 'Rubber band',
    icon: '⭕',
    conductor: false,
    why: 'Rubber holds its electrons tightly — that is why it is wrapped around wires as insulation.',
  },
  {
    id: 'foil',
    name: 'Aluminium foil',
    icon: '🥡',
    conductor: true,
    why: 'Aluminium is a metal, so current passes through it easily.',
  },
  {
    id: 'glass',
    name: 'Glass marble',
    icon: '🔮',
    conductor: false,
    why: 'Glass blocks current completely, which is why it is used on power line insulators.',
  },
  {
    id: 'nail',
    name: 'Iron nail',
    icon: '🔩',
    conductor: true,
    why: 'Iron is a metal — the bulb lights right up.',
  },
  {
    id: 'wood',
    name: 'Wooden ruler',
    icon: '📏',
    conductor: false,
    why: 'Dry wood is an insulator. Wet wood is a different story.',
  },
  {
    id: 'graphite',
    name: 'Pencil lead',
    icon: '✏️',
    conductor: true,
    tricky: true,
    why: 'Pencil "lead" is graphite — a form of carbon, and one of the few non-metals that conducts.',
  },
  {
    id: 'plastic',
    name: 'Plastic straw',
    icon: '🥤',
    conductor: false,
    why: 'Plastics are insulators, which is why plugs and cases are made from them.',
  },
  {
    id: 'saltwater',
    name: 'Salt water',
    icon: '🧂',
    conductor: true,
    tricky: true,
    why: 'Dissolved salt splits into charged ions that carry current through the water.',
  },
  {
    id: 'purewater',
    name: 'Distilled water',
    icon: '💧',
    conductor: false,
    tricky: true,
    why: 'Pure water is a poor conductor. It is the dissolved salts in tap water that do the conducting.',
  },
  {
    id: 'spoon',
    name: 'Steel spoon',
    icon: '🥄',
    conductor: true,
    why: 'Steel is a metal alloy — a good conductor.',
  },
  {
    id: 'cloth',
    name: 'Cotton cloth',
    icon: '🧶',
    conductor: false,
    why: 'Dry cotton fibres carry no current.',
  },
  {
    id: 'clip',
    name: 'Paper clip',
    icon: '📎',
    conductor: true,
    why: 'A steel paper clip completes a circuit perfectly — a classic classroom test lead.',
  },
  {
    id: 'ceramic',
    name: 'Ceramic mug',
    icon: '☕',
    conductor: false,
    why: 'Ceramic is such a good insulator that it is used to mount high-voltage lines.',
  },
  {
    id: 'lemon',
    name: 'Lemon juice',
    icon: '🍋',
    conductor: true,
    tricky: true,
    why: 'Citric acid makes ions in the juice — enough to conduct, and enough to build a lemon battery.',
  },
  {
    id: 'gold',
    name: 'Gold ring',
    icon: '💍',
    conductor: true,
    why: 'Gold conducts superbly and never corrodes, so it plates the contacts in good electronics.',
  },
  {
    id: 'paper',
    name: 'Dry paper',
    icon: '📄',
    conductor: false,
    why: 'Dry paper is an insulator — damp paper is not.',
  },
  {
    id: 'air',
    name: 'Air gap',
    icon: '🌬️',
    conductor: false,
    why: 'Air is an insulator. That gap is exactly what an open switch creates.',
  },
]
