import type { AiProviderId, IAiImageProvider } from '../types/IAiImageProvider'

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['IMAGE'] },
            }),
        },
    )

    if (!res.ok) throw new Error(`Nano Banana request failed (${res.status})`)

    const json = await res.json()
    const parts = json?.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((part: { inlineData?: { data?: string } }) => part.inlineData?.data)
    if (!imagePart) throw new Error('Nano Banana returned no image')

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
}

const providers: Record<AiProviderId, IAiImageProvider> = {
    gemini: {
        id: 'gemini',
        label: 'Gemini (Nano Banana)',
        generate: generateWithGemini,
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
