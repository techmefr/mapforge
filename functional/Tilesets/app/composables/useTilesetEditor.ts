import type { TileShape } from '../../../Games/app/types/IGame'
import type { TerrainType } from '../types/ITerrainDef'

const FALLBACK_TYPES: TerrainType[] = ['grass', 'forest', 'water', 'stone', 'sand', 'road']

export function useTilesetEditor() {
    const store = useGamesStore()
    const { genTile, promptToTypes, terrainDefs } = useTerrainGenerator()
    const { show } = useToast()

    const tileset = computed(() => store.currentTileset)

    function setName(name: string): void {
        if (tileset.value) tileset.value.name = name
    }

    function setShape(shape: TileShape): void {
        if (tileset.value) tileset.value.shape = shape
    }

    function setSizeCm(sizeCm: number): void {
        if (tileset.value) tileset.value.sizeCm = sizeCm
    }

    function setPrompt(prompt: string): void {
        if (tileset.value) tileset.value.prompt = prompt
    }

    function addPromptKeyword(label: string): void {
        if (!tileset.value) return
        const lower = label.toLowerCase()
        tileset.value.prompt = tileset.value.prompt ? `${tileset.value.prompt}, ${lower}` : lower
    }

    function incVariants(): void {
        if (tileset.value) tileset.value.variants = Math.min(6, (tileset.value.variants || 1) + 1)
    }

    function decVariants(): void {
        if (tileset.value) tileset.value.variants = Math.max(1, (tileset.value.variants || 1) - 1)
    }

    function deleteTile(tileId: string): void {
        if (!tileset.value) return
        tileset.value.tiles = tileset.value.tiles.filter(tile => tile.id !== tileId)
    }

    function generate(): void {
        if (!tileset.value) return
        const defs = terrainDefs()
        const variants = tileset.value.variants || 4

        let types = promptToTypes(tileset.value.prompt || '')
        if (types.length === 0) {
            types = [FALLBACK_TYPES[Math.floor(Math.random() * FALLBACK_TYPES.length)]]
        }

        const newTiles: typeof tileset.value.tiles = []
        types.forEach(type => {
            for (let variant = 0; variant < variants; variant++) {
                const seed = Math.floor(Math.random() * 1e9)
                newTiles.push({
                    id: crypto.randomUUID(),
                    type,
                    name: variants > 1 ? `${defs[type].label} ${variant + 1}` : defs[type].label,
                    art: genTile(type, seed, variant),
                })
            }
        })

        tileset.value.tiles.push(...newTiles)
        show(`${newTiles.length} tuile(s) générée(s)`)
    }

    return {
        tileset,
        setName,
        setShape,
        setSizeCm,
        setPrompt,
        addPromptKeyword,
        incVariants,
        decVariants,
        deleteTile,
        generate,
    }
}
