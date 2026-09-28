revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_status() from public, anon, authenticated;
revoke execute on function public.protect_comment() from public, anon, authenticated;
revoke execute on function public.admin_dashboard(int) from public, anon;
grant execute on function public.admin_dashboard(int) to authenticated;