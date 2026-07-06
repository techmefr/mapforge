drop policy "own blobs" on public.user_blobs;
create policy "own blobs" on public.user_blobs
    for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy "own secrets" on public.user_secrets;
create policy "own secrets" on public.user_secrets
    for all
    using ((select auth.uid()) = user_id);
