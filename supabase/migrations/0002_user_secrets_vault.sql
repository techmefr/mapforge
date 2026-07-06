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
