# Auth Supabase + sync cloud/local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional Supabase authentication (email/password, magic link, Google OAuth) with a minimal login UI, and make all app data (`IMapForgeData` blob) plus a future AI-provider API key sync to Supabase when logged in, while remaining fully usable offline/local when not.

**Architecture:** Two new Nuxt layers following the existing `technical/*` pattern: `technical/Auth` (Supabase client singleton + session/login composables, no knowledge of app data) and `technical/CloudSync` (generic `useSyncedState` composable, drop-in replacement for `usePersistedState`, that debounce-pushes to a Supabase `user_blobs` table and pulls-with-cloud-wins on login). `functional/Games/app/stores/games.store.ts` swaps to `useSyncedState`. A `user_secrets` + Supabase Vault schema backs a `useCloudSecret` composable for the encrypted API key (UI for it lands in a later spec).

**Tech Stack:** Nuxt 4 (SPA, `ssr:false`), Pinia, `@supabase/supabase-js`, Supabase Postgres + Auth + Vault, Vitest + `@nuxt/test-utils` for composable tests.

---

## Before you start

Repo root for all paths below: `/home/gaetan/code/project/mapforge/mapforge`.
Supabase project: id `hswmrxrvsmlknyhkniwx` (name "mapforge", already ACTIVE, `supabase_vault` extension already installed, `public` schema currently empty, `auth.users` schema present with 0 rows). Env vars `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY` are already set in `.env` at repo root but not yet wired into `runtimeConfig` (Nuxt only maps `NUXT_*` env vars onto declared `runtimeConfig` keys, and none exist yet — Task 2 adds them).

---

### Task 1: Test infra (Vitest + `@nuxt/test-utils`)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

No test runner exists in this project yet. Add one before writing any composable tests.

- [ ] **Step 1: Add dependencies**

Run:
```bash
pnpm add -D vitest @nuxt/test-utils @vue/test-utils happy-dom
pnpm add @supabase/supabase-js
```

- [ ] **Step 2: Add `vitest.config.ts`**

```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
    test: {
        environment: 'nuxt',
    },
})
```

- [ ] **Step 3: Add a `test` script**

Modify `package.json` scripts block, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Verify the harness boots**

Run: `pnpm test`
Expected: exits 0 with "No test files found" (no test files exist yet — this just proves the Nuxt vitest environment boots without config errors).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest + nuxt test-utils, add supabase-js dependency"
```

---

### Task 2: Supabase client singleton (`technical/Auth` layer, part 1)

**Files:**
- Create: `technical/Auth/nuxt.config.ts`
- Create: `technical/Auth/app/composables/useSupabaseClient.ts`
- Create: `technical/Auth/README.md`
- Modify: `nuxt.config.ts:1-25` (root — add layer to `extends`)

- [ ] **Step 1: Create the layer config with runtime config**

`technical/Auth/nuxt.config.ts`:
```ts
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            supabaseUrl: '',
            supabaseKey: '',
        },
    },
})
```

- [ ] **Step 2: Create the Supabase client composable**

`technical/Auth/app/composables/useSupabaseClient.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function useSupabaseClient(): SupabaseClient {
    if (client) return client

    const config = useRuntimeConfig()
    client = createClient(config.public.supabaseUrl, config.public.supabaseKey)
    return client
}
```

- [ ] **Step 3: Register the layer in the root config**

Modify `nuxt.config.ts`, add `'./technical/Auth'` to the `extends` array (keep existing entries):
```ts
    extends: [
        './technical/Storage',
        './technical/AiImageProviders',
        './technical/PrintLayout',
        './technical/Notifications',
        './technical/Auth',
        './functional/Games',
        './functional/Tilesets',
        './functional/Maps',
    ],
```

- [ ] **Step 4: Add the README**

`technical/Auth/README.md`:
```markdown
# Auth

Layer technique d'authentification. Fournit un client Supabase singleton et
un composable `useAuth` (session, login email/mot de passe, magic link,
Google OAuth, logout). Ne connait rien du modele de donnees MapForge.

Reutilisable dans n'importe quel projet Nuxt branche sur Supabase Auth.
```

- [ ] **Step 5: Verify the dev server boots with the new layer and env vars**

Run: `pnpm dev` (then Ctrl+C once it's up)
Expected: no error about `supabaseUrl`/`supabaseKey`; `.env` already has `NUXT_PUBLIC_SUPABASE_URL`/`NUXT_PUBLIC_SUPABASE_KEY` which now map onto the declared runtime config keys.

- [ ] **Step 6: Commit**

```bash
git add nuxt.config.ts technical/Auth
git commit -m "feat: add Supabase client singleton layer"
```

---

### Task 3: `useAuth` composable + tests

**Files:**
- Create: `technical/Auth/app/composables/useAuth.ts`
- Test: `technical/Auth/app/composables/useAuth.test.ts`

- [ ] **Step 1: Write the failing test**

`technical/Auth/app/composables/useAuth.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test useAuth`
Expected: FAIL — `useAuth is not defined` (composable doesn't exist yet).

- [ ] **Step 3: Write the composable**

`technical/Auth/app/composables/useAuth.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test useAuth`
Expected: PASS (2 tests).

- [ ] **Step 5: Call `init()` once on app mount**

Modify `app/app.vue`, add to the top of `<script setup lang="ts">` (after existing composable calls):
```ts
const auth = useAuth()

onMounted(() => {
    auth.init()
})
```

- [ ] **Step 6: Commit**

```bash
git add technical/Auth app/app.vue
git commit -m "feat: add useAuth composable with password/magic-link/google sign in"
```

---

### Task 4: Minimal login UI

**Files:**
- Create: `technical/Auth/app/composables/useAuthModal.ts`
- Create: `technical/Auth/app/components/AuthModal.vue`
- Modify: `app/app.vue`

This is intentionally plain — a later spec builds the full account panel on top of `useAuth`.

- [ ] **Step 1: Add the open/close state composable**

`technical/Auth/app/composables/useAuthModal.ts`:
```ts
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
```

- [ ] **Step 2: Add the modal component**

`technical/Auth/app/components/AuthModal.vue`:
```vue
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
```

- [ ] **Step 3: Wire the topbar button**

Modify `app/app.vue`. Add `const authModal = useAuthModal()` next to the existing `const auth = useAuth()`. Add this button in the topbar, right before the closing `</div>` of the `flex-1` spacer block (i.e. after `<div class="flex-1" />` and before the existing print button — order doesn't matter, place it after the print button so it's the rightmost element):

```vue
            <button
                class="flex h-8 items-center gap-1.5 rounded-lg border border-mf-border3 bg-mf-surface2 px-3.5 text-[13px] font-semibold text-mf-text"
                @click="auth.isAuthenticated.value ? auth.signOut() : authModal.open()"
            >
                {{ auth.isAuthenticated.value ? 'Se deconnecter' : 'Se connecter' }}
            </button>
```

And add `<AuthModal />` right after the closing `</div>` of `mf-app` (as a sibling, same level as the `mf-print` block at the bottom of the template).

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, open `http://localhost:3000`. Click "Se connecter", the modal opens. Try a bogus password login — a toast should show the Supabase error message. Close via backdrop click.

- [ ] **Step 5: Commit**

```bash
git add technical/Auth app/app.vue
git commit -m "feat: add minimal login modal and topbar auth button"
```

---

### Task 5: Supabase schema — `user_blobs` (data sync table)

**Files:**
- Create: `supabase/migrations/0001_user_blobs.sql`

- [ ] **Step 1: Write the migration file**

`supabase/migrations/0001_user_blobs.sql`:
```sql
create table if not exists public.user_blobs (
    user_id uuid not null references auth.users(id) on delete cascade,
    key text not null,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (user_id, key)
);

alter table public.user_blobs enable row level security;

create policy "own blobs" on public.user_blobs
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply it to the real Supabase project**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with:
- `project_id`: `hswmrxrvsmlknyhkniwx`
- `name`: `create_user_blobs`
- `query`: the SQL from Step 1

Expected: success, no error returned.

- [ ] **Step 3: Verify**

Use `mcp__claude_ai_Supabase__list_tables` with `project_id: hswmrxrvsmlknyhkniwx`, `schemas: ["public"]`, `verbose: true`.
Expected: `user_blobs` table listed with columns `user_id`, `key`, `data`, `updated_at` and RLS enabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_user_blobs.sql
git commit -m "feat: add user_blobs table for cloud data sync"
```

---

### Task 6: Supabase schema — `user_secrets` + Vault RPCs (API key storage)

**Files:**
- Create: `supabase/migrations/0002_user_secrets_vault.sql`

- [ ] **Step 1: Write the migration file**

`supabase/migrations/0002_user_secrets_vault.sql`:
```sql
create table if not exists public.user_secrets (
    user_id uuid not null references auth.users(id) on delete cascade,
    secret_name text not null,
    secret_id uuid not null references vault.secrets(id) on delete cascade,
    primary key (user_id, secret_name)
);

alter table public.user_secrets enable row level security;

create policy "own secrets" on public.user_secrets
    for all
    using (auth.uid() = user_id);

create or replace function public.set_my_secret(name text, value text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
    existing_secret_id uuid;
    new_secret_id uuid;
begin
    select secret_id into existing_secret_id
    from public.user_secrets
    where user_id = auth.uid() and secret_name = name;

    if existing_secret_id is not null then
        perform vault.update_secret(existing_secret_id, value);
    else
        new_secret_id := vault.create_secret(value, name);
        insert into public.user_secrets (user_id, secret_name, secret_id)
        values (auth.uid(), name, new_secret_id);
    end if;
end;
$$;

create or replace function public.get_my_secret(name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
    result text;
begin
    select decrypted_secret into result
    from vault.decrypted_secrets ds
    join public.user_secrets us on us.secret_id = ds.id
    where us.user_id = auth.uid() and us.secret_name = name;

    return result;
end;
$$;

revoke all on function public.set_my_secret(text, text) from public;
revoke all on function public.get_my_secret(text) from public;
grant execute on function public.set_my_secret(text, text) to authenticated;
grant execute on function public.get_my_secret(text) to authenticated;
```

- [ ] **Step 2: Apply it to the real Supabase project**

Use `mcp__claude_ai_Supabase__apply_migration` with `project_id: hswmrxrvsmlknyhkniwx`, `name: create_user_secrets_vault`, `query`: the SQL from Step 1.
Expected: success.

- [ ] **Step 3: Verify with a real round trip**

Use `mcp__claude_ai_Supabase__execute_sql` with `project_id: hswmrxrvsmlknyhkniwx` and this query (runs as the Postgres role, so `auth.uid()` is null here — this only checks the functions exist and compile, not RLS behavior; RLS behavior is checked from the app in Task 8):
```sql
select proname from pg_proc where proname in ('set_my_secret', 'get_my_secret');
```
Expected: both function names returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_user_secrets_vault.sql
git commit -m "feat: add user_secrets table and Vault-backed RPCs for encrypted API keys"
```

---

### Task 7: `useSyncedState` composable (`technical/CloudSync` layer) + tests

**Files:**
- Create: `technical/CloudSync/nuxt.config.ts`
- Create: `technical/CloudSync/app/composables/useSyncedState.ts`
- Test: `technical/CloudSync/app/composables/useSyncedState.test.ts`
- Create: `technical/CloudSync/README.md`
- Modify: `nuxt.config.ts:1-26` (root — add layer to `extends`)

- [ ] **Step 1: Create the layer config**

`technical/CloudSync/nuxt.config.ts`:
```ts
export default defineNuxtConfig({})
```

- [ ] **Step 2: Register the layer in the root config**

Modify `nuxt.config.ts`, add `'./technical/CloudSync'` right after `'./technical/Auth'` in the `extends` array.

- [ ] **Step 3: Write the failing test**

`technical/CloudSync/app/composables/useSyncedState.test.ts`:
```ts
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
        auth.user.value = { id: 'user-2' } as never

        await vi.waitFor(() => expect(synced.state.value.count).toBe(99))
    })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test useSyncedState`
Expected: FAIL — `useSyncedState is not defined`.

- [ ] **Step 5: Write the composable**

`technical/CloudSync/app/composables/useSyncedState.ts`:
```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test useSyncedState`
Expected: PASS (3 tests).

- [ ] **Step 7: Add the README**

`technical/CloudSync/README.md`:
```markdown
# CloudSync

Layer technique de synchronisation. Fournit `useSyncedState`, un remplacant
direct de `usePersistedState` (meme forme `{ state, persist }`) qui, en plus
de l'ecriture localStorage instantanee, pousse l'etat vers une table
Supabase `user_blobs` (debounce ~1.5s) quand l'utilisateur est connecte, et
tire les donnees cloud (qui gagnent sur le local) a la connexion.

Depend de `technical/Auth` (useAuth) et `technical/Storage`
(usePersistedState). Aucun lien avec le modele de donnees MapForge : la cle
de stockage est un parametre generique.
```

- [ ] **Step 8: Commit**

```bash
git add nuxt.config.ts technical/CloudSync
git commit -m "feat: add useSyncedState composable for cloud/local data sync"
```

---

### Task 8: Wire the games store to cloud sync

**Files:**
- Modify: `functional/Games/app/stores/games.store.ts:66`

- [ ] **Step 1: Swap the composable**

In `functional/Games/app/stores/games.store.ts`, change:
```ts
    const { state: data, persist } = usePersistedState<IMapForgeData>('mapforge-data', () => ({
```
to:
```ts
    const { state: data, persist } = useSyncedState<IMapForgeData>('mapforge-data', () => ({
```
(the rest of the factory function body and the `watch(data, persist, { deep: true })` line stay untouched).

- [ ] **Step 2: Manual verification — local mode unaffected**

Run: `pnpm dev`. Without logging in, create a game / place a tile. Refresh the page. Data should still be there (localStorage path unchanged).

- [ ] **Step 3: Manual verification — cloud sync**

Sign up with a real email via the login modal (or magic link). Place a tile, wait ~2s. In the Supabase dashboard (or via `mcp__claude_ai_Supabase__execute_sql` on `hswmrxrvsmlknyhkniwx`: `select user_id, key, updated_at from public.user_blobs;`), confirm a row exists for that user with `key = 'mapforge-data'`.

Open the app in a second browser (or incognito window), log in with the same account. Confirm the same game/tile data appears (cloud pulled and replaced local).

- [ ] **Step 4: Commit**

```bash
git add functional/Games/app/stores/games.store.ts
git commit -m "feat: sync game data to Supabase when authenticated"
```

---

### Task 9: `useCloudSecret` composable (data layer for the future API-key UI)

**Files:**
- Create: `technical/Auth/app/composables/useCloudSecret.ts`
- Test: `technical/Auth/app/composables/useCloudSecret.test.ts`

No UI consumes this yet (that lands in the account-panel spec) — this task only delivers the tested data-access composable per the design doc.

- [ ] **Step 1: Write the failing test**

`technical/Auth/app/composables/useCloudSecret.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test useCloudSecret`
Expected: FAIL — `useCloudSecret is not defined`.

- [ ] **Step 3: Write the composable**

`technical/Auth/app/composables/useCloudSecret.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test useCloudSecret`
Expected: PASS (3 tests).

- [ ] **Step 5: Manual verification against the real RPCs**

Once logged in in the browser dev console (or a temporary throwaway button), call:
```js
const secret = useCloudSecret('test-key')
await secret.set('hello-world')
await secret.get() // should return 'hello-world'
```
Then confirm via `mcp__claude_ai_Supabase__execute_sql` on `hswmrxrvsmlknyhkniwx` that `select * from public.user_secrets;` shows a row, and that `select decrypted_secret from vault.decrypted_secrets;` never needs to be queried directly by the app (only through the RPC).

- [ ] **Step 6: Commit**

```bash
git add technical/Auth/app/composables/useCloudSecret.ts technical/Auth/app/composables/useCloudSecret.test.ts
git commit -m "feat: add useCloudSecret composable backed by Supabase Vault RPCs"
```

---

### Task 10: Vercel deployment wiring

**Files:**
- Create: `vercel.json` (only if default Nuxt preset detection needs an explicit nudge — see Step 1)
- No code changes otherwise; this task is mostly configuration/documentation.

- [ ] **Step 1: Confirm Vercel's Nuxt preset needs no override**

Nuxt's official Vercel preset auto-detects `nuxt.config.ts` and builds via Nitro's `vercel` preset automatically when the project is imported on Vercel — no `vercel.json` is required for a standard `ssr:false` Nuxt app. Skip creating `vercel.json` unless a real deploy (Step 3) shows a build/runtime mismatch.

- [ ] **Step 2: Set environment variables on Vercel**

In the Vercel project dashboard (Settings → Environment Variables), add for Production, Preview, and Development:
- `NUXT_PUBLIC_SUPABASE_URL` = `https://hswmrxrvsmlknyhkniwx.supabase.co`
- `NUXT_PUBLIC_SUPABASE_KEY` = (the publishable key currently in `.env`)

This is a dashboard action — do it manually or via `vercel env add NUXT_PUBLIC_SUPABASE_URL production` etc. with the Vercel CLI if linked.

- [ ] **Step 3: Register redirect URLs in Supabase Auth**

In the Supabase dashboard for project `hswmrxrvsmlknyhkniwx` → Authentication → URL Configuration, add to "Redirect URLs":
- `http://localhost:3000/**` (dev)
- `https://<your-vercel-domain>/**` (production, and any preview domain pattern if you want magic links/OAuth to work on preview deploys)

- [ ] **Step 4: Configure Google OAuth**

In Supabase dashboard → Authentication → Providers → Google: enable it, and fill in the Client ID / Secret from a Google Cloud OAuth consent screen + credentials configured with authorized redirect URI `https://hswmrxrvsmlknyhkniwx.supabase.co/auth/v1/callback`. This is an external dashboard step with no repo file to change.

- [ ] **Step 5: Deploy and smoke-test**

Deploy to Vercel (preview or production, per how the project is already linked). Open the deployed URL, click "Se connecter", try email/password sign up and magic link. Confirm a toast/behavior matches what was seen locally in Task 4/8.

No commit needed for this task (dashboard/env configuration only), unless Step 1 turned up a need for `vercel.json`, in which case:
```bash
git add vercel.json
git commit -m "chore: pin Vercel build config for Nuxt SPA output"
```

---

## Self-review notes

- Every spec section has a corresponding task: architecture (Tasks 2, 3, 7), schema (Tasks 5, 6), data flow / login / logout / debounce (Tasks 3, 4, 7, 8), API key data layer (Tasks 6, 9), error handling (try/catch + toast paths built into Tasks 3, 4, 7), tests (Tasks 3, 7, 9), Vercel deployment (Task 10).
- API key UI (settings panel) is explicitly out of scope per the design doc — Task 9 stops at the tested composable, no UI.
- i18n and the full account/settings panel (theme, font size, language switch) are separate specs, not part of this plan.
