export type PageFormat = 'A4' | 'A3'

export interface IPrintPageCell<T> {
    left: number
    top: number
    width: number
    height: number
    clipPath: string
    data: T
}

export interface IPrintPage<T> {
    widthPx: number
    heightPx: number
    innerLeftPx: number
    innerTopPx: number
    innerWidthPx: number
    innerHeightPx: number
    cells: IPrintPageCell<T>[]
    cropMarkStyles: string[]
    label: string
}

export interface IPrintPaginationOptions<T> {
    shape: 'square' | 'hex'
    cols: number
    rows: number
    cellSizeCm: number
    pageFormat: PageFormat
    cropMarks: boolean
    marginMm?: number
    getCell: (col: number, row: number) => T | undefined
}
