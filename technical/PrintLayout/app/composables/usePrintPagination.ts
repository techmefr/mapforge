import type { IPrintPage, IPrintPaginationOptions, PageFormat } from '../types/IPrintPage'

const PAGE_SIZES_MM: Record<PageFormat, { w: number; h: number }> = {
    A4: { w: 210, h: 297 },
    A3: { w: 297, h: 420 },
}

const CROP_MARK_LENGTH_PX = 14
const CROP_MARK_COLOR = '#222'

export function usePrintPagination() {
    const { PX_PER_MM } = useUnits()
    const { cellGeometry } = useCellGeometry()

    function paginate<T>(options: IPrintPaginationOptions<T>): IPrintPage<T>[] {
        const marginMm = options.marginMm ?? 8
        const pageMm = PAGE_SIZES_MM[options.pageFormat]
        const innerMm = { w: pageMm.w - 2 * marginMm, h: pageMm.h - 2 * marginMm }

        const cellPx = options.cellSizeCm * (PX_PER_MM * 10)
        const geom = cellGeometry(options.shape, cellPx)

        const innerPx = { w: innerMm.w * PX_PER_MM, h: innerMm.h * PX_PER_MM }
        const colsPerPage = Math.max(1, Math.floor((innerPx.w - geom.rowOffset) / geom.stepX))
        const rowsPerPage = Math.max(1, Math.floor((innerPx.h - (geom.height - geom.stepY)) / geom.stepY))

        const pagesX = Math.ceil(options.cols / colsPerPage)
        const pagesY = Math.ceil(options.rows / rowsPerPage)

        const pageWidthPx = pageMm.w * PX_PER_MM
        const pageHeightPx = pageMm.h * PX_PER_MM
        const marginPx = marginMm * PX_PER_MM

        const pages: IPrintPage<T>[] = []
        let pageNumber = 0

        for (let py = 0; py < pagesY; py++) {
            for (let px = 0; px < pagesX; px++) {
                pageNumber++
                const col0 = px * colsPerPage
                const row0 = py * rowsPerPage

                const cells: IPrintPage<T>['cells'] = []
                for (let row = row0; row < Math.min(row0 + rowsPerPage, options.rows); row++) {
                    for (let col = col0; col < Math.min(col0 + colsPerPage, options.cols); col++) {
                        const data = options.getCell(col, row)
                        if (data === undefined) continue

                        cells.push({
                            left: (col - col0) * geom.stepX + (row % 2 ? geom.rowOffset : 0),
                            top: (row - row0) * geom.stepY,
                            width: geom.width,
                            height: geom.height,
                            clipPath: geom.clipPath,
                            data,
                        })
                    }
                }

                const cropMarkStyles: string[] = []
                if (options.cropMarks) {
                    const corners = [
                        [marginPx, marginPx],
                        [pageWidthPx - marginPx, marginPx],
                        [marginPx, pageHeightPx - marginPx],
                        [pageWidthPx - marginPx, pageHeightPx - marginPx],
                    ]
                    corners.forEach(([x, y]) => {
                        cropMarkStyles.push(
                            `position:absolute;left:${x - CROP_MARK_LENGTH_PX}px;top:${y}px;width:${CROP_MARK_LENGTH_PX}px;height:1px;background:${CROP_MARK_COLOR}`,
                        )
                        cropMarkStyles.push(
                            `position:absolute;left:${x}px;top:${y - CROP_MARK_LENGTH_PX}px;width:1px;height:${CROP_MARK_LENGTH_PX}px;background:${CROP_MARK_COLOR}`,
                        )
                    })
                }

                pages.push({
                    widthPx: pageWidthPx,
                    heightPx: pageHeightPx,
                    innerLeftPx: marginPx,
                    innerTopPx: marginPx,
                    innerWidthPx: innerPx.w,
                    innerHeightPx: innerPx.h,
                    cells,
                    cropMarkStyles,
                    label: `${options.pageFormat} · page ${pageNumber}/${pagesX * pagesY}`,
                })
            }
        }

        return pages
    }

    return { paginate, PAGE_SIZES_MM }
}
