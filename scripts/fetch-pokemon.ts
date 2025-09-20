// scripts/fetch-pokemon.ts
import fs from 'fs'
import fetch from 'node-fetch'

async function main() {
  const limit = 1025
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`)
  const data: any = await res.json()

  const entries = data.results.map((p: any, i: number) => {
    const id = i + 1
    return {
      id,
      name: capitalize(p.name),
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    }
  })

  fs.mkdirSync('src/data', { recursive: true })
  fs.writeFileSync('src/data/pokemon.json', JSON.stringify(entries, null, 2))
  console.log('✅ Wrote src/data/pokemon.json')
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

main()
