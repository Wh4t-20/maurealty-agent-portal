// src/services/ticketService.ts
// IT support tickets: raise (any signed-in user), list, and the admin status flow
// raised -> in_review -> resolved (+ reopen). See project-context.md 7.21.
//
// The database enforces the same rules (RLS + the support_tickets_guard trigger in
// supabase/migrations/20261104160000_support_tickets.sql): a non-admin only reads and raises
// their own tickets, only admins change a status, the reviewer/resolver stamps are set on the
// server, and what the user wrote can't be edited. Screenshots live in the PRIVATE bucket
// support_attachments and are shown through signed URLs that expire.
//
// SQL injection: values go to PostgREST as JSON and are bound as parameters; no filter string
// is ever built from user text. Text is also cleaned and length-checked here before sending.
import { supabase } from '../supabaseClient';
import { cleanText, cleanMultilineText } from '../utils/sanitize';
import {
  TICKET_AREAS, TICKET_FREQUENCIES, TICKET_TEXT_LIMITS as L, MAX_TICKET_IMAGES, MAX_TICKET_IMAGE_MB,
  MIN_TICKET_STEPS, TICKET_IMAGE_TYPES, categoryOption, isIssueCategory, charCount, countSteps, imageProblem,
  type NewTicket, type SupportTicket, type TicketStatus,
} from '../assets/classes/ticket';

const BUCKET = 'support_attachments';
const SIGNED_URL_SECONDS = 60 * 60; // screenshot links work for an hour after the ticket is opened

// support_tickets has three links to agents (raised by, reviewed by, resolved by), so each embed
// names its foreign key constraint. A column hint like agents!agent_ID is NOT enough here:
// PostgREST also matches the hint against the agents side, and all three keys point at
// agents."agent_ID", so it fails with PGRST201 "more than one relationship was found".
// (commissions' agents!recipient_agent_ID works because that name is only on one side.)
// The names are the ones Postgres generated for the inline references in the migration.
const TICKET_COLUMNS = `
  ticket_ID, agent_ID, category, title, area, frequency, description, steps_to_reproduce,
  expected_result, occurred_at, device_info, attachment_paths, status, resolution_note,
  reviewed_by, reviewed_at, resolved_by, resolved_at, reopen_count, reopened_at, created_at, updated_at,
  raiser:agents!support_tickets_agent_ID_fkey (first_name, last_name),
  reviewer:agents!support_tickets_reviewed_by_fkey (first_name, last_name),
  resolver:agents!support_tickets_resolved_by_fkey (first_name, last_name)
`;

// A 1:1 embed can come back as an object or an array (see project-context.md 5.3).
function one<T>(x: T | T[] | null | undefined): T | null {
  return (Array.isArray(x) ? x[0] : x) ?? null;
}

function fullName(a: { first_name?: string | null; last_name?: string | null } | null): string {
  return a ? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() : '';
}

function toTicket(r: any): SupportTicket {
  return {
    id: r.ticket_ID,
    agent_ID: r.agent_ID ?? null,
    raised_by_name: fullName(one(r.raiser)) || (r.agent_ID != null ? `Agent #${r.agent_ID}` : 'Removed agent'),
    category: r.category,
    title: r.title ?? '',
    area: r.area ?? '',
    frequency: r.frequency ?? null,
    description: r.description ?? '',
    steps_to_reproduce: r.steps_to_reproduce ?? null,
    expected_result: r.expected_result ?? null,
    occurred_at: r.occurred_at ?? null,
    device_info: r.device_info ?? null,
    attachment_paths: r.attachment_paths ?? [],
    status: r.status as TicketStatus,
    resolution_note: r.resolution_note ?? null,
    reviewed_by: r.reviewed_by ?? null,
    reviewed_by_name: fullName(one(r.reviewer)) || null,
    reviewed_at: r.reviewed_at ?? null,
    resolved_by: r.resolved_by ?? null,
    resolved_by_name: fullName(one(r.resolver)) || null,
    resolved_at: r.resolved_at ?? null,
    reopen_count: Number(r.reopen_count) || 0,
    reopened_at: r.reopened_at ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// Turns Postgres, PostgREST and Storage errors into something a user (or the dev team) can act on.
function ticketErrorMessage(e: any): string {
  const code = String(e?.code ?? '');
  const msg = String(e?.message ?? e ?? '');
  // Our own messages from support_tickets_guard (limit reached, flow, note missing, ...).
  if (code === 'P0001') return msg;
  if (code === '42P01' || code === 'PGRST205' || (/support_tickets/i.test(msg) && /does not exist|schema cache/i.test(msg))) {
    return 'The support tickets table is missing. Run supabase/migrations/20261104160000_support_tickets.sql in the Supabase SQL editor.';
  }
  if (code === 'PGRST202' || /current_agent_id/i.test(msg)) {
    return 'A support tickets database function is missing. Re-run supabase/migrations/20261104160000_support_tickets.sql.';
  }
  if (/bucket not found/i.test(msg)) {
    return 'The support_attachments storage bucket is missing. Re-run supabase/migrations/20261104160000_support_tickets.sql.';
  }
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return "You don't have permission to do that.";
  }
  if (code === '23514') return 'Some answers are too short or too long. Check the form and try again.';
  if (/maximum allowed size|payload too large|too large/i.test(msg)) return `Each screenshot must be ${MAX_TICKET_IMAGE_MB} MB or smaller.`;
  if (/mime type/i.test(msg)) return 'Only PNG, JPG, WEBP or GIF screenshots can be attached.';
  if (/failed to fetch|network/i.test(msg)) return 'Could not reach the server. Check your internet connection and try again.';
  return msg || 'Something went wrong. Please try again.';
}

// Random file name for a screenshot. crypto.randomUUID needs https (or localhost); the
// fallback builds the same v4 format from crypto.getRandomValues.
function randomFileId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Tidies the form values before they are checked or sent: trims, removes control characters,
 * caps lengths, and drops the issue-only answers (steps, expected result, frequency) from requests.
 */
export function cleanTicket(input: NewTicket): NewTicket {
  const issue = isIssueCategory(input.category);
  const when = input.occurred_at ? new Date(input.occurred_at) : null;
  return {
    category: input.category,
    title: cleanText(input.title, L.title.max),
    area: cleanText(input.area, L.area.max),
    frequency: issue ? (input.frequency ?? null) : null,
    description: cleanMultilineText(input.description, L.description.max),
    steps_to_reproduce: issue ? (cleanMultilineText(input.steps_to_reproduce, L.steps.max) || null) : null,
    expected_result: issue ? (cleanMultilineText(input.expected_result, L.expected.max) || null) : null,
    occurred_at: when && !Number.isNaN(when.getTime()) ? when.toISOString() : null,
    device_info: cleanText(input.device_info, L.deviceInfo.max) || null,
  };
}

/** What is still missing or wrong in a cleaned ticket (empty = ready to send). */
export function ticketProblems(t: NewTicket): string[] {
  const problems: string[] = [];
  const issue = isIssueCategory(t.category);
  if (!categoryOption(t.category)) problems.push('Choose a category.');
  if (!TICKET_AREAS.includes(t.area)) problems.push('Choose where in the portal it happened.');
  if (charCount(t.title) < L.title.min) problems.push(`Write a title of at least ${L.title.min} characters that names the problem.`);
  if (issue) {
    const steps = t.steps_to_reproduce ?? '';
    if (countSteps(steps) < MIN_TICKET_STEPS || charCount(steps) < L.steps.min) {
      problems.push(`List at least ${MIN_TICKET_STEPS} steps IT support can follow to see the problem.`);
    }
    if (charCount(t.expected_result ?? '') < L.expected.min) problems.push('Say what you expected to happen.');
    if (charCount(t.description) < L.description.min) problems.push(`Describe what happened instead (at least ${L.description.min} characters).`);
    if (!TICKET_FREQUENCIES.some(f => f.id === t.frequency)) problems.push('Choose how often it happens.');
  } else if (charCount(t.description) < L.description.min) {
    problems.push(`Describe your request (at least ${L.description.min} characters).`);
  }
  // A few minutes of leeway for a phone clock that runs slightly fast.
  if (t.occurred_at && new Date(t.occurred_at).getTime() > Date.now() + 5 * 60 * 1000) {
    problems.push("The time it happened can't be in the future.");
  }
  return problems;
}

export const ticketService = {
  // Every ticket the signed-in user may see, newest first. RLS already limits a non-admin to
  // their own tickets; pass agentId as well so the query says so.
  async getTickets(agentId?: number): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select(TICKET_COLUMNS)
      .order('created_at', { ascending: false });

    if (agentId !== undefined) {
      query = query.eq('agent_ID', agentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching support tickets:', error);
      throw new Error(ticketErrorMessage(error));
    }
    return (data ?? []).map(toTicket);
  },

  // Raise a ticket. Screenshots are uploaded first (to "<auth uid>/<uuid>.<ext>"), then the row
  // is inserted with their paths. If anything fails, the uploads are removed again.
  // The server sets the raiser, the status (raised) and the stamps, and enforces the open-ticket limit.
  async createTicket(agentId: number, input: NewTicket, files: File[] = []): Promise<number> {
    const ticket = cleanTicket(input);
    const problems = ticketProblems(ticket);
    if (problems.length) throw new Error(problems[0]);
    if (files.length > MAX_TICKET_IMAGES) throw new Error(`Attach up to ${MAX_TICKET_IMAGES} screenshots.`);
    for (const file of files) {
      const problem = imageProblem(file);
      if (problem) throw new Error(problem);
    }

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) throw new Error('Your session has ended. Sign in again to raise a ticket.');

    const uploaded: string[] = [];
    try {
      for (const file of files) {
        // The extension comes from the checked file type, never from the file's own name.
        const path = `${uid}/${randomFileId()}.${TICKET_IMAGE_TYPES[file.type]}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        uploaded.push(path);
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({ agent_ID: agentId, ...ticket, attachment_paths: uploaded })
        .select('ticket_ID')
        .single();
      if (error) throw error;
      return data.ticket_ID as number;
    } catch (e) {
      console.error('Error raising support ticket:', e);
      if (uploaded.length) {
        const { error: rmErr } = await supabase.storage.from(BUCKET).remove(uploaded);
        if (rmErr) console.error('Could not remove the uploaded screenshots:', rmErr);
      }
      throw new Error(ticketErrorMessage(e));
    }
  },

  // Move a ticket on from the status it is expected to have. Returns the updated ticket, or null
  // when no row changed (someone else moved it first, or RLS blocked a non-admin).
  async _advance(id: number, from: TicketStatus, patch: Record<string, unknown>): Promise<SupportTicket | null> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(patch)
      .eq('ticket_ID', id)
      .eq('status', from)
      .select(TICKET_COLUMNS);

    if (error) {
      console.error('Error updating support ticket:', error);
      throw new Error(ticketErrorMessage(error));
    }
    return data && data.length > 0 ? toTicket(data[0]) : null;
  },

  // Admin: raised -> in_review. The server records who started the review and when.
  async startReview(id: number): Promise<SupportTicket | null> {
    return this._advance(id, 'raised', { status: 'in_review' });
  },

  // Admin: in_review -> resolved, with the note the user will read (required).
  async resolveTicket(id: number, note: string): Promise<SupportTicket | null> {
    const cleaned = cleanMultilineText(note, L.resolutionNote.max);
    if (charCount(cleaned) < L.resolutionNote.min) {
      throw new Error(`Write a resolution note of at least ${L.resolutionNote.min} characters.`);
    }
    return this._advance(id, 'in_review', { status: 'resolved', resolution_note: cleaned });
  },

  // Admin: resolved -> in_review again (the fix didn't hold). The last note stays visible.
  async reopenTicket(id: number): Promise<SupportTicket | null> {
    return this._advance(id, 'resolved', { status: 'in_review' });
  },

  // Signed links for a ticket's screenshots, in the same order (null where one can't be opened).
  async getAttachmentUrls(paths: string[]): Promise<(string | null)[]> {
    if (paths.length === 0) return [];
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (error) {
      console.error('Error creating screenshot links:', error);
      throw new Error(ticketErrorMessage(error));
    }
    return paths.map(p => {
      const hit = (data ?? []).find(d => d.path === p);
      return hit && !hit.error ? hit.signedUrl : null;
    });
  },
};
