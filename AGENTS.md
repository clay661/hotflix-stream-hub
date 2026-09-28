# Hotflix — technical rules
- Public catalog (videos, categories, creators) is read via `getCatalog` server fn with a publishable client and cached under the `catalog` query key; admin edits must invalidate it.
- Admin writes go through the browser client under RLS (`has_role(auth.uid(),'admin')`); only auth-user deletion uses the service role, in `src/lib/admin.functions.ts`.
- `/admin` is a client-only (`ssr:false`) layout gated by the admin role; `/admin/entrar` is un-nested (`admin_.entrar.tsx`) so it stays reachable.
- Visits and video views are recorded with the `track_page_view` / `track_video_view` database functions; dashboard numbers come from `admin_dashboard()`.
- Comments are never hard-deleted by users: status moves between active/hidden/deleted; a trigger stops non-admins from un-hiding their own comments.
