<script setup lang="ts">
const store = useGamesStore()

function isTilesetActive(gameId: string, tilesetId: string): boolean {
    return store.selection.gameId === gameId && store.selection.type === 'tileset' && store.selection.tilesetId === tilesetId
}

function isMapActive(gameId: string): boolean {
    return store.selection.gameId === gameId && store.selection.type === 'map'
}

function onDeleteTileset(event: MouseEvent, gameId: string, tilesetId: string): void {
    event.stopPropagation()
    store.deleteTileset(gameId, tilesetId)
}
</script>

<template>
    <div class="flex w-[266px] flex-none flex-col border-r border-mf-border bg-mf-panel">
        <div class="flex items-center justify-between px-3.5 pb-2.5 pt-3.5">
            <span class="text-[11px] font-bold uppercase tracking-[0.09em] text-mf-muted2">Mes jeux</span>
            <button
                title="Nouveau jeu"
                class="flex h-6 w-6 items-center justify-center rounded-md border border-mf-border2 bg-[#16181f] text-base leading-none text-mf-text2"
                @click="store.createGame"
            >
                +
            </button>
        </div>

        <div class="flex-1 overflow-y-auto px-2 pb-3">
            <div v-for="game in store.data.games" :key="game.id" class="mb-[3px]">
                <div
                    class="mf-row flex h-8 cursor-pointer items-center gap-1.5 rounded-[7px] px-1.5"
                    @click="store.toggleGameOpen(game.id)"
                >
                    <span
                        class="flex w-3.5 items-center justify-center text-mf-muted2 transition-transform"
                        :class="game.open ? 'rotate-90' : 'rotate-0'"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" class="flex-none">
                        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#9a8cff" stroke-width="1.6" />
                    </svg>
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">{{ game.name }}</span>
                    <span class="mf-rowact flex gap-0.5 opacity-0">
                        <button
                            title="Nouveau tileset"
                            class="h-5 w-5 rounded border-none bg-[#22262f] text-sm leading-none text-mf-text2"
                            @click.stop="store.addTileset(game.id)"
                        >
                            +
                        </button>
                    </span>
                </div>

                <div v-if="game.open" class="ml-3.5 mb-1 mt-px border-l border-mf-border pl-2">
                    <div
                        v-for="tileset in game.tilesets"
                        :key="tileset.id"
                        class="mf-row flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md px-2"
                        :class="isTilesetActive(game.id, tileset.id) ? 'bg-[rgba(124,122,255,.14)]' : ''"
                        @click="store.selectTileset(game.id, tileset.id)"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="flex-none">
                            <rect x="3" y="3" width="8" height="8" rx="1.5" :stroke="isTilesetActive(game.id, tileset.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.7" />
                            <rect x="13" y="3" width="8" height="8" rx="1.5" :stroke="isTilesetActive(game.id, tileset.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.7" />
                            <rect x="3" y="13" width="8" height="8" rx="1.5" :stroke="isTilesetActive(game.id, tileset.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.7" />
                            <rect x="13" y="13" width="8" height="8" rx="1.5" :stroke="isTilesetActive(game.id, tileset.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.7" />
                        </svg>
                        <span
                            class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
                            :class="isTilesetActive(game.id, tileset.id) ? 'font-bold text-[#cdc9ff]' : 'font-medium text-mf-text2'"
                        >
                            {{ tileset.name }}
                        </span>
                        <span class="text-[10.5px] tabular-nums text-mf-faint">{{ tileset.tiles.length }}</span>
                        <span class="mf-rowact opacity-0">
                            <button
                                title="Supprimer"
                                class="h-[18px] w-[18px] rounded border-none bg-transparent text-[13px] leading-none text-[#7a7f8b]"
                                @click="onDeleteTileset($event, game.id, tileset.id)"
                            >
                                ×
                            </button>
                        </span>
                    </div>

                    <div
                        class="mf-row mt-0.5 flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md px-2"
                        :class="isMapActive(game.id) ? 'bg-[rgba(124,122,255,.14)]' : ''"
                        @click="store.selectMap(game.id)"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="flex-none">
                            <path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z" :stroke="isMapActive(game.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.6" stroke-linejoin="round" />
                            <path d="M9 3v16M15 5v16" :stroke="isMapActive(game.id) ? '#7c7aff' : '#7a7f8b'" stroke-width="1.6" />
                        </svg>
                        <span class="flex-1 text-[13px]" :class="isMapActive(game.id) ? 'font-bold text-[#cdc9ff]' : 'font-medium text-mf-text2'">Carte</span>
                    </div>
                </div>
            </div>

            <button
                class="mt-1.5 flex h-8 w-full items-center gap-2 rounded-[7px] border border-dashed border-mf-border2 bg-transparent px-2 text-[13px] font-semibold text-[#7a7f8b]"
                @click="store.createGame"
            >
                <span class="text-[15px] leading-none">+</span> Nouveau jeu
            </button>
        </div>
    </div>
</template>
