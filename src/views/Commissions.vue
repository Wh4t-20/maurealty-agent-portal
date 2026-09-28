<template>
    <div class="relative w-full flex flex-col min-h-screen bg-background-gray dark:bg-background-dark-gray">
        <header class="flex flex-col py-5 px-4 sm:px-10 pb-3 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky top-0 z-20">
        <div class="flex items-baseline gap-3">
            <h1 class="text-xl sm:text-3xl font-bold">COMMISSIONS</h1>
            <span class="text-sm font-medium text-maurealty-blue/70 dark:text-white/70"></span>
        </div>
        </header>    
        
    </div>
</template>

<script lang="ts" setup>
    import { ref, reactive, watch } from 'vue';
    import { commissionService} from '@/services/commissionService';
    import { type CalculateCommissionPayload, type CommissionCalculationResult } from '@/assets/classes/commission';
    interface Commission {
        property: string;
        commissionableAmount: number;
        overallDpRate: number;
        dpDivisions: { divisionRate: number; months: number; startDate?: string; endDate?: string }[];
    }
    const commissions = 
    [
        {
            property: "Unit 12B, Solano Residences",
            commissionableAmount: 3500000,
            overallDpRate: 20,
            dpDivisions: [
            { divisionRate: 5, months: 1, startDate: "2026-09-01", endDate: "2026-09-01" },
            { divisionRate: 15, months: 12, startDate: "2026-10-01", endDate: "2027-09-01" }
            ]
        },
        {
            property: "Lot 8, Block 3, Palm Grove",
            commissionableAmount: 1800000,
            overallDpRate: 20,
            dpDivisions: [
            { divisionRate: 20, months: 18 } // dates omitted (optional)
            ]
        },
        {
            property: "Unit 5A, Azure Heights",
            commissionableAmount: 5200000,
            overallDpRate: 20,
            dpDivisions: [
            { divisionRate: 5, months: 3, startDate: "2026-08-01", endDate: "2026-10-01" },
            { divisionRate: 15, months: 24, startDate: "2026-11-01", endDate: "2028-10-01" }
            ]
        },
        {
            property: "Townhouse 3, Verde Enclave",
            commissionableAmount: 4200000,
            overallDpRate: 15,
            dpDivisions: [
            { divisionRate: 5, months: 1 },
            { divisionRate: 10, months: 15 }
            ]
        },
        {
            property: "Lot 21, Block 7, Hillcrest Estates",
            commissionableAmount: 2400000,
            overallDpRate: 20,
            dpDivisions: [
            { divisionRate: 20, months: 10, startDate: "2026-09-01", endDate: "2027-06-01" }
            ]
        }
    ];
    const calculatedCommissions: CommissionCalculationResult[] = commissions.map((commission: Commission) => {
        return commissionService.calculateSchedule({
            commissionableAmount: commission.commissionableAmount,
            overallDpRate: commission.overallDpRate,
            paymentScheme: 'DP',
            dpDivisions: commission.dpDivisions
        });
    });
    for (const [index, commission] of commissions.entries()) {
        const result = calculatedCommissions[index];
        if (!result) continue;

        console.log(`Commission for ${commission.property}:`, result);
    }
</script>