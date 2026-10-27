import { supabase } from '../supabaseClient';
import { dueDateAt, addMonthsClamped } from '../utils/paySchedule';
import { allocatePayouts, type PayoutRole, type CommissionPayout } from '../utils/commissionAllocation';
import { DEFAULT_RANK_RATE } from '../utils/ranks';
import type {
  CalculateCommissionPayload,
  CommissionCalculationResult,
  CommissionScheduleItem
} from '../assets/classes/commission';

// One commission tab as stored in the `commissions` table.
// Agent = the seller. Upline 1 / Upline 2 = the Supervisor / Investment Manager above them
// (nearest first). Upline 3 = the Partner Broker. The recipient's rank is kept beside the role.
export type CommissionRole = PayoutRole;

export interface CommissionTabRow {
  sale_ID: number;
  recipient_agent_ID: number;
  role: CommissionRole;
  recipient_rank: string;
  payment_no: number;
  due_date: string;
  amount: number;
  is_balance: boolean;
}

// Lifecycle of one commission payout:
//   pending_approval -> approved -> payment_requested -> payment_released -> received
export type CommissionStatus = 'pending_approval' | 'approved' | 'payment_requested' | 'payment_released' | 'received';

export const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  payment_requested: 'Payment Requested',
  payment_released: 'Payment Released',
  received: 'Received',
};

// What the agent submits when requesting payment (first/middle/last name come from their
// account, the rest from the sale and the payout).
export interface PaymentRequestDetails {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  sale_id: number;
  project: string;
  developer: string;
  client_name: string;
  reservation_date: string;
  total_contract_price: number;
  role: string;
  rank: string;
  payment_no: number;
  payment_total: number;
  amount: number;
  due_date: string;
}

// A tab as the Commissions page shows it.
export interface CommissionTab {
  id: number;
  sale_ID: number;
  due_date: string;
  commission_amount: number;
  recipient_agent_ID: number;
  agent_name: string;
  role: CommissionRole;
  rank: string;               // rank of the recipient when the tab was created
  project_name: string;
  developer_name: string;
  is_admin_approved: boolean; // an admin must approve each tab before it can be claimed
  claimed: boolean;
  claimed_at: string | null;
  payment_no: number;
  payment_total: number;      // number of payments in the sale ("Payment n of N")
  is_balance: boolean;        // the remaining-balance tab
  sale_status: string;        // 'complete' lifts the due-date wait
  status: CommissionStatus;
  client_name: string;
  reservation_date: string;
  total_contract_price: number;
  requested_at: string | null;
  request_details: PaymentRequestDetails | null;
  released_at: string | null;
  proof_urls: string[];       // proof of payment / receipt / voucher images
}

// Receivables = the commission tabs of a person (or of everyone).
export interface ReceivablesSummary {
  claimedAmount: number;
  totalAmount: number;
  claimedCount: number;
  totalCount: number;
  pendingAmount: number;
}

export function summarizeTabs(tabs: CommissionTab[]): ReceivablesSummary {
  const s: ReceivablesSummary = { claimedAmount: 0, totalAmount: 0, claimedCount: 0, totalCount: tabs.length, pendingAmount: 0 };
  for (const t of tabs) {
    s.totalAmount += t.commission_amount;
    if (t.claimed) { s.claimedAmount += t.commission_amount; s.claimedCount++; }
  }
  s.claimedAmount = Number(s.claimedAmount.toFixed(2));
  s.totalAmount = Number(s.totalAmount.toFixed(2));
  s.pendingAmount = Number((s.totalAmount - s.claimedAmount).toFixed(2));
  return s;
}

// One slot of the payment plan before commissions are split: when it is due and what share
// (%) of the contract price it represents.
interface Slot { dueDate: string; ratePct: number; isBalance?: boolean }

export const commissionService = {
  calculateSchedule(payload: CalculateCommissionPayload): CommissionCalculationResult {
    const { commissionableAmount, overallDpRate, paymentScheme, dpDivisions, firstDueDate } = payload;
    const seller = payload.chain?.seller ?? { agent_ID: 0, rank: 'specialist' as const, rate: DEFAULT_RANK_RATE.specialist };
    const ancestors = payload.chain?.ancestors ?? [];

    const slots: Slot[] = [];

    if (paymentScheme === 'Spot-Cash') {
      // One payment of 100%.
      slots.push({ dueDate: firstDueDate ?? '', ratePct: 100 });
    } else if (paymentScheme === 'Deferred-Cash') {
      // The contract price in 12 equal monthly installments.
      for (let i = 0; i < 12; i++) {
        slots.push({ dueDate: firstDueDate ? addMonthsClamped(firstDueDate, i) : '', ratePct: 100 / 12 });
      }
    } else {
      // Validate DP division rates match overall DP rate
      const totalDivisionRate = dpDivisions.reduce((sum, div) => sum + div.divisionRate, 0);
      if (Math.abs(totalDivisionRate - overallDpRate) > 0.01) {
        throw new Error('Total of DP division rates must equal the overall DP rate.');
      }

      for (const division of dpDivisions) {
        if (!division.count || division.count <= 0) continue;
        for (let i = 0; i < division.count; i++) {
          slots.push({
            // First payment is due on the start date, then one step (month/quarter/year) apart.
            dueDate: division.startDate ? dueDateAt(division.startDate, division.unit, i) : '',
            ratePct: division.divisionRate / division.count,
          });
        }
      }

      // One extra tab for the remaining balance (100% - DP rate), due one month after the last
      // DP division ends. Skipped when the DP covers 100%.
      const balanceRate = Math.round((100 - overallDpRate) * 100) / 100;
      if (balanceRate > 0) {
        const lastEnd = dpDivisions.reduce((latest, div) => (div.endDate && div.endDate > latest ? div.endDate : latest), '');
        const anchor = lastEnd || (slots[slots.length - 1]?.dueDate ?? '');
        slots.push({ dueDate: anchor ? addMonthsClamped(anchor, 1) : '', ratePct: balanceRate, isBalance: true });
      }
    }

    const schedule: CommissionScheduleItem[] = slots.map((slot, i) => {
      const raw = (slot.ratePct / 100) * (0.05 * commissionableAmount);
      return {
        paymentNo: i + 1,
        dueDate: slot.dueDate,
        isBalance: slot.isBalance,
        rawCompanyCommission: Number(raw.toFixed(2)),
        payouts: allocatePayouts(raw, seller, ancestors),
      };
    });

    const byRole: Partial<Record<PayoutRole, number>> = {};
    let totalRaw = 0;
    let totalPaid = 0;
    for (const item of schedule) {
      totalRaw += item.rawCompanyCommission;
      for (const p of item.payouts as CommissionPayout[]) {
        byRole[p.role] = Number(((byRole[p.role] ?? 0) + p.amount).toFixed(2));
        totalPaid += p.amount;
      }
    }

    return {
      summary: { totalRawCommission: Number(totalRaw.toFixed(2)), totalPaidOut: Number(totalPaid.toFixed(2)), byRole },
      schedule,
    };
  },

  // Save generated tabs. The unique key (sale, role, payment no) makes this safe to re-run.
  async saveTabs(rows: CommissionTabRow[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await supabase
      .from('commissions')
      .upsert(rows, { onConflict: 'sale_ID,role,payment_no', ignoreDuplicates: true });

    if (error) {
      console.error('Error saving commission tabs:', error);
      throw error;
    }
  },

  // How many tabs a sale already has (generation is skipped if any exist).
  async countForSale(saleId: number): Promise<number> {
    const { count, error } = await supabase
      .from('commissions')
      .select('commission_ID', { count: 'exact', head: true })
      .eq('sale_ID', saleId);

    if (error) {
      console.error('Error counting commission tabs:', error);
      throw error;
    }
    return count ?? 0;
  },

  // Tabs for the Commissions page. Pass agentId for "my tabs"; omit it for everyone (admin).
  async getTabs(agentId?: number): Promise<CommissionTab[]> {
    let query = supabase
      .from('commissions')
      .select(`
        commission_ID, sale_ID, recipient_agent_ID, role, recipient_rank, payment_no, due_date, amount, claimed, claimed_at,
        admin_approved, is_balance, status, requested_at, request_details, released_at, proof_urls,
        agents!recipient_agent_ID (first_name, last_name),
        sales (status, client_name, total_contract_price, reservation_date, main_listings (listing_title, developers (name)))
      `)
      .order('due_date');

    if (agentId !== undefined) {
      query = query.eq('recipient_agent_ID', agentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching commission tabs:', error);
      throw error;
    }

    const rows: any[] = data || [];

    // "Payment n of N": N is the highest payment no. of the sale (every recipient has a tab for
    // every payment, so a person's own tabs are enough to know it).
    const totals = new Map<number, number>();
    for (const r of rows) totals.set(r.sale_ID, Math.max(totals.get(r.sale_ID) ?? 0, r.payment_no));

    return rows.map((r: any) => ({
      id: r.commission_ID,
      sale_ID: r.sale_ID,
      due_date: r.due_date,
      commission_amount: Number(r.amount),
      recipient_agent_ID: r.recipient_agent_ID,
      agent_name: `${r.agents?.first_name || ''} ${r.agents?.last_name || ''}`.trim() || `Agent #${r.recipient_agent_ID}`,
      role: r.role,
      rank: r.recipient_rank ?? '',
      project_name: r.sales?.main_listings?.listing_title || 'Unknown',
      developer_name: r.sales?.main_listings?.developers?.name || '—',
      is_admin_approved: !!r.admin_approved,
      claimed: r.claimed,
      claimed_at: r.claimed_at ?? null,
      payment_no: r.payment_no,
      payment_total: totals.get(r.sale_ID) ?? r.payment_no,
      is_balance: !!r.is_balance,
      sale_status: r.sales?.status ?? '',
      status: (r.status as CommissionStatus) ?? (r.claimed ? 'received' : r.admin_approved ? 'approved' : 'pending_approval'),
      client_name: r.sales?.client_name ?? '',
      reservation_date: r.sales?.reservation_date ?? '',
      total_contract_price: Number(r.sales?.total_contract_price) || 0,
      requested_at: r.requested_at ?? null,
      request_details: r.request_details ?? null,
      released_at: r.released_at ?? null,
      proof_urls: r.proof_urls ?? [],
    }));
  },

  // Admin approves a tab: the recipient is alerted on their dashboard and can request payment
  // (once the due date is reached).
  async approveTab(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('commissions')
      .update({ admin_approved: true, status: 'approved', approved_at: new Date().toISOString() })
      .eq('commission_ID', id)
      .eq('status', 'pending_approval')
      .select();

    if (error) {
      console.error('Error approving commission tab:', error);
      throw error;
    }
    return !!data && data.length > 0;
  },

  // A cancelled sale loses its commission tabs. Tabs already claimed are kept as a record.
  async removeUnclaimedForSale(saleId: number): Promise<void> {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('sale_ID', saleId)
      .eq('claimed', false);

    if (error) {
      console.error('Error removing commission tabs:', error);
      throw error;
    }
  },

  // Move a tab from one status to the next. Selecting after the update makes a silent RLS block or
  // a status that already moved on (zero rows) detectable.
  async _advance(id: number, from: CommissionStatus, patch: Record<string, any>): Promise<boolean> {
    const { data, error } = await supabase
      .from('commissions')
      .update(patch)
      .eq('commission_ID', id)
      .eq('status', from)
      .select();

    if (error) {
      console.error('Error updating commission tab:', error);
      throw error;
    }
    return !!data && data.length > 0;
  },

  // Agent: ask for payment of an approved tab. Their details go to the admin.
  async requestPayment(id: number, details: PaymentRequestDetails): Promise<boolean> {
    // Payments are received in order: every earlier payment of this sale must be received first.
    const { data: me, error: meErr } = await supabase
      .from('commissions')
      .select('sale_ID, recipient_agent_ID, payment_no')
      .eq('commission_ID', id)
      .single();
    if (meErr || !me) throw meErr ?? new Error('Commission not found.');
    const { count, error: cErr } = await supabase
      .from('commissions')
      .select('commission_ID', { count: 'exact', head: true })
      .eq('sale_ID', me.sale_ID)
      .eq('recipient_agent_ID', me.recipient_agent_ID)
      .lt('payment_no', me.payment_no)
      .neq('status', 'received');
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) throw new Error('Receive the earlier payments of this sale before requesting this one.');

    return this._advance(id, 'approved', {
      status: 'payment_requested',
      requested_at: new Date().toISOString(),
      request_details: details,
    });
  },

  // Admin: release payment. At least one proof image (receipt / voucher / proof of payment) is
  // required; the files go to the "images" bucket and their links are saved on the tab.
  async releasePayment(id: number, releasedBy: number | null, files: File[]): Promise<boolean> {
    if (files.length === 0) throw new Error('Attach at least one proof of payment image.');

    const urls: string[] = [];
    for (const [i, file] of files.entries()) {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `payment-proofs/${id}-${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('images').upload(path, file);
      if (upErr) {
        console.error('Error uploading proof of payment:', upErr);
        throw upErr;
      }
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      if (!data.publicUrl) throw new Error('Failed to retrieve the uploaded image link.');
      urls.push(data.publicUrl);
    }

    return this._advance(id, 'payment_requested', {
      status: 'payment_released',
      released_at: new Date().toISOString(),
      released_by: releasedBy,
      proof_urls: urls,
    });
  },

  // Agent: confirm the money arrived. This is what marks the tab claimed (a received commission).
  async confirmReceived(id: number): Promise<boolean> {
    return this._advance(id, 'payment_released', {
      status: 'received',
      claimed: true,
      claimed_at: new Date().toISOString(),
    });
  }
};
