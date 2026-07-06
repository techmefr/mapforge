export function useAuthModal() {
    const isOpen = useState<boolean>('mf-auth-modal-open', () => false)

    function open(): void {
        isOpen.value = true
    }

    function close(): void {
        isOpen.value = false
    }

    return { isOpen, open, close }
}
