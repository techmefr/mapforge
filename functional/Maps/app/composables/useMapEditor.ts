import type { MapBackground, TileShape } from '../../../Games/app/types/IGame'

export type MapTool = 'paint' | 'erase'

export interface IBackgroundStyle {
    base: string
    line: string
}

const BACKGROUNDS: Record<MapBackground, IBackgroundStyle> = {
    paper: { base: '#f6f3ec', line: 'rgba(120,110,90,.13)' },
    white: { base: '#ffffff', line: 'rgba(0,0,0,.08)' },
    cork: { base: '#c19a6b', line: 'rgba(80,55,30,.18)' },
    parch: { base: '#e9dcc0', line: 'rgba(120,95,55,.16)' },
    blue: { base: '#16314f', line: 'rgba(120,170,230,.28)' },
    dark: { base: '#23262e', line: 'rgba(255,255,255,.07)' },
}

const BACKGROUND_OPTIONS: Array<{ id: MapBackground; name: string }> = [
    { id: 'paper', name: 'Papier' },
    { id: 'parch', name: 'Parchemin' },
    { id: 'cork', name: 'Liège' },
    { id: 'white', name: 'Blanc' },
    { id: 'blue', name: 'Blueprint' },
    { id: 'dark', name: 'Ardoise' },
]

export function useMapEditor() {
    const store = useGamesStore()
    const { cellGeometry } = useCellGeometry()
    const { PX_PER_CM } = useUnits()

    const tool = useState<MapTool>('mf-map-tool', () => 'paint')
    const paintArt = useState<string | null>('mf-map-paint-art', () => null)
    const paintName = useState<string | null>('mf-map-paint-name', () => null)
    const painting = ref(false)

    const map = computed(() => store.currentGame?.map ?? null)

    function backgroundStyle(bg: MapBackground): IBackgroundStyle {
        return BACKGROUNDS[bg]
    }

    const geometry = computed(() => {
        if (!map.value) return cellGeometry('square', 0)
        const px = map.value.sizeCm * PX_PER_CM * (map.value.zoom || 0.7)
        return cellGeometry(map.value.shape, px)
    })

    const palette = computed(() => {
        if (!store.currentGame) return []
        return store.currentGame.tilesets.flatMap(tileset => tileset.tiles.map(tile => ({ art: tile.art, name: tile.name })))
    })

    function setShape(shape: TileShape): void {
        if (map.value) map.value.shape = shape
    }

    function setBackground(bg: MapBackground): void {
        if (map.value) map.value.bg = bg
    }

    function lessColumns(): void {
        if (!map.value) return
        map.value.cols = Math.max(3, map.value.cols - 1)
        map.value.rows = Math.max(3, map.value.rows - 1)
    }

    function moreColumns(): void {
        if (!map.value) return
        map.value.cols = Math.min(40, map.value.cols + 1)
        map.value.rows = Math.min(40, map.value.rows + 1)
    }

    function zoomIn(): void {
        if (map.value) map.value.zoom = Math.min(1.4, (map.value.zoom || 0.7) + 0.1)
    }

    function zoomOut(): void {
        if (map.value) map.value.zoom = Math.max(0.3, (map.value.zoom || 0.7) - 0.1)
    }

    function clear(): void {
        if (map.value) map.value.placed = {}
    }

    function setToolPaint(): void {
        tool.value = 'paint'
    }

    function setToolErase(): void {
        tool.value = 'erase'
    }

    function pickPalette(art: string, name: string): void {
        paintArt.value = art
        paintName.value = name
        tool.value = 'paint'
    }

    function place(key: string): void {
        if (!map.value) return
        if (tool.value === 'erase') {
            delete map.value.placed[key]
        } else if (paintArt.value) {
            map.value.placed[key] = { art: paintArt.value, name: paintName.value ?? '' }
        }
    }

    function startPaint(key: string): void {
        painting.value = true
        place(key)
    }

    function enterCell(key: string): void {
        if (painting.value) place(key)
    }

    function endPaint(): void {
        painting.value = false
    }

    return {
        map,
        tool,
        paintArt,
        painting,
        geometry,
        palette,
        backgroundOptions: BACKGROUND_OPTIONS,
        backgroundStyle,
        setShape,
        setBackground,
        lessColumns,
        moreColumns,
        zoomIn,
        zoomOut,
        clear,
        setToolPaint,
        setToolErase,
        pickPalette,
        startPaint,
        enterCell,
        endPaint,
    }
}
