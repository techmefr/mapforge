export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    ssr: false,
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
    pinia: {
        storesDirs: ['./stores/**'],
    },
    css: ['~/assets/css/main.css'],
    extends: [
        './technical/Storage',
        './technical/AiImageProviders',
        './technical/PrintLayout',
        './technical/Notifications',
        './functional/Games',
        './functional/Tilesets',
        './functional/Maps',
    ],
    app: {
        head: {
            title: 'MapForge',
            link: [
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap',
                },
            ],
        },
    },
})
