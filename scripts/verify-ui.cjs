/* eslint-disable @typescript-eslint/no-require-imports -- Dependency-free Node verification of the TSX source. */
// Run with node scripts/verify-ui.cjs. No browser, credentials, or database writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const root = path.resolve(__dirname, '..')
const cache = new Map()
function sourceModule(filename) {
  const resolved = [
    filename,
    `${filename}.ts`,
    `${filename}.tsx`,
    path.join(filename, 'index.ts'),
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
  assert.ok(resolved, `Module exists: ${filename}`)
  if (resolved.endsWith('.json'))
    return JSON.parse(fs.readFileSync(resolved, 'utf8'))
  if (cache.has(resolved)) return cache.get(resolved).exports
  const module = { exports: {} }
  cache.set(resolved, module)
  const compiled = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const localRequire = (specifier) =>
    specifier.startsWith('@/')
      ? sourceModule(path.join(root, 'src', specifier.slice(2)))
      : specifier.startsWith('.')
        ? sourceModule(path.resolve(path.dirname(resolved), specifier))
        : require(specifier)
  new Function('require', 'module', 'exports', compiled)(
    localRequire,
    module,
    module.exports,
  )
  return module.exports
}

const { GENS, TOTAL_POKEMON } = sourceModule(path.join(root, 'src/lib/gens'))
const { POKEMON, pokemonForGen } = sourceModule(
  path.join(root, 'src/lib/pokemon'),
)
const { GenerationSection } = sourceModule(
  path.join(root, 'src/components/dex/generation-section'),
)
const { PokemonCard } = sourceModule(
  path.join(root, 'src/components/dex/pokemon-card'),
)
const { CollectionOverview } = sourceModule(
  path.join(root, 'src/components/dex/collection-overview'),
)
const { DexList } = sourceModule(path.join(root, 'src/components/dex/dex-list'))
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props))

assert.equal(new Set(POKEMON.map((p) => p.id)).size, POKEMON.length)
assert.equal(
  GENS.reduce((sum, g) => sum + pokemonForGen(g).length, 0),
  TOTAL_POKEMON,
)
const base = {
  gen: GENS[0],
  visible: pokemonForGen(GENS[0]),
  have: 1,
  total: GENS[0].total,
  onToggle() {},
  isCaught: (id) => id === 1,
  isFiltering: false,
}

const closed = render(GenerationSection, { ...base, open: false })
assert.doesNotMatch(closed, /<img\b/)
assert.doesNotMatch(closed, /class="pokemon-grid"/)
assert.match(closed, /aria-expanded="false"/)

const open = render(GenerationSection, {
  ...base,
  open: true,
  onTogglePokemon() {},
})
assert.equal((open.match(/<img\b/g) || []).length, GENS[0].total)
assert.equal((open.match(/loading="lazy"/g) || []).length, GENS[0].total)
assert.doesNotMatch(open, /\/_next\/image/)
assert.match(open, /aria-pressed="true"/)

const readonly = render(PokemonCard, { pokemon: POKEMON[0], caught: true })
assert.doesNotMatch(readonly, /<button\b/)
assert.match(readonly, /Shiny caught/)
const pending = render(PokemonCard, {
  pokemon: POKEMON[0],
  caught: true,
  pending: true,
  onToggle() {},
})
assert.match(pending, /disabled=""/)
assert.match(pending, /aria-busy="true"/)
assert.match(pending, /Saving/)

const generations = GENS.map((gen) => ({
  gen,
  visible: pokemonForGen(gen),
  have: gen.total,
  total: gen.total,
  open: gen === GENS[0],
}))
const summary = render(CollectionOverview, {
  caughtCount: TOTAL_POKEMON,
  generations,
})
assert.match(summary, /100\.0%/)
const loading = render(CollectionOverview, {
  caughtCount: 0,
  generations,
  loading: true,
})
assert.match(loading, /aria-busy="true"/)
assert.doesNotMatch(loading, /aria-valuenow="0"/)
const empty = render(DexList, {
  generations,
  totalMatches: 0,
  isFiltering: true,
  isCaught: () => false,
  toggleGen() {},
  onReset() {},
})
assert.match(empty, /No Pokémon found/)
assert.match(empty, /Clear filters/)
assert.doesNotMatch(empty, /<img\b/)

console.log(
  'Passed: catalogue integrity; collapsed grids unmounted; lazy direct sprites; read-only cards; pending states; completion totals; loading semantics; recoverable empty state.',
)
