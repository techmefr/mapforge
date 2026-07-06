import type { Session, User } from '@supabase/supabase-js'

let listenerAttached = false

export function useAuth() {
    const user = useState<User | null>('mf-auth-user', () => null)
    const isLoading = useState<boolean>('mf-auth-loading', () => true)
    const isAuthenticated = computed<boolean>(() => user.value !== null)

    const supabase = useSupabaseClient()

    function init(): void {
        if (import.meta.server || listenerAttached) return
        listenerAttached = true

        supabase.auth.getSession().then(({ data }) => {
            user.value = data.session?.user ?? null
            isLoading.value = false
        })

        supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            user.value = session?.user ?? null
        })
    }

    async function signInWithPassword(email: string, password: string): Promise<string | null> {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error?.message ?? null
    }

    async function signUpWithPassword(email: string, password: string): Promise<string | null> {
        const { error } = await supabase.auth.signUp({ email, password })
        return error?.message ?? null
    }

    async function signInWithMagicLink(email: string): Promise<string | null> {
        const { error } = await supabase.auth.signInWithOtp({ email })
        return error?.message ?? null
    }

    async function signInWithGoogle(): Promise<string | null> {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
        return error?.message ?? null
    }

    async function signOut(): Promise<void> {
        await supabase.auth.signOut()
    }

    return {
        user,
        isAuthenticated,
        isLoading,
        init,
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
    }
}
