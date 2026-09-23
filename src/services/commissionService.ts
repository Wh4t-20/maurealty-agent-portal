import type {
  CalculateCommissionPayload,
  CommissionCalculationResult,
  CommissionScheduleItem
} from '../assets/classes/commission';

export const commissionService = {
  calculateSchedule(payload: CalculateCommissionPayload): CommissionCalculationResult {
    const { commissionableAmount, overallDpRate, paymentScheme, dpDivisions } = payload;

    // 1. Handle Spot-Cash payment scheme
    if (paymentScheme === 'Spot-Cash') {
      const rawComm = 0.05 * commissionableAmount;
      const singleItem: CommissionScheduleItem = {
        paymentNo: 1,
        rawCompanyCommission: Number(rawComm.toFixed(2)),
        agentCommission: Number((rawComm * 0.45).toFixed(2)),
        upline1Commission: Number((rawComm * 0.075).toFixed(2)),
        upline2Commission: Number((rawComm * 0.075).toFixed(2))
      };

      return {
        summary: {
          totalRawCommission: singleItem.rawCompanyCommission,
          totalAgentCommission: singleItem.agentCommission,
          totalUpline1Commission: singleItem.upline1Commission,
          totalUpline2Commission: singleItem.upline2Commission
        },
        schedule: [singleItem]
      };
    }

    // 2. Validate DP division rates match overall DP rate
    const totalDivisionRate = dpDivisions.reduce((sum, div) => sum + div.divisionRate, 0);
    if (Math.abs(totalDivisionRate - overallDpRate) > 0.01) {
      throw new Error('Total of DP division rates must equal the overall DP rate.');
    }

    // 3. Generate schedule for Down Payment scheme
    const schedule: CommissionScheduleItem[] = [];
    let paymentCounter = 1;

    for (const division of dpDivisions) {
      if (!division.months || division.months <= 0) continue;

      const dpRateDecimal = division.divisionRate / 100;
      const rawPerPay = (dpRateDecimal / division.months) * (0.05 * commissionableAmount);
      
      const agentPerPay = rawPerPay * (3 / 4) * (3 / 5);   // 45% cut
      const uplinePerPay = rawPerPay * (3 / 4) * (1 / 10); // 7.5% cut

      for (let i = 0; i < division.months; i++) {
        schedule.push({
          paymentNo: paymentCounter++,
          rawCompanyCommission: Number(rawPerPay.toFixed(2)),
          agentCommission: Number(agentPerPay.toFixed(2)),
          upline1Commission: Number(uplinePerPay.toFixed(2)),
          upline2Commission: Number(uplinePerPay.toFixed(2))
        });
      }
    }

    // 4. Calculate grand total summary
    const summary = schedule.reduce(
      (acc, item) => ({
        totalRawCommission: Number((acc.totalRawCommission + item.rawCompanyCommission).toFixed(2)),
        totalAgentCommission: Number((acc.totalAgentCommission + item.agentCommission).toFixed(2)),
        totalUpline1Commission: Number((acc.totalUpline1Commission + item.upline1Commission).toFixed(2)),
        totalUpline2Commission: Number((acc.totalUpline2Commission + item.upline2Commission).toFixed(2))
      }),
      { totalRawCommission: 0, totalAgentCommission: 0, totalUpline1Commission: 0, totalUpline2Commission: 0 }
    );

    return { summary, schedule };
  }
};