// scripts/fetch-pokemon.ts
//
// Regenerates src/data/pokemon.json. Run this after adding a generation to
// src/lib/gens.ts — the dex size is derived from the generation registry, so
// there is no separate number to keep in sync here.
import fs from 'fs'
import fetch from 'node-fetch'
import { TOTAL_POKEMON } from '../src/lib/gens'

type PokeApiListItem = { name: string; url: string }
type PokeApiList = { results: PokeApiListItem[] }

async function main() {
  const limit = TOTAL_POKEMON
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`)
  const data = (await res.json()) as PokeApiList

  const entries = data.results.map((p: PokeApiListItem, i: number) => {
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
