export type Gen = { key: string; name: string; start: number; end: number }

export const GENS: Gen[] = [
  { key: 'gen1', name: 'Gen 1 • Kanto',  start: 1,   end: 151 },
  { key: 'gen2', name: 'Gen 2 • Johto',  start: 152, end: 251 },
  { key: 'gen3', name: 'Gen 3 • Hoenn',  start: 252, end: 386 },
  { key: 'gen4', name: 'Gen 4 • Sinnoh', start: 387, end: 493 },
  { key: 'gen5', name: 'Gen 5 • Unova',  start: 494, end: 649 },
  { key: 'gen6', name: 'Gen 6 • Kalos',  start: 650, end: 721 },
  { key: 'gen7', name: 'Gen 7 • Alola',  start: 722, end: 809 },
  { key: 'gen8', name: 'Gen 8 • Galar',  start: 810, end: 898 },
  { key: 'gen9', name: 'Gen 9 • Paldea', start: 906, end: 1025 },
]
