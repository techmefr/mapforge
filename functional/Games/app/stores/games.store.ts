import { defineStore } from 'pinia'
import type { IGame, IMapForgeData, ITileset } from '../types/IGame'

export type SelectionType = 'tileset' | 'map' | null

export interface ISelection {
    gameId: string | null
    type: SelectionType
    tilesetId?: string
}

function createDemoGame(): IGame {
    const { genTile } = useTerrainGenerator()
    const demoTypes: Array<[ITileset['tiles'][number]['type'], number]> = [
        ['grass', 11], ['water', 37], ['stone', 23], ['forest', 51], ['road', 67], ['sand', 83],
    ]
    const labels: Record<string, string> = {
        grass: 'Herbe', water: 'Eau', stone: 'Pierre', forest: 'Forêt', road: 'Route', sand: 'Sable',
    }

    const tiles: ITileset['tiles'] = []
    const byType: Record<string, ITileset['tiles']> = {}
    demoTypes.forEach(([type, base]) => {
        byType[type] = []
        for (let variant = 0; variant < 4; variant++) {
            const tile = {
                id: crypto.randomUUID(),
                type,
                name: `${labels[type]} ${variant + 1}`,
                art: genTile(type, base * 7 + variant * 131, variant),
            }
            tiles.push(tile)
            byType[type].push(tile)
        }
    })

    const pick = (type: string) => byType[type][Math.floor(Math.random() * byType[type].length)]
    const placed: IGame['map']['placed'] = {}
    const put = (col: number, row: number, type: string) => {
        const tile = pick(type)
        placed[`${col},${row}`] = { art: tile.art, name: tile.name }
    }

    for (let col = 0; col < 12; col++) for (let row = 0; row < 9; row++) put(col, row, 'grass')
    for (let col = 3; col < 9; col++) put(col, 4, 'road')
    put(2, 2, 'stone'); put(2, 3, 'stone'); put(3, 2, 'stone'); put(3, 3, 'stone')
    put(9, 6, 'water'); put(10, 6, 'water'); put(9, 7, 'water'); put(10, 7, 'water')
    put(6, 1, 'forest'); put(7, 1, 'forest'); put(6, 7, 'forest')

    return {
        id: crypto.randomUUID(),
        name: 'Donjon Express',
        open: true,
        tilesets: [{ id: crypto.randomUUID(), name: 'Terrains', shape: 'square', sizeCm: 3, prompt: '', variants: 4, tiles }],
        map: { shape: 'square', sizeCm: 3, cols: 12, rows: 9, bg: 'paper', zoom: 0.7, placed },
    }
}

function firstSelection(data: IMapForgeData): ISelection {
    const game = data.games[0]
    if (game?.tilesets[0]) return { gameId: game.id, type: 'tileset', tilesetId: game.tilesets[0].id }
    return { gameId: null, type: null }
}

export const useGamesStore = defineStore('games', () => {
    const { state: data, persist } = usePersistedState<IMapForgeData>('mapforge-data', () => ({
        games: [createDemoGame()],
    }))
    const selection = ref<ISelection>(firstSelection(data.value))

    watch(data, persist, { deep: true })

    const currentGame = computed<IGame | null>(() =>
        data.value.games.find(g => g.id === selection.value.gameId) ?? null,
    )

    const currentTileset = computed<ITileset | null>(() => {
        if (!currentGame.value || selection.value.type !== 'tileset') return null
        return currentGame.value.tilesets.find(t => t.id === selection.value.tilesetId) ?? null
    })

    function createGame(): void {
        const game: IGame = {
            id: crypto.randomUUID(),
            name: 'Nouveau jeu',
            open: true,
            tilesets: [],
            map: { shape: 'square', sizeCm: 3, cols: 10, rows: 8, bg: 'paper', zoom: 0.7, placed: {} },
        }
        data.value.games.push(game)
        selection.value = { gameId: game.id, type: null }
        useToast().show('Jeu créé')
    }

    function toggleGameOpen(gameId: string): void {
        const game = data.value.games.find(g => g.id === gameId)
        if (game) game.open = !game.open
    }

    function addTileset(gameId: string): string | null {
        const game = data.value.games.find(g => g.id === gameId)
        if (!game) return null

        const tileset: ITileset = {
            id: crypto.randomUUID(),
            name: `Tileset ${game.tilesets.length + 1}`,
            shape: 'square',
            sizeCm: 3,
            prompt: '',
            variants: 4,
            tiles: [],
        }
        game.open = true
        game.tilesets.push(tileset)
        selection.value = { gameId, type: 'tileset', tilesetId: tileset.id }
        return tileset.id
    }

    function deleteTileset(gameId: string, tilesetId: string): void {
        const game = data.value.games.find(g => g.id === gameId)
        if (!game) return

        game.tilesets = game.tilesets.filter(t => t.id !== tilesetId)
        if (selection.value.gameId === gameId && selection.value.tilesetId === tilesetId) {
            selection.value = { gameId, type: null }
        }
    }

    function selectTileset(gameId: string, tilesetId: string): void {
        selection.value = { gameId, type: 'tileset', tilesetId }
    }

    function selectMap(gameId: string): void {
        selection.value = { gameId, type: 'map' }
    }

    return {
        data,
        selection,
        currentGame,
        currentTileset,
        createGame,
        toggleGameOpen,
        addTileset,
        deleteTileset,
        selectTileset,
        selectMap,
    }
})
