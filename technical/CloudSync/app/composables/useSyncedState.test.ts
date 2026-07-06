import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

const mockSupabase = {
    auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
        upsert: mockUpsert,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
    })),
}

mockNuxtImport('useSupabaseClient', () => () => mockSupabase)

describe('useSyncedState', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
        mockMaybeSingle.mockResolvedValue({ data: null, error: null })
        vi.useFakeTimers()
    })

    it('does not push to cloud while unauthenticated', async () => {
        const synced = useSyncedState('test-key-anon', () => ({ count: 0 }))

        synced.state.value.count = 1
        synced.persist()

        await vi.advanceTimersByTimeAsync(3000)

        expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('pushes to cloud after debounce once authenticated', async () => {
        const synced = useSyncedState('test-key-auth', () => ({ count: 0 }))
        const auth = useAuth()
        auth.init()
        await vi.advanceTimersByTimeAsync(0)
        auth.user.value = { id: 'user-1' } as never

        synced.state.value.count = 1
        synced.persist()

        await vi.advanceTimersByTimeAsync(1500)

        expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-1',
            key: 'test-key-auth',
        }))
    })

    it('replaces local state with cloud data on login when a cloud row exists', async () => {
        mockMaybeSingle.mockResolvedValue({ data: { data: { count: 99 } }, error: null })

        const synced = useSyncedState('test-key-pull', () => ({ count: 0 }))
        const auth = useAuth()
        auth.init()
        await vi.advanceTimersByTimeAsync(0)
        auth.user.value = { id: 'user-2' } as never

        await vi.waitFor(() => expect(synced.state.value.count).toBe(99))
    })
})
