const TOAST_DURATION_MS = 2400

export function useToast() {
    const message = useState<string>('mf-toast-message', () => '')
    const generation = useState<number>('mf-toast-generation', () => 0)

    function show(text: string): void {
        generation.value += 1
        const current = generation.value
        message.value = text
        setTimeout(() => {
            if (generation.value === current) message.value = ''
        }, TOAST_DURATION_MS)
    }

    return { message, show }
}
