<script setup lang="ts">
import type { TileShape } from '../../../Games/app/types/IGame'

const { cellGeometry } = useCellGeometry()
const editor = useMapEditor()

const paletteGeometry = computed(() => {
    if (!editor.map.value) return cellGeometry('square', 0)
    return cellGeometry(editor.map.value.shape, 60)
})

const boardSize = computed(() => {
    const g = editor.geometry.value
    if (!editor.map.value) return { width: 0, height: 0 }
    const width = (editor.map.value.cols - 1) * g.stepX + g.width + (g.rowOffset > 0 ? g.rowOffset : 0)
    const height = (editor.map.value.rows - 1) * g.stepY + g.height
    return { width, height }
})

interface ICellView {
    key: string
    style: Record<string, string>
}

const cells = computed<ICellView[]>(() => {
    if (!editor.map.value) return []
    const g = editor.geometry.value
    const bg = editor.backgroundStyle(editor.map.value.bg)
    const list: ICellView[] = []

    for (let row = 0; row < editor.map.value.rows; row++) {
        for (let col = 0; col < editor.map.value.cols; col++) {
            const key = `${col},${row}`
            const placed = editor.map.value.placed[key]
            const left = col * g.stepX + (row % 2 ? g.rowOffset : 0)
            const top = row * g.stepY

            const style: Record<string, string> = {
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${g.width}px`,
                height: `${g.height}px`,
                clipPath: g.clipPath,
                boxSizing: 'border-box',
                cursor: editor.tool.value === 'erase' ? 'cell' : 'crosshair',
            }
            if (placed) {
                style.backgroundImage = `url(${placed.art})`
                style.backgroundSize = 'cover'
            } else {
                style.background = bg.base
                style.outline = `1px solid ${bg.line}`
                style.outlineOffset = '-1px'
            }
            if (g.clipPath === 'none') {
                style.border = `1px solid ${placed ? 'rgba(0,0,0,.10)' : bg.line}`
            }

            list.push({ key, style })
        }
    }

    return list
})

function onMouseUpWindow(): void {
    if (editor.painting.value) editor.endPaint()
}

onMounted(() => window.addEventListener('mouseup', onMouseUpWindow))
onUnmounted(() => window.removeEventListener('mouseup', onMouseUpWindow))

function onSetShape(shape: TileShape): void {
    editor.setShape(shape)
}
</script>

<template>
    <div v-if="editor.map.value" class="flex min-h-0 flex-1 flex-col">
        <div class="flex h-[54px] flex-none items-center gap-3.5 border-b border-mf-border bg-mf-panel px-4">
            <div class="flex gap-1 rounded-[9px] border border-[#222631] bg-mf-surface p-[3px]">
                <button
                    title="Poser"
                    class="flex h-[30px] w-[34px] items-center justify-center rounded-md border-none"
                    :class="editor.tool.value === 'paint' ? 'bg-[rgba(124,122,255,.18)] text-[#cdc9ff]' : 'bg-transparent text-mf-muted'"
                    @click="editor.setToolPaint"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><path d="M14 7l3-3 2 2-3 3" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
                </button>
                <button
                    title="Gomme"
                    class="flex h-[30px] w-[34px] items-center justify-center rounded-md border-none"
                    :class="editor.tool.value === 'erase' ? 'bg-[rgba(255,138,138,.16)] text-[#ff9a9a]' : 'bg-transparent text-mf-muted'"
                    @click="editor.setToolErase"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 14l6-6 8 8-4 4H8l-4-4 0-2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><path d="M10 8l6 6" stroke="currentColor" stroke-width="1.7" /></svg>
                </button>
            </div>

            <div class="h-6 w-px bg-[#222631]" />
            <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-mf-muted2">Fond</span>
            <div class="flex gap-1.5">
                <button
                    v-for="bg in editor.backgroundOptions" :key="bg.id"
                    :title="bg.name"
                    class="h-[26px] w-[26px] rounded-[7px] border-2"
                    :style="{ background: editor.backgroundStyle(bg.id).base, borderColor: editor.map.value.bg === bg.id ? '#7c7aff' : '#2a2e38' }"
                    @click="editor.setBackground(bg.id)"
                />
            </div>

            <div class="h-6 w-px bg-[#222631]" />
            <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-mf-muted2">Forme</span>
            <div class="flex gap-1 rounded-lg border border-[#222631] bg-mf-surface p-[3px]">
                <button
                    title="Carré"
                    class="flex h-[26px] w-[30px] items-center justify-center rounded border-none"
                    :class="editor.map.value.shape === 'square' ? 'bg-[rgba(124,122,255,.18)]' : 'bg-transparent'"
                    @click="onSetShape('square')"
                >
                    <div class="h-[15px] w-[15px] rounded-[2px] border-2" :style="{ borderColor: editor.map.value.shape === 'square' ? '#cdc9ff' : '#7a7f8b' }" />
                </button>
                <button
                    title="Hexagone"
                    class="flex h-[26px] w-[30px] items-center justify-center rounded border-none"
                    :class="editor.map.value.shape === 'hex' ? 'bg-[rgba(124,122,255,.18)]' : 'bg-transparent'"
                    @click="onSetShape('hex')"
                >
                    <div
                        class="h-[17px] w-[15px]"
                        :style="{ background: editor.map.value.shape === 'hex' ? '#cdc9ff' : '#7a7f8b', clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }"
                    />
                </button>
            </div>

            <div class="h-6 w-px bg-[#222631]" />
            <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-mf-muted2">Grille</span>
            <div class="flex items-center gap-2 text-[12.5px] text-mf-muted">
                <button class="h-6 w-6 rounded-md border border-mf-border2 bg-mf-surface text-sm leading-none text-mf-muted" @click="editor.lessColumns">−</button>
                <span class="min-w-[54px] text-center tabular-nums">{{ editor.map.value.cols }}×{{ editor.map.value.rows }}</span>
                <button class="h-6 w-6 rounded-md border border-mf-border2 bg-mf-surface text-sm leading-none text-mf-muted" @click="editor.moreColumns">+</button>
            </div>

            <div class="flex-1" />
            <button class="h-7 w-7 rounded-md border border-mf-border2 bg-mf-surface text-[15px] text-mf-muted" @click="editor.zoomOut">−</button>
            <span class="w-[42px] text-center text-xs tabular-nums text-mf-muted">{{ Math.round((editor.map.value.zoom || 0.7) * 100) }}%</span>
            <button class="h-7 w-7 rounded-md border border-mf-border2 bg-mf-surface text-[15px] text-mf-muted" @click="editor.zoomIn">+</button>
            <div class="h-6 w-px bg-[#222631]" />
            <button class="h-[30px] rounded-md border border-[#3a2530] bg-[#1d1418] px-3 text-xs font-semibold text-[#ff8a8a]" @click="editor.clear">Vider</button>
        </div>

        <div class="flex min-h-0 flex-1">
            <div class="w-[124px] flex-none overflow-y-auto border-r border-mf-border bg-mf-panel py-3.5">
                <div class="px-3.5 pb-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-mf-muted2">Palette</div>
                <div v-if="editor.palette.value.length > 0" class="flex flex-col items-center gap-3">
                    <button
                        v-for="tile in editor.palette.value" :key="tile.art + tile.name"
                        :title="tile.name"
                        class="relative flex h-[66px] w-[66px] items-center justify-center border-none bg-transparent p-0"
                        @click="editor.pickPalette(tile.art, tile.name)"
                    >
                        <div
                            :style="{
                                width: '60px',
                                height: `${paletteGeometry.height}px`,
                                backgroundImage: `url(${tile.art})`,
                                backgroundSize: 'cover',
                                clipPath: paletteGeometry.clipPath,
                                boxShadow: editor.paintArt.value === tile.art ? '0 0 0 3px #7c7aff' : '0 0 0 1px rgba(255,255,255,.10)',
                            }"
                        />
                    </button>
                </div>
                <div v-else class="px-3.5 text-[11.5px] leading-relaxed text-mf-faint">Génère des tuiles dans un tileset pour les poser ici.</div>
            </div>

            <div class="flex flex-1 items-start justify-center overflow-auto bg-mf-panel2 p-10" style="background-image: radial-gradient(#1a1d24 1px, transparent 1px); background-size: 22px 22px">
                <div
                    class="relative rounded-[2px] shadow-[0_12px_50px_rgba(0,0,0,.5)]"
                    :style="{ width: `${boardSize.width}px`, height: `${boardSize.height}px`, background: editor.backgroundStyle(editor.map.value.bg).base }"
                    @mouseleave="editor.endPaint"
                >
                    <div
                        v-for="cell in cells" :key="cell.key"
                        :style="cell.style"
                        @mousedown="editor.startPaint(cell.key)"
                        @mouseenter="editor.enterCell(cell.key)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
