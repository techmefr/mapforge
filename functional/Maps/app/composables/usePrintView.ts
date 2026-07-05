import type { PageFormat } from '../../../../technical/PrintLayout/app/types/IPrintPage'
import type { IPlacedCell } from '../../../Games/app/types/IGame'

const PAGE_STYLE_ELEMENT_ID = 'mf-page-style'

export function usePrintView() {
    const store = useGamesStore()
    const editor = useMapEditor()
    const { paginate, PAGE_SIZES_MM } = usePrintPagination()

    const isOpen = useState<boolean>('mf-print-open', () => false)
    const pageFormat = useState<PageFormat>('mf-print-format', () => 'A4')
    const cropMarks = useState<boolean>('mf-print-crop-marks', () => true)

    function applyPageStyle(): void {
        if (import.meta.server) return
        let styleEl = document.getElementById(PAGE_STYLE_ELEMENT_ID) as HTMLStyleElement | null
        if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.id = PAGE_STYLE_ELEMENT_ID
            document.head.appendChild(styleEl)
        }
        const size = PAGE_SIZES_MM[pageFormat.value]
        styleEl.textContent = `@media print{@page{size:${size.w}mm ${size.h}mm;margin:0}.mf-page{box-shadow:none!important;margin:0!important;page-break-after:always;border:none!important}.mf-pagelabel{display:none}#mf-print-scroll{padding:0!important;gap:0!important}}`
    }

    const pages = computed(() => {
        if (!editor.map.value) return []
        return paginate<IPlacedCell>({
            shape: editor.map.value.shape,
            cols: editor.map.value.cols,
            rows: editor.map.value.rows,
            cellSizeCm: editor.map.value.sizeCm,
            pageFormat: pageFormat.value,
            cropMarks: cropMarks.value,
            getCell: (col, row) => editor.map.value?.placed[`${col},${row}`],
        })
    })

    const info = computed(() => {
        if (!editor.map.value) return ''
        const sizeLabel = editor.map.value.sizeCm.toString().replace('.0', '')
        return `${pages.value.length} page(s) · échelle réelle ${sizeLabel} cm/tuile`
    })

    function open(): void {
        isOpen.value = true
        applyPageStyle()
    }

    function close(): void {
        isOpen.value = false
    }

    function setFormat(format: PageFormat): void {
        pageFormat.value = format
        applyPageStyle()
    }

    function toggleCropMarks(): void {
        cropMarks.value = !cropMarks.value
    }

    function print(): void {
        applyPageStyle()
        setTimeout(() => window.print(), 60)
    }

    return { isOpen, pageFormat, cropMarks, pages, info, open, close, setFormat, toggleCropMarks, print }
}
