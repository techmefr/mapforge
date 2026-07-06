const SYNC_DEBOUNCE_MS = 1500

export function useSyncedState<T>(key: string, factory: () => T) {
    const { state, persist: persistLocal } = usePersistedState<T>(key, factory)
    const { user, isAuthenticated } = useAuth()
    const supabase = useSupabaseClient()

    let syncTimer: ReturnType<typeof setTimeout> | null = null
    let pulledForUserId: string | null = null

    function persist(): void {
        persistLocal()
        schedulePush()
    }

    function schedulePush(): void {
        if (!isAuthenticated.value || !user.value) return
        if (syncTimer) clearTimeout(syncTimer)
        syncTimer = setTimeout(pushToCloud, SYNC_DEBOUNCE_MS)
    }

    async function pushToCloud(): Promise<void> {
        if (!user.value) return

        try {
            await supabase.from('user_blobs').upsert({
                user_id: user.value.id,
                key,
                data: state.value,
                updated_at: new Date().toISOString(),
            })
        } catch {
            // network/RLS failure: local copy stays authoritative, retried on next edit
        }
    }

    async function pullFromCloud(userId: string): Promise<void> {
        if (pulledForUserId === userId) return
        pulledForUserId = userId

        try {
            const { data, error } = await supabase
                .from('user_blobs')
                .select('data')
                .eq('user_id', userId)
                .eq('key', key)
                .maybeSingle()

            if (error) return

            if (data) {
                state.value = data.data as T
                persistLocal()
            } else {
                await pushToCloud()
            }
        } catch {
            // stay on local copy if cloud is unreachable
        }
    }

    watch(user, newUser => {
        if (newUser) pullFromCloud(newUser.id)
        else pulledForUserId = null
    }, { immediate: true })

    return { state, persist }
}
