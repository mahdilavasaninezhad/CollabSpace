import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Bell, Check,
  ChevronRight, CircleHelp, Copy, FileText, Hash, Info,
  Languages, Lock, LogOut, MessageCircle, MessageSquareText, Moon, MoreHorizontal,
  Paperclip, Plus, Search, Send, Settings2, ShieldCheck, Smile, Sparkles, Sun, Trash2,
  Users, X, Zap, Pencil, Keyboard, RotateCcw, Bookmark, Download, ListFilter, CheckCheck, ChevronUp, ChevronDown
} from 'lucide-react';
import { configured } from './lib/supabase';
import { useCloud } from './core/useCloud';
import { DEMO_SELF, startDemoSync, useDemoStore } from './core/demo';
import { ensureMessageText, formatDay, formatTime, groupMessages, initials, resolveRoomName } from './lib/format';
import type { Attachment, Locale, Member, Message, Mode, Theme, ToastItem, WorkspaceData, Room } from './lib/types';

const copy = {
  en: {
    spaces: 'Spaces', inbox: 'Inbox', messages: 'Messages', channels: 'Channels', direct: 'Direct messages', people: 'People', files: 'Files', home: 'Home',
    search: 'Search in workspace', searchAll: 'Search messages, people and channels...', noSearch: 'Nothing matched your search',
    startConversation: 'Start a conversation', description: 'A little space for big ideas.', workspace: 'Workspace',
    online: 'Online', preview: 'Preview', previewNotice: 'Preview mode · saved in this browser', realTime: 'Live workspace',
    connect: 'Connect live workspace', enterPreview: 'Back to preview', settings: 'Preferences', theme: 'Appearance', light: 'Light', dark: 'Dark', language: 'Language',
    createChannel: 'Create channel', channelName: 'Channel name', channelTopic: 'What is this channel for?', create: 'Create', cancel: 'Cancel',
    writeMessage: 'Message', messagePlaceholder: 'Write a message...', send: 'Send', sendMessage: 'Send message',
    enterToSend: 'Enter to send · Shift + Enter for a new line', members: 'Members', teamDirectory: 'Team directory', startDm: 'Send message',
    invited: 'Invite your teammates', invite: 'Invite people', inviteCode: 'Invitation code', copy: 'Copy', copied: 'Copied',
    switchTheme: 'Switch theme', switchLanguage: 'Switch language', share: 'Share', overview: 'Overview',
    jumpInto: 'This is the beginning of', channelIntro: 'A shared place for conversations and collaboration.',
    emptyChat: 'No messages yet. Start the conversation.', noMessages: 'No matching messages in this channel.',
    today: 'Today', edited: 'edited', edit: 'Edit', delete: 'Delete', save: 'Save', react: 'React', attachment: 'Attachment', download: 'Download',
    selectFile: 'Attach a file', fileLimit: 'Max 10 MB in live mode, 1.5 MB in preview.',
    cloudOnly: 'Live sync between devices requires Supabase setup.',
    demoData: 'You are exploring sample data. Changes are saved locally and sync across tabs in the same browser.',
    refresh: 'Refresh', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
    email: 'Email', password: 'Password', fullName: 'Full name', haveAccount: 'Already have an account?', noAccount: 'New to CollabSpace?',
    welcome: 'Work together, beautifully.', authSubtitle: 'A thoughtful space for your team’s conversations, files and ideas.',
    authDisclaimer: 'Connected accounts and data are stored in your Supabase project.',
    verification: 'Check your email to confirm your account, then sign in.',
    resendEmail: 'Resend confirmation email', resendSent: 'A new confirmation email has been requested.',
    joinTeam: 'Join a team', newTeam: 'Create a workspace', teamName: 'Workspace name', joinCode: 'Enter invitation code',
    continue: 'Continue', back: 'Back', setupTitle: 'Make your space yours.', setupSubtitle: 'Create your team workspace or join one with an invitation code.',
    recentlyShared: 'Shared files', noFiles: 'No files shared yet', roomDetails: 'Conversation details',
    notifications: 'Notifications', notificationsOn: 'Browser notifications on', notificationsOff: 'Enable browser notifications',
    typing: 'is typing...', unknown: 'Something went wrong', channelCreated: 'Channel created', messageSent: 'Message sent',
    signedOut: 'Signed out', messageRemoved: 'Message deleted', messageUpdated: 'Message updated', mode: 'Mode',
    tryLive: 'Try live collaboration', setupHint: 'Add Supabase environment variables and run the SQL schema to enable real accounts, invites and live messaging.',
    inviteHint: 'Share this code with teammates who have registered an account.', channelNameHint: 'e.g. product-updates',
    workspacePeople: 'Your teammates', searchAllRooms: 'Search all conversations',
    deleteConfirm: 'Delete this message permanently?', resetDemo: 'Reset preview data', resetConfirm: 'Reset the preview workspace?',
    account: 'Account', memberCount: 'members', joined: 'Team channel', private: 'Private conversation',
    writing: 'Draft', fileReady: 'File attached', removeFile: 'Remove file', close: 'Close',
    noBackend: 'Live mode isn’t configured on this deployment yet.',
    role: 'Team member', attachmentTooLarge: 'This attachment is too large',
    invalidMessage: 'Write a message or add an attachment.',
    editing: 'Editing message', saveChanges: 'Save changes',
    noMembers: 'No other members yet', room: 'Conversation', openSidebar: 'Open navigation',
    openDetails: 'Open conversation details', hideDetails: 'Hide details',
    channelRequired: 'Enter at least two characters for the channel name.',
    refreshData: 'Refresh conversations', personal: 'Personal preferences',
    cloudConnected: 'Realtime enabled', noCloud: 'Preview mode',
    emptySelection: 'Choose a conversation to get started.',
    searchShortcut: 'Ctrl K to search', emojiHint: 'React to this message',
    sendDm: 'Message', teamOverview: 'Bring your team closer',
    messageNotSaved: 'Could not save the message',
    pressEsc: 'Press Esc to close', profile: 'Your profile', attachmentName: 'Attached file',
    latestActivity: 'Latest conversations', status: 'Status', open: 'Open', avatar: 'Avatar', person: 'Person',
    authPending: 'Please sign in to continue', previewOnly: 'Local preview',
    peopleSearch: 'Find a teammate', teamInvite: 'Invite code',
    cancelEdit: 'Cancel editing', channelDescription: 'Channel description',
    signedInAs: 'Signed in as', liveSession: 'Live session', loading: 'Loading your workspace...',
    refreshFailed: 'Unable to load workspace', noCloudLink: 'This preview doesn’t connect different devices.',
    fileDownload: 'Open attachment', lock: 'Private', publicRoom: 'Team channel', reactQuick: 'Quick reactions',
    savedMessages: 'Saved messages', saveMessage: 'Save message', unsaveMessage: 'Remove saved message', savedHere: 'Saved on this device', noSaved: 'No saved messages yet. Bookmark a message to find it here.',
    unreadOnly: 'Unread only', showAll: 'Show all', noUnread: 'You are all caught up.', markUnread: 'Mark as unread', markedUnread: 'Conversation marked unread',
    searchHere: 'Find in this conversation', searchCount: 'results', previousMatch: 'Previous match', nextMatch: 'Next match', clearSearch: 'Clear search',
    exportChat: 'Export loaded messages', exported: 'Conversation exported', draftRestored: 'Draft saved on this device',
    sendPreference: 'Send shortcut', sendWithEnter: 'Enter', sendWithModifier: 'Ctrl + Enter', mobileBack: 'Back to conversations', quickAccess: 'Quick access', jumpLatest: 'Jump to latest', deleteChannel: 'Delete channel', channelRemoved: 'Channel deleted', channelDeletionWarning: 'This permanently deletes the channel, every message and reaction in it for all team members. This cannot be undone.', channelDeletionPrompt: 'Type the channel name to confirm deletion', channelCreatorOnly: 'Only the channel creator can delete it.', deletePermanently: 'Delete permanently', channelCreator: 'Created by'
  },
  fa: {
    spaces: 'فضاها', inbox: 'صندوق پیام', messages: 'پیام‌ها', channels: 'کانال‌ها', direct: 'گفتگوهای خصوصی', people: 'افراد', files: 'فایل‌ها', home: 'خانه',
    search: 'جست‌وجو در تیم', searchAll: 'جست‌وجوی پیام، افراد و کانال‌ها...', noSearch: 'نتیجه‌ای برای جست‌وجو پیدا نشد',
    startConversation: 'شروع گفتگو', description: 'فضایی کوچک برای ایده‌های بزرگ.', workspace: 'فضای کاری',
    online: 'آنلاین', preview: 'دمو', previewNotice: 'حالت آزمایشی · ذخیره در این مرورگر', realTime: 'فضای کاری زنده',
    connect: 'اتصال به فضای کاری واقعی', enterPreview: 'بازگشت به نسخه نمایشی', settings: 'تنظیمات', theme: 'ظاهر', light: 'روشن', dark: 'تیره', language: 'زبان',
    createChannel: 'ساخت کانال', channelName: 'نام کانال', channelTopic: 'این کانال برای چه کاری است؟', create: 'ایجاد', cancel: 'انصراف',
    writeMessage: 'پیام', messagePlaceholder: 'پیامت را بنویس...', send: 'ارسال', sendMessage: 'ارسال پیام',
    enterToSend: 'Enter برای ارسال · Shift + Enter برای خط جدید', members: 'اعضا', teamDirectory: 'فهرست اعضای تیم', startDm: 'ارسال پیام',
    invited: 'دعوت از هم‌تیمی‌ها', invite: 'دعوت افراد', inviteCode: 'کد دعوت', copy: 'کپی', copied: 'کپی شد',
    switchTheme: 'تغییر تم', switchLanguage: 'تغییر زبان', share: 'اشتراک‌گذاری', overview: 'نمای کلی',
    jumpInto: 'شروع گفتگو در', channelIntro: 'فضایی مشترک برای گفتگو و همکاری.',
    emptyChat: 'هنوز پیامی وجود ندارد. گفتگو را شروع کن.', noMessages: 'پیامی متناسب با جست‌وجو پیدا نشد.',
    today: 'امروز', edited: 'ویرایش‌شده', edit: 'ویرایش', delete: 'حذف', save: 'ذخیره', react: 'واکنش', attachment: 'پیوست', download: 'دانلود',
    selectFile: 'پیوست کردن فایل', fileLimit: 'حداکثر ۱۰ مگابایت در حالت واقعی و ۱٫۵ مگابایت در حالت دمو.',
    cloudOnly: 'برای همگام‌سازی بین دستگاه‌ها باید Supabase راه‌اندازی شود.',
    demoData: 'در حال بررسی داده‌های نمونه هستی. تغییرات محلی ذخیره و بین تب‌های همین مرورگر همگام می‌شوند.',
    refresh: 'بارگذاری مجدد', signIn: 'ورود', signUp: 'ساخت حساب', signOut: 'خروج',
    email: 'ایمیل', password: 'رمز عبور', fullName: 'نام کامل', haveAccount: 'از قبل حساب داری؟', noAccount: 'تازه وارد CollabSpace شدی؟',
    welcome: 'همکاری، به زیباترین شکل.', authSubtitle: 'فضایی آرام و حرفه‌ای برای گفتگوها، فایل‌ها و ایده‌های تیم.',
    authDisclaimer: 'حساب‌های واقعی و داده‌ها در پروژه Supabase شما ذخیره می‌شوند.',
    verification: 'ایمیلت را تأیید کن و سپس وارد حساب شو.',
    resendEmail: 'ارسال دوباره ایمیل تأیید', resendSent: 'درخواست ارسال دوباره ایمیل تأیید ثبت شد.',
    joinTeam: 'پیوستن به تیم', newTeam: 'ساخت فضای کاری', teamName: 'نام فضای کاری', joinCode: 'کد دعوت را وارد کن',
    continue: 'ادامه', back: 'بازگشت', setupTitle: 'فضای تیمی خودت را بساز.', setupSubtitle: 'یک فضای کاری جدید ایجاد کن یا با کد دعوت به تیم بپیوند.',
    recentlyShared: 'فایل‌های اشتراک‌گذاری‌شده', noFiles: 'هنوز فایلی ارسال نشده', roomDetails: 'جزئیات گفتگو',
    notifications: 'اعلان‌ها', notificationsOn: 'اعلان مرورگر فعال است', notificationsOff: 'فعال‌کردن اعلان مرورگر',
    typing: 'در حال نوشتن است...', unknown: 'خطایی رخ داد', channelCreated: 'کانال ساخته شد', messageSent: 'پیام ارسال شد',
    signedOut: 'از حساب خارج شدی', messageRemoved: 'پیام حذف شد', messageUpdated: 'پیام ویرایش شد', mode: 'حالت',
    tryLive: 'شروع همکاری واقعی', setupHint: 'برای فعال‌شدن حساب، دعوت و پیام‌رسانی واقعی، تنظیمات Supabase و اسکریپت SQL را انجام بده.',
    inviteHint: 'این کد را برای هم‌تیمی‌هایی بفرست که حساب کاربری ساخته‌اند.', channelNameHint: 'مثلاً product-updates',
    workspacePeople: 'اعضای تیم', searchAllRooms: 'جست‌وجو در همه گفتگوها',
    deleteConfirm: 'این پیام برای همیشه حذف شود؟', resetDemo: 'بازنشانی داده‌های دمو', resetConfirm: 'اطلاعات آزمایشی به حالت اولیه برگردد؟',
    account: 'حساب کاربری', memberCount: 'عضو', joined: 'کانال تیمی', private: 'گفتگوی خصوصی',
    writing: 'پیش‌نویس', fileReady: 'فایل پیوست شد', removeFile: 'حذف پیوست', close: 'بستن',
    noBackend: 'اتصال حالت واقعی هنوز برای این سایت تنظیم نشده است.',
    role: 'عضو تیم', attachmentTooLarge: 'حجم این پیوست بیش از حد مجاز است',
    invalidMessage: 'یک پیام بنویس یا فایل پیوست کن.',
    editing: 'ویرایش پیام', saveChanges: 'ذخیره تغییرات',
    noMembers: 'هنوز عضو دیگری وجود ندارد', room: 'گفتگو', openSidebar: 'باز کردن منو',
    openDetails: 'نمایش جزئیات گفتگو', hideDetails: 'پنهان‌کردن جزئیات',
    channelRequired: 'نام کانال باید حداقل دو نویسه داشته باشد.',
    refreshData: 'بارگذاری دوباره گفتگوها', personal: 'تنظیمات شخصی',
    cloudConnected: 'ارتباط زنده فعال', noCloud: 'حالت نمایشی',
    emptySelection: 'برای شروع، یک گفتگو انتخاب کن.',
    searchShortcut: 'Ctrl K برای جست‌وجو', emojiHint: 'واکنش به پیام',
    sendDm: 'پیام', teamOverview: 'تیمت را به هم نزدیک‌تر کن',
    messageNotSaved: 'پیام ذخیره نشد',
    pressEsc: 'Escape برای بستن', profile: 'پروفایل تو', attachmentName: 'فایل پیوست',
    latestActivity: 'گفتگوهای اخیر', status: 'وضعیت', open: 'باز', avatar: 'تصویر', person: 'شخص',
    authPending: 'برای ادامه وارد حساب شو', previewOnly: 'نسخه نمایشی محلی',
    peopleSearch: 'جست‌وجوی هم‌تیمی', teamInvite: 'کد دعوت',
    cancelEdit: 'لغو ویرایش', channelDescription: 'توضیح کانال',
    signedInAs: 'واردشده با', liveSession: 'جلسه فعال', loading: 'در حال بارگذاری فضای کاری...',
    refreshFailed: 'فضای کاری بارگذاری نشد', noCloudLink: 'این نسخه نمایشی بین دستگاه‌های مختلف همگام نمی‌شود.',
    fileDownload: 'باز کردن پیوست', lock: 'خصوصی', publicRoom: 'کانال تیمی', reactQuick: 'واکنش‌های سریع',
    savedMessages: 'پیام‌های ذخیره‌شده', saveMessage: 'ذخیره پیام', unsaveMessage: 'حذف از ذخیره‌شده‌ها', savedHere: 'ذخیره‌شده در همین دستگاه', noSaved: 'هنوز پیامی ذخیره نشده. پیام‌های مهم را نشان‌دار کن.',
    unreadOnly: 'فقط خوانده‌نشده‌ها', showAll: 'نمایش همه', noUnread: 'همه گفتگوها را خوانده‌ای.', markUnread: 'علامت‌گذاری به‌عنوان خوانده‌نشده', markedUnread: 'گفتگو خوانده‌نشده شد',
    searchHere: 'جست‌وجو در این گفتگو', searchCount: 'نتیجه', previousMatch: 'نتیجه قبلی', nextMatch: 'نتیجه بعدی', clearSearch: 'پاک‌کردن جست‌وجو',
    exportChat: 'خروجی پیام‌های بارگذاری‌شده', exported: 'خروجی گفتگو آماده شد', draftRestored: 'پیش‌نویس روی این دستگاه ذخیره می‌شود',
    sendPreference: 'میانبر ارسال پیام', sendWithEnter: 'Enter', sendWithModifier: 'Ctrl + Enter', mobileBack: 'بازگشت به گفتگوها', quickAccess: 'دسترسی سریع', jumpLatest: 'آخرین پیام‌ها', deleteChannel: 'حذف کانال', channelRemoved: 'کانال حذف شد', channelDeletionWarning: 'با این کار کانال و تمام پیام‌ها و واکنش‌های آن برای همه اعضای تیم برای همیشه حذف می‌شود. این کار برگشت‌پذیر نیست.', channelDeletionPrompt: 'برای تأیید، نام کانال را وارد کن', channelCreatorOnly: 'فقط سازنده کانال اجازه حذف آن را دارد.', deletePermanently: 'حذف دائمی', channelCreator: 'سازنده کانال'
  }
} as const;

type Key = keyof typeof copy.en;
type T = (key: Key) => string;
const emojis = ['✨', '👍', '💜', '🔥', '🎉', '😂'];

function usePreference<TValue extends string>(name: string, fallback: TValue) {
  const [value, setValue] = useState<TValue>(() => (localStorage.getItem(name) as TValue | null) || fallback);
  const change = (next: TValue) => {
    setValue(next);
    localStorage.setItem(name, next);
  };
  return [value, change] as const;
}

function IconButton({ label, children, onClick, active = false, className = '' }: { label: string; children: ReactNode; onClick: () => void; active?: boolean; className?: string }) {
  return <button type="button" className={`icon-button ${active ? 'is-active' : ''} ${className}`} title={label} aria-label={label} onClick={onClick}>{children}</button>;
}

function Avatar({ member, size = 'md', online = false }: { member?: Member; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
  return <span className={`avatar avatar-${size} avatar-${member?.color || 'violet'}`} title={member?.name || ''}>
    {initials(member?.name || '?')}
    {online && <span className="online-indicator" />}
  </span>;
}

function Modal({ title, onClose, children, width = 'normal' }: { title: string; onClose: () => void; children: ReactNode; width?: 'normal' | 'wide' }) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);
  return <div className="modal-screen" role="presentation">
    <button className="modal-shade" onClick={onClose} aria-label="Close dialog" />
    <section className={`modal-sheet modal-${width}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><h2>{title}</h2><IconButton label="Close" onClick={onClose}><X size={18} /></IconButton></div>
      {children}
    </section>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><div className="brand-icon"><MessageSquareText size={23} strokeWidth={2.4} /></div>{!compact && <div className="brand-word">Collab<span>Space</span></div>}</div>;
}

function MessageCard({
  message, author, own, canDelete, locale, t, onReact, onEdit, onDelete, onOpenProfile, onSave, saved, highlighted, matched
}: {
  message: Message;
  author?: Member;
  own: boolean;
  canDelete: boolean;
  locale: Locale;
  t: T;
  onReact: (message: Message, emoji: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onOpenProfile: (memberId: string) => void;
  onSave: (message: Message) => void;
  saved: boolean;
  highlighted: boolean;
  matched: boolean;
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const isImage = message.attachment?.type?.startsWith('image/') || Boolean(message.attachment?.url?.startsWith('data:image/'));
  return <article id={`message-${message.id}`} className={`message-row ${own ? 'message-own' : ''} ${highlighted ? 'message-focused' : ''} ${matched ? 'message-search-match' : ''}`}>
    <button className="avatar-action" onClick={() => onOpenProfile(message.authorId)}><Avatar member={author} size="md" /></button>
    <div className="message-main">
      <div className="message-byline"><button onClick={() => onOpenProfile(message.authorId)} className="author-name">{author?.name || 'Teammate'}</button><time>{formatTime(message.createdAt, locale)}</time>{message.editedAt && <span className="edited-tag">· {t('edited')}</span>}</div>
      {message.body && <p className="message-body">{message.body}</p>}
      {message.attachment && <a className={`file-pill ${isImage ? 'file-image' : ''}`} href={message.attachment.url || '#'} download={message.attachment.name} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!message.attachment?.url) e.preventDefault(); }}>
        {isImage && message.attachment.url ? <img className="attachment-image" src={message.attachment.url} alt={message.attachment.name} /> : <span className="file-icon"><FileText size={20} /></span>}
        <span className="file-meta"><strong>{message.attachment.name}</strong><small>{t('fileDownload')}</small></span><ArrowDownToLine size={16} />
      </a>}
      {!!Object.keys(message.reactions).length && <div className="reaction-list">
        {Object.entries(message.reactions).map(([emoji, people]) => <button key={emoji} className="reaction-chip" title={people.length.toString()} onClick={() => onReact(message, emoji)}><span>{emoji}</span><span>{people.length}</span></button>)}
      </div>}
    </div>
    <div className="message-actions">
      <IconButton label={saved ? t('unsaveMessage') : t('saveMessage')} active={saved} onClick={() => onSave(message)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></IconButton>
      <IconButton label={t('react')} onClick={() => setReactionsOpen((previous) => !previous)}><Smile size={16} /></IconButton>
      {own && <IconButton label={t('edit')} onClick={() => onEdit(message)}><Pencil size={15} /></IconButton>}
      {canDelete && <IconButton label={t('delete')} onClick={() => onDelete(message)}><Trash2 size={15} /></IconButton>}
      {reactionsOpen && <div className="quick-reactions">{emojis.map((emoji) => <button key={emoji} onClick={() => { onReact(message, emoji); setReactionsOpen(false); }}>{emoji}</button>)}</div>}
    </div>
  </article>;
}

function Notice({ text, kind, onDismiss }: { text: string; kind: ToastItem['tone']; onDismiss: () => void }) {
  return <div className={`notice notice-${kind}`} role="status"><span>{kind === 'positive' ? <Check size={16} /> : kind === 'error' ? <CircleHelp size={16} /> : <Info size={16} />}</span><span>{text}</span><button aria-label="Dismiss" onClick={onDismiss}><X size={15} /></button></div>;
}

function AuthScreen({ theme, t, cloud, onPreview, onTheme, onLocale }: {
  theme: Theme; t: T; cloud: ReturnType<typeof useCloud>; onPreview: () => void; onTheme: () => void; onLocale: () => void;
}) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    try {
      if (register) {
        const result = await cloud.signUp(name.trim(), email.trim(), password);
        if (result === 'confirmation-required') setMessage(t('verification'));
      } else await cloud.signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };
  const resend = async () => {
    setPending(true);
    setError('');
    try {
      await cloud.resendConfirmation(email.trim());
      setMessage(t('resendSent'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };
  return <div className="auth-layout">
    <section className="auth-art">
      <Brand />
      <div className="auth-art-center"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-orbit orbit-three" /><div className="art-bubble"><MessageCircle size={38} /></div><span className="art-spark"><Sparkles size={23} /></span></div>
      <div className="auth-art-bottom"><span className="eyebrow">WELCOME TO YOUR SPACE</span><h1>{t('welcome')}</h1><p>{t('authSubtitle')}</p></div>
    </section>
    <section className="auth-form-area">
      <div className="auth-controls"><IconButton label={t('switchLanguage')} onClick={onLocale}><Languages size={18} /></IconButton><IconButton label={t('switchTheme')} onClick={onTheme}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</IconButton></div>
      <div className="auth-form-card"><span className="eyebrow">COLLABSPACE ACCOUNT</span><h2>{register ? t('signUp') : t('signIn')}</h2><p className="muted">{t('authDisclaimer')}</p>
        <form onSubmit={submit} className="vertical-form">
          {register && <label>{t('fullName')}<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required autoComplete="name" /></label>}
          <label>{t('email')}<input value={email} type="email" required autoComplete="email" onChange={(event) => setEmail(event.target.value)} /></label>
          <label>{t('password')}<input value={password} type="password" minLength={6} required autoComplete={register ? 'new-password' : 'current-password'} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <div className="inline-error">{error}</div>}
          {message && <div className="inline-success">{message}</div>}
          {register && message && <button type="button" className="button-secondary full" disabled={pending || !email.trim()} onClick={resend}>{t('resendEmail')}</button>}
          <button className="button-primary full" disabled={pending}>{pending ? '...' : register ? t('signUp') : t('signIn')}<ArrowRight size={17} /></button>
        </form>
        <div className="auth-switch">{register ? t('haveAccount') : t('noAccount')} <button onClick={() => { setRegister(!register); setError(''); setMessage(''); }}>{register ? t('signIn') : t('signUp')}</button></div>
        <button className="button-quiet full" onClick={onPreview}><ArrowLeft size={16} />{t('enterPreview')}</button>
      </div>
    </section>
  </div>;
}

function WorkspaceSetup({ locale, t, cloud, onPreview }: { locale: Locale; t: T; cloud: ReturnType<typeof useCloud>; onPreview: () => void }) {
  const [joining, setJoining] = useState(false);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      if (joining) await cloud.joinWorkspace(value);
      else await cloud.createWorkspace(value);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setPending(false); }
  };
  return <div className="setup-screen"><Brand /><div className="setup-card">
    <span className="setup-emblem"><Users size={28} /></span><span className="eyebrow">{t('workspace')}</span><h1>{t('setupTitle')}</h1><p>{t('setupSubtitle')}</p>
    <div className="setup-tabs"><button className={!joining ? 'active' : ''} onClick={() => { setJoining(false); setValue(''); setError(''); }}>{t('newTeam')}</button><button className={joining ? 'active' : ''} onClick={() => { setJoining(true); setValue(''); setError(''); }}>{t('joinTeam')}</button></div>
    <form onSubmit={submit} className="vertical-form"><label>{joining ? t('joinCode') : t('teamName')}<input value={value} onChange={(event) => setValue(event.target.value)} minLength={joining ? 6 : 2} required placeholder={joining ? 'A1B2C3D4E5F6' : locale === 'fa' ? 'استودیوی ما' : 'Our design studio'} /></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="button-primary full" disabled={pending}>{pending ? '...' : t('continue')}<ArrowRight size={17} /></button></form>
    <button className="button-quiet full" onClick={onPreview}>{t('enterPreview')}</button>
  </div></div>;
}

export default function App() {
  const [locale, setLocale] = usePreference<Locale>('collabspace-language', 'en');
  const [theme, setTheme] = usePreference<Theme>('collabspace-theme', 'light');
  const [mode, setMode] = usePreference<Mode>('collabspace-mode', 'demo');
  const [sendShortcut, setSendShortcut] = usePreference<'enter' | 'modifier'>('collabspace-send-shortcut', 'enter');
  useEffect(() => {
    if (!configured) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const search = new URLSearchParams(window.location.search);
    if (hash.has('access_token') || hash.has('error_code') || search.has('code') || search.has('error_code')) {
      setMode('cloud');
    }
  }, []);
  const cloud = useCloud(mode === 'cloud' && configured);
  const demo = useDemoStore();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('collabspace-drafts-v2') || '{}') as Record<string, string>; }
    catch { return {}; }
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pending, setPending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showDetails, setShowDetails] = useState(() => window.matchMedia('(min-width: 1161px)').matches);
  const [showNav, setShowNav] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  const [overlay, setOverlay] = useState<'search' | 'members' | 'channel' | 'settings' | 'invite' | 'profile' | 'saved' | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<Room | null>(null);
  const [deleteChannelText, setDeleteChannelText] = useState('');
  const [deletingChannel, setDeletingChannel] = useState(false);
  const [editText, setEditText] = useState('');
  const [search, setSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [roomSearchOpen, setRoomSearchOpen] = useState(false);
  const [matchIndex, setMatchIndex] = useState(-1);
  const [focusedMessage, setFocusedMessage] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('collabspace-saved-v1') || '[]') as string[]; }
    catch { return []; }
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [lastRead, setLastRead] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('collabspace-last-read') || '{}') as Record<string, string>; }
    catch { return {}; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingAt = useRef(0);
  const noticeTimer = useRef<number | undefined>(undefined);
  const previousMessageCount = useRef(0);
  const previousRoom = useRef<string | null>(null);
  const t: T = (key) => copy[locale][key];
  const inCloud = mode === 'cloud' && configured;
  const data: WorkspaceData = inCloud ? cloud.data : demo.data;
  const meId = inCloud ? cloud.user?.id || '' : DEMO_SELF;
  const myself = data.members.find((member) => member.id === meId);
  const rooms = data.rooms;
  const members = data.members;
  const channels = rooms.filter((room) => room.kind === 'channel');
  const canDeleteChannel = (room: Room) => room.kind === 'channel' && (room.createdBy === meId || (!inCloud && !room.createdBy));
  const directs = rooms.filter((room) => room.kind === 'dm' && room.participantIds?.includes(meId));
  const activeRoom = rooms.find((room) => room.id === roomId) || rooms[0] || null;
  const workspaceScope = `${inCloud ? 'cloud' : 'demo'}:${data.workspace?.id || 'default'}:${meId}`;
  const draftKey = `${workspaceScope}:${activeRoom?.id || 'none'}`;
  const draft = drafts[draftKey] || '';
  const setDraft = (value: string | ((previous: string) => string)) => {
    setDrafts((previous) => {
      const next = typeof value === 'function' ? value(previous[draftKey] || '') : value;
      if (next === (previous[draftKey] || '')) return previous;
      return { ...previous, [draftKey]: next };
    });
  };
  const messageSaveKey = (message: Message) => `${workspaceScope}:${message.id}`;
  const isSaved = (message: Message) => savedIds.includes(messageSaveKey(message));
  const currentMessages = useMemo(() => groupMessages(data.messages.filter((message) => message.roomId === activeRoom?.id)), [data.messages, activeRoom?.id]);
  const lastMessage = currentMessages[currentMessages.length - 1];
  const roomMatches = useMemo(() => {
    const term = roomSearch.trim().toLocaleLowerCase(locale);
    return term ? currentMessages.filter((message) => message.body.toLocaleLowerCase(locale).includes(term) || message.attachment?.name.toLocaleLowerCase(locale).includes(term)) : [];
  }, [currentMessages, roomSearch, locale]);
  const savedMessages = data.messages.filter(isSaved).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const roomTitle = activeRoom ? resolveRoomName(activeRoom, members, meId, locale) : '';
  const currentPeer = activeRoom?.kind === 'dm' ? members.find((member) => activeRoom.participantIds?.includes(member.id) && member.id !== meId) : undefined;
  const currentOnline = inCloud ? cloud.online : [DEMO_SELF];
  const visibleMembers = members.filter((member) => member.name.toLowerCase().includes(memberSearch.trim().toLowerCase()));
  const attachments = data.messages.filter((message) => message.attachment && message.roomId === activeRoom?.id).slice(-4).reverse();
  const onlineCount = inCloud ? currentOnline.length : 0;
  const activeRoomMessageCount = data.messages.filter((message) => message.roomId === activeRoom?.id).length;
  const todayCount = data.messages.filter((message) => new Date(message.createdAt).toDateString() === new Date().toDateString()).length;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme;
    document.title = `CollabSpace · ${data.workspace?.name || 'Team collaboration'}`;
  }, [locale, theme, data.workspace?.name]);

  useEffect(() => startDemoSync(), []);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 720px)');
    const compact = window.matchMedia('(max-width: 1160px)');
    const handleMobile = (event: MediaQueryListEvent) => {
      setShowNav(event.matches);
      if (event.matches) setShowDetails(false);
    };
    const handleCompact = (event: MediaQueryListEvent) => {
      setShowDetails(!event.matches);
    };
    mobile.addEventListener('change', handleMobile);
    compact.addEventListener('change', handleCompact);
    return () => {
      mobile.removeEventListener('change', handleMobile);
      compact.removeEventListener('change', handleCompact);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || overlay) return;
      if (showDetails && window.matchMedia('(max-width: 1160px)').matches) setShowDetails(false);
      else if (showNav && window.matchMedia('(max-width: 720px)').matches) setShowNav(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showNav, showDetails, overlay]);

  useEffect(() => {
    if (roomId && !rooms.some((room) => room.id === roomId)) setRoomId(rooms[0]?.id || null);
    if (!roomId && rooms.length) setRoomId(rooms[0].id);
  }, [roomId, rooms]);

  useEffect(() => {
    if (!activeRoom?.id || !lastMessage?.createdAt || !isNearBottom || showNav) return;
    const room = activeRoom.id;
    const when = lastMessage.createdAt;
    setLastRead((previous) => previous[room] && previous[room] >= when ? previous : { ...previous, [room]: when });
  }, [activeRoom?.id, lastMessage?.id, lastMessage?.createdAt, isNearBottom, showNav]);

  useEffect(() => {
    localStorage.setItem('collabspace-last-read', JSON.stringify(lastRead));
  }, [lastRead]);

  useEffect(() => {
    localStorage.setItem('collabspace-drafts-v2', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('collabspace-saved-v1', JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    const changed = previousRoom.current !== activeRoom?.id;
    previousRoom.current = activeRoom?.id || null;
    if (changed) setIsNearBottom(true);
    if (!focusedMessage && (changed || isNearBottom)) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: changed ? 'auto' : 'smooth' });
    }
  }, [activeRoom?.id, lastMessage?.id, focusedMessage]);

  useEffect(() => {
    if (!focusedMessage) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`message-${focusedMessage}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedMessage, activeRoom?.id]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOverlay('search');
      }
      if (event.key === 'Escape' && overlay) setOverlay(null);
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [overlay]);

  useEffect(() => {
    if (overlay === 'search') searchRef.current?.focus();
  }, [overlay]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !emojiPickerRef.current?.contains(event.target)) setShowEmojiPicker(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowEmojiPicker(false);
    };
    window.addEventListener('pointerdown', closeOnOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (previousMessageCount.current && data.messages.length > previousMessageCount.current && inCloud && 'Notification' in window && Notification.permission === 'granted') {
      const latest = data.messages[data.messages.length - 1];
      if (latest && latest.authorId !== meId && latest.roomId !== activeRoom?.id) {
        const title = rooms.find((room) => room.id === latest.roomId);
        new Notification(title ? resolveRoomName(title, members, meId, locale) : 'CollabSpace', { body: latest.body.slice(0, 140) || t('attachmentName') });
      }
    }
    previousMessageCount.current = data.messages.length;
  }, [data.messages.length, inCloud, meId, activeRoom?.id, rooms, members, locale]);

  const notify = (text: string, tone: ToastItem['tone'] = 'positive') => {
    window.clearTimeout(noticeTimer.current);
    const id = crypto.randomUUID();
    setToast({ id, text, tone });
    noticeTimer.current = window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 3600);
  };

  const perform = async (action: () => Promise<void> | void, success?: string) => {
    try {
      await action();
      if (success) notify(success);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), 'error');
    }
  };

  const showRoom = (nextId: string) => {
    setRoomId(nextId);
    setIsNearBottom(true);
    setAttachedFile(null);
    setShowEmojiPicker(false);
    setRoomSearchOpen(false);
    setRoomSearch('');
    setFocusedMessage(null);
    setShowNav(false);
    setOverlay(null);
    if (!window.matchMedia('(max-width: 720px)').matches) inputRef.current?.focus();
  };

  const toggleSaved = (message: Message) => {
    const key = messageSaveKey(message);
    setSavedIds((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]);
  };

  const jumpToMessage = (message: Message) => {
    if (message.roomId !== activeRoom?.id) showRoom(message.roomId);
    setFocusedMessage(message.id);
    setOverlay(null);
    setShowNav(false);
  };

  const jumpToMatch = (index: number) => {
    if (!roomMatches.length) return;
    const next = ((index % roomMatches.length) + roomMatches.length) % roomMatches.length;
    setMatchIndex(next);
    setFocusedMessage(roomMatches[next].id);
  };

  const markUnread = () => {
    if (!activeRoom) return;
    const lastIncoming = [...currentMessages].reverse().find((message) => message.authorId !== meId);
    if (!lastIncoming) return;
    const point = new Date(new Date(lastIncoming.createdAt).getTime() - 1).toISOString();
    setLastRead((previous) => ({ ...previous, [activeRoom.id]: point }));
    notify(t('markedUnread'));
    if (window.matchMedia('(max-width: 720px)').matches) setShowNav(true);
  };

  const exportConversation = () => {
    if (!activeRoom) return;
    const lines = [`${roomTitle} — CollabSpace`, `${data.workspace?.name || 'Workspace'}`, '', ...currentMessages.map((message) => {
      const author = members.find((member) => member.id === message.authorId)?.name || 'Member';
      return `[${new Date(message.createdAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}] ${author}: ${message.body}${message.attachment ? ` [${message.attachment.name}]` : ''}`;
    })];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${roomTitle.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 50) || 'conversation'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t('exported'));
  };

  const unread = (id: string) => {
    const latestSeen = lastRead[id] || (inCloud ? '1970-01-01T00:00:00.000Z' : new Date(Date.now() - 120 * 60000).toISOString());
    return data.messages.filter((message) => message.roomId === id && message.authorId !== meId && message.createdAt > latestSeen).length;
  };

  const unreadCount = [...channels, ...directs].reduce((total, room) => total + unread(room.id), 0);

  const fileToUrl = async (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('File could not be read'));
    reader.readAsDataURL(file);
  });

  const send = async () => {
    if (!activeRoom || pending) return;
    if (!ensureMessageText(draft, Boolean(attachedFile))) {
      notify(t('invalidMessage'), 'neutral');
      return;
    }
    const body = draft;
    const file = attachedFile;
    setPending(true);
    try {
      if (inCloud) await cloud.sendMessage(activeRoom.id, body, file || undefined);
      else {
        let attachment: Attachment | undefined;
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) throw new Error(t('attachmentTooLarge'));
          attachment = { name: file.name, url: await fileToUrl(file), type: file.type };
        }
        demo.sendMessage(activeRoom.id, body.trim(), attachment);
      }
      setDraft('');
      setAttachedFile(null);
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), 'error');
    } finally { setPending(false); }
  };

  const onDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
    if (inCloud && activeRoom && Date.now() - typingAt.current > 1700) {
      typingAt.current = Date.now();
      cloud.sendTyping(activeRoom.id);
    }
  };

  const toggleReaction = (message: Message, emoji: string) => {
    void perform(() => inCloud ? cloud.toggleReaction(message.id, emoji) : demo.react(message.id, emoji));
  };

  const editMessage = (message: Message) => {
    setEditing(message);
    setEditText(message.body);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing || (!editText.trim() && !editing.attachment)) return;
    try {
      if (inCloud) await cloud.editMessage(editing.id, editText.trim());
      else demo.editMessage(editing.id, editText.trim());
      setEditing(null);
      notify(t('messageUpdated'));
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), 'error');
    }
  };

  const deleteMessage = (message: Message) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    void perform(() => inCloud ? cloud.deleteMessage(message.id) : demo.deleteMessage(message.id), t('messageRemoved'));
  };

  const requestChannelDeletion = (room: Room) => {
    if (!canDeleteChannel(room)) return;
    setDeleteChannelText('');
    setChannelToDelete(room);
  };

  const confirmChannelDeletion = async (event: FormEvent) => {
    event.preventDefault();
    const room = channelToDelete;
    if (!room || !canDeleteChannel(room) || deleteChannelText !== room.name || deletingChannel) return;
    setDeletingChannel(true);
    try {
      if (inCloud) await cloud.deleteChannel(room.id);
      else demo.deleteChannel(room.id);
      const keys = new Set(data.messages.filter((message) => message.roomId === room.id).map((message) => messageSaveKey(message)));
      setSavedIds((previous) => previous.filter((key) => !keys.has(key)));
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[`${workspaceScope}:${room.id}`];
        return next;
      });
      setLastRead((previous) => {
        const next = { ...previous };
        delete next[room.id];
        return next;
      });
      if (roomId === room.id) setRoomId(rooms.find((item) => item.id !== room.id)?.id || null);
      setChannelToDelete(null);
      setShowDetails(false);
      setRoomSearchOpen(false);
      setFocusedMessage(null);
      notify(t('channelRemoved'));
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), 'error');
    } finally {
      setDeletingChannel(false);
    }
  };

  const createChannel = async (event: FormEvent) => {
    event.preventDefault();
    const name = channelName.trim().replace(/\s+/g, '-').toLowerCase();
    if (name.length < 2) { notify(t('channelRequired'), 'error'); return; }
    try {
      if (inCloud) await cloud.addChannel(name, channelTopic.trim());
      else demo.addChannel(name, channelTopic.trim());
      setChannelName('');
      setChannelTopic('');
      setOverlay(null);
      notify(t('channelCreated'));
    } catch (cause) { notify(cause instanceof Error ? cause.message : String(cause), 'error'); }
  };

  const startDm = async (memberId: string) => {
    if (memberId === meId) return;
    try {
      const nextRoom = inCloud ? await cloud.createDm(memberId) : demo.createDm(memberId);
      showRoom(nextRoom);
    } catch (cause) { notify(cause instanceof Error ? cause.message : String(cause), 'error'); }
  };

  const copyInvite = async () => {
    if (!inCloud || !data.workspace?.code) { notify(t('cloudOnly'), 'neutral'); return; }
    try {
      await navigator.clipboard.writeText(data.workspace.code);
      notify(t('copied'));
    } catch { notify(data.workspace.code, 'neutral'); }
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) { notify(t('notificationsOff'), 'neutral'); return; }
    const result = await Notification.requestPermission();
    notify(result === 'granted' ? t('notificationsOn') : t('notificationsOff'), 'neutral');
  };

  const searchTerm = search.trim().toLowerCase();
  const matchingMessages = searchTerm ? data.messages.filter((message) => message.body.toLowerCase().includes(searchTerm) || message.attachment?.name.toLowerCase().includes(searchTerm)).slice(-35).reverse() : [];
  const matchingRooms = searchTerm ? rooms.filter((room) => resolveRoomName(room, members, meId, locale).toLowerCase().includes(searchTerm)) : [];
  const matchingMembers = searchTerm ? members.filter((member) => member.name.toLowerCase().includes(searchTerm)) : [];
  const memberFor = (id: string) => members.find((member) => member.id === id);
  const selectProfile = (id: string) => { setSelectedProfile(id); setOverlay('profile'); };

  if (inCloud && cloud.loading) return <div className="loading-screen"><Brand /><div className="loading-spinner" /><p>{t('loading')}</p></div>;
  if (inCloud && !cloud.user) return <AuthScreen theme={theme} t={t} cloud={cloud} onPreview={() => setMode('demo')} onTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onLocale={() => setLocale(locale === 'en' ? 'fa' : 'en')} />;
  if (inCloud && !data.workspace) return <WorkspaceSetup locale={locale} t={t} cloud={cloud} onPreview={() => setMode('demo')} />;

  return <div className={`app-layout ${showNav ? 'mobile-nav-active' : ''}`}>
    <nav className="icon-rail" aria-label="Workspace navigation">
      <div className="icon-rail-brand"><Brand compact /><span className="rail-brand-line" /></div>
      <div className="rail-nav"><span className="rail-eyebrow">WORK</span>
        <IconButton label={t('messages')} onClick={() => { setOverlay(null); setShowNav(true); }} active><MessageSquareText size={21} /></IconButton>
        <IconButton label={t('search')} onClick={() => setOverlay('search')}><Search size={21} /></IconButton>
        <IconButton label={t('savedMessages')} onClick={() => setOverlay('saved')}><Bookmark size={21} /></IconButton>
        <IconButton label={t('people')} onClick={() => setOverlay('members')}><Users size={21} /></IconButton>
      </div>
      <div className="rail-bottom"><span className="rail-bottom-line" />
        <IconButton label={t('settings')} onClick={() => setOverlay('settings')}><Settings2 size={21} /></IconButton>
        <button className="rail-self" onClick={() => selectProfile(meId)} aria-label={t('profile')}><Avatar member={myself} /></button>
      </div>
    </nav>

    <aside className={`channel-sidebar ${showNav ? 'mobile-visible' : ''}`} aria-label={t('channels')}>
      <div className="workspace-header">
        <div className="workspace-emblem"><span>{initials(data.workspace?.name || 'CS')}</span></div>
        <div className="workspace-identity"><small className="workspace-kicker">{locale === 'fa' ? 'فضای کار شما' : 'YOUR WORKSPACE'}</small><strong>{data.workspace?.name || 'CollabSpace'}</strong><span><i className={`status-dot ${inCloud ? 'dot-live' : ''}`} />{inCloud ? t('realTime') : t('preview')}</span></div>
        <div className="mobile-sidebar-actions">
          <IconButton label={t('people')} onClick={() => setOverlay('members')}><Users size={20} /></IconButton>
          <IconButton label={t('settings')} onClick={() => setOverlay('settings')}><Settings2 size={20} /></IconButton>
          <IconButton label={t('close')} className="mobile-close" onClick={() => setShowNav(false)}><X size={20} /></IconButton>
        </div>
      </div>
      <button className="sidebar-search" onClick={() => setOverlay('search')}><Search size={17} /><span>{t('search')}</span><kbd>Ctrl K</kbd></button>
      <div className="sidebar-quick-actions">
        <button className={`quick-action ${onlyUnread ? 'quick-action-active' : ''}`} aria-pressed={onlyUnread} onClick={() => setOnlyUnread((previous) => !previous)}><ListFilter size={15} />{onlyUnread ? t('showAll') : t('unreadOnly')}{unreadCount > 0 && <b>{unreadCount}</b>}</button>
        <button className="quick-action" onClick={() => setOverlay('saved')}><Bookmark size={15} />{t('savedMessages')}{savedMessages.length > 0 && <b>{savedMessages.length}</b>}</button>
      </div>
      <div className="sidebar-nav-label"><span>{locale === 'fa' ? 'فضای همکاری' : 'COLLABORATION'}</span><span className="sidebar-nav-index">01 / 03</span></div>
      <div className="sidebar-scroll">
        <div className="sidebar-group"><div className="sidebar-section-title"><span>{t('channels')} <span className="group-count">{channels.length}</span></span><IconButton label={t('createChannel')} onClick={() => setOverlay('channel')}><Plus size={18} /></IconButton></div>
          {channels.filter((room) => !onlyUnread || unread(room.id) > 0).map((room) => <button key={room.id} className={`channel-link ${activeRoom?.id === room.id ? 'selected' : ''}`} onClick={() => showRoom(room.id)}><Hash size={17} /><span className="truncate">{room.name}</span>{unread(room.id) > 0 && <span className="unread-dot">{Math.min(unread(room.id), 99)}</span>}</button>)}
        </div>
        {onlyUnread && unreadCount === 0 && <div className="sidebar-empty"><CheckCheck size={19} /><span>{t('noUnread')}</span></div>}
        <div className="sidebar-group"><div className="sidebar-section-title"><span>{t('direct')} <span className="group-count">{directs.length}</span></span><IconButton label={t('startConversation')} onClick={() => setOverlay('members')}><Plus size={18} /></IconButton></div>
          {directs.filter((room) => !onlyUnread || unread(room.id) > 0).map((room) => {
            const name = resolveRoomName(room, members, meId, locale);
            const member = members.find((item) => room.participantIds?.includes(item.id) && item.id !== meId);
            return <button key={room.id} className={`channel-link dm-link ${activeRoom?.id === room.id ? 'selected' : ''}`} onClick={() => showRoom(room.id)}><Avatar member={member} size="sm" online={inCloud && Boolean(member && currentOnline.includes(member.id))} /><span className="truncate">{name}</span>{unread(room.id) > 0 && <span className="unread-dot">{Math.min(unread(room.id), 99)}</span>}</button>;
          })}
          <button className="sidebar-new-dm" onClick={() => setOverlay('members')}><Plus size={15} />{t('startConversation')}</button>
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="team-card">
          <div className="team-card-top"><span className="team-card-label">{locale === 'fa' ? 'مرکز تیم' : 'TEAM HUB'}</span><span className="team-card-symbol"><Users size={15} /></span></div>
          <strong>{t('teamOverview')}</strong>
          <div className="team-card-metrics"><span><b>{members.length.toString().padStart(2, '0')}</b>{t('memberCount')}</span><span><b>{channels.length.toString().padStart(2, '0')}</b>{t('channels')}</span></div>
          <button onClick={() => setOverlay(inCloud ? 'invite' : 'members')}>{inCloud ? t('invite') : t('teamDirectory')}<ArrowRight size={15} /></button>
        </div>
        <button className="profile-row" onClick={() => selectProfile(meId)}><Avatar member={myself} /><div><strong>{myself?.name || 'Alex Morgan'}</strong><span>{inCloud ? t('liveSession') : t('previewOnly')}</span></div><MoreHorizontal size={19} /></button>
      </div>
    </aside>

    {showNav && <button className="sidebar-scrim" aria-label={t('mobileBack')} onClick={() => setShowNav(false)} />}
    <main className="conversation-panel" inert={showNav}>
      {activeRoom ? <>
        <header className="conversation-header">
          <div className="conversation-heading"><IconButton className="mobile-nav-button" label={t('openSidebar')} onClick={() => { setShowDetails(false); setShowNav(true); }}><ArrowLeft size={21} /></IconButton>
            {activeRoom.kind === 'channel' ? <span className="room-heading-icon"><Hash size={22} /></span> : <Avatar member={currentPeer} />}
            <div className="heading-titles"><div className="heading-breadcrumb">{data.workspace?.name || 'CollabSpace'}<ChevronRight size={12} />{activeRoom.kind === 'channel' ? t('channels') : t('direct')}</div><h1>{roomTitle}</h1><p>{activeRoom.kind === 'channel' ? activeRoom.description || t('channelIntro') : `${t('private')} · ${currentPeer?.role || t('role')}`}</p></div>
          </div>
          <div className="heading-actions">
            <span className="header-live-status"><span className={`live-status-pulse ${inCloud ? 'is-live' : ''}`} />{inCloud ? t('realTime') : t('previewOnly')}</span>
            <button className="header-people" onClick={() => setOverlay('members')}><span className="people-avatar-stack">{members.slice(0, 3).map((member) => <Avatar key={member.id} member={member} size="sm" />)}</span><span>{members.length}</span></button>
            <IconButton label={t('searchHere')} onClick={() => { setRoomSearchOpen((current) => !current); setMatchIndex(-1); setFocusedMessage(null); }} active={roomSearchOpen}><Search size={19} /></IconButton>
            <IconButton className="mark-unread-action" label={t('markUnread')} onClick={markUnread}><CheckCheck size={18} /></IconButton>
            {canDeleteChannel(activeRoom) && <IconButton className="channel-delete-action" label={t('deleteChannel')} onClick={() => requestChannelDeletion(activeRoom)}><Trash2 size={18} /></IconButton>}
            <IconButton label={showDetails ? t('hideDetails') : t('openDetails')} onClick={() => { setShowNav(false); setShowDetails((current) => !current); }} active={showDetails}><Info size={19} /></IconButton>
          </div>
        </header>

        {roomSearchOpen && <div className="room-search-bar">
          <div className="room-search-input"><Search size={17} /><input autoFocus value={roomSearch} placeholder={t('searchHere')} onChange={(event) => { setRoomSearch(event.target.value); setMatchIndex(-1); setFocusedMessage(null); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); jumpToMatch(matchIndex + (event.shiftKey ? -1 : 1)); } }} /><IconButton label={t('clearSearch')} onClick={() => { setRoomSearch(''); setFocusedMessage(null); setRoomSearchOpen(false); }}><X size={16} /></IconButton></div>
          <span className="room-search-count">{roomMatches.length ? `${matchIndex < 0 ? 0 : matchIndex + 1} / ${roomMatches.length}` : '0'} {t('searchCount')}</span><div className="room-search-pager"><IconButton label={t('previousMatch')} onClick={() => jumpToMatch(matchIndex < 0 ? roomMatches.length - 1 : matchIndex - 1)}><ChevronUp size={17} /></IconButton><IconButton label={t('nextMatch')} onClick={() => jumpToMatch(matchIndex + 1)}><ChevronDown size={17} /></IconButton></div>
        </div>}
        {!inCloud && <div className="preview-strip"><span className="preview-pulse" /><span>{t('previewNotice')}</span><button onClick={() => setOverlay('settings')}>{t('cloudOnly')}</button></div>}
        {cloud.error && inCloud && <div className="cloud-error"><CircleHelp size={16} />{cloud.error}<button onClick={() => void cloud.refresh()}>{t('refresh')}</button></div>}

        <div className="messages-scroll" ref={scrollRef} onScroll={(event) => { const element = event.currentTarget; const near = element.scrollHeight - element.scrollTop - element.clientHeight < 100; setIsNearBottom((previous) => previous === near ? previous : near); }}>
          <div className="conversation-intro">
            <div className="intro-pattern" aria-hidden="true"><span /><span /><span /></div>
            <div className="intro-topline"><span className="intro-glyph">{activeRoom.kind === 'channel' ? <Hash size={25} /> : <MessageCircle size={25} />}</span><span className="intro-index">{activeRoom.kind === 'channel' ? 'CHANNEL' : 'CONVERSATION'} / {activeRoom.id.slice(0, 5).toUpperCase()}</span></div>
            <h2>{activeRoom.kind === 'channel' ? `# ${roomTitle}` : roomTitle}</h2><p>{activeRoom.description || t('channelIntro')}</p>
            <div className="intro-meta"><span><MessageCircle size={14} />{activeRoomMessageCount} {t('messages')}</span><span><Users size={14} />{members.length} {t('memberCount')}</span></div>
          </div>
          {currentMessages.length === 0 && <div className="no-messages">{t('emptyChat')}</div>}
          <div className="message-stack">{currentMessages.map((message, index) => {
            const previous = currentMessages[index - 1];
            const day = formatDay(message.createdAt, locale);
            const showDay = !previous || formatDay(previous.createdAt, locale) !== day;
            return <div key={message.id}>
              {showDay && <div className="date-separator"><span>{day}</span></div>}
              <MessageCard message={message} author={memberFor(message.authorId)} own={message.authorId === meId} canDelete={message.authorId === meId || Boolean(activeRoom && canDeleteChannel(activeRoom))} locale={locale} t={t} onReact={toggleReaction} onEdit={editMessage} onDelete={deleteMessage} onOpenProfile={selectProfile} onSave={toggleSaved} saved={isSaved(message)} highlighted={focusedMessage === message.id} matched={roomSearchOpen && Boolean(roomSearch.trim()) && roomMatches.some((match) => match.id === message.id)} />
            </div>;
          })}</div>
        </div>
        {!isNearBottom && <button className="jump-latest" onClick={() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); setFocusedMessage(null); setIsNearBottom(true); }}><ChevronDown size={15} />{t('jumpLatest')}</button>}
        <div className="composer-wrap"><div className="composer-context"><span><span className="composer-ready" />{locale === 'fa' ? 'پاسخ در گفتگو' : 'REPLY TO CONVERSATION'} <b>{roomTitle}</b></span><span className="composer-count">{draft.length} / 8000</span></div><div className="composer">
          {attachedFile && <div className="selected-file"><span><Paperclip size={17} />{attachedFile.name}</span><IconButton label={t('removeFile')} onClick={() => setAttachedFile(null)}><X size={16} /></IconButton></div>}
          <textarea ref={inputRef} value={draft} onChange={onDraftChange} placeholder={`${t('messagePlaceholder')} ${roomTitle}`} rows={2} maxLength={8000} onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && (sendShortcut === 'enter' ? !event.shiftKey : event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void send();
            }
          }} />
          <div className="composer-bottom"><div className="composer-tools"><input ref={fileRef} type="file" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && file.size > (inCloud ? 10 : 1.5) * 1024 * 1024) { notify(t('attachmentTooLarge'), 'error'); event.currentTarget.value = ''; return; } setAttachedFile(file); }} hidden />
            <IconButton label={t('selectFile')} onClick={() => fileRef.current?.click()}><Paperclip size={18} /></IconButton>
            <div className="composer-emoji-wrap" ref={emojiPickerRef}><IconButton label={t('react')} active={showEmojiPicker} onClick={() => setShowEmojiPicker((current) => !current)}><Smile size={18} /></IconButton>
              {showEmojiPicker && <div className="composer-emoji-menu" aria-label={t('reactQuick')}>{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => { setDraft((current) => `${current}${emoji}`); setShowEmojiPicker(false); inputRef.current?.focus(); }}>{emoji}</button>)}</div>}</div>
            <span className="composer-shortcut">{sendShortcut === 'enter' ? t('enterToSend') : `${t('sendWithModifier')} · Shift + Enter`}</span>
          </div><button className="composer-send" disabled={pending || !ensureMessageText(draft, Boolean(attachedFile))} onClick={() => void send()}>{pending ? '...' : <Send size={18} />}<span>{t('send')}</span></button></div>
        </div>{inCloud && cloud.typing[activeRoom.id] && <div className="typing-label"><span className="typing-dots"><i /><i /><i /></span>{cloud.typing[activeRoom.id]} {t('typing')}</div>}</div>
      </> : <div className="unselected-screen"><MessageCircle size={44} /><h2>{t('emptySelection')}</h2></div>}
    </main>

    {showDetails && <button className="details-scrim" aria-label={t('hideDetails')} onClick={() => setShowDetails(false)} />}
    {showDetails && <aside className="details-panel" aria-label={t('roomDetails')}>
      <div className="details-header"><h2>{t('roomDetails')}</h2><IconButton label={t('hideDetails')} onClick={() => setShowDetails(false)}><X size={18} /></IconButton></div>
      <div className="details-content">
        <div className="detail-overline">{locale === 'fa' ? 'درباره گفتگو' : 'CONVERSATION OVERVIEW'} <span>03 / DETAILS</span></div>
        <div className="room-poster"><div className="poster-spark spark-a" /><div className="poster-spark spark-b" /><span className="poster-logo">{activeRoom?.kind === 'channel' ? <Hash size={32} /> : <MessageCircle size={32} />}</span></div>
        <div className="details-room-title"><h3>{roomTitle}</h3><span>{activeRoom?.kind === 'dm' ? <><Lock size={13} />{t('lock')}</> : <><Hash size={13} />{t('publicRoom')}</>}</span></div>
        <p className="details-about">{activeRoom?.description || t('channelIntro')}</p>
        {activeRoom?.kind === 'channel' && activeRoom.createdBy && <p className="channel-creator-caption"><ShieldCheck size={14} />{t('channelCreator')}: {memberFor(activeRoom.createdBy)?.name || t('person')}</p>}
        <div className="detail-stats"><div><strong>{activeRoomMessageCount.toString().padStart(2, '0')}</strong><span>{t('messages')}</span></div><div><strong>{inCloud ? onlineCount.toString().padStart(2, '0') : todayCount.toString().padStart(2, '0')}</strong><span>{inCloud ? t('online') : t('today')}</span></div></div>
        <div className="details-divider" />
        <div className="detail-section"><div className="detail-section-head"><h4>{t('workspacePeople')}</h4><button onClick={() => setOverlay('members')}>{t('people')}<ChevronRight size={14} /></button></div>
          <div className="members-stack">{members.slice(0, 5).map((member) => <button key={member.id} className="member-line" onClick={() => selectProfile(member.id)}><Avatar member={member} size="sm" online={inCloud && currentOnline.includes(member.id)} /><span><strong>{member.name}</strong><small>{member.role}</small></span></button>)}</div>
          <button className="detail-full-button" onClick={() => setOverlay('members')}><Users size={15} />{t('teamDirectory')}</button>
        </div>
        <div className="details-divider" />
        <div className="detail-section"><div className="detail-section-head"><h4>{t('savedMessages')}</h4><Bookmark size={16} /></div>
          <button className="detail-full-button" onClick={() => setOverlay('saved')}><Bookmark size={15} />{t('savedMessages')} <span className="detail-saved-count">{savedMessages.length}</span></button>
        </div>
        <div className="detail-section"><div className="detail-section-head"><h4>{t('recentlyShared')}</h4><FileText size={17} /></div>
          {attachments.length ? <div className="shared-list">{attachments.map((message) => <a key={message.id} href={message.attachment?.url || '#'} download={message.attachment?.name} target="_blank" rel="noopener noreferrer" onClick={(event) => { if (!message.attachment?.url) event.preventDefault(); }}><span className="shared-file-icon"><FileText size={17} /></span><span className="truncate">{message.attachment?.name}</span><ArrowDownToLine size={16} /></a>)}</div> : <p className="empty-files">{t('noFiles')}</p>}
        </div>
        <div className="details-divider" />
        <div className="detail-section detail-actions"><button className="detail-full-button" onClick={exportConversation}><Download size={16} />{t('exportChat')}</button><button className="detail-full-button" onClick={markUnread}><CheckCheck size={16} />{t('markUnread')}</button>{activeRoom && canDeleteChannel(activeRoom) && <button className="detail-full-button detail-delete-channel" onClick={() => requestChannelDeletion(activeRoom)}><Trash2 size={16} />{t('deleteChannel')}</button>}</div>
        {inCloud && data.workspace?.code && <><div className="details-divider" /><div className="detail-section"><div className="detail-section-head"><h4>{t('invite')}</h4><ShieldCheck size={17} /></div><button className="invite-mini" onClick={() => setOverlay('invite')}><span>{data.workspace.code}</span><Copy size={16} /></button></div></>}
      </div>
    </aside>}

    {overlay === 'saved' && <Modal title={t('savedMessages')} onClose={() => setOverlay(null)} width="wide">
      <p className="saved-device-notice"><Bookmark size={16} />{t('savedHere')}</p>
      <div className="search-results saved-results">
        {savedMessages.length === 0 && <div className="empty-search">{t('noSaved')}</div>}
        {savedMessages.map((message) => <div className="saved-result" key={message.id}>
          <button className="search-result" onClick={() => jumpToMessage(message)}><span className="result-icon"><Bookmark size={18} /></span><div><strong>{memberFor(message.authorId)?.name || t('person')} · {resolveRoomName(rooms.find((room) => room.id === message.roomId) || { id: '', workspaceId: '', name: '', description: '', kind: 'channel', createdAt: '' }, members, meId, locale)}</strong><small>{message.body.slice(0, 140) || message.attachment?.name || t('attachment')}</small></div><ChevronRight size={17} /></button>
          <IconButton label={t('unsaveMessage')} onClick={() => toggleSaved(message)}><X size={16} /></IconButton>
        </div>)}
      </div>
    </Modal>}

    {overlay === 'search' && <Modal title={t('searchAllRooms')} onClose={() => setOverlay(null)} width="wide">
      <div className="search-modal-field"><Search size={21} /><input ref={searchRef} placeholder={t('searchAll')} value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>ESC</kbd></div>
      {!searchTerm ? <div className="search-intro"><Keyboard size={29} /><h3>{t('searchShortcut')}</h3><p>{t('searchAll')}</p></div> : <div className="search-results">
        {!matchingRooms.length && !matchingMembers.length && !matchingMessages.length && <div className="empty-search">{t('noSearch')}</div>}
        {matchingRooms.map((room) => <button key={room.id} className="search-result" onClick={() => showRoom(room.id)}><span className="result-icon"><Hash size={18} /></span><div><strong>{resolveRoomName(room, members, meId, locale)}</strong><small>{t('channels')}</small></div><ChevronRight size={17} /></button>)}
        {matchingMembers.map((member) => <button key={member.id} className="search-result" onClick={() => selectProfile(member.id)}><Avatar member={member} /><div><strong>{member.name}</strong><small>{member.role}</small></div><ChevronRight size={17} /></button>)}
        {matchingMessages.map((message) => <button key={message.id} className="search-result" onClick={() => jumpToMessage(message)}><span className="result-icon"><MessageCircle size={18} /></span><div><strong>{memberFor(message.authorId)?.name || t('person')}</strong><small>{message.body.slice(0, 130)}</small></div><span className="result-room">{resolveRoomName(rooms.find((room) => room.id === message.roomId) || { id: '', workspaceId: '', name: '', description: '', kind: 'channel', createdAt: '' }, members, meId, locale)}</span></button>)}
      </div>}
    </Modal>}

    {overlay === 'channel' && <Modal title={t('createChannel')} onClose={() => setOverlay(null)}>
      <form className="vertical-form modal-form" onSubmit={(event) => { void createChannel(event); }}><label>{t('channelName')}<div className="input-with-icon"><Hash size={17} /><input value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder={t('channelNameHint')} minLength={2} maxLength={60} required /></div></label>
        <label>{t('channelTopic')}<textarea value={channelTopic} onChange={(event) => setChannelTopic(event.target.value)} rows={3} maxLength={300} placeholder={t('channelTopic')} /></label>
        <div className="form-buttons"><button type="button" className="button-secondary" onClick={() => setOverlay(null)}>{t('cancel')}</button><button className="button-primary" type="submit"><Plus size={17} />{t('create')}</button></div>
      </form>
    </Modal>}

    {overlay === 'members' && <Modal title={t('teamDirectory')} onClose={() => setOverlay(null)} width="wide">
      <div className="member-modal-toolbar"><span>{members.length} {t('memberCount')}</span><div className="member-search"><Search size={17} /><input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder={t('peopleSearch')} /></div></div>
      <div className="member-grid">{visibleMembers.map((member) => <article className="member-tile" key={member.id}><Avatar member={member} size="lg" online={inCloud && currentOnline.includes(member.id)} /><div><strong>{member.name}</strong><span>{member.role}</span></div><button disabled={member.id === meId} className="member-message-action" onClick={() => { void startDm(member.id); }}><MessageSquareText size={16} />{t('sendDm')}</button></article>)}</div>
      {inCloud && <div className="directory-invite"><span>{t('inviteHint')}</span><button className="button-secondary" onClick={() => setOverlay('invite')}><Plus size={15} />{t('invite')}</button></div>}
    </Modal>}

    {overlay === 'settings' && <Modal title={t('personal')} onClose={() => setOverlay(null)}>
      <div className="settings-items">
        <div className="setting-row"><div><strong><Sun size={17} />{t('theme')}</strong><p>{t('light')} / {t('dark')}</p></div><div className="segmented"><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={16} /></button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={16} /></button></div></div>
        <div className="setting-row"><div><strong><Languages size={17} />{t('language')}</strong><p>English / فارسی</p></div><div className="segmented"><button className={locale === 'en' ? 'selected' : ''} onClick={() => setLocale('en')}>EN</button><button className={locale === 'fa' ? 'selected' : ''} onClick={() => setLocale('fa')}>فا</button></div></div>
        <div className="setting-row"><div><strong><Bell size={17} />{t('notifications')}</strong><p>{t('notificationsOff')}</p></div><button className="button-secondary" onClick={() => { void enableNotifications(); }}><Bell size={16} />{t('open')}</button></div>
        <div className="setting-row"><div><strong><Keyboard size={17} />{t('sendPreference')}</strong><p>{t('draftRestored')}</p></div><div className="segmented"><button className={sendShortcut === 'enter' ? 'selected' : ''} onClick={() => setSendShortcut('enter')}>{t('sendWithEnter')}</button><button className={sendShortcut === 'modifier' ? 'selected' : ''} onClick={() => setSendShortcut('modifier')}>{t('sendWithModifier')}</button></div></div>
        <div className="setting-row"><div><strong><Zap size={17} />{t('mode')}</strong><p>{inCloud ? t('cloudConnected') : t('noCloud')}</p></div><span className={`mode-indicator ${inCloud ? 'live' : ''}`}>{inCloud ? t('realTime') : t('preview')}</span></div>
      </div>
      <div className="settings-bottom">
        {!inCloud && configured && <button className="button-primary full" onClick={() => { setMode('cloud'); setOverlay(null); }}><Zap size={17} />{t('tryLive')}</button>}
        {!inCloud && !configured && <div className="setup-hint"><Info size={18} /><span>{t('setupHint')}</span></div>}
        {inCloud && <button className="button-secondary full" onClick={() => { setMode('demo'); setOverlay(null); }}>{t('enterPreview')}</button>}
        {!inCloud && <button className="button-quiet full" onClick={() => { if (window.confirm(t('resetConfirm'))) { demo.reset(); notify(t('resetDemo')); setOverlay(null); } }}><RotateCcw size={16} />{t('resetDemo')}</button>}
        {inCloud && <button className="button-quiet full danger" onClick={() => { void perform(() => cloud.signOut(), t('signedOut')); setOverlay(null); }}><LogOut size={16} />{t('signOut')}</button>}
      </div>
    </Modal>}

    {overlay === 'invite' && <Modal title={t('invite')} onClose={() => setOverlay(null)}>
      <div className="invite-panel"><span className="invite-large-icon"><Users size={26} /></span><h3>{t('invited')}</h3><p>{t('inviteHint')}</p><div className="invite-code-box"><strong>{data.workspace?.code || 'DEMO-ONLY'}</strong><button onClick={() => { void copyInvite(); }}><Copy size={16} />{t('copy')}</button></div></div>
    </Modal>}

    {overlay === 'profile' && <Modal title={t('profile')} onClose={() => setOverlay(null)}>
      {(() => {
        const member = members.find((item) => item.id === selectedProfile);
        if (!member) return <div className="profile-modal-content">{t('noMembers')}</div>;
        return <div className="profile-modal-content"><Avatar member={member} size="lg" online={inCloud && currentOnline.includes(member.id)} /><h3>{member.name}</h3><p>{member.role}</p><span className="profile-presence">{member.id === meId ? t('account') : inCloud && currentOnline.includes(member.id) ? t('online') : t('memberCount')}</span>
          {member.id !== meId && <button className="button-primary full" onClick={() => { void startDm(member.id); }}><MessageCircle size={16} />{t('sendDm')}</button>}
          {member.id === meId && inCloud && <button className="button-secondary full" onClick={() => { void perform(() => cloud.signOut(), t('signedOut')); setOverlay(null); }}><LogOut size={16} />{t('signOut')}</button>}
        </div>;
      })()}
    </Modal>}

    {channelToDelete && <Modal title={t('deleteChannel')} onClose={() => { if (!deletingChannel) setChannelToDelete(null); }}>
      <form className="vertical-form modal-form" onSubmit={(event) => { void confirmChannelDeletion(event); }}>
        <div className="destructive-warning"><Trash2 size={21} /><div><strong>#{channelToDelete.name}</strong><p>{t('channelDeletionWarning')}</p><small>{t('channelCreatorOnly')}</small></div></div>
        <label>{t('channelDeletionPrompt')}<input autoFocus value={deleteChannelText} onChange={(event) => setDeleteChannelText(event.target.value)} autoComplete="off" spellCheck={false} placeholder={channelToDelete.name} /></label>
        <div className="form-buttons"><button type="button" className="button-secondary" disabled={deletingChannel} onClick={() => setChannelToDelete(null)}>{t('cancel')}</button><button type="submit" className="button-danger" disabled={deleteChannelText !== channelToDelete.name || deletingChannel}><Trash2 size={16} />{deletingChannel ? '...' : t('deletePermanently')}</button></div>
      </form>
    </Modal>}

    {editing && <Modal title={t('editing')} onClose={() => setEditing(null)}>
      <form className="vertical-form modal-form" onSubmit={(event) => { void saveEdit(event); }}><label>{t('writeMessage')}<textarea rows={5} value={editText} onChange={(event) => setEditText(event.target.value)} maxLength={8000} /></label><div className="form-buttons"><button className="button-secondary" type="button" onClick={() => setEditing(null)}>{t('cancelEdit')}</button><button className="button-primary" type="submit"><Check size={17} />{t('saveChanges')}</button></div></form>
    </Modal>}

    {toast && <Notice text={toast.text} kind={toast.tone} onDismiss={() => setToast(null)} />}
  </div>;
}
