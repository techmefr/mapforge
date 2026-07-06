<script setup lang="ts">
const store = useGamesStore()
const toast = useToast()
const printView = usePrintView()
const auth = useAuth()

onMounted(() => {
    auth.init()
})

const view = computed<'empty' | 'tileset' | 'map'>(() => {
    if (!store.currentGame || !store.selection.type) return 'empty'
    return store.selection.type
})

const crumb = computed(() => {
    const game = store.currentGame
    if (!game) return 'Aucune sélection'
    if (store.selection.type === 'tileset') {
        const tileset = game.tilesets.find(t => t.id === store.selection.tilesetId)
        return `${game.name}  ›  ${tileset ? tileset.name : '?'}`
    }
    if (store.selection.type === 'map') return `${game.name}  ›  Carte`
    return game.name
})

const showPrint = computed(() => !!store.currentGame && store.selection.type === 'map')
</script>

<template>
    <div class="mf-app flex h-screen w-screen flex-col overflow-hidden bg-mf-bg">
        <div class="flex h-[50px] flex-none items-center gap-3.5 border-b border-mf-border bg-mf-panel2 px-4">
            <div class="flex items-center gap-2.5">
                <div class="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-gradient-to-br from-mf-accent to-mf-accent2 shadow-[0_2px_8px_rgba(99,91,255,.4)]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" />
                        <path d="M3 12l9 4 9-4M3 17l9 4 9-4" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" opacity=".7" />
                    </svg>
                </div>
                <span class="font-display text-base font-bold tracking-tight">MapForge</span>
            </div>
            <div class="h-5 w-px bg-mf-border2" />
            <div class="flex min-w-0 items-center gap-1.5 text-[13px] text-mf-muted">
                <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ crumb }}</span>
            </div>
            <div class="flex-1" />
            <button
                v-if="showPrint"
                class="flex h-8 items-center gap-1.5 rounded-lg border border-mf-border3 bg-mf-surface2 px-3.5 text-[13px] font-semibold text-mf-text"
                @click="printView.open"
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-3a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
                Imprimer / PDF
            </button>
        </div>

        <div class="flex min-h-0 flex-1">
            <GamesSidebar />

            <div class="flex min-w-0 flex-1 flex-col bg-mf-bg">
                <div v-if="view === 'empty'" class="flex flex-1 flex-col items-center justify-center gap-4.5 text-mf-faint">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#22262f] bg-[#14161c]">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M3 7l9-4 9 4-9 4-9-4z" stroke="#7c7aff" stroke-width="1.5" stroke-linejoin="round" /><path d="M3 12l9 4 9-4M3 17l9 4 9-4" stroke="#7c7aff" stroke-width="1.5" stroke-linejoin="round" opacity=".5" /></svg>
                    </div>
                    <div class="text-center">
                        <div class="text-base font-bold text-[#c5c9d2]">Sélectionne un tileset ou une carte</div>
                        <div class="mt-1.5 max-w-[340px] text-[13px]">Crée un jeu, ajoute des tilesets pour générer tes tuiles, puis assemble-les sur la carte et imprime en PDF.</div>
                    </div>
                </div>

                <TilesetEditor v-else-if="view === 'tileset'" />
                <MapEditor v-else-if="view === 'map'" />
            </div>
        </div>

        <div
            v-if="toast.message.value"
            class="fixed bottom-[22px] left-1/2 z-90 flex -translate-x-1/2 items-center gap-2.5 rounded-[10px] border border-mf-border3 bg-mf-surface2 px-4.5 py-2.5 text-[13px] font-semibold text-mf-text shadow-[0_8px_28px_rgba(0,0,0,.5)]"
            style="animation: mf-toast 2.4s ease forwards"
        >
            <span class="h-[7px] w-[7px] rounded-full bg-mf-accent" />{{ toast.message.value }}
        </div>
    </div>

    <div class="mf-print hidden">
        <PrintView />
    </div>
</template>
