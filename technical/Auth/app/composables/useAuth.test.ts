import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

type AuthChangeCallback = (event: string, session: { user: { id: string } } | null) => void

const authChangeCallbacks: AuthChangeCallback[] = []

const mockSupabase = {
    auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn((callback: AuthChangeCallback) => {
            authChangeCallbacks.push(callback)
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        signUp: vi.fn().mockResolvedValue({ error: null }),
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
    },
}

mockNuxtImport('useSupabaseClient', () => () => mockSupabase)

describe('useAuth', () => {
    beforeEach(() => {
        authChangeCallbacks.length = 0
        vi.clearAllMocks()
    })

    it('starts unauthenticated and reflects SIGNED_IN / SIGNED_OUT events', async () => {
        const auth = useAuth()
        auth.init()

        expect(auth.isAuthenticated.value).toBe(false)

        authChangeCallbacks[0]('SIGNED_IN', { user: { id: 'user-1' } })
        expect(auth.isAuthenticated.value).toBe(true)
        expect(auth.user.value?.id).toBe('user-1')

        authChangeCallbacks[0]('SIGNED_OUT', null)
        expect(auth.isAuthenticated.value).toBe(false)
        expect(auth.user.value).toBe(null)
    })

    it('returns the Supabase error message on failed sign in', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })

        const auth = useAuth()
        const error = await auth.signInWithPassword('a@b.com', 'wrong')

        expect(error).toBe('Invalid login credentials')
    })
})
