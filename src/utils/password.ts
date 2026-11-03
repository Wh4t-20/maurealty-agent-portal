// src/utils/password.ts
// Initial passwords for new agent logins, and the rules for passwords agents choose themselves.
//
// Initial password format (agreed with the team on 2026-11-04): 14 characters in total, the
// agent's initials first, then random characters. Juan Santos Dela Cruz gets "JSD" + 11 random
// characters, for example JSDk7#Pm2xQ9vR.

export const INITIAL_PASSWORD_LENGTH = 14;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt (Supabase Auth) ignores anything longer

// Look-alike characters (0/O, 1/l/I) are left out so the password is easy to read out and type.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

// Initials take at most 3 characters (first, middle, last name), so at least 11 random
// characters always follow them. The first 11 random characters always include an upper-case
// letter, a lower-case letter, a digit and a symbol, so cutting the password to 14 never drops one.
const MIN_RANDOM = INITIAL_PASSWORD_LENGTH - 3;

/** A random index below `max` from the browser's secure generator (not Math.random). */
function randomIndex(max: number): number {
  // Rejection sampling avoids the small bias of `random % max`.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0]! >= limit);
  return buf[0]! % max;
}

const pick = (set: string) => set.charAt(randomIndex(set.length));

function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars;
}

/** The random part of an initial password (14 characters, cut to fit after the initials). */
export function generatePasswordTail(): string {
  const head = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (head.length < MIN_RANDOM) head.push(pick(ALL));
  const rest = Array.from({ length: INITIAL_PASSWORD_LENGTH - MIN_RANDOM }, () => pick(ALL));
  return shuffle(head).join('') + rest.join('');
}

/** First letter of the first, middle and last name in upper case, e.g. "JSD". Accents drop (Ñ -> N). */
export function agentInitials(first?: string | null, middle?: string | null, last?: string | null): string {
  return [first, middle, last]
    .map(name => (name ?? '').normalize('NFD').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase())
    .join('');
}

/** "<initials><random>" cut to 14 characters. */
export function buildInitialPassword(initials: string, tail: string): string {
  return (initials + tail).slice(0, INITIAL_PASSWORD_LENGTH);
}

export interface PasswordRule {
  id: string;
  label: string;
  ok: boolean;
}

/** Rules for a password an agent chooses, shown as a checklist in the change-password modal. */
export function passwordRules(password: string): PasswordRule[] {
  return [
    { id: 'length', label: `${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH },
    { id: 'upper', label: 'An upper-case letter', ok: /[A-Z]/.test(password) },
    { id: 'lower', label: 'A lower-case letter', ok: /[a-z]/.test(password) },
    { id: 'digit', label: 'A number', ok: /\d/.test(password) },
    { id: 'spaces', label: 'No spaces', ok: password.length > 0 && !/\s/.test(password) },
  ];
}

export function isStrongPassword(password: string): boolean {
  return passwordRules(password).every(rule => rule.ok);
}
