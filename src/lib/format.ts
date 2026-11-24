import type { Locale, Member, Message, Room } from './types';

export function formatTime(timestamp: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

export function formatDay(timestamp: string, locale: Locale) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export function resolveRoomName(room: Room, members: Member[], selfId: string, locale: Locale) {
  if (room.kind === 'channel') return room.name;
  const user = members.find((member) => room.participantIds?.includes(member.id) && member.id !== selfId);
  return user?.name || (locale === 'fa' ? 'گفتگوی خصوصی' : 'Direct message');
}

export function groupMessages(messages: Message[]) {
  return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function ensureMessageText(text: string, hasFile: boolean) {
  return Boolean(text.trim() || hasFile);
}

export function safeFileName(name: string) {
  return name.replace(/[^\w.\-\u0600-\u06FF]/g, '_').slice(0, 120);
}

export function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
