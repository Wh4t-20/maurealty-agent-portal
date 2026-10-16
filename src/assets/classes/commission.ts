import type { CommissionPayout, ChainMember, PayoutRole } from '@/utils/commissionAllocation';

export type PayUnit = 'months' | 'quarters' | 'years';

export interface DpDivision {
  divisionRate: number; // e.g., 10 for 10%
  count: number;        // number of payments (= commission tabs): 12 months, 6 quarters, 2 years...
  unit: PayUnit;        // how far apart the payments are
  startDate?: string;   // due date of the first payment
  endDate?: string;     // due date of the last payment
}

export type CommissionPaymentScheme = 'DP' | 'Spot-Cash' | 'Deferred-Cash';

// The seller and everyone above them (nearest first), with ranks and position rates.
export interface CommissionChain {
  seller: ChainMember;
  ancestors: ChainMember[];
}

export interface CalculateCommissionPayload {
  commissionableAmount: number;
  overallDpRate: number; // e.g., 20 for 20%
  paymentScheme: CommissionPaymentScheme;
  dpDivisions: DpDivision[];
  firstDueDate?: string; // Spot-Cash: its single due date. Deferred-Cash: the first of 12 monthly due dates.
  chain?: CommissionChain; // who earns what; defaults to a lone Specialist
}

export interface CommissionScheduleItem {
  paymentNo: number;
  dueDate: string;
  isBalance?: boolean;  // the one extra payment for the remaining balance (100% - DP rate)
  rawCompanyCommission: number;
  payouts: CommissionPayout[]; // the seller's share and each upline's override for this payment
}

export interface CommissionSummary {
  totalRawCommission: number;
  totalPaidOut: number;
  byRole: Partial<Record<PayoutRole, number>>;
}

export interface CommissionCalculationResult {
  summary: CommissionSummary;
  schedule: CommissionScheduleItem[];
}
