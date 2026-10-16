// src/services/salesService.ts
import { supabase } from '../supabaseClient';

//change Imported commissionService to handle commission math
import { commissionService } from '@/services/commissionService';

//change Imported TypeScript interfaces for type safety from commission.ts
import type { 
  DpDivision, 
  PayUnit,
  CalculateCommissionPayload, 
  CommissionCalculationResult 
} from '@/assets/classes/commission';

//change Imported genealogyService to find the selling agent's upline 1 and upline 2
import { genealogyService } from '@/services/genealogyService';
import { addMonthsClamped } from '@/utils/paySchedule';
import type { CommissionTabRow } from '@/services/commissionService';

//change Added SaleSubmissionPayload interface using snake_case naming conventions
export type Financing = 'Pag-ibig' | 'Banking' | 'In-House with Interest';
export type PaymentScheme = 'DP' | 'Spot-Cash' | 'Deferred-Cash';

export interface SaleSubmissionPayload {
  developer_name: string;
  project_name: string;
  total_contract_price: number;
  commission_rate: number; // e.g., 5 for 5% commission rate
  financing: Financing;
  payment_scheme: PaymentScheme;
  overall_dp_rate: number; // e.g., 40 for 40% overall downpayment rate
  dp_divisions: DpDivision[];
}

// A sale row joined with the seller's name and the property title.
export interface Sale {
  sale_ID: number;
  agent_ID: number;
  listing_ID: number;
  client_name: string;
  reservation_date: string;
  total_contract_price: number;
  agent_sale_seq: number | null;
  gross_commission: number | null;
  net_commission: number | null;
  remarks: string | null;
  voucher_series: string | null;
  status: 'pending approval' | 'awaiting payment' | 'complete' | 'cancelled';
  unit_details?: Record<string,any> | null;
  // Financing / payment scheme. Null on sales saved before these existed.
  financing: Financing | null;
  payment_scheme: PaymentScheme | null;
  commissionable_amount: number | null; // amount the commission rate is applied to (can differ from the contract price)
  commission_rate: number | null;  // % applied to the commissionable amount to get the gross commission
  dp_rate: number | null;          // % of contract price (DP only)
  dp_amount: number | null;
  remaining_balance: number | null;
  created_at: string;
  agent_name: string;
  listing_title: string;
  developer_name: string | null;   // the listing's developer
  // Incentives read through from the linked listing (see main_listings).
  agent_incentive: string | null;
  realty_incentive: string | null;
}

// Totals feed (e.g. teammate's Sales calculator). Both interpretations of
// "total sales" are returned so the consumer picks: contract-price sum vs
// gross-commission sum.
export interface SalesTotals {
  count: number;
  totalContractPrice: number;
  totalGrossCommission: number;
}

// Optional filters. Pass agentId to scope to one agent (agent-sees-own);
// omit it for the admin-sees-all view. search matches client name / voucher.
interface GetSalesOptions {
  agentId?: number;
  search?: string;
}

const SALE_SELECT = `
  sale_ID,
  agent_ID,
  listing_ID,
  client_name,
  reservation_date,
  total_contract_price,
  agent_sale_seq,
  gross_commission,
  net_commission,
  remarks,
  voucher_series,
  status,
  unit_details,
  financing,
  payment_scheme,
  commission_rate,
  commissionable_amount,
  dp_rate,
  dp_amount,
  remaining_balance,
  created_at,
  agents (first_name, last_name),
  main_listings (listing_title, agent_incentive, realty_incentive, developers (name))
`;

// Flatten the embedded agent/listing objects into display strings.
function mapToSale(item: any): Sale {
  return {
    sale_ID: item.sale_ID,
    agent_ID: item.agent_ID,
    listing_ID: item.listing_ID,
    client_name: item.client_name,
    reservation_date: item.reservation_date,
    total_contract_price: item.total_contract_price,
    agent_sale_seq: item.agent_sale_seq,
    gross_commission: item.gross_commission,
    net_commission: item.net_commission,
    remarks: item.remarks,
    voucher_series: item.voucher_series,
    status: item.status,
    unit_details: item.unit_details,
    financing: item.financing ?? null,
    payment_scheme: item.payment_scheme ?? null,
    commission_rate: item.commission_rate != null ? Number(item.commission_rate) : null,
    commissionable_amount: item.commissionable_amount != null ? Number(item.commissionable_amount) : null,
    dp_rate: item.dp_rate ?? null,
    dp_amount: item.dp_amount ?? null,
    remaining_balance: item.remaining_balance ?? null,
    created_at: item.created_at,
    agent_name: `${item.agents?.first_name || ''} ${item.agents?.last_name || ''}`.trim(),
    listing_title: item.main_listings?.listing_title || 'Unknown',
    developer_name: item.main_listings?.developers?.name ?? null,
    agent_incentive: item.main_listings?.agent_incentive ?? null,
    realty_incentive: item.main_listings?.realty_incentive ?? null,
  };
}

// "Sale 1 ... n": numbered automatically by when the sale was created, earliest first.
//   perAgent = true  (an agent's own view): counted only among that agent's sales.
//   perAgent = false (admin, all agents):   counted across every sale.
// Numbers come from all sales in the table, so filtering the list never changes them.
async function applySaleNumbers(sales: Sale[], perAgent: boolean): Promise<Sale[]> {
  if (sales.length === 0) return sales;
  const { data } = await supabase
    .from('sales')
    .select('sale_ID, agent_ID, created_at')
    .order('created_at', { ascending: true })
    .order('sale_ID', { ascending: true });

  const numbers = new Map<number, number>();
  const perAgentCount = new Map<number, number>();
  let all = 0;
  for (const r of (data || []) as any[]) {
    if (perAgent) {
      const n = (perAgentCount.get(r.agent_ID) ?? 0) + 1;
      perAgentCount.set(r.agent_ID, n);
      numbers.set(r.sale_ID, n);
    } else {
      numbers.set(r.sale_ID, ++all);
    }
  }
  return sales.map(s => ({ ...s, agent_sale_seq: numbers.get(s.sale_ID) ?? s.agent_sale_seq }));
}

// The sale's agent name normally comes from the joined agents row. If that join comes back
// empty, look the names up directly; if that fails too, show "Agent #id" instead of a blank.
async function fillMissingAgentNames(sales: Sale[]): Promise<Sale[]> {
  const missing = [...new Set(sales.filter(s => !s.agent_name).map(s => s.agent_ID))];
  if (missing.length === 0) return sales;

  const { data } = await supabase
    .from('agents')
    .select('agent_ID, first_name, last_name')
    .in('agent_ID', missing);

  const names = new Map<number, string>();
  for (const a of data || []) {
    names.set(a.agent_ID, `${a.first_name || ''} ${a.last_name || ''}`.trim());
  }

  return sales.map(s => s.agent_name
    ? s
    : { ...s, agent_name: names.get(s.agent_ID) || `Agent #${s.agent_ID}` });
}

export const salesService = {
  // Fetch sales, newest first. Filters are applied conditionally to keep this
  // DRY (one function, optional params) instead of separate query functions.
  async getSales({ agentId, search }: GetSalesOptions = {}): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select(SALE_SELECT)
      .order('reservation_date', { ascending: false });

    if (agentId !== undefined) {
      query = query.eq('agent_ID', agentId);
    }

    if (search) {
      // client name OR voucher series. Joined fields (listing title) are
      // filtered client-side in the view, mirroring the Listings search.
      query = query.or(`client_name.ilike.%${search}%,voucher_series.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }

    // An agent's own list is numbered among their own sales; the all-agents (admin) list across every sale.
    return applySaleNumbers(await fillMissingAgentNames((data || []).map(mapToSale)), agentId !== undefined);
  },

  // Single sale by ID.
  async getSaleById(id: number): Promise<Sale | null> {
    const { data, error } = await supabase
      .from('sales')
      .select(SALE_SELECT)
      .eq('sale_ID', id)
      .single();

    if (error) {
      console.error('Error fetching sale by ID:', error);
      throw error;
    }

    if (!data) return null;
    const [numbered] = await applySaleNumbers([mapToSale(data)], false);
    return numbered ?? null;
  },

  // Insert a new sale (the upload popup calls this).
  async createSale(payload: Record<string, any>) {
    const { data, error } = await supabase
      .from('sales')
      .insert([payload])
      .select('sale_ID')
      .single();

    if (error) {
      console.error('Error creating sale:', error);
      throw error;
    }

    return { success: true, data };
  },

  // Update an existing sale. Selects after updating so a silent RLS block
  // (zero rows touched) is detectable, same as the listings service.
  async updateSale(id: number, payload: Record<string, any>) {
    const { data, error } = await supabase
      .from('sales')
      .update(payload)
      .eq('sale_ID', id)
      .select();

    if (error) {
      console.error('Error updating sale:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('Update failed silently. Zero rows modified in sales.');
      return { success: false };
    }

    return { success: true };
  },

  // Delete a sale by ID. Selects deleted rows to catch a silent RLS block.
  async deleteSale(id: number) {
    const { data, error } = await supabase
      .from('sales')
      .delete()
      .eq('sale_ID', id)
      .select();

    if (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('Delete failed silently. Zero rows deleted in sales.');
      return { success: false };
    }

    return { success: true };
  },

  // Aggregate totals. Summed in JS (reliable at dev scale) rather than via a
  // PostgREST aggregate/RPC. Scope to one agent with agentId, or all if omitted.
  async getTotalSales(agentId?: number): Promise<SalesTotals> {
    let query = supabase
      .from('sales')
      .select('total_contract_price, gross_commission');

    if (agentId !== undefined) {
      query = query.eq('agent_ID', agentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales totals:', error);
      throw error;
    }

    const rows = data || [];
    return {
      count: rows.length,
      totalContractPrice: rows.reduce((sum, r: any) => sum + (r.total_contract_price || 0), 0),
      totalGrossCommission: rows.reduce((sum, r: any) => sum + (r.gross_commission || 0), 0),
    };
  },

  //change Added calculateCommissionableAmount to compute baseline pool (commission_rate * total_contract_price)
  calculateCommissionableAmount(totalContractPrice: number, commissionRate: number): number {
    const rateDecimal = commissionRate > 1 ? commissionRate / 100 : commissionRate;
    const amount = totalContractPrice * rateDecimal;
    return Number(amount.toFixed(2));
  },

  //change Added calculateDownpaymentMetrics to compute downpayment amount and remaining balance
  calculateDownpaymentMetrics(totalContractPrice: number, overallDpRate: number) {
    const dpAmount = (totalContractPrice * overallDpRate) / 100;
    const remainingBalance = totalContractPrice - dpAmount;
    
    return {
      dp_amount: Number(dpAmount.toFixed(2)),
      remaining_balance: Number(remainingBalance.toFixed(2))
    };
  },

  //change Added validateDpDivisions to verify sum of all division rates matches overall DP rate
  validateDpDivisions(overallDpRate: number, divisions: DpDivision[]): boolean {
    if (divisions.length === 0) return overallDpRate === 0;
    // Strict match: compare in hundredths of a percent so float noise
    // (e.g. 0.1 + 0.2) can't cause a false mismatch or a false pass.
    const hundredths = (n: number) => Math.round(n * 100);
    const totalDivisionRate = divisions.reduce((sum, div) => sum + hundredths(div.divisionRate), 0);
    return totalDivisionRate === hundredths(overallDpRate);
  },

  // DP divisions of one sale, in order (Division 1, 2, ...).
  async getDpDivisions(saleId: number): Promise<DpDivision[]> {
    const { data, error } = await supabase
      .from('sale_dp_divisions')
      .select('rate, payable_count, payable_unit, due_date_start, due_date_end')
      .eq('sale_ID', saleId)
      .order('division_no');

    if (error) {
      console.error('Error fetching DP divisions:', error);
      throw error;
    }

    return (data || []).map((d: any) => ({
      divisionRate: Number(d.rate),
      count: d.payable_count,
      unit: d.payable_unit as PayUnit,
      startDate: d.due_date_start,
      endDate: d.due_date_end,
    }));
  },

  // Replace all divisions of a sale (delete, then insert). Pass [] for Spot-Cash.
  // Refuses to save if the rates don't add up to the DP rate.
  async saveDpDivisions(saleId: number, dpRate: number, divisions: DpDivision[]) {
    if (divisions.length > 0 && !this.validateDpDivisions(dpRate, divisions)) {
      throw new Error('Total of DP division rates must equal the DP rate.');
    }

    const { error: delError } = await supabase
      .from('sale_dp_divisions')
      .delete()
      .eq('sale_ID', saleId);

    if (delError) {
      console.error('Error clearing DP divisions:', delError);
      throw delError;
    }

    if (divisions.length === 0) return;

    const rows = divisions.map((d, i) => ({
      sale_ID: saleId,
      division_no: i + 1,
      rate: d.divisionRate,
      payable_count: d.count,
      payable_unit: d.unit,
      due_date_start: d.startDate,
      due_date_end: d.endDate,
    }));

    const { error } = await supabase.from('sale_dp_divisions').insert(rows);
    if (error) {
      console.error('Error saving DP divisions:', error);
      throw error;
    }
  },

  // Called when a sale is approved. Builds the commission tabs: one per payment for the
  // selling agent and each upline who earns an override (by rank, per genealogy). Amounts come
  // from commissionService.calculateSchedule. Does nothing if the sale isn't approved, has no
  // payment scheme (older sales), or already has tabs. Returns how many tabs were created.
  async generateCommissionTabs(saleId: number): Promise<number> {
    const { data: sale, error } = await supabase
      .from('sales')
      .select('sale_ID, agent_ID, reservation_date, status, payment_scheme, dp_rate, gross_commission')
      .eq('sale_ID', saleId)
      .single();

    if (error || !sale) {
      console.error('Error loading sale for commission tabs:', error);
      throw error ?? new Error('Sale not found.');
    }

    const approved = ['awaiting payment', 'complete'].includes(sale.status);
    if (!approved || !sale.payment_scheme) return 0;
    if ((await commissionService.countForSale(saleId)) > 0) return 0;

    // The commissionable amount is the sale's Gross Commission (entered by the admin).
    const commissionableAmount = Number(sale.gross_commission) || 0;
    if (commissionableAmount <= 0) {
      throw new Error('Enter the Gross Commission for this sale first, so commission tabs can be created.');
    }

    const isDp = sale.payment_scheme === 'DP';
    const divisions = isDp ? await this.getDpDivisions(saleId) : [];

    // Tabs are generated the moment the sale is changed to Awaiting Payment. Spot-Cash is due
    // one month after that moment; Deferred-Cash starts its 12 monthly installments one month after it.
    const approvedOn = new Date();
    const approvedISO = `${approvedOn.getFullYear()}-${String(approvedOn.getMonth() + 1).padStart(2, '0')}-${String(approvedOn.getDate()).padStart(2, '0')}`;
    const firstDueDate = addMonthsClamped(approvedISO, 1);

    // The seller and everyone above them, with ranks: the engine splits each payment by role.
    const chain = await genealogyService.getRoleChain(sale.agent_ID);

    const result = commissionService.calculateSchedule({
      commissionableAmount,
      overallDpRate: isDp ? Number(sale.dp_rate) : 0,
      paymentScheme: sale.payment_scheme as 'DP' | 'Spot-Cash' | 'Deferred-Cash',
      dpDivisions: divisions,
      firstDueDate,
      chain,
    });

    const rows: CommissionTabRow[] = [];
    for (const item of result.schedule) {
      for (const p of item.payouts) {
        rows.push({
          sale_ID: saleId,
          payment_no: item.paymentNo,
          due_date: item.dueDate,
          is_balance: item.isBalance ?? false,
          recipient_agent_ID: p.agent_ID,
          role: p.role,
          recipient_rank: p.rankLabel,
          amount: p.amount,
        });
      }
    }

    await commissionService.saveTabs(rows);
    return rows.length;
  },

  // Developer name of a listing (the sale form needs it when the project is locked).
  async getListingDeveloperName(listingId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('main_listings')
      .select('developers (name)')
      .eq('listing_ID', listingId)
      .single();

    if (error) {
      console.error('Error fetching listing developer:', error);
      return null;
    }

    return (data as any)?.developers?.name ?? null;
  },

  //change Added generateSchedulePreview to package submission data and call commissionService calculation logic
  generateSchedulePreview(payload: SaleSubmissionPayload): CommissionCalculationResult {
    const commissionableAmount = this.calculateCommissionableAmount(
      payload.total_contract_price, 
      payload.commission_rate
    );

    const calculationPayload: CalculateCommissionPayload = {
      commissionableAmount,
      overallDpRate: payload.payment_scheme === 'DP' ? payload.overall_dp_rate : 0,
      paymentScheme: payload.payment_scheme,
      dpDivisions: payload.payment_scheme === 'DP' ? payload.dp_divisions : []
    };

    return commissionService.calculateSchedule(calculationPayload);
  }
};