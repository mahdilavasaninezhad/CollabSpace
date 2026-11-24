create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Teammate',
  avatar_color text not null default 'violet',
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  invite_code text not null unique,
  owner_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default '',
  description text not null default '',
  kind text not null check (kind in ('channel', 'dm')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint channel_name check ((kind = 'dm') or (char_length(name) between 2 and 60))
);

create table if not exists public.dm_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null default '' check (char_length(body) <= 8000),
  attachment_path text,
  attachment_name text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint non_empty_message check (char_length(btrim(body)) > 0 or attachment_path is not null)
);

create table if not exists public.reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 12),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists room_workspace_idx on public.rooms(workspace_id);
create index if not exists message_room_time_idx on public.messages(room_id, created_at);
create index if not exists members_user_idx on public.workspace_members(user_id);

create or replace function public.is_workspace_member(p_workspace uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = (select auth.uid())
  );
$$;

create or replace function public.can_access_room(p_room uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room
      and public.is_workspace_member(r.workspace_id)
      and (
        r.kind = 'channel'
        or exists (
          select 1 from public.dm_members d
          where d.room_id = r.id and d.user_id = (select auth.uid())
        )
      )
  );
$$;

create or replace function public.can_access_message(p_message uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.messages m where m.id = p_message and public.can_access_room(m.room_id)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name, avatar_color)
  values (
    new.id,
    coalesce(nullif(left(new.raw_user_meta_data ->> 'full_name', 80), ''), split_part(new.email, '@', 1), 'Teammate'),
    (array['violet', 'peach', 'mint', 'rose', 'blue', 'gold'])[1 + floor(random() * 6)::integer]
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.profiles(id, display_name)
select id, coalesce(nullif(left(raw_user_meta_data ->> 'full_name', 80), ''), split_part(email, '@', 1), 'Teammate')
from auth.users
on conflict (id) do nothing;

create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if char_length(btrim(p_name)) not between 2 and 80 then raise exception 'Invalid workspace name'; end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.workspaces(name, invite_code, owner_id)
  values (btrim(p_name), v_code, auth.uid()) returning id into v_id;
  insert into public.workspace_members(workspace_id, user_id, role)
  values (v_id, auth.uid(), 'owner');
  insert into public.rooms(workspace_id, name, description, kind, created_by)
  values (v_id, 'general', 'Team updates and announcements', 'channel', auth.uid());
  return v_id;
end;
$$;

create or replace function public.join_workspace(p_code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select id into v_id from public.workspaces where invite_code = upper(btrim(p_code));
  if v_id is null then raise exception 'Invalid invitation code'; end if;
  insert into public.workspace_members(workspace_id, user_id, role)
  values (v_id, auth.uid(), 'member') on conflict do nothing;
  return v_id;
end;
$$;

create or replace function public.create_direct_room(p_workspace uuid, p_target uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or auth.uid() = p_target then raise exception 'Invalid recipient'; end if;
  if not public.is_workspace_member(p_workspace) or not exists (
    select 1 from public.workspace_members where workspace_id = p_workspace and user_id = p_target
  ) then raise exception 'Both people must belong to this workspace'; end if;

  select r.id into v_id
  from public.rooms r
  where r.workspace_id = p_workspace and r.kind = 'dm'
    and exists (select 1 from public.dm_members d where d.room_id = r.id and d.user_id = auth.uid())
    and exists (select 1 from public.dm_members d where d.room_id = r.id and d.user_id = p_target)
    and (select count(*) from public.dm_members d where d.room_id = r.id) = 2
  limit 1;

  if v_id is not null then return v_id; end if;

  insert into public.rooms(workspace_id, name, description, kind, created_by)
  values (p_workspace, '', '', 'dm', auth.uid()) returning id into v_id;
  insert into public.dm_members(room_id, user_id) values (v_id, auth.uid()), (v_id, p_target);
  return v_id;
end;
$$;

grant usage on schema public to authenticated;

grant select on table
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.rooms,
  public.dm_members,
  public.messages,
  public.reactions
  to authenticated;

grant insert on table
  public.rooms,
  public.messages,
  public.reactions
  to authenticated;

grant update (display_name, avatar_color) on table public.profiles to authenticated;
grant update (body, edited_at) on table public.messages to authenticated;

grant delete on table
  public.messages,
  public.reactions
  to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.rooms enable row level security;
alter table public.dm_members enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;

create policy "read shared profiles" on public.profiles for select to authenticated
using (
  id = (select auth.uid()) or exists (
    select 1 from public.workspace_members a
    join public.workspace_members b on b.workspace_id = a.workspace_id
    where a.user_id = (select auth.uid()) and b.user_id = profiles.id
  )
);

create policy "update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "read joined workspaces" on public.workspaces for select to authenticated
using (public.is_workspace_member(id));

create policy "read membership" on public.workspace_members for select to authenticated
using (public.is_workspace_member(workspace_id));

create policy "read accessible rooms" on public.rooms for select to authenticated
using (public.can_access_room(id));

create policy "create channels" on public.rooms for insert to authenticated
with check (kind = 'channel' and created_by = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy "read dm membership" on public.dm_members for select to authenticated
using (public.can_access_room(room_id));

create policy "read allowed messages" on public.messages for select to authenticated
using (public.can_access_room(room_id));

create policy "send allowed messages" on public.messages for insert to authenticated
with check (sender_id = (select auth.uid()) and public.can_access_room(room_id));

create policy "edit own messages" on public.messages for update to authenticated
using (sender_id = (select auth.uid()) and public.can_access_room(room_id))
with check (sender_id = (select auth.uid()) and public.can_access_room(room_id));

create policy "delete own messages" on public.messages for delete to authenticated
using (sender_id = (select auth.uid()) and public.can_access_room(room_id));

create policy "read allowed reactions" on public.reactions for select to authenticated
using (public.can_access_message(message_id));

create policy "add own reactions" on public.reactions for insert to authenticated
with check (user_id = (select auth.uid()) and public.can_access_message(message_id));

create policy "remove own reactions" on public.reactions for delete to authenticated
using (user_id = (select auth.uid()) and public.can_access_message(message_id));

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.can_access_room(uuid) from public;
revoke all on function public.can_access_message(uuid) from public;
revoke all on function public.create_workspace(text) from public;
revoke all on function public.join_workspace(text) from public;
revoke all on function public.create_direct_room(uuid, uuid) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.can_access_room(uuid) to authenticated;
grant execute on function public.can_access_message(uuid) to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.join_workspace(text) to authenticated;
grant execute on function public.create_direct_room(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('collabspace-attachments', 'collabspace-attachments', false, 10485760)
on conflict (id) do nothing;

create policy "read workspace files" on storage.objects for select to authenticated
using (
  bucket_id = 'collabspace-attachments'
  and public.can_access_room((split_part(name, '/', 1))::uuid)
);

create policy "upload workspace files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'collabspace-attachments'
  and split_part(name, '/', 2) = (select auth.uid())::text
  and public.can_access_room((split_part(name, '/', 1))::uuid)
);

create policy "delete own workspace files" on storage.objects for delete to authenticated
using (
  bucket_id = 'collabspace-attachments'
  and split_part(name, '/', 2) = (select auth.uid())::text
  and public.can_access_room((split_part(name, '/', 1))::uuid)
);

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reactions') then
    alter publication supabase_realtime add table public.reactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_members') then
    alter publication supabase_realtime add table public.dm_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workspace_members') then
    alter publication supabase_realtime add table public.workspace_members;
  end if;
end;
$$;

create policy "read private workspace realtime" on realtime.messages for select to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and realtime.topic() like 'collabspace-presence-%'
  and public.is_workspace_member(substring(realtime.topic() from 22)::uuid)
);

create policy "write private workspace realtime" on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and realtime.topic() like 'collabspace-presence-%'
  and public.is_workspace_member(substring(realtime.topic() from 22)::uuid)
);
