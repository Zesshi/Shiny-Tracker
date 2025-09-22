// super tiny queue in localStorage: [{pokemon_id, caught, ts}]
const KEY = 'shinyQueue_v1'

type Item = { pokemon_id: number; caught: boolean; ts: number }

function read(): Item[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function write(items: Item[]) { localStorage.setItem(KEY, JSON.stringify(items)) }

export function enqueue(pokemon_id: number, caught: boolean) {
    const items = read()
    items.push({ pokemon_id, caught, ts: Date.now() })
    write(items)
}

export async function flushQueue(supabase: any, userId: string) {
    const items = read()
    if (!items.length) return

    // Keep the latest intent per pokemon
    const latest = new Map<number, Item>()
    for (const it of items) latest.set(it.pokemon_id, it)
    const ops = Array.from(latest.values())

    const toCatch: number[] = []
    const toUncatch: number[] = []
    for (const it of ops) (it.caught ? toCatch : toUncatch).push(it.pokemon_id)

    if (toCatch.length) {
        // bulk upsert
        const rows = toCatch.map(pokemon_id => ({ user_id: userId, pokemon_id, caught_shiny: true }))
        await supabase.from('catches').upsert(rows, { onConflict: 'user_id,pokemon_id' })
    }

    if (toUncatch.length) {
        // bulk delete (build an OR filter)
        const or = toUncatch.map(id => `pokemon_id.eq.${id}`).join(',')
        await supabase.from('catches').delete().eq('user_id', userId).or(or)
    }

    write([])
}


export function listenOnline(supabase: any, userId: string) {
    const on = async () => {
        try { await flushQueue(supabase, userId) } catch { }
    }
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
}
