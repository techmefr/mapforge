import type { AiProviderId, IAiImageProvider } from '../types/IAiImageProvider'

const providers: Record<AiProviderId, IAiImageProvider> = {
    gemini: {
        id: 'gemini',
        label: 'Gemini',
        generate: async () => {
            throw new Error('Gemini image generation is not wired up yet')
        },
    },
    openai: {
        id: 'openai',
        label: 'OpenAI',
        generate: async () => {
            throw new Error('OpenAI image generation is not wired up yet')
        },
    },
}

export function useAiImageProvider() {
    const providerId = useState<AiProviderId>('mf-ai-provider-id', () => 'gemini')
    const apiKey = useState<string>('mf-ai-provider-key', () => '')
    const isOpen = useState<boolean>('mf-ai-provider-open', () => false)

    const isConfigured = computed<boolean>(() => apiKey.value.trim().length > 0)

    function selectProvider(id: AiProviderId): void {
        providerId.value = id
    }

    async function generateOrNull(prompt: string): Promise<string | null> {
        if (!isConfigured.value) return null

        try {
            return await providers[providerId.value].generate(prompt, apiKey.value)
        } catch {
            return null
        }
    }

    return { providerId, apiKey, isOpen, isConfigured, providers, selectProvider, generateOrNull }
}
