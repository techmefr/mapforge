revoke execute on function public.set_my_secret(text, text) from anon;
revoke execute on function public.get_my_secret(text) from anon;
revoke execute on function public.set_my_secret(text, text) from authenticated;
revoke execute on function public.get_my_secret(text) from authenticated;

grant execute on function public.set_my_secret(text, text) to authenticated;
grant execute on function public.get_my_secret(text) to authenticated;
