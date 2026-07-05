<script setup lang="ts">
import type { TileShape } from '../../../Games/app/types/IGame'

const { PX_PER_CM } = useUnits()
const { cellGeometry } = useCellGeometry()
const { terrainDefs } = useTerrainGenerator()
const editor = useTilesetEditor()
const ai = useAiImageProvider()

const chipTypes = ['grass', 'forest', 'water', 'sand', 'stone', 'road', 'snow', 'mountain'] as const

const previewGeom = computed(() => {
    if (!editor.tileset.value) return cellGeometry('square', 0)
    const px = Math.min(editor.tileset.value.sizeCm * PX_PER_CM, 120)
    return cellGeometry(editor.tileset.value.shape, px)
})

function tileStyle(art: string) {
    const g = previewGeom.value
    return {
        width: `${g.width}px`,
        height: `${g.height}px`,
        backgroundImage: `url(${art})`,
        backgroundSize: 'cover',
        clipPath: g.clipPath,
        boxShadow: '0 4px 14px rgba(0,0,0,.45)',
        border: '1px solid rgba(255,255,255,.08)',
    }
}

function onSetShape(shape: TileShape): void {
    editor.setShape(shape)
}
</script>

<template>
    <div v-if="editor.tileset.value" class="flex min-h-0 flex-1">
        <div class="flex w-[330px] flex-none flex-col overflow-y-auto border-r border-mf-border bg-mf-panel">
            <div class="px-4.5 pb-1.5 pt-4.5">
                <input
                    :value="editor.tileset.value.name"
                    placeholder="Nom du tileset"
                    class="w-full border-b border-transparent bg-transparent pb-1 font-display text-lg font-extrabold text-white"
                    @input="editor.setName(($event.target as HTMLInputElement).value)"
                >
                <div class="mt-0.5 text-xs text-mf-muted2">{{ editor.tileset.value.tiles.length }} tuile(s)</div>
            </div>

            <div class="mt-2 border-t border-[#1a1d24] px-4.5 py-3.5">
                <div class="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-mf-muted2">Forme &amp; taille</div>
                <div class="mb-3.5 flex gap-2">
                    <button
                        class="flex h-[60px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[9px] border text-mf-text2"
                        :class="editor.tileset.value.shape === 'square' ? 'border-mf-accent bg-[rgba(124,122,255,.10)]' : 'border-mf-border2 bg-mf-surface'"
                        @click="onSetShape('square')"
                    >
                        <div class="h-[22px] w-[22px] rounded-[3px] border-2" :class="editor.tileset.value.shape === 'square' ? 'border-mf-accent' : 'border-[#7a7f8b]'" />
                        <span class="text-[11.5px] font-semibold">Carré</span>
                    </button>
                    <button
                        class="flex h-[60px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[9px] border text-mf-text2"
                        :class="editor.tileset.value.shape === 'hex' ? 'border-mf-accent bg-[rgba(124,122,255,.10)]' : 'border-mf-border2 bg-mf-surface'"
                        @click="onSetShape('hex')"
                    >
                        <div
                            class="h-6 w-[22px]"
                            :class="editor.tileset.value.shape === 'hex' ? 'bg-mf-accent' : 'bg-[#7a7f8b]'"
                            style="clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)"
                        />
                        <span class="text-[11.5px] font-semibold">Hexagone</span>
                    </button>
                </div>
                <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] text-mf-muted">Taille de tuile</span>
                    <span class="text-[12.5px] font-bold tabular-nums text-mf-accentsoft">{{ editor.tileset.value.sizeCm.toString().replace('.0', '') }} cm</span>
                </div>
                <input
                    type="range" min="2" max="8" step="0.5"
                    :value="editor.tileset.value.sizeCm"
                    class="w-full accent-mf-accent"
                    @input="editor.setSizeCm(Number(($event.target as HTMLInputElement).value))"
                >
                <div class="mt-0.5 flex justify-between text-[10px] text-mf-faint"><span>2 cm</span><span>8 cm</span></div>
            </div>

            <div class="border-t border-[#1a1d24] px-4.5 py-3.5">
                <div class="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-mf-muted2">Générer des tuiles</div>
                <textarea
                    :value="editor.tileset.value.prompt"
                    placeholder="ex : herbe, forêt, eau, pierre, route, sable…"
                    class="h-[62px] w-full resize-none rounded-[9px] border border-mf-border2 bg-mf-surface px-2.5 py-2.5 text-[13px] leading-[1.45] text-mf-text"
                    @input="editor.setPrompt(($event.target as HTMLTextAreaElement).value)"
                />
                <div class="my-2.5 flex flex-wrap gap-1.5">
                    <button
                        v-for="key in chipTypes" :key="key"
                        class="flex h-[26px] items-center gap-1 rounded-full border border-mf-border2 bg-mf-surface px-2.5 text-[11.5px] font-semibold text-mf-text2"
                        @click="editor.addPromptKeyword(terrainDefs()[key].label)"
                    >
                        <span class="h-[11px] w-[11px] rounded-[3px]" :style="{ background: terrainDefs()[key].color }" />{{ terrainDefs()[key].label }}
                    </button>
                </div>
                <div class="mb-2.5 flex items-center gap-2.5">
                    <span class="flex-1 text-[12.5px] text-mf-muted">Variantes</span>
                    <div class="flex items-center rounded-lg border border-mf-border2 bg-mf-surface">
                        <button class="h-7 w-7 border-none bg-transparent text-base text-mf-muted" @click="editor.decVariants">−</button>
                        <span class="w-6 text-center text-[13px] font-bold tabular-nums">{{ editor.tileset.value.variants }}</span>
                        <button class="h-7 w-7 border-none bg-transparent text-base text-mf-muted" @click="editor.incVariants">+</button>
                    </div>
                </div>
                <button
                    class="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] border-none bg-gradient-to-br from-mf-accent to-mf-accent2 text-[13.5px] font-bold text-white shadow-[0_4px_14px_rgba(99,91,255,.35)]"
                    @click="editor.generate"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" fill="#fff" /></svg>
                    Générer
                </button>

                <button
                    class="mt-3 flex w-full items-center gap-1.5 border-none bg-transparent p-0 text-[11.5px] font-semibold text-mf-muted2"
                    @click="ai.isOpen.value = !ai.isOpen.value"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="transition-transform" :class="ai.isOpen.value ? 'rotate-90' : 'rotate-0'">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                    </svg>
                    Connecter une IA d'image (Gemini / OpenAI)
                </button>
                <div v-if="ai.isOpen.value" class="mt-2.5 rounded-[9px] border border-[#222631] bg-[#121419] p-2.5">
                    <div class="mb-2 flex gap-1.5">
                        <button
                            class="h-7 flex-1 rounded-md border text-[11.5px] font-semibold text-mf-text2"
                            :class="ai.providerId.value === 'gemini' ? 'border-mf-accent bg-[rgba(124,122,255,.10)]' : 'border-mf-border2 bg-mf-surface'"
                            @click="ai.selectProvider('gemini')"
                        >
                            Gemini
                        </button>
                        <button
                            class="h-7 flex-1 rounded-md border text-[11.5px] font-semibold text-mf-text2"
                            :class="ai.providerId.value === 'openai' ? 'border-mf-accent bg-[rgba(124,122,255,.10)]' : 'border-mf-border2 bg-mf-surface'"
                            @click="ai.selectProvider('openai')"
                        >
                            OpenAI
                        </button>
                    </div>
                    <input
                        v-model="ai.apiKey.value"
                        type="password"
                        placeholder="Coller la clé API…"
                        class="h-8 w-full rounded-[7px] border border-mf-border2 bg-mf-surface px-2.5 text-xs text-mf-text"
                    >
                    <div class="mt-1.5 text-[10.5px] leading-relaxed text-mf-faint">
                        La clé reste sur ton appareil. Mode démo actif : les tuiles sont générées localement (terrains procéduraux) en attendant la connexion live.
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-6">
            <div v-if="editor.tileset.value.tiles.length > 0" class="flex flex-wrap content-start gap-4.5">
                <div v-for="tile in editor.tileset.value.tiles" :key="tile.id" class="flex flex-col items-center gap-2" style="animation: mf-pop .2s ease">
                    <div class="mf-tile-btn relative flex items-center justify-center" :style="{ width: `${Math.max(previewGeom.width, previewGeom.height)}px`, height: `${Math.max(previewGeom.width, previewGeom.height)}px` }">
                        <div :style="tileStyle(tile.art)" />
                        <button
                            class="mf-tile-del absolute -right-1.5 -top-1.5 h-[22px] w-[22px] rounded-full border-none bg-mf-surface2 text-sm leading-none text-[#ff7a7a] opacity-0 shadow-[0_2px_6px_rgba(0,0,0,.5)] transition-opacity"
                            @click="editor.deleteTile(tile.id)"
                        >
                            ×
                        </button>
                    </div>
                    <span class="text-[11.5px] font-semibold text-mf-muted">{{ tile.name }}</span>
                </div>
            </div>
            <div v-else class="flex h-full flex-col items-center justify-center gap-3.5 text-mf-faint">
                <div class="flex h-[54px] w-[54px] items-center justify-center rounded-[13px] border border-[#22262f] bg-[#14161c]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" stroke="#7c7aff" stroke-width="1.4" stroke-linejoin="round" /></svg>
                </div>
                <div class="max-w-[280px] text-center">Aucune tuile encore. Décris un terrain à gauche et clique <b class="text-mf-accentsoft">Générer</b>.</div>
            </div>
        </div>
    </div>
</template>
