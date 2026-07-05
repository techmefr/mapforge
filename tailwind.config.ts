import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
    content: [],
    theme: {
        extend: {
            colors: {
                mf: {
                    bg: '#0c0d11',
                    panel: '#0e1015',
                    panel2: '#101218',
                    surface: '#15171d',
                    surface2: '#1a1d24',
                    border: '#20242d',
                    border2: '#262a33',
                    border3: '#2f343f',
                    text: '#e7e9ee',
                    text2: '#cdd1da',
                    muted: '#9a9fab',
                    muted2: '#6b7080',
                    faint: '#5d626e',
                    accent: '#7c7aff',
                    accent2: '#5b54e8',
                    accentsoft: '#9a8cff',
                },
            },
            fontFamily: {
                sans: ['Manrope', 'system-ui', 'sans-serif'],
                display: ['"Space Grotesk"', 'sans-serif'],
            },
        },
    },
}
