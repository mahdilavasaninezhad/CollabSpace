import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Member, Message, Room, WorkspaceData } from '../lib/types';

export const DEMO_SELF = 'me';

const members: Member[] = [
  { id: 'me', name: 'Alex Morgan', color: 'violet', role: 'Product Designer', email: 'alex@example.com' },
  { id: 'maria', name: 'Maria Chen', color: 'peach', role: 'Head of Product' },
  { id: 'james', name: 'James Wilson', color: 'mint', role: 'Frontend Engineer' },
  { id: 'sara', name: 'Sara Rahimi', color: 'rose', role: 'Brand Designer' },
  { id: 'noah', name: 'Noah Kim', color: 'blue', role: 'Growth Lead' },
  { id: 'lily', name: 'Lily Parker', color: 'gold', role: 'Content Strategist' }
];

const rooms: Room[] = [
  { id: 'general', workspaceId: 'studio', name: 'general', description: 'Team announcements, conversations and celebrations', kind: 'channel', createdBy: 'me', createdAt: '2026-01-01' },
  { id: 'design', workspaceId: 'studio', name: 'design-team', description: 'Everything design. Reviews, feedback and explorations.', kind: 'channel', createdBy: 'me', createdAt: '2026-01-02' },
  { id: 'engineering', workspaceId: 'studio', name: 'engineering', description: 'Shipping quality software together', kind: 'channel', createdBy: 'james', createdAt: '2026-01-03' },
  { id: 'launch', workspaceId: 'studio', name: 'product-launch', description: 'Launch planning and important milestones', kind: 'channel', createdBy: 'maria', createdAt: '2026-01-04' },
  { id: 'dm-maria', workspaceId: 'studio', name: 'maria', description: '', kind: 'dm', participantIds: ['me', 'maria'], createdAt: '2026-01-05' },
  { id: 'dm-james', workspaceId: 'studio', name: 'james', description: '', kind: 'dm', participantIds: ['me', 'james'], createdAt: '2026-01-06' }
];

const minusMinutes = (n: number) => new Date(Date.now() - n * 60000).toISOString();

const starter: Array<[string, string, string, number]> = [
  ['general', 'maria', 'Good morning team! ☀️ New week, new momentum. Let’s make it count.', 1470],
  ['general', 'james', 'Morning! Just wrapped up the responsive components from last sprint.', 1467],
  ['general', 'sara', 'Sharing the updated brand direction today. Excited for everyone to see it ✨', 1463],
  ['general', 'me', 'Amazing progress! Can we sync on the landing page after lunch?', 1320],
  ['general', 'maria', 'Absolutely. I have the product notes ready. 🚀', 1302],
  ['general', 'noah', 'Quick update: the waitlist crossed 2,400 signups this morning!', 96],
  ['general', 'lily', 'That’s huge. The new launch email is ready for review.', 92],
  ['design', 'sara', 'I polished the color system and component states. The new direction feels much calmer.', 1268],
  ['design', 'me', 'Love that. Let’s keep the typography spacious and let the interface breathe.', 1259],
  ['design', 'maria', 'The new onboarding screens look wonderful. One small note on the invite flow.', 1040],
  ['design', 'sara', 'I’m updating the prototype now. Will share the link in our review.', 72],
  ['engineering', 'james', 'API contracts are ready for review. I’ve added typed payload examples.', 1257],
  ['engineering', 'noah', 'Can we get an event when someone successfully joins a workspace?', 1240],
  ['engineering', 'james', 'Yes, I’ll add it to the event list along with invite acceptance.', 1197],
  ['engineering', 'me', 'The message composer now supports file previews and keyboard shortcuts.', 53],
  ['launch', 'maria', 'Launch checklist is live. Please review your items by end of day.', 984],
  ['launch', 'lily', 'I’ve prepared announcement copy in both short and long formats.', 950],
  ['launch', 'noah', 'The landing page conversion tests are looking promising.', 83],
  ['dm-maria', 'maria', 'Hey Alex! Do you have a minute to review the new concept?', 342],
  ['dm-maria', 'me', 'Of course. Send it over whenever you’re ready.', 332],
  ['dm-maria', 'maria', 'Perfect. I’ll have the deck ready this afternoon.', 330],
  ['dm-james', 'james', 'Could you check the new navigation interaction on mobile?', 286],
  ['dm-james', 'me', 'Sure! I’ll test it on a few viewport sizes.', 278]
];

function initialMessages(): Message[] {
  return starter.map(([roomId, authorId, body, minutes], index) => {
    const reactions: Record<string, string[]> = index === 5
      ? { '🎉': ['me', 'james'], '🔥': ['sara'] }
      : index === 8
        ? { '💜': ['maria', 'sara'] }
        : {};
    return {
      id: `demo-msg-${index + 1}`,
      roomId,
      authorId,
      body,
      createdAt: minusMinutes(minutes),
      reactions
    };
  });
}

export const initialDemo = (): WorkspaceData => ({
  workspace: { id: 'studio', name: 'Atelier Studio', code: 'DEMO-ONLY', ownerId: DEMO_SELF },
  members,
  rooms,
  messages: initialMessages()
});

type DemoState = {
  data: WorkspaceData;
  sendMessage: (roomId: string, body: string, attachment?: Message['attachment']) => void;
  editMessage: (id: string, body: string) => void;
  deleteMessage: (id: string) => void;
  deleteChannel: (id: string) => void;
  react: (id: string, emoji: string) => void;
  addChannel: (name: string, description: string) => void;
  createDm: (memberId: string) => string;
  reset: () => void;
  sync: (data: WorkspaceData) => void;
};

export const useDemoStore = create<DemoState>()(persist((set, get) => ({
  data: initialDemo(),
  sendMessage: (roomId, body, attachment) => set((s) => ({
    data: {
      ...s.data,
      messages: [...s.data.messages, { id: crypto.randomUUID(), roomId, authorId: DEMO_SELF, body, createdAt: new Date().toISOString(), attachment, reactions: {} }]
    }
  })),
  editMessage: (id, body) => set((s) => ({
    data: { ...s.data, messages: s.data.messages.map((message) => message.id === id && message.authorId === DEMO_SELF ? { ...message, body, editedAt: new Date().toISOString() } : message) }
  })),
  deleteMessage: (id) => set((s) => {
    const message = s.data.messages.find((item) => item.id === id);
    const room = s.data.rooms.find((item) => item.id === message?.roomId);
    const canModerate = room?.kind === 'channel' && (room.createdBy === DEMO_SELF || !room.createdBy);
    if (!message || (message.authorId !== DEMO_SELF && !canModerate)) return s;
    return { data: { ...s.data, messages: s.data.messages.filter((item) => item.id !== id) } };
  }),
  deleteChannel: (id) => set((s) => {
    const room = s.data.rooms.find((item) => item.id === id);
    if (!room || room.kind !== 'channel' || (room.createdBy && room.createdBy !== DEMO_SELF)) return s;
    return { data: { ...s.data, rooms: s.data.rooms.filter((item) => item.id !== id), messages: s.data.messages.filter((item) => item.roomId !== id) } };
  }),
  react: (id, emoji) => set((s) => ({
    data: { ...s.data, messages: s.data.messages.map((message) => {
      if (message.id !== id) return message;
      const current = message.reactions[emoji] || [];
      const people = current.includes(DEMO_SELF) ? current.filter((user) => user !== DEMO_SELF) : [...current, DEMO_SELF];
      const reactions = { ...message.reactions, [emoji]: people };
      if (!people.length) delete reactions[emoji];
      return { ...message, reactions };
    }) }
  })),
  addChannel: (name, description) => set((s) => ({
    data: { ...s.data, rooms: [...s.data.rooms, { id: crypto.randomUUID(), workspaceId: 'studio', name, description, kind: 'channel', createdBy: DEMO_SELF, createdAt: new Date().toISOString() }] }
  })),
  createDm: (memberId) => {
    const existing = get().data.rooms.find((room) => room.kind === 'dm' && room.participantIds?.includes(memberId));
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    set((s) => ({ data: { ...s.data, rooms: [...s.data.rooms, { id, workspaceId: 'studio', name: memberId, description: '', kind: 'dm', participantIds: [DEMO_SELF, memberId], createdAt: new Date().toISOString() }] } }));
    return id;
  },
  reset: () => set({ data: initialDemo() }),
  sync: (data) => set({ data })
}), { name: 'collabspace-demo-v1', storage: createJSONStorage(() => localStorage) }));

export function startDemoSync() {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel('collabspace-demo-sync');
  let receiving = false;
  const unsubscribe = useDemoStore.subscribe((state) => {
    if (!receiving) channel.postMessage({ data: state.data });
  });
  channel.onmessage = (event: MessageEvent<{ data: WorkspaceData }>) => {
    if (!event.data?.data) return;
    receiving = true;
    useDemoStore.getState().sync(event.data.data);
    receiving = false;
  };
  return () => {
    unsubscribe();
    channel.close();
  };
}
