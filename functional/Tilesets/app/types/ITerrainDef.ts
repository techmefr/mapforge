export type TerrainKind =
    | 'speck'
    | 'trees'
    | 'waves'
    | 'dots'
    | 'cracks'
    | 'road'
    | 'lava'
    | 'brick'
    | 'mountain'
    | 'wood'

export interface ITerrainDef {
    label: string
    color: string
    base: string
    alt: string
    kind: TerrainKind
}

export type TerrainType =
    | 'grass'
    | 'forest'
    | 'water'
    | 'sand'
    | 'stone'
    | 'road'
    | 'snow'
    | 'lava'
    | 'swamp'
    | 'brick'
    | 'mountain'
    | 'wood'
