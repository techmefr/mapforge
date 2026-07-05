export function usePersistedState<T>(key: string, factory: () => T) {
    const state = ref<T>(loadOrCreate(key, factory))

    function loadOrCreate(storageKey: string, createDefault: () => T): T {
        if (import.meta.server) return createDefault()

        try {
            const raw = localStorage.getItem(storageKey)
            if (raw === null) return createDefault()
            return JSON.parse(raw) as T
        } catch {
            return createDefault()
        }
    }

    function persist(): void {
        if (import.meta.server) return

        try {
            localStorage.setItem(key, JSON.stringify(state.value))
        } catch {
            // quota exceeded or storage unavailable: ignore, state stays in memory
        }
    }

    return { state, persist }
}
