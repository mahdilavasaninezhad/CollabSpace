import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getErrorText, safeFileName } from '../lib/format';
import type { Attachment, Member, Message, Room, Workspace, WorkspaceData } from '../lib/types';

type CloudAccess = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  data: WorkspaceData;
  online: string[];
  typing: Record<string, string>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<string>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  joinWorkspace: (code: string) => Promise<void>;
  sendMessage: (roomId: string, body: string, file?: File) => Promise<void>;
  editMessage: (id: string, body: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;
  addChannel: (name: string, description: string) => Promise<void>;
  createDm: (memberId: string) => Promise<string>;
  sendTyping: (roomId: string) => void;
  refresh: () => Promise<void>;
};

const empty: WorkspaceData = { workspace: null, rooms: [], members: [], messages: [] };

type ProfileRow = { id: string; display_name: string; avatar_color: string };
type RoomRow = { id: string; workspace_id: string; name: string; description: string; kind: 'channel' | 'dm'; created_at: string };
type MessageRow = { id: string; room_id: string; sender_id: string; body: string; created_at: string; edited_at: string | null; attachment_path: string | null; attachment_name: string | null };
type ReactionRow = { message_id: string; user_id: string; emoji: string };

export function useCloud(enabled: boolean): CloudAccess {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<WorkspaceData>(empty);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<Record<string, string>>({});
  const workspaceRef = useRef<string | null>(null);
  const userRef = useRef<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const presenceRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const refreshSequence = useRef(0);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !enabled || !userRef.current) return;
    const sequence = ++refreshSequence.current;
    setRefreshing(true);
    try {
      const membership = await client.from('workspace_members').select('workspace_id').eq('user_id', userRef.current);
      if (membership.error) throw membership.error;
      const ids = (membership.data || []).map((row) => row.workspace_id as string);
      if (!ids.length) {
        if (sequence === refreshSequence.current) setData(empty);
        return;
      }
      const requested = workspaceRef.current;
      const selectedId = requested && ids.includes(requested) ? requested : ids[0];
      workspaceRef.current = selectedId;
      const [workspaceResult, roomsResult, usersResult] = await Promise.all([
        client.from('workspaces').select('id,name,invite_code,owner_id').eq('id', selectedId).single(),
        client.from('rooms').select('id,workspace_id,name,description,kind,created_at').eq('workspace_id', selectedId).order('created_at', { ascending: true }),
        client.from('workspace_members').select('user_id,role').eq('workspace_id', selectedId)
      ]);
      if (workspaceResult.error) throw workspaceResult.error;
      if (roomsResult.error) throw roomsResult.error;
      if (usersResult.error) throw usersResult.error;
      const workspaceRow = workspaceResult.data;
      const workspace: Workspace = { id: workspaceRow.id, name: workspaceRow.name, code: workspaceRow.invite_code, ownerId: workspaceRow.owner_id };
      const membersResult = await client.from('profiles').select('id,display_name,avatar_color').in('id', (usersResult.data || []).map((item) => item.user_id));
      if (membersResult.error) throw membersResult.error;
      const memberRows = (membersResult.data || []) as ProfileRow[];
      const members: Member[] = memberRows.map((row) => ({ id: row.id, name: row.display_name, color: row.avatar_color, role: usersResult.data?.find((item) => item.user_id === row.id)?.role || 'member' }));
      const roomRows = (roomsResult.data || []) as RoomRow[];
      const dmRows = roomRows.filter((room) => room.kind === 'dm');
      const participantsResult = dmRows.length ? await client.from('dm_members').select('room_id,user_id').in('room_id', dmRows.map((room) => room.id)) : { data: [], error: null };
      if (participantsResult.error) throw participantsResult.error;
      const rooms: Room[] = roomRows.map((room) => ({
        id: room.id,
        workspaceId: room.workspace_id,
        name: room.name,
        description: room.description,
        kind: room.kind,
        participantIds: room.kind === 'dm' ? (participantsResult.data || []).filter((participant) => participant.room_id === room.id).map((participant) => participant.user_id) : undefined,
        createdAt: room.created_at
      }));
      let messages: Message[] = [];
      if (rooms.length) {
        const messagesResult = await client.from('messages').select('id,room_id,sender_id,body,created_at,edited_at,attachment_path,attachment_name').in('room_id', rooms.map((room) => room.id)).order('created_at', { ascending: true }).limit(500);
        if (messagesResult.error) throw messagesResult.error;
        const messageRows = (messagesResult.data || []) as MessageRow[];
        const reactionsResult = messageRows.length ? await client.from('reactions').select('message_id,user_id,emoji').in('message_id', messageRows.map((row) => row.id)) : { data: [], error: null };
        if (reactionsResult.error) throw reactionsResult.error;
        const reactionRows = (reactionsResult.data || []) as ReactionRow[];
        const paths = [...new Set(messageRows.map((row) => row.attachment_path).filter((path): path is string => Boolean(path)))];
        const urls = new Map<string, string>();
        await Promise.all(paths.map(async (path) => {
          const result = await client.storage.from('collabspace-attachments').createSignedUrl(path, 3600);
          if (result.data?.signedUrl) urls.set(path, result.data.signedUrl);
        }));
        messages = messageRows.map((row) => {
          const reactions: Record<string, string[]> = {};
          reactionRows.filter((reaction) => reaction.message_id === row.id).forEach((reaction) => {
            reactions[reaction.emoji] = [...(reactions[reaction.emoji] || []), reaction.user_id];
          });
          const attachment: Attachment | undefined = row.attachment_path && row.attachment_name
            ? { name: row.attachment_name, path: row.attachment_path, url: urls.get(row.attachment_path) }
            : undefined;
          return {
            id: row.id,
            roomId: row.room_id,
            authorId: row.sender_id,
            body: row.body,
            createdAt: row.created_at,
            editedAt: row.edited_at || undefined,
            attachment,
            reactions
          };
        });
      }
      if (sequence === refreshSequence.current) {
        setData({ workspace, rooms, members, messages });
        setError('');
      }
    } catch (cause) {
      if (sequence === refreshSequence.current) setError(getErrorText(cause));
    } finally {
      if (sequence === refreshSequence.current) setRefreshing(false);
    }
  }, [enabled]);

  refreshRef.current = load;

  useEffect(() => {
    if (!supabase || !enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data: authData }) => {
      if (!active) return;
      setSession(authData.session);
      setUser(authData.session?.user || null);
      userRef.current = authData.session?.user.id || null;
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (!active) return;
      setSession(activeSession);
      setUser(activeSession?.user || null);
      userRef.current = activeSession?.user.id || null;
      if (!activeSession) setData(empty);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && user?.id) void load();
  }, [enabled, user?.id, load]);

  useEffect(() => {
    if (!supabase || !enabled || !user?.id || !data.workspace?.id) return;
    const client = supabase;
    const workspaceId = data.workspace.id;
    const presence = client.channel(`collabspace-presence-${workspaceId}`, { config: { private: true, presence: { key: user.id }, broadcast: { self: false } } });
    presenceRef.current = presence;
    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        setOnline(Object.keys(state));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const item = payload as { roomId: string; userId: string; name: string };
        if (item.userId === user.id) return;
        setTyping((previous) => ({ ...previous, [item.roomId]: item.name }));
        window.setTimeout(() => setTyping((previous) => {
          if (previous[item.roomId] !== item.name) return previous;
          const copy = { ...previous };
          delete copy[item.roomId];
          return copy;
        }), 2200);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presence.track({ name: data.members.find((member) => member.id === user.id)?.name || 'Team member' });
      });
    const changes = client.channel(`collabspace-changes-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { void refreshRef.current(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => { void refreshRef.current(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, () => { void refreshRef.current(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_members' }, () => { void refreshRef.current(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workspace_members' }, () => { void refreshRef.current(); })
      .subscribe();
    return () => {
      presenceRef.current = null;
      setOnline([]);
      void client.removeChannel(presence);
      void client.removeChannel(changes);
    };
  }, [enabled, user?.id, data.workspace?.id]);

  const requireClient = () => {
    if (!supabase) throw new Error('Supabase is not configured');
    return supabase;
  };

  const signIn = async (email: string, password: string) => {
    const { error: issue } = await requireClient().auth.signInWithPassword({ email, password });
    if (issue) throw issue;
  };

  const emailRedirectTo = () => import.meta.env.VITE_AUTH_REDIRECT_URL || new URL(import.meta.env.BASE_URL, window.location.origin).toString();

  const signUp = async (name: string, email: string, password: string) => {
    const { data: result, error: issue } = await requireClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: emailRedirectTo()
      }
    });
    if (issue) throw issue;
    return result.session ? 'signed-in' : 'confirmation-required';
  };

  const resendConfirmation = async (email: string) => {
    const { error: issue } = await requireClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: emailRedirectTo() }
    });
    if (issue) throw issue;
  };

  const signOut = async () => {
    const { error: issue } = await requireClient().auth.signOut();
    if (issue) throw issue;
  };

  const createWorkspace = async (name: string) => {
    const { data: result, error: issue } = await requireClient().rpc('create_workspace', { p_name: name });
    if (issue) throw issue;
    workspaceRef.current = result as string;
    await load();
  };

  const joinWorkspace = async (code: string) => {
    const { data: result, error: issue } = await requireClient().rpc('join_workspace', { p_code: code });
    if (issue) throw issue;
    workspaceRef.current = result as string;
    await load();
  };

  const sendMessage = async (roomId: string, body: string, file?: File) => {
    const client = requireClient();
    if (!user) throw new Error('Sign in required');
    let attachmentPath: string | null = null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) throw new Error('Maximum attachment size is 10 MB');
      attachmentPath = `${roomId}/${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await client.storage.from('collabspace-attachments').upload(attachmentPath, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;
    }
    const { error: issue } = await client.from('messages').insert({ room_id: roomId, sender_id: user.id, body: body.trim(), attachment_path: attachmentPath, attachment_name: file?.name || null });
    if (issue) {
      if (attachmentPath) await client.storage.from('collabspace-attachments').remove([attachmentPath]);
      throw issue;
    }
    await load();
  };

  const editMessage = async (id: string, body: string) => {
    const { error: issue } = await requireClient().from('messages').update({ body, edited_at: new Date().toISOString() }).eq('id', id).eq('sender_id', user?.id || '');
    if (issue) throw issue;
    await load();
  };

  const deleteMessage = async (id: string) => {
    const message = data.messages.find((item) => item.id === id);
    const { error: issue } = await requireClient().from('messages').delete().eq('id', id).eq('sender_id', user?.id || '');
    if (issue) throw issue;
    if (message?.attachment?.path) await requireClient().storage.from('collabspace-attachments').remove([message.attachment.path]);
    await load();
  };

  const toggleReaction = async (id: string, emoji: string) => {
    const client = requireClient();
    const selected = data.messages.find((message) => message.id === id)?.reactions[emoji]?.includes(user?.id || '') || false;
    const result = selected
      ? await client.from('reactions').delete().eq('message_id', id).eq('user_id', user?.id || '').eq('emoji', emoji)
      : await client.from('reactions').insert({ message_id: id, user_id: user?.id, emoji });
    if (result.error) throw result.error;
    await load();
  };

  const addChannel = async (name: string, description: string) => {
    if (!data.workspace) throw new Error('Create or join a workspace first');
    const { error: issue } = await requireClient().from('rooms').insert({ workspace_id: data.workspace.id, name, description, kind: 'channel', created_by: user?.id });
    if (issue) throw issue;
    await load();
  };

  const createDm = async (memberId: string) => {
    if (!data.workspace) throw new Error('Create or join a workspace first');
    const { data: result, error: issue } = await requireClient().rpc('create_direct_room', { p_workspace: data.workspace.id, p_target: memberId });
    if (issue) throw issue;
    await load();
    return result as string;
  };

  const sendTyping = (roomId: string) => {
    if (!user || !presenceRef.current) return;
    void presenceRef.current.send({ type: 'broadcast', event: 'typing', payload: { roomId, userId: user.id, name: data.members.find((member) => member.id === user.id)?.name || 'Teammate' } });
  };

  return { user, session, loading, refreshing, error, data, online, typing, signIn, signUp, resendConfirmation, signOut, createWorkspace, joinWorkspace, sendMessage, editMessage, deleteMessage, toggleReaction, addChannel, createDm, sendTyping, refresh: load };
}
