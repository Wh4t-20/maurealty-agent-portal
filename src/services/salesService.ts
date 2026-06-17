// src/services/salesService.ts
import { supabase } from '../supabaseClient';

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
  created_at: string;
  agent_name: string;
  listing_title: string;
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
  created_at,
  agents (first_name, last_name),
  main_listings (listing_title)
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
    created_at: item.created_at,
    agent_name: `${item.agents?.first_name || ''} ${item.agents?.last_name || ''}`.trim(),
    listing_title: item.main_listings?.listing_title || 'Unknown',
  };
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

    return (data || []).map(mapToSale);
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

    return data ? mapToSale(data) : null;
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
};
