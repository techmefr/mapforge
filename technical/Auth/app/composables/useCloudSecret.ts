export function useCloudSecret(name: string) {
    const supabase = useSupabaseClient()

    async function get(): Promise<string | null> {
        const { data, error } = await supabase.rpc('get_my_secret', { name })
        if (error) return null
        return (data as string | null) ?? null
    }

    async function set(value: string): Promise<boolean> {
        const { error } = await supabase.rpc('set_my_secret', { name, value })
        return !error
    }

    return { get, set }
}
