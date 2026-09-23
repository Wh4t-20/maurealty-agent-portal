export interface DpDivision {
  divisionRate: number; // e.g., 10 for 10%
  months: number;       // number of payments in this division
  startDate?: string;
  endDate?: string;
}

export interface CalculateCommissionPayload {
  commissionableAmount: number;
  overallDpRate: number; // e.g., 20 for 20%
  paymentScheme: 'DP' | 'Spot-Cash';
  dpDivisions: DpDivision[];
}

export interface CommissionScheduleItem {
  paymentNo: number;
  rawCompanyCommission: number;
  agentCommission: number;
  upline1Commission: number;
  upline2Commission: number;
}

export interface CommissionSummary {
  totalRawCommission: number;
  totalAgentCommission: number;
  totalUpline1Commission: number;
  totalUpline2Commission: number;
}

export interface CommissionCalculationResult {
  summary: CommissionSummary;
  schedule: CommissionScheduleItem[];
}