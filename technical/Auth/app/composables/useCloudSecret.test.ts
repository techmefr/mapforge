import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockRpc = vi.fn()

const mockSupabase = {
    rpc: mockRpc,
}

mockNuxtImport('useSupabaseClient', () => () => mockSupabase)

describe('useCloudSecret', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('get() returns null when the RPC errors', async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

        const secret = useCloudSecret('gemini-api-key')
        const value = await secret.get()

        expect(value).toBe(null)
        expect(mockRpc).toHaveBeenCalledWith('get_my_secret', { name: 'gemini-api-key' })
    })

    it('get() returns the decrypted value on success', async () => {
        mockRpc.mockResolvedValueOnce({ data: 'sk-test-123', error: null })

        const secret = useCloudSecret('gemini-api-key')
        const value = await secret.get()

        expect(value).toBe('sk-test-123')
    })

    it('set() returns false when the RPC errors', async () => {
        mockRpc.mockResolvedValueOnce({ error: { message: 'denied' } })

        const secret = useCloudSecret('gemini-api-key')
        const ok = await secret.set('sk-test-123')

        expect(ok).toBe(false)
        expect(mockRpc).toHaveBeenCalledWith('set_my_secret', { name: 'gemini-api-key', value: 'sk-test-123' })
    })
})
