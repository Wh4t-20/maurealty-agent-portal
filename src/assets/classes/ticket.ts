// src/assets/classes/ticket.ts
// IT support tickets (the IT Support page, /support): shapes and constants shared by
// ticketService, the page and its modals.
//
// The database repeats the limits below (check constraints and the support_tickets_guard
// trigger in supabase/migrations/20261104160000_support_tickets.sql). Keep both in step.

// Lifecycle, changed by admins (IT support) only:
//   raised -> in_review -> resolved, and a resolved ticket can be reopened (back to in_review).
export type TicketStatus = 'raised' | 'in_review' | 'resolved';

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  raised: 'Raised',
  in_review: 'In Review',
  resolved: 'Resolved',
};

export type TicketCategory =
  | 'bug' | 'login_account' | 'performance' | 'data'   // issues
  | 'feature_request' | 'feedback' | 'other';          // requests

export interface TicketCategoryOption {
  id: TicketCategory;
  label: string;
  hint: string;          // shown under the Category dropdown
  titleExample: string;  // placeholder of the Title field
  isIssue: boolean;      // issues must say how to recreate them: steps, expected result, frequency
}

export const TICKET_CATEGORIES: TicketCategoryOption[] = [
  { id: 'bug',             label: "Something isn't working", isIssue: true,
    hint: 'A button, page or form shows an error or does nothing.',
    titleExample: 'SOLD button does nothing on a bulk condo listing' },
  { id: 'login_account',   label: 'Login or account',        isIssue: true,
    hint: "Can't sign in, the password code doesn't arrive, or your account details are wrong.",
    titleExample: 'Password code email never arrives' },
  { id: 'performance',     label: 'Slow or not loading',     isIssue: true,
    hint: 'A page takes too long, keeps loading or freezes.',
    titleExample: 'Sales Report takes over a minute to load' },
  { id: 'data',            label: 'Wrong or missing data',   isIssue: true,
    hint: 'Listings, sales, commissions or numbers look wrong or are missing.',
    titleExample: 'Commission for Payment 2 of 12 looks too low' },
  { id: 'feature_request', label: 'Feature request',         isIssue: false,
    hint: 'Something new you would like the portal to do.',
    titleExample: 'Export the Commissions page to CSV' },
  { id: 'feedback',        label: 'Feedback',                isIssue: false,
    hint: 'What works well, or what could be better.',
    titleExample: 'Listing filters are hard to find on phones' },
  { id: 'other',           label: 'Other',                   isIssue: false,
    hint: "Anything that doesn't fit the other categories.",
    titleExample: 'Question about shared listing links' },
];

export type TicketFrequency = 'every_time' | 'sometimes' | 'once';

export const TICKET_FREQUENCIES: { id: TicketFrequency; label: string }[] = [
  { id: 'every_time', label: 'Every time' },
  { id: 'sometimes',  label: 'Sometimes' },
  { id: 'once',       label: 'Only once' },
];

// Where in the portal it happened (the Sidebar pages plus the public ones). Stored as text
// (2-60 characters) so a new page only needs a new entry here.
export const TICKET_AREAS: string[] = [
  'Login page',
  'Dashboard',
  'Project Listings',
  'Property Management',
  'Shared listing link',
  'Sales Report',
  'Commissions',
  'Genealogy',
  'Developer List',
  'Accounting (calculators)',
  'Profile',
  'Settings',
  'IT Support',
  'Whole portal / not sure',
];

export const MAX_OPEN_TICKETS = 3;     // per person, Raised + In Review (also enforced by the trigger)
export const MAX_TICKET_IMAGES = 3;    // screenshots per ticket (also a check constraint)
export const MAX_TICKET_IMAGE_MB = 5;  // per screenshot (also the bucket's file size limit)
export const MIN_TICKET_STEPS = 2;     // steps to recreate an issue (app only; the DB checks the length)

// Accepted screenshot types -> file extension used in the storage path (the bucket allows these only).
export const TICKET_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Character limits, counted like the database counts them (see charCount).
export const TICKET_TEXT_LIMITS = {
  title:          { min: 8,  max: 120 },
  area:           { min: 2,  max: 60 },
  description:    { min: 20, max: 2000 },
  steps:          { min: 10, max: 2000 },
  expected:       { min: 5,  max: 1000 },
  resolutionNote: { min: 10, max: 2000 },
  deviceInfo:     { min: 0,  max: 300 },
} as const;

// What the Raise a Ticket form sends (ticketService.cleanTicket tidies it first).
export interface NewTicket {
  category: TicketCategory;
  title: string;
  area: string;
  frequency: TicketFrequency | null;
  description: string;                // issues: what happened instead; requests: the details
  steps_to_reproduce: string | null;  // issues only
  expected_result: string | null;     // issues only
  occurred_at: string | null;         // ISO timestamp, optional
  device_info: string | null;
}

// One ticket as the IT Support page shows it.
export interface SupportTicket extends NewTicket {
  id: number;                         // ticket_ID, shown as #T-<id>
  agent_ID: number | null;            // who raised it (null = that agent was deleted)
  raised_by_name: string;
  attachment_paths: string[];         // paths in the private support_attachments bucket
  status: TicketStatus;
  resolution_note: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  resolved_by: number | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  reopen_count: number;
  reopened_at: string | null;
  created_at: string;
  updated_at: string;
}

export function ticketNumber(id: number): string {
  return `#T-${id}`;
}

export function categoryOption(id: string): TicketCategoryOption | undefined {
  return TICKET_CATEGORIES.find(c => c.id === id);
}

export function categoryLabel(id: string): string {
  return categoryOption(id)?.label ?? id;
}

export function isIssueCategory(id: string): boolean {
  return !!categoryOption(id)?.isIssue;
}

export function frequencyLabel(id: string | null): string {
  return TICKET_FREQUENCIES.find(f => f.id === id)?.label ?? '';
}

/** Characters as the database counts them (an emoji is one character, not two). */
export function charCount(text: string): number {
  return Array.from(text).length;
}

/** Filled-in steps: lines with some text after an optional "1." / "1)" / "-" marker. */
export function countSteps(steps: string): number {
  return steps
    .split('\n')
    .map(line => line.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim())
    .filter(line => line.length >= 3)
    .length;
}

/** Why a file can't be attached as a screenshot, or null if it can. */
export function imageProblem(file: File): string | null {
  const name = file.name.length > 60 ? `${file.name.slice(0, 57)}...` : file.name;
  if (!TICKET_IMAGE_TYPES[file.type]) return `"${name}" is not a PNG, JPG, WEBP or GIF image.`;
  if (file.size > MAX_TICKET_IMAGE_MB * 1024 * 1024) return `"${name}" is larger than ${MAX_TICKET_IMAGE_MB} MB.`;
  return null;
}
