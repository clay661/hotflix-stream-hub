-- Roles
create type public.app_role as enum ('admin', 'moderator', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key,
  email text,
  display_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.profiles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- prevent non-admins from changing their own status
create or replace function public.protect_profile_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.has_role(auth.uid(),'admin') then
    new.status := old.status;
  end if;
  return new;
end $$;
create trigger profiles_protect_status before update on public.profiles for each row execute function public.protect_profile_status();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Catalog
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bio text not null default '',
  verified boolean not null default false,
  avatar text not null default ''
);
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  duration text not null default '0:00',
  thumb text not null default '',
  video_url text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  creator_id uuid references public.creators(id) on delete set null,
  tags text[] not null default '{}',
  published boolean not null default true,
  views int not null default 0,
  published_at timestamptz not null default now()
);
create index videos_category_idx on public.videos(category_id);
create index videos_creator_idx on public.videos(creator_id);
create index videos_published_idx on public.videos(published, published_at desc);

grant select on public.categories, public.creators, public.videos to anon, authenticated;
grant insert, update, delete on public.categories, public.creators, public.videos to authenticated;
grant all on public.categories, public.creators, public.videos to service_role;
alter table public.categories enable row level security;
alter table public.creators enable row level security;
alter table public.videos enable row level security;
create policy "public read categories" on public.categories for select using (true);
create policy "admin write categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read creators" on public.creators for select using (true);
create policy "admin write creators" on public.creators for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read published videos" on public.videos for select using (published or public.has_role(auth.uid(),'admin'));
create policy "admin write videos" on public.videos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'active' check (status in ('active','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_video_idx on public.comments(video_id, created_at);
create index comments_user_idx on public.comments(user_id);
grant select on public.comments to anon;
grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "read active comments" on public.comments for select using (status = 'active' or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "active users insert own" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and status = 'active' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'));
create policy "update own or admin" on public.comments for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "delete own or admin" on public.comments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.protect_comment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    if new.status = 'hidden' and old.status <> 'hidden' then new.status := old.status; end if;
    if old.status = 'hidden' then new.status := 'hidden'; end if;
    new.user_id := old.user_id; new.video_id := old.video_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger comments_protect before update on public.comments for each row execute function public.protect_comment();

-- public view of commenter names
create or replace function public.comment_authors(_ids uuid[]) returns table(id uuid, display_name text)
language sql stable security definer set search_path = public as $$
  select id, display_name from public.profiles where id = any(_ids)
$$;
grant execute on function public.comment_authors(uuid[]) to anon, authenticated;

-- Analytics
create table public.page_views (
  id bigserial primary key,
  path text not null,
  session_id text not null,
  user_id uuid,
  device text,
  referrer text,
  created_at timestamptz not null default now()
);
create table public.video_views (
  id bigserial primary key,
  video_id uuid not null references public.videos(id) on delete cascade,
  session_id text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views(created_at);
create index page_views_session_idx on public.page_views(session_id);
create index video_views_created_idx on public.video_views(created_at);
create index video_views_video_idx on public.video_views(video_id);
grant select on public.page_views, public.video_views to authenticated;
grant all on public.page_views, public.video_views to service_role;
grant usage, select on sequence public.page_views_id_seq, public.video_views_id_seq to service_role;
alter table public.page_views enable row level security;
alter table public.video_views enable row level security;
create policy "admin read page views" on public.page_views for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin read video views" on public.video_views for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.track_page_view(_path text, _session text, _device text, _referrer text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.page_views(path, session_id, user_id, device, referrer)
  values (left(_path,300), left(_session,64), auth.uid(), left(_device,20), left(_referrer,300));
  if auth.uid() is not null then update public.profiles set last_seen_at = now() where id = auth.uid(); end if;
end $$;
create or replace function public.track_video_view(_video uuid, _session text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.video_views(video_id, session_id, user_id) values (_video, left(_session,64), auth.uid());
  update public.videos set views = views + 1 where id = _video;
end $$;
grant execute on function public.track_page_view(text,text,text,text), public.track_video_view(uuid,text) to anon, authenticated;

-- Admin dashboard
create or replace function public.admin_dashboard(_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'total_visitors', (select count(distinct session_id) from page_views),
    'visitors_today', (select count(distinct session_id) from page_views where created_at >= date_trunc('day', now())),
    'visitors_week', (select count(distinct session_id) from page_views where created_at >= now() - interval '7 days'),
    'page_views', (select count(*) from page_views),
    'total_users', (select count(*) from profiles),
    'total_videos', (select count(*) from videos),
    'total_views', (select coalesce(sum(views),0) from videos),
    'total_comments', (select count(*) from comments where status <> 'deleted'),
    'visitors_series', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'visitors', (select count(distinct session_id) from page_views where created_at::date = d::date), 'views', (select count(*) from page_views where created_at::date = d::date)) order by d), '[]') from generate_series(current_date - (_days-1), current_date, interval '1 day') d),
    'video_views_series', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'views', (select count(*) from video_views where created_at::date = d::date)) order by d), '[]') from generate_series(current_date - (_days-1), current_date, interval '1 day') d),
    'signups_series', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'users', (select count(*) from profiles where created_at::date = d::date)) order by d), '[]') from generate_series(current_date - (_days-1), current_date, interval '1 day') d),
    'top_videos', (select coalesce(jsonb_agg(t), '[]') from (select v.title, v.slug, v.views from videos v order by v.views desc limit 8) t),
    'top_categories', (select coalesce(jsonb_agg(t), '[]') from (select c.name, coalesce(sum(v.views),0)::int as views from categories c left join videos v on v.category_id = c.id group by c.name order by 2 desc) t),
    'active_users', (select coalesce(jsonb_agg(t), '[]') from (select p.display_name, p.email, count(c.id)::int as comments from profiles p join comments c on c.user_id = p.id group by p.id order by 3 desc limit 5) t),
    'devices', (select coalesce(jsonb_agg(t), '[]') from (select coalesce(device,'desconhecido') as device, count(*)::int as total from page_views group by 1 order by 2 desc) t),
    'top_pages', (select coalesce(jsonb_agg(t), '[]') from (select path, count(*)::int as total from page_views group by 1 order by 2 desc limit 8) t),
    'avg_pages_per_session', (select round(coalesce(avg(c),0)::numeric,1) from (select count(*) c from page_views group by session_id) s)
  ) into r;
  return r;
end $$;
grant execute on function public.admin_dashboard(int) to authenticated;

-- Seed catalog
insert into public.categories (slug, name, description, position) values
('viagens','Viagens','Destinos, roteiros e paisagens pelo mundo.',1),
('esportes','Esportes','Treinos, competições e bastidores do esporte.',2),
('musica','Música','Clipes, sessões ao vivo e bastidores musicais.',3),
('tecnologia','Tecnologia','Reviews, tutoriais e novidades tech.',4),
('estilo-de-vida','Estilo de vida','Rotinas, culinária, casa e bem-estar.',5),
('entretenimento','Entretenimento','Humor, curiosidades e cultura pop.',6);

insert into public.creators (slug, name, bio, verified, avatar) values
('rota-livre','Rota Livre','Viajando o Brasil e o mundo com câmera na mão.',true,'https://picsum.photos/seed/av-rota/200/200'),
('pulso-esportivo','Pulso Esportivo','Análises e treinos para quem vive o esporte.',true,'https://picsum.photos/seed/av-pulso/200/200'),
('estudio-som','Estúdio Som','Sessões acústicas e produção musical.',false,'https://picsum.photos/seed/av-som/200/200'),
('byte-lab','Byte Lab','Tecnologia explicada sem complicação.',true,'https://picsum.photos/seed/av-byte/200/200'),
('casa-e-sabor','Casa & Sabor','Receitas simples e ideias para o dia a dia.',false,'https://picsum.photos/seed/av-casa/200/200');

insert into public.videos (slug, title, description, duration, thumb, video_url, category_id, creator_id, tags, views, published_at)
select s.slug, s.title, s.title || '. Um vídeo de demonstração da Hotflix com conteúdo neutro.', s.duration,
  'https://picsum.photos/seed/hf-' || s.n || '/640/360',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  (select id from public.categories where slug = s.cat), (select id from public.creators where slug = s.cre),
  array[s.cat, 'demonstração'], s.views, now() - (s.n * 2 || ' days')::interval
from (values
 (0,'por-do-sol-na-chapada-diamantina','Pôr do sol na Chapada Diamantina','viagens','rota-livre','4:00',1200),
 (1,'roteiro-de-3-dias-em-lisboa','Roteiro de 3 dias em Lisboa','viagens','rota-livre','11:13',9119),
 (2,'treino-funcional-de-20-minutos','Treino funcional de 20 minutos','esportes','pulso-esportivo','18:26',17038),
 (3,'os-melhores-lances-da-rodada','Os melhores lances da rodada','esportes','pulso-esportivo','7:39',24957),
 (4,'sessao-acustica-ao-entardecer','Sessão acústica ao entardecer','musica','estudio-som','14:52',32876),
 (5,'como-gravar-voz-em-casa','Como gravar voz em casa','musica','estudio-som','21:05',40795),
 (6,'review-o-notebook-mais-leve-do-ano','Review: o notebook mais leve do ano','tecnologia','byte-lab','10:18',48714),
 (7,'automatize-sua-casa-com-pouco-dinheiro','Automatize sua casa com pouco dinheiro','tecnologia','byte-lab','17:31',56633),
 (8,'pao-caseiro-em-5-passos','Pão caseiro em 5 passos','estilo-de-vida','casa-e-sabor','6:44',64552),
 (9,'organizacao-de-cozinha-pequena','Organização de cozinha pequena','estilo-de-vida','casa-e-sabor','13:57',72471),
 (10,'curiosidades-sobre-o-cinema-classico','Curiosidades sobre o cinema clássico','entretenimento','byte-lab','20:10',80390),
 (11,'trilha-ate-o-pico-da-bandeira','Trilha até o Pico da Bandeira','viagens','rota-livre','9:23',88309),
 (12,'corrida-de-rua-guia-para-iniciantes','Corrida de rua: guia para iniciantes','esportes','pulso-esportivo','16:36',96228),
 (13,'bastidores-de-um-show-ao-vivo','Bastidores de um show ao vivo','musica','estudio-som','5:49',104147),
 (14,'montando-um-setup-minimalista','Montando um setup minimalista','tecnologia','byte-lab','12:02',112066),
 (15,'cafe-da-manha-rapido-e-saudavel','Café da manhã rápido e saudável','estilo-de-vida','casa-e-sabor','19:15',119985),
 (16,'quiz-de-cultura-pop-em-10-perguntas','Quiz de cultura pop em 10 perguntas','entretenimento','estudio-som','8:28',127904),
 (17,'mergulho-em-fernando-de-noronha','Mergulho em Fernando de Noronha','viagens','rota-livre','15:41',135823)
) as s(n, slug, title, cat, cre, duration, views);

-- Seed 30 days of demo analytics
insert into public.page_views (path, session_id, device, referrer, created_at)
select (array['/','/categorias','/videos','/criadores','/busca','/video/treino-funcional-de-20-minutos','/video/mergulho-em-fernando-de-noronha'])[1 + (g % 7)],
  'demo-' || (d::date - current_date + 40) || '-' || (g % (40 + (extract(day from d)::int % 20))),
  (array['mobile','mobile','desktop','tablet'])[1 + (g % 4)],
  (array['direto','google','instagram','whatsapp'])[1 + (g % 4)],
  d + ((g * 37) % 1440 || ' minutes')::interval
from generate_series(current_date - 29, current_date - 1, interval '1 day') d,
     generate_series(1, 120 + (extract(dow from current_date)::int * 7)) g;

insert into public.video_views (video_id, session_id, created_at)
select v.id, 'demo-' || g, d + ((g * 53) % 1440 || ' minutes')::interval
from generate_series(current_date - 29, current_date - 1, interval '1 day') d,
     generate_series(1, 60) g
join lateral (select id from public.videos order by views desc offset (g % 18) limit 1) v on true;