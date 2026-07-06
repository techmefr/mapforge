<script setup lang="ts">
const auth = useAuth()
const authModal = useAuthModal()
const toast = useToast()

const mode = ref<'password' | 'magic-link'>('password')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

async function submitPassword(): Promise<void> {
    isSubmitting.value = true
    try {
        const error = await auth.signInWithPassword(email.value, password.value)
        if (error) {
            toast.show(error)
            return
        }
        authModal.close()
    } finally {
        isSubmitting.value = false
    }
}

async function submitSignUp(): Promise<void> {
    isSubmitting.value = true
    try {
        const error = await auth.signUpWithPassword(email.value, password.value)
        toast.show(error ?? 'Compte cree, verifie tes emails pour confirmer.')
        if (!error) authModal.close()
    } finally {
        isSubmitting.value = false
    }
}

async function submitMagicLink(): Promise<void> {
    isSubmitting.value = true
    try {
        const error = await auth.signInWithMagicLink(email.value)
        toast.show(error ?? 'Lien de connexion envoye par email.')
    } finally {
        isSubmitting.value = false
    }
}

async function submitGoogle(): Promise<void> {
    const error = await auth.signInWithGoogle()
    if (error) toast.show(error)
}
</script>

<template>
    <div
        v-if="authModal.isOpen.value"
        class="fixed inset-0 z-100 flex items-center justify-center bg-black/60"
        @click.self="authModal.close"
    >
        <div class="w-[340px] rounded-xl border border-mf-border3 bg-mf-panel p-5">
            <div class="mb-4 text-base font-bold text-mf-text">Se connecter</div>

            <div class="mb-3 flex gap-2 text-[13px]">
                <button
                    class="rounded-md px-2.5 py-1"
                    :class="mode === 'password' ? 'bg-mf-surface2 text-mf-text' : 'text-mf-muted'"
                    @click="mode = 'password'"
                >
                    Mot de passe
                </button>
                <button
                    class="rounded-md px-2.5 py-1"
                    :class="mode === 'magic-link' ? 'bg-mf-surface2 text-mf-text' : 'text-mf-muted'"
                    @click="mode = 'magic-link'"
                >
                    Lien magique
                </button>
            </div>

            <input
                v-model="email"
                type="email"
                placeholder="email@exemple.com"
                class="mb-2 w-full rounded-md border border-mf-border3 bg-mf-surface px-3 py-2 text-[13px] text-mf-text"
            >

            <input
                v-if="mode === 'password'"
                v-model="password"
                type="password"
                placeholder="Mot de passe"
                class="mb-2 w-full rounded-md border border-mf-border3 bg-mf-surface px-3 py-2 text-[13px] text-mf-text"
            >

            <button
                v-if="mode === 'password'"
                :disabled="isSubmitting"
                class="mb-2 w-full rounded-md bg-mf-accent px-3 py-2 text-[13px] font-semibold text-white"
                @click="submitPassword"
            >
                Se connecter
            </button>
            <button
                v-if="mode === 'password'"
                :disabled="isSubmitting"
                class="mb-3 w-full rounded-md border border-mf-border3 px-3 py-2 text-[13px] text-mf-text"
                @click="submitSignUp"
            >
                Creer un compte
            </button>

            <button
                v-if="mode === 'magic-link'"
                :disabled="isSubmitting"
                class="mb-3 w-full rounded-md bg-mf-accent px-3 py-2 text-[13px] font-semibold text-white"
                @click="submitMagicLink"
            >
                Envoyer le lien
            </button>

            <button
                class="w-full rounded-md border border-mf-border3 px-3 py-2 text-[13px] text-mf-text"
                @click="submitGoogle"
            >
                Continuer avec Google
            </button>
        </div>
    </div>
</template>
