// src/services/dashboardService.ts
// Feeds the Dashboard from the same tables the rest of the app writes to:
//   sales (Sales Report), commissions (Commissions page), main_listings (Listings),
//   genealogy (Genealogy page). Nothing here is stored separately, so the numbers
//   always match those pages.
import { supabase } from '../supabaseClient';
import { commissionService, summarizeTabs, STATUS_LABEL, type CommissionTab } from './commissionService';

// ---------- Data pulled from the database ----------

export interface DashSale {
  sale_ID: number;
  agent_ID: number;
  client_name: string;
  status: string;
  gross_commission: number;
  total_contract_price: number;
  created_at: string;
  reservation_date: string | null; // the date of the sale (what the Sales Report shows)
  completed_at: string | null;   // set when an admin marks the sale complete
  listing_title: string;
  agent_name: string;
}

export interface DashListing {
  listing_ID: number;
  listing_title: string;
  created_at: string;
  status: string;
}

export interface DashboardData {
  sales: DashSale[];
  listings: DashListing[];
  tabs: CommissionTab[];
}

// ---------- What the Dashboard shows ----------

export interface MetricDetail {
  date: string;
  title: string;
  status: string;
  amount?: number;
}

export interface Metric {
  label: string;
  value: string;
  trend: string;
  sub: string;
  type: 'positive' | 'negative' | 'neutral';
  details: MetricDetail[];
  showAmount: boolean;
  link?: string;   // when set, opening the card goes to this page instead of showing a popup
}

export interface Activity {
  id: string;
  type: 'money' | 'lead';
  title: string;
  desc: string;
  time: string;
  at: string;
  to: string;      // page to open when clicked
}

export interface Reminder {
  text: string;
  urgent: boolean;
  to: string;      // page to open when the reminder is clicked
}

export interface Performance {
  bars: { label: string; value: number }[];  // properties sold per month
  sold: number;
  avgDeal: number;
}

// One commission payout for the Commission History panel ("Payment n of N").
export type HistoryStatus = 'Pending Approval' | 'Approved' | 'Payment Requested' | 'Payment Released' | 'Received';

export interface HistoryItem {
  id: number;
  sale_ID: number;
  sale_label: string;      // "Sale #12 · Project"
  agent_name: string;
  role: string;
  rank: string;
  payment_no: number;
  payment_total: number;
  amount: number;
  due_date: string;
  status: HistoryStatus;
}

// A banner at the top of the dashboard: something that needs the viewer's attention.
export interface DashAlert {
  text: string;
  tone: 'info' | 'action';
  to: string;
}

export interface DashboardView {
  alerts: DashAlert[];
  metrics: Metric[];       // sales/listings row
  commissionMetrics: Metric[];
  history: HistoryItem[];
  performance: Performance;
  activities: Activity[];
  reminders: Reminder[];
}

interface BuildOptions {
  month: string;           // 'YYYY-MM', or '' for all time
  agentId: number | null;  // who is looking
  isAdmin: boolean;
  now?: Date;
}

// ---------- Loading ----------

// agentId = only that agent's data; omit it for the company-wide (admin) view.
export async function getDashboardData(agentId?: number): Promise<DashboardData> {
  let salesQuery = supabase
    .from('sales')
    .select('sale_ID, agent_ID, client_name, status, gross_commission, total_contract_price, created_at, reservation_date, completed_at, agents (first_name, last_name), main_listings (listing_title)');
  let listingsQuery = supabase
    .from('main_listings')
    .select('listing_ID, listing_title, created_at, status')
    .order('created_at', { ascending: false });

  if (agentId !== undefined) {
    salesQuery = salesQuery.eq('agent_ID', agentId);
    listingsQuery = listingsQuery.eq('agent_ID', agentId);
  }

  const [salesRes, listingsRes, tabs] = await Promise.all([
    salesQuery,
    listingsQuery,
    commissionService.getTabs(agentId),
  ]);

  if (salesRes.error) throw salesRes.error;
  if (listingsRes.error) throw listingsRes.error;

  const sales: DashSale[] = (salesRes.data || []).map((r: any) => ({
    sale_ID: r.sale_ID,
    agent_ID: r.agent_ID,
    client_name: r.client_name,
    status: (r.status || '').toString().toLowerCase().trim(),
    gross_commission: Number(r.gross_commission) || 0,
    total_contract_price: Number(r.total_contract_price) || 0,
    created_at: r.created_at,
    reservation_date: r.reservation_date ?? null,
    completed_at: r.completed_at ?? null,
    listing_title: r.main_listings?.listing_title || 'Unknown',
    agent_name: `${r.agents?.first_name || ''} ${r.agents?.last_name || ''}`.trim(),
  }));

  return { sales, listings: (listingsRes.data || []) as DashListing[], tabs };
}

// ---------- Helpers ----------

const peso = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

// An approved sale (awaiting payment or complete) counts toward the month of its reservation date.
const isApproved = (s: DashSale) => s.status === 'awaiting payment' || s.status === 'complete';
const saleDate = (s: DashSale) => new Date(s.reservation_date ? `${s.reservation_date}T00:00:00` : s.created_at);

// A sale counts toward the month it was completed. Sales completed before completed_at
// existed fall back to the date they were created.
const soldAt = (s: DashSale) => new Date(s.completed_at ?? s.created_at);

type Range = { start: Date; end: Date } | null;

function monthRange(month: string, shift = 0): Range {
  if (!month) return null;
  const [y = 0, m = 1] = month.split('-').map(Number);
  return { start: new Date(y, m - 1 + shift, 1), end: new Date(y, m + shift, 1) };
}

const inRange = (d: Date, r: Range) => !r || (d >= r.start && d < r.end);

function trendText(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const percent = ((curr - prev) / prev) * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

function trendType(curr: number, prev: number): Metric['type'] {
  if (curr === prev) return 'neutral';
  return curr > prev ? 'positive' : 'negative';
}

function relativeTime(iso: string, now: Date): string {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// A tab is claimable when approved and due (or its sale is complete).
const today = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const isDue = (t: CommissionTab, now: Date) => t.sale_status === 'complete' || today(now) >= t.due_date;
// Ready to request: approved by an admin, due (or sale complete) and payment not yet requested.
const isReady = (t: CommissionTab, now: Date) => t.status === 'approved' && isDue(t, now);

// ---------- Building the dashboard ----------

export function buildDashboard(data: DashboardData, opts: BuildOptions): DashboardView {
  const now = opts.now ?? new Date();
  const cur = monthRange(opts.month);
  const prev = monthRange(opts.month, -1);
  const monthly = !!opts.month;

  // Sales / listings numbers for a period (null = all time). "Approved" = no longer pending
  // approval and not cancelled (awaiting payment or complete).
  const salesStats = (r: Range) => {
    const approved = data.sales.filter(s => isApproved(s) && inRange(saleDate(s), r));
    const listings = data.listings.filter(l => inRange(new Date(l.created_at), r));
    return {
      approved,
      listings,
      value: approved.reduce((sum, s) => sum + s.total_contract_price, 0),
    };
  };
  const c = salesStats(cur);
  const p = salesStats(prev);

  const word = (a: string, b: string) => (monthly ? a : b);
  const sub = monthly ? 'vs previous month' : 'All Time';
  const trend = (a: number, b: number) => (monthly ? trendText(a, b) : '-');
  const kind = (a: number, b: number): Metric['type'] => (monthly ? trendType(a, b) : 'neutral');

  const claimedIn = (r: Range) => data.tabs.filter(t => t.claimed && t.claimed_at && inRange(new Date(t.claimed_at), r));
  const claimedCur = claimedIn(cur);
  const claimedPrev = claimedIn(prev);
  const sum = (tabs: CommissionTab[]) => tabs.reduce((s, t) => s + t.commission_amount, 0);
  const tabDetail = (t: CommissionTab, status: string): MetricDetail => ({
    date: t.due_date,
    title: `${t.project_name} · ${t.agent_name} (${t.role}) · Payment ${t.payment_no} of ${t.payment_total}`,
    status,
    amount: t.commission_amount,
  });

  // Row 1: total sales (opens the Sales Report), received commission, listings.
  const metrics: Metric[] = [
    {
      label: word('TOTAL SALES (MONTH)', 'TOTAL SALES'),
      value: String(c.approved.length), trend: trend(c.approved.length, p.approved.length),
      sub: `${peso(c.value)} contract value · ${sub}`, type: kind(c.approved.length, p.approved.length),
      details: [], showAmount: false, link: '/sales',
    },
    {
      label: word('TOTAL RECEIVED COMMISSION (MONTH)', 'TOTAL RECEIVED COMMISSION'),
      value: peso(sum(claimedCur)), trend: trend(sum(claimedCur), sum(claimedPrev)), sub,
      type: kind(sum(claimedCur), sum(claimedPrev)),
      details: claimedCur.map(t => ({ ...tabDetail(t, 'received'), date: t.claimed_at as string })), showAmount: true,
    },
    {
      label: word('LISTINGS (MONTH)', 'LISTINGS'),
      value: String(c.listings.length), trend: trend(c.listings.length, p.listings.length), sub,
      type: kind(c.listings.length, p.listings.length),
      details: c.listings.map(l => ({ date: l.created_at, title: l.listing_title, status: l.status })),
      showAmount: false,
    },
  ];

  const ready = data.tabs.filter(t => isReady(t, now));
  const awaitingApproval = data.tabs.filter(t => t.status === 'pending_approval');

  // Receivables = commission payouts not yet received (of the people in view).
  const recv = summarizeTabs(data.tabs);
  const outstanding = data.tabs.filter(t => t.status !== 'received');

  // Row 2 (one row): receivables, ready to request, awaiting approval.
  const commissionMetrics: Metric[] = [
    {
      label: 'RECEIVABLES',
      value: peso(recv.pendingAmount),
      trend: `${outstanding.length} payout${outstanding.length === 1 ? '' : 's'}`,
      sub: `${peso(recv.claimedAmount)} received of ${peso(recv.totalAmount)}`,
      type: outstanding.length > 0 ? 'positive' : 'neutral',
      details: [...outstanding]
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .map(t => tabDetail(t, STATUS_LABEL[t.status].toLowerCase())),
      showAmount: true,
    },
    {
      label: 'READY TO REQUEST',
      value: peso(sum(ready)), trend: `${ready.length} tab${ready.length === 1 ? '' : 's'}`, sub: 'Approved: request payment',
      type: ready.length > 0 ? 'positive' : 'neutral',
      details: ready.map(t => tabDetail(t, 'approved')), showAmount: true,
    },
    {
      label: 'AWAITING APPROVAL',
      value: peso(sum(awaitingApproval)), trend: `${awaitingApproval.length} tab${awaitingApproval.length === 1 ? '' : 's'}`,
      sub: opts.isAdmin ? 'Needs admin approval' : 'Waiting for admin',
      type: 'neutral',
      details: awaitingApproval.map(t => tabDetail(t, 'awaiting approval')), showAmount: true,
    },
  ];

  // Approved sales per month (live from the sales table), for the 7 months ending at the selected month.
  const anchor = cur ? cur.start : new Date(now.getFullYear(), now.getMonth(), 1);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - (6 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const value = data.sales.filter(s => isApproved(s) && inRange(saleDate(s), { start, end })).length;
    return { label: start.toLocaleDateString('en-US', { month: 'short' }), value };
  });
  const avgDeal = c.approved.length ? c.value / c.approved.length : 0;

  // Recent activity: new/updated sales and claimed commissions, newest first.
  const activities: Activity[] = [
    ...data.sales.map(s => ({
      id: `sale-${s.sale_ID}`,
      type: 'lead' as const,
      title: s.status === 'complete' ? 'Sale completed:' : 'Sale:',
      desc: `${s.client_name} · ${s.listing_title} (${s.status})${opts.isAdmin && s.agent_name ? ` by ${s.agent_name}` : ''}`,
      at: s.status === 'complete' ? soldAt(s).toISOString() : s.created_at,
      to: '/sales',
    })),
    ...data.tabs.filter(t => t.claimed && t.claimed_at).map(t => ({
      id: `claim-${t.id}`,
      type: 'money' as const,
      title: 'Commission received:',
      desc: `${peso(t.commission_amount)} · ${t.project_name} (${t.agent_name}, ${t.role})`,
      at: t.claimed_at as string,
      to: '/commissions',
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10)
    .map(a => ({ ...a, time: relativeTime(a.at, now) }));

  // Reminders: what needs attention now.
  const reminders: Reminder[] = [];
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  if (opts.isAdmin) {
    const pending = data.sales.filter(s => s.status === 'pending approval').length;
    if (pending > 0) reminders.push({ text: `${plural(pending, 'sale')} waiting for your approval`, urgent: true, to: '/sales' });
    if (awaitingApproval.length > 0) reminders.push({ text: `${plural(awaitingApproval.length, 'commission')} waiting for your approval`, urgent: true, to: '/commissions' });
  }
  // Requesting and receiving payment is agent-only, so an admin has no personal payout alerts.
  const mine = opts.isAdmin ? [] : data.tabs.filter(t => t.recipient_agent_ID === opts.agentId);
  const myReady = mine.filter(t => isReady(t, now));
  if (myReady.length > 0) reminders.push({ text: `${plural(myReady.length, 'commission')} approved: request payment (${peso(sum(myReady))})`, urgent: true, to: '/commissions' });
  const weekAhead = today(new Date(now.getTime() + 7 * 86400000));
  mine
    .filter(t => t.status === 'approved' && !isDue(t, now) && t.due_date <= weekAhead)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .forEach(t => reminders.push({ text: `${peso(t.commission_amount)} (${t.role}) due ${t.due_date} · ${t.project_name}`, urgent: false, to: '/commissions' }));

  const history: HistoryItem[] = [...data.tabs]
    .sort((a, b) => b.sale_ID - a.sale_ID || a.payment_no - b.payment_no)
    .map(t => ({
      id: t.id,
      sale_ID: t.sale_ID,
      sale_label: `Sale #${t.sale_ID} · ${t.project_name}`,
      agent_name: t.agent_name,
      role: t.role,
      rank: t.rank,
      payment_no: t.payment_no,
      payment_total: t.payment_total,
      amount: t.commission_amount,
      due_date: t.due_date,
      status: STATUS_LABEL[t.status] as HistoryStatus,
    }));

  // Alerts: approvals and proofs of payment for the viewer; requests and approvals for an admin.
  const alerts: DashAlert[] = [];
  const myApproved = mine.filter(t => t.status === 'approved');
  const myReleased = mine.filter(t => t.status === 'payment_released');
  if (myReleased.length > 0) {
    alerts.push({ text: `Proof of payment was sent for ${plural(myReleased.length, 'commission')} (${peso(sum(myReleased))}). Check it and press "Received payment" once you are paid.`, tone: 'action', to: '/commissions' });
  }
  if (myApproved.length > 0) {
    alerts.push({ text: `${plural(myApproved.length, 'commission')} approved (${peso(sum(myApproved))}). You can request payment${myApproved.some(t => !isDue(t, now)) ? ' once each is due' : ''}.`, tone: 'action', to: '/commissions' });
  }
  if (opts.isAdmin) {
    const requested = data.tabs.filter(t => t.status === 'payment_requested');
    if (requested.length > 0) alerts.push({ text: `${plural(requested.length, 'payment request')} waiting for you to release (${peso(sum(requested))}).`, tone: 'action', to: '/commissions' });
    if (awaitingApproval.length > 0) alerts.push({ text: `${plural(awaitingApproval.length, 'commission')} waiting for your approval.`, tone: 'info', to: '/commissions' });
  }

  return { alerts, metrics, commissionMetrics, history, performance: { bars, sold: c.approved.length, avgDeal }, activities, reminders };
}