<script setup lang="ts">
const view = usePrintView()
</script>

<template>
    <div v-if="view.isOpen.value" class="mf-app fixed inset-0 z-[200] flex flex-col bg-[#181b21]">
        <div class="flex h-14 flex-none items-center gap-4 border-b border-mf-border bg-mf-panel2 px-5">
            <span class="font-display text-[15px] font-bold">Aperçu d'impression</span>
            <div class="flex gap-1.5 rounded-[9px] border border-[#222631] bg-mf-surface p-[3px]">
                <button
                    class="h-7 rounded-md border-none px-3.5 text-[12.5px] font-semibold"
                    :class="view.pageFormat.value === 'A4' ? 'bg-[rgba(124,122,255,.18)] text-[#cdc9ff]' : 'bg-transparent text-mf-muted'"
                    @click="view.setFormat('A4')"
                >
                    A4
                </button>
                <button
                    class="h-7 rounded-md border-none px-3.5 text-[12.5px] font-semibold"
                    :class="view.pageFormat.value === 'A3' ? 'bg-[rgba(124,122,255,.18)] text-[#cdc9ff]' : 'bg-transparent text-mf-muted'"
                    @click="view.setFormat('A3')"
                >
                    A3
                </button>
            </div>
            <label class="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-mf-muted">
                <input type="checkbox" :checked="view.cropMarks.value" class="h-[15px] w-[15px] accent-mf-accent" @change="view.toggleCropMarks">
                Repères de découpe
            </label>
            <span class="text-xs text-mf-muted2">{{ view.info.value }}</span>
            <div class="flex-1" />
            <button class="h-[34px] rounded-lg border-none bg-gradient-to-br from-mf-accent to-mf-accent2 px-4.5 text-[13px] font-bold text-white" @click="view.print">
                Imprimer en PDF
            </button>
            <button class="h-[34px] rounded-lg border border-mf-border3 bg-mf-surface2 px-4 text-[13px] font-semibold text-mf-text" @click="view.close">
                Fermer
            </button>
        </div>
        <div id="mf-print-scroll" class="flex flex-1 flex-col items-center gap-6 overflow-auto p-7">
            <div
                v-for="(page, index) in view.pages.value" :key="index"
                class="mf-page relative flex-none shadow-[0_6px_30px_rgba(0,0,0,.4)]"
                :style="{ width: `${page.widthPx}px`, height: `${page.heightPx}px`, background: '#fff' }"
            >
                <div
                    class="absolute overflow-hidden"
                    :style="{ left: `${page.innerLeftPx}px`, top: `${page.innerTopPx}px`, width: `${page.innerWidthPx}px`, height: `${page.innerHeightPx}px`, background: '#f6f3ec' }"
                >
                    <div
                        v-for="(cell, cellIndex) in page.cells" :key="cellIndex"
                        :style="{ position: 'absolute', left: `${cell.left}px`, top: `${cell.top}px`, width: `${cell.width}px`, height: `${cell.height}px`, clipPath: cell.clipPath, backgroundImage: `url(${cell.data.art})`, backgroundSize: 'cover' }"
                    />
                </div>
                <div v-for="(mark, markIndex) in page.cropMarkStyles" :key="markIndex" :style="mark" />
                <div class="mf-pagelabel absolute bottom-1.5 right-2.5 font-mono text-[9px] text-[#999]">{{ page.label }}</div>
            </div>
        </div>
    </div>
</template>
