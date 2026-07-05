export type CellShape = 'square' | 'hex'

export interface ICellGeometry {
    width: number
    height: number
    stepX: number
    stepY: number
    rowOffset: number
    clipPath: string
}

export function useCellGeometry() {
    function cellGeometry(shape: CellShape, cellPx: number): ICellGeometry {
        if (shape === 'hex') {
            const s = cellPx / Math.sqrt(3)
            const tileHeight = 2 * s
            return {
                width: cellPx,
                height: tileHeight,
                stepX: cellPx,
                stepY: 1.5 * s,
                rowOffset: cellPx / 2,
                clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)',
            }
        }

        return {
            width: cellPx,
            height: cellPx,
            stepX: cellPx,
            stepY: cellPx,
            rowOffset: 0,
            clipPath: 'none',
        }
    }

    return { cellGeometry }
}
