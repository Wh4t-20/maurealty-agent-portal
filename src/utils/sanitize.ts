// src/utils/sanitize.ts
// Input cleaning for forms that write to the database or to Supabase Auth.
//
// SQL injection: the app never builds SQL out of text. supabase-js sends values as JSON to
// PostgREST, which binds them as query parameters, and the SQL functions in
// supabase/migrations use no dynamic SQL. These helpers are a second layer: they strip control
// characters, cap lengths and reject malformed values before anything is sent.
// The agent-account Edge Function repeats the same checks on the server.

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^[0-9+()\-.\s]{5,30}$/;

/** Trims, removes control characters, collapses repeated spaces and caps the length. */
export function cleanText(value: unknown, maxLength = 255): string {
  if (value == null) return '';
  return String(value).replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

// Same as CONTROL_CHARS but keeps the line break (\n), for multi-line answers.
const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0009\u000B-\u001F\u007F]/g;
// Invisible direction overrides (U+202A-U+202E, U+2066-U+2069) can make text read differently
// from what it really says, so long texts drop them.
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/g;

/**
 * Like cleanText, but keeps line breaks, for long answers such as the steps of a support
 * ticket or a resolution note. Normalizes line endings, removes control characters, collapses
 * repeated spaces, trims each line, allows at most one blank line in a row, and caps the length.
 * (The app shows these texts with `white-space: pre-line`, which drops leading spaces anyway.)
 */
export function cleanMultilineText(value: unknown, maxLength = 2000): string {
  if (value == null) return '';
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE, ' ')
    .replace(BIDI_CONTROLS, '')
    .split('\n')
    .map(line => line.replace(/ {2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
    .trimEnd();
}

// Same, but also keeps the tab (\t): Markdown uses tabs and spaces for indentation.
const CONTROL_CHARS_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/**
 * For Markdown fields (a listing's description and FAQ). Unlike cleanMultilineText it keeps every
 * line exactly as typed (indentation for nested lists and code blocks, two trailing spaces for a
 * line break). It only normalizes line endings, removes control characters and invisible
 * direction overrides, drops blank lines at the start and whitespace at the end, and caps the
 * length. The text is rendered through compileMarkdown() (DOMPurify), never as raw HTML.
 */
export function cleanMarkdownText(value: unknown, maxLength = 20000): string {
  if (value == null) return '';
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS_EXCEPT_TAB_NEWLINE, '')
    .replace(BIDI_CONTROLS, '')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
    .slice(0, maxLength);
}

/**
 * A file's extension for a storage path: lower-case letters and digits only (max 8 characters),
 * or `fallback` when there is none. Never take the extension straight from file.name: a name such
 * as "photo./x" would add a folder to the path.
 */
export function safeFileExtension(fileName: unknown, fallback = 'bin'): string {
  const name = String(fileName ?? '');
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  return ext || fallback;
}

/**
 * A file name that is safe inside a storage path (fact sheets keep their name for the download):
 * accents dropped, spaces become "_", only letters, digits, ".", "-" and "_" kept, no leading dots
 * or dashes, at most `maxLength` characters (the extension is kept when it has to be shortened).
 */
export function safeFileName(fileName: unknown, maxLength = 100): string {
  const cleaned = String(fileName ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .replace(/^[._-]+/, '');
  if (!cleaned) return 'file';
  if (cleaned.length <= maxLength) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  const ext = dot > 0 ? cleaned.slice(dot, dot + 10) : '';
  return cleaned.slice(0, maxLength - ext.length) + ext;
}

/** Lower-case email with no spaces (Supabase Auth stores login emails in lower case). */
export function normalizeEmail(value: unknown): string {
  return cleanText(value, 254).replace(/\s/g, '').toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/** Digits, spaces and + ( ) - . only, 5 to 30 characters. */
export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

/** A real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Digits only, for the one-time code sent by email. */
export function digitsOnly(value: unknown, maxLength = 10): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
}

/** A finite number from a form field (empty, NaN and Infinity become `fallback`). */
export function finiteNumber(value: unknown, fallback: number | null = null): number | null {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
