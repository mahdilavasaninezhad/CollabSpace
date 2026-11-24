import { describe, expect, it } from 'vitest';
import { ensureMessageText, groupMessages, initials, safeFileName } from './format';

const sample = (id: string, createdAt: string) => ({ id, createdAt, roomId: 'r', authorId: 'a', body: '', reactions: {} });

describe('conversation helpers', () => {
  it('orders messages chronologically', () => {
    expect(groupMessages([sample('b', '2026-01-02'), sample('a', '2026-01-01')]).map((message) => message.id)).toEqual(['a', 'b']);
  });

  it('accepts file-only messages and rejects blank messages', () => {
    expect(ensureMessageText('  ', false)).toBe(false);
    expect(ensureMessageText('  ', true)).toBe(true);
    expect(ensureMessageText('hello', false)).toBe(true);
  });

  it('formats initials and sanitizes file names', () => {
    expect(initials('Alex Morgan')).toBe('AM');
    expect(safeFileName('new pic.png')).toBe('new_pic.png');
  });
});
