export type TileShape = 'square' | 'hex'
export type MapBackground = 'paper' | 'parch' | 'cork' | 'white' | 'blue' | 'dark'

export interface ITile {
    id: string
    type: string
    name: string
    art: string
}

export interface ITileset {
    id: string
    name: string
    shape: TileShape
    sizeCm: number
    prompt: string
    variants: number
    tiles: ITile[]
}

export interface IPlacedCell {
    art: string
    name: string
}

export interface IMapData {
    shape: TileShape
    sizeCm: number
    cols: number
    rows: number
    bg: MapBackground
    zoom: number
    placed: Record<string, IPlacedCell>
}

export interface IGame {
    id: string
    name: string
    open: boolean
    tilesets: ITileset[]
    map: IMapData
}

export interface IMapForgeData {
    games: IGame[]
}
