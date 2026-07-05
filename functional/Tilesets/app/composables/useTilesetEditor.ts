import type { TileShape } from '../../../Games/app/types/IGame'
import type { TerrainType } from '../types/ITerrainDef'

const FALLBACK_TYPES: TerrainType[] = ['grass', 'forest', 'water', 'stone', 'sand', 'road']

function themedPrompt(terrainLabel: string, theme: string): string {
    const base = `Seamless top-down RPG game tile texture, ${terrainLabel} terrain, square tile, no text, no border, no watermark, digital painting`
    return theme.trim() ? `${base}, theme: ${theme.trim()}` : base
}

export function useTilesetEditor() {
    const store = useGamesStore()
    const { genTile, promptToTypes, terrainDefs } = useTerrainGenerator()
    const { show } = useToast()
    const ai = useAiImageProvider()

    const tileset = computed(() => store.currentTileset)
    const isGenerating = ref(false)

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

    async function generate(): Promise<void> {
        if (!tileset.value || isGenerating.value) return
        const defs = terrainDefs()
        const variants = tileset.value.variants || 4
        const prompt = tileset.value.prompt || ''
        const useAi = ai.isConfigured.value

        let types = promptToTypes(prompt)
        if (types.length === 0) {
            types = [FALLBACK_TYPES[Math.floor(Math.random() * FALLBACK_TYPES.length)]]
        }

        isGenerating.value = true
        try {
            const newTiles: typeof tileset.value.tiles = []
            let aiFailures = 0

            for (const type of types) {
                for (let variant = 0; variant < variants; variant++) {
                    const seed = Math.floor(Math.random() * 1e9)
                    let art: string | null = null

                    if (useAi) {
                        art = await ai.generateOrNull(themedPrompt(defs[type].label, prompt))
                        if (!art) aiFailures++
                    }

                    newTiles.push({
                        id: crypto.randomUUID(),
                        type,
                        name: variants > 1 ? `${defs[type].label} ${variant + 1}` : defs[type].label,
                        art: art ?? genTile(type, seed, variant),
                    })
                }
            }

            tileset.value.tiles.push(...newTiles)

            if (useAi && aiFailures > 0) {
                show(`${newTiles.length} tuile(s) générée(s) (${aiFailures} en mode démo, Nano Banana indisponible)`)
            } else {
                show(`${newTiles.length} tuile(s) générée(s)`)
            }
        } finally {
            isGenerating.value = false
        }
    }

    return {
        tileset,
        isGenerating,
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
