export function spriteUrl(id: number, shiny: boolean) {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
  return shiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`
}
