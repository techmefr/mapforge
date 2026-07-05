import type { ITerrainDef, TerrainType } from '../types/ITerrainDef'

const TERRAIN_DEFS: Record<TerrainType, ITerrainDef> = {
    grass: { label: 'Herbe', color: '#5a8f3c', base: '#4f8636', alt: '#67a046', kind: 'speck' },
    forest: { label: 'Forêt', color: '#2f6b3a', base: '#27592f', alt: '#3c7d49', kind: 'trees' },
    water: { label: 'Eau', color: '#2f74c7', base: '#2766b4', alt: '#4a93da', kind: 'waves' },
    sand: { label: 'Sable', color: '#d8b96a', base: '#d4b25e', alt: '#e3cd8c', kind: 'dots' },
    stone: { label: 'Pierre', color: '#7d808a', base: '#6f7280', alt: '#90939d', kind: 'cracks' },
    road: { label: 'Route', color: '#9a8f7a', base: '#857a66', alt: '#b3a88f', kind: 'road' },
    snow: { label: 'Neige', color: '#dfe7ef', base: '#d2dce6', alt: '#f2f6fa', kind: 'speck' },
    lava: { label: 'Lave', color: '#c0392b', base: '#8e271d', alt: '#f0853a', kind: 'lava' },
    swamp: { label: 'Marais', color: '#4a5b39', base: '#3f4f31', alt: '#5d7045', kind: 'speck' },
    brick: { label: 'Mur', color: '#9c5b46', base: '#8a4f3d', alt: '#b06d56', kind: 'brick' },
    mountain: { label: 'Montagne', color: '#6c6f78', base: '#5a5d66', alt: '#8b8e98', kind: 'mountain' },
    wood: { label: 'Bois', color: '#a9794a', base: '#956a40', alt: '#c08e5c', kind: 'wood' },
}

const KEYWORD_TO_TYPE: Record<string, TerrainType> = {
    herbe: 'grass', gazon: 'grass', prairie: 'grass', grass: 'grass', plaine: 'grass',
    foret: 'forest', 'forêt': 'forest', arbre: 'forest', bois: 'wood', forest: 'forest',
    eau: 'water', mer: 'water', riviere: 'water', 'rivière': 'water', lac: 'water', ocean: 'water', water: 'water',
    sable: 'sand', desert: 'sand', 'désert': 'sand', plage: 'sand', sand: 'sand', dune: 'sand',
    pierre: 'stone', roche: 'stone', rock: 'stone', caverne: 'stone', donjon: 'stone', dungeon: 'stone', stone: 'stone', cave: 'stone',
    route: 'road', chemin: 'road', sentier: 'road', road: 'road', path: 'road',
    neige: 'snow', glace: 'snow', snow: 'snow', ice: 'snow',
    lave: 'lava', volcan: 'lava', lava: 'lava', feu: 'lava',
    marais: 'swamp', 'marécage': 'swamp', swamp: 'swamp', boue: 'swamp',
    mur: 'brick', brique: 'brick', wall: 'brick', brick: 'brick', chateau: 'brick', 'château': 'brick',
    montagne: 'mountain', mountain: 'mountain', colline: 'mountain',
    plancher: 'wood', planche: 'wood', table: 'wood',
}

const VARIANT_SHIFTS = [0, -13, 12, 5]
const VARIANT_DENSITY = [1, 1.25, 0.78, 1.1]
const TILE_CANVAS_SIZE = 256

function createRng(seed: number): () => number {
    let s = seed >>> 0
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
    }
}

function shade(hex: string, percent: number): string {
    const n = Number.parseInt(hex.slice(1), 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    const f = percent / 100
    const channel = (c: number): number => {
        const shifted = percent < 0 ? c * (1 + f) : c + (255 - c) * f
        return Math.max(0, Math.min(255, Math.round(shifted)))
    }
    return `#${((1 << 24) + (channel(r) << 16) + (channel(g) << 8) + channel(b)).toString(16).slice(1)}`
}

export function useTerrainGenerator() {
    function terrainDefs(): Record<TerrainType, ITerrainDef> {
        return TERRAIN_DEFS
    }

    function keywordToType(word: string): TerrainType | null {
        return KEYWORD_TO_TYPE[(word || '').toLowerCase().trim()] ?? null
    }

    function promptToTypes(prompt: string): TerrainType[] {
        const types: TerrainType[] = []
        const trimmed = prompt.trim()
        if (!trimmed) return types

        trimmed.split(/[,;\n]+| et /).forEach(part => {
            part.split(/\s+/).forEach(word => {
                const type = keywordToType(word)
                if (type && !types.includes(type)) types.push(type)
            })
        })

        return types
    }

    function genTile(type: TerrainType, seed: number, variant = 0): string {
        const base0 = TERRAIN_DEFS[type] ?? TERRAIN_DEFS.grass
        const shift = VARIANT_SHIFTS[variant % 4]
        const density = VARIANT_DENSITY[variant % 4]
        const def = {
            kind: base0.kind,
            density,
            color: shade(base0.color, shift),
            base: shade(base0.base, shift),
            alt: shade(base0.alt, shift < 0 ? shift + 6 : shift),
        }

        const size = TILE_CANVAS_SIZE
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const rand = createRng(seed * 2654435761 + 7)

        const gradient = ctx.createLinearGradient(0, 0, size, size)
        gradient.addColorStop(0, def.base)
        gradient.addColorStop(1, def.color)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)

        for (let i = 0; i < 900; i++) {
            const x = rand() * size
            const y = rand() * size
            const a = rand() * 0.10
            ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`
            const s = 1 + rand() * 3
            ctx.fillRect(x, y, s, s)
        }

        const kind = def.kind
        const dm = def.density || 1

        if (kind === 'trees') {
            for (let i = 0; i < Math.round(26 * dm); i++) {
                const x = rand() * size
                const y = rand() * size
                const r = 8 + rand() * 10
                ctx.fillStyle = def.alt
                ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
                ctx.fillStyle = 'rgba(0,0,0,.18)'
                ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.3, r * 0.6, 0, 7); ctx.fill()
            }
        } else if (kind === 'waves') {
            ctx.strokeStyle = def.alt
            ctx.lineWidth = 2.4
            for (let y = 14; y < size; y += 22) {
                ctx.beginPath()
                for (let x = 0; x <= size; x += 8) ctx.lineTo(x, y + Math.sin((x / size * 6) + y) * 5)
                ctx.stroke()
            }
        } else if (kind === 'dots') {
            for (let i = 0; i < Math.round(160 * dm); i++) {
                const x = rand() * size
                const y = rand() * size
                ctx.fillStyle = rand() > 0.5 ? def.alt : 'rgba(120,90,30,.25)'
                ctx.beginPath(); ctx.arc(x, y, 1 + rand() * 2, 0, 7); ctx.fill()
            }
        } else if (kind === 'cracks') {
            ctx.strokeStyle = 'rgba(0,0,0,.28)'
            ctx.lineWidth = 2
            for (let i = 0; i < 9; i++) {
                ctx.beginPath()
                let x = rand() * size
                let y = rand() * size
                ctx.moveTo(x, y)
                for (let j = 0; j < 4; j++) {
                    x += (rand() - 0.5) * 70
                    y += (rand() - 0.5) * 70
                    ctx.lineTo(x, y)
                }
                ctx.stroke()
            }
        } else if (kind === 'road') {
            for (let i = 0; i < 120; i++) {
                const x = rand() * size
                const y = rand() * size
                ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.10)'
                ctx.fillRect(x, y, 2 + rand() * 4, 2 + rand() * 4)
            }
            ctx.fillStyle = 'rgba(0,0,0,.16)'
            ctx.fillRect(0, size / 2 - 18, size, 36)
            ctx.setLineDash([16, 12])
            ctx.strokeStyle = 'rgba(255,255,255,.55)'
            ctx.lineWidth = 3
            ctx.beginPath(); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke()
            ctx.setLineDash([])
        } else if (kind === 'lava') {
            for (let i = 0; i < Math.round(22 * dm); i++) {
                const x = rand() * size
                const y = rand() * size
                const r = 6 + rand() * 16
                const lg = ctx.createRadialGradient(x, y, 1, x, y, r)
                lg.addColorStop(0, def.alt)
                lg.addColorStop(1, 'rgba(0,0,0,0)')
                ctx.fillStyle = lg
                ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
            }
        } else if (kind === 'brick') {
            const bw = 58
            const bh = 28
            ctx.strokeStyle = 'rgba(0,0,0,.32)'
            ctx.lineWidth = 3
            let row = 0
            for (let r = 0; r < size; r += bh, row++) {
                const off = row % 2 ? bw / 2 : 0
                ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(size, r); ctx.stroke()
                for (let x = off; x < size + bw; x += bw) {
                    ctx.beginPath(); ctx.moveTo(x, r); ctx.lineTo(x, r + bh); ctx.stroke()
                }
            }
        } else if (kind === 'mountain') {
            for (let i = 0; i < Math.max(3, Math.round(5 * dm)); i++) {
                const x = rand() * size
                const h = 60 + rand() * 90
                const w = 70 + rand() * 60
                ctx.fillStyle = def.alt
                ctx.beginPath()
                ctx.moveTo(x, size); ctx.lineTo(x + w / 2, size - h); ctx.lineTo(x + w, size)
                ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,.7)'
                ctx.beginPath()
                ctx.moveTo(x + w / 2, size - h)
                ctx.lineTo(x + w / 2 - w * 0.13, size - h + h * 0.22)
                ctx.lineTo(x + w / 2 + w * 0.13, size - h + h * 0.22)
                ctx.closePath(); ctx.fill()
            }
        } else if (kind === 'wood') {
            ctx.strokeStyle = 'rgba(0,0,0,.16)'
            ctx.lineWidth = 2
            for (let x = 0; x < size; x += 42) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke()
            }
            ctx.strokeStyle = 'rgba(0,0,0,.10)'
            for (let i = 0; i < 40; i++) {
                const y = rand() * size
                const x = Math.floor(rand() * 6) * 42
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.bezierCurveTo(x + 14, y + rand() * 8, x + 28, y - rand() * 8, x + 42, y)
                ctx.stroke()
            }
        } else {
            for (let i = 0; i < Math.round(70 * dm); i++) {
                const x = rand() * size
                const y = rand() * size
                ctx.fillStyle = def.alt
                ctx.beginPath(); ctx.arc(x, y, 1 + rand() * 2.5, 0, 7); ctx.fill()
            }
        }

        const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72)
        vignette.addColorStop(0, 'rgba(0,0,0,0)')
        vignette.addColorStop(1, 'rgba(0,0,0,.22)')
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, size, size)

        return canvas.toDataURL('image/jpeg', 0.78)
    }

    return { terrainDefs, keywordToType, promptToTypes, genTile }
}
