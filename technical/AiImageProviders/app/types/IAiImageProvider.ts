export type AiProviderId = 'gemini' | 'openai'

export interface IAiImageProviderConfig {
    provider: AiProviderId
    apiKey: string
}

export interface IAiImageProvider {
    id: AiProviderId
    label: string
    generate: (prompt: string, apiKey: string) => Promise<string>
}
