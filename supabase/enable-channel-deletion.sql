begin;

grant delete on table public.rooms to authenticated;

drop policy if exists "delete creator channels" on public.rooms;

create policy "delete creator channels"
on public.rooms
for delete
to authenticated
using (
  kind = 'channel'
  and created_by = (select auth.uid())
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "moderate creator channel messages" on public.messages;

create policy "moderate creator channel messages"
on public.messages
for delete
to authenticated
using (
  exists (
    select 1 from public.rooms r
    where r.id = messages.room_id
      and r.kind = 'channel'
      and r.created_by = (select auth.uid())
      and public.is_workspace_member(r.workspace_id)
  )
);

drop policy if exists "delete creator managed channel files" on storage.objects;

create policy "delete creator managed channel files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'collabspace-attachments'
  and exists (
    select 1 from public.rooms r
    where r.id = (split_part(name, '/', 1))::uuid
      and r.kind = 'channel'
      and r.created_by = (select auth.uid())
      and public.is_workspace_member(r.workspace_id)
  )
);

commit;
