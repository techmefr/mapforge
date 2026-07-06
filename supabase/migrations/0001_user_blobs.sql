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
