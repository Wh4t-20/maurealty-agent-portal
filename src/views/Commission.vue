<template>
  <div class="min-h-screen bg-background-gray text-gray-800 flex flex-col md:flex-row font-sans">

    <!-- MAIN CONTENT CONTAINER -->
    <main class="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-2xl p-6 shadow-sm mb-6 border border-sidebar-hover/20">
        <div>
          <strong><h1 class="text-2xl md:text-3xl font-bold text-maurealty-blue">COMMISSIONS MANAGEMENT</h1></strong>
          <p class="text-sm text-gray-600 mt-1">Track, review, and claim your real estate commissions schedule.</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <span class="px-3 py-1 bg-maurealty-green/10 text-maurealty-green font-semibold text-xs rounded-full uppercase tracking-wider">
            Active Portal
          </span>
        </div>
      </div>

      <!-- FILTER & STATUS TABS (ALL 4 IN ONE LINE WITH HORIZONTAL SCROLL ON MOBILE) -->
      <div class="bg-white rounded-2xl p-3 shadow-sm mb-6 border border-sidebar-hover/20">
        <div class="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            v-for="tab in filter_tabs"
            :key="tab.id"
            @click="active_tab = tab.id"
            :class="[
              'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0',
              active_tab === tab.id
                ? 'bg-maurealty-blue text-white shadow-md'
                : 'bg-background-gray text-sidebar-hover hover:bg-sidebar-hover/20'
            ]"
          >
            {{ tab.label }} ({{ countCommissionsByStatus(tab.id) }})
          </button>
        </div>
      </div>

      <!-- BIG CONTAINER IN THE MIDDLE FOR COMMISSION TABS -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-sidebar-hover/20 min-h-[500px]">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-maurealty-blue">
            {{ getActiveTabLabel }} 
            <span class="text-xs font-normal text-gray-500 ml-2">({{ filteredCommissions.length }} Items)</span>
          </h2>
          <div class="text-xs text-gray-500">
            Current Date: <span class="font-semibold text-gray-700">{{ current_date_string }}</span>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div v-if="filteredCommissions.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-16 h-16 bg-background-gray text-sidebar-hover rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ₱
          </div>
          <h3 class="text-lg font-semibold text-gray-700">No commissions found</h3>
          <p class="text-sm text-gray-500 mt-1 max-w-sm">There are no commission records matching this status filter right now.</p>
        </div>

        <!-- COMMISSION TAB LIST -->
        <div v-else class="space-y-4">
          <div
            v-for="comm in filteredCommissions"
            :key="comm.id"
            class="bg-background-gray/40 border border-sidebar-hover/20 rounded-xl p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <!-- DETAILS SECTION -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 flex-1">
              <!-- Project Name & Developer -->
              <div class="col-span-2 sm:col-span-1">
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Project / Developer</span>
                <p class="text-sm font-bold text-maurealty-blue truncate" :title="comm.project_name">{{ comm.project_name }}</p>
                <p class="text-xs text-gray-600 truncate" :title="comm.developer_name">{{ comm.developer_name }}</p>
              </div>

              <!-- Agent Name & Role -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Agent & Role</span>
                <p class="text-sm font-semibold text-gray-800 truncate" :title="comm.agent_name">{{ comm.agent_name }}</p>
                <span class="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded bg-sidebar-hover/10 text-maurealty-blue uppercase">
                  {{ comm.role }}
                </span>
              </div>

              <!-- Commission Amount -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Commission</span>
                <p class="text-base font-extrabold text-maurealty-green">
                  ₱{{ comm.commission_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </p>
                <span class="text-[10px] text-gray-500">Pay No. {{ comm.payment_no }}</span>
              </div>

              <!-- Due Date -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Due Date</span>
                <p class="text-sm font-medium text-gray-700">{{ comm.due_date }}</p>
                <span 
                  :class="[
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5',
                    isDueDateReached(comm.due_date) ? 'bg-maurealty-green/20 text-maurealty-green' : 'bg-amber-100 text-amber-700'
                  ]"
                >
                  {{ isDueDateReached(comm.due_date) ? 'Due Date Reached' : 'Pending Date' }}
                </span>
              </div>

              <!-- Admin Approval Status -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Admin Approval</span>
                <div class="mt-1 flex items-center gap-1.5">
                  <span 
                    :class="[
                      'w-2.5 h-2.5 rounded-full',
                      comm.is_admin_approved ? 'bg-maurealty-green' : 'bg-amber-500'
                    ]"
                  ></span>
                  <span class="text-xs font-semibold" :class="comm.is_admin_approved ? 'text-maurealty-green' : 'text-amber-600'">
                    {{ comm.is_admin_approved ? 'Approved' : 'Pending Approval' }}
                  </span>
                </div>
                <!-- Admin Toggle Simulator Button for testing -->
                <button 
                  @click="toggleAdminApproval(comm.id)"
                  class="text-[10px] text-maurealty-blue underline mt-1 hover:text-sidebar-hover cursor-pointer"
                  title="Toggle Admin Approval status for testing"
                >
                  [Toggle Admin]
                </button>
              </div>

              <!-- Claim Status Badge -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Status</span>
                <span 
                  :class="[
                    'inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1',
                    comm.status === 'Claimed' ? 'bg-gray-200 text-gray-700' :
                    (isDueDateReached(comm.due_date) && comm.is_admin_approved) ? 'bg-maurealty-green text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                  ]"
                >
                  {{ comm.status }}
                </span>
              </div>
            </div>

            <!-- CLAIM BUTTON CONTAINER -->
            <div class="flex items-center justify-end lg:justify-center border-t lg:border-t-0 pt-3 lg:pt-0">
            <button
                @click="handleClaimCommission(comm.id)"
                :disabled="comm.status === 'Claimed' || !isDueDateReached(comm.due_date) || !comm.is_admin_approved"
                :class="[
                'w-44 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2',
                comm.status === 'Claimed'
                    ? 'bg-gray-100 text-gray-500 cursor-default shadow-none border border-gray-200'
                    : (isDueDateReached(comm.due_date) && comm.is_admin_approved)
                    ? 'bg-maurealty-green hover:bg-maurealty-green/90 text-white cursor-pointer shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                ]"
                :title="getClaimButtonTooltip(comm)"
            >
                <!-- CLAIMED STATE -->
                <template v-if="comm.status === 'Claimed'">
                <span>✓ Claimed & Credited</span>
                </template>

                <!-- UNCLAIMED STATE -->
                <template v-else>
                <span>Claim</span>
                <svg v-if="isDueDateReached(comm.due_date) && comm.is_admin_approved" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                </template>
            </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">

import { ref, computed } from 'vue';
import { commissionService } from '@/services/commissionService';
import type { CalculateCommissionPayload } from '@/assets/classes/commission';

interface CommissionItem {
  id: string;
  due_date: string;
  commission_amount: number;
  agent_name: string;
  role: 'Agent' | 'Upline 1' | 'Upline 2';
  project_name: string;
  developer_name: string;
  is_admin_approved: boolean;
  status: 'Ready' | 'Locked' | 'Claimed';
  payment_no: number;
}

// Active Filter Tab state
const active_tab = ref<string>('all');

// Filter tabs definition
const filter_tabs = [
  { id: 'all', label: 'All Commissions' },
  { id: 'ready', label: 'Ready to Claim' },
  { id: 'locked', label: 'Locked / Pending' },
  { id: 'claimed', label: 'Claimed' }
];

// Current date string for display and comparison
const current_date_string = ref<string>('2026-10-12');

// Mock Data initialized utilizing the commissionService calculation patterns
const commissions_list = ref<CommissionItem[]>([
  {
    id: 'comm-1',
    due_date: '2026-10-01',
    commission_amount: 67500.00,
    agent_name: 'Cole de Unson',
    role: 'Agent',
    project_name: 'Grand Tower Manila',
    developer_name: 'Megaworld Corporation',
    is_admin_approved: true,
    status: 'Ready',
    payment_no: 1
  },
  {
    id: 'comm-2',
    due_date: '2026-10-15',
    commission_amount: 11250.00,
    agent_name: 'Cole de Unson',
    role: 'Upline 1',
    project_name: 'Grand Tower Manila',
    developer_name: 'Megaworld Corporation',
    is_admin_approved: true,
    status: 'Locked',
    payment_no: 1
  },
  {
    id: 'comm-3',
    due_date: '2026-11-01',
    commission_amount: 11250.00,
    agent_name: 'Cole de Unson',
    role: 'Upline 2',
    project_name: 'Grand Tower Manila',
    developer_name: 'Megaworld Corporation',
    is_admin_approved: false,
    status: 'Locked',
    payment_no: 1
  },
  {
    id: 'comm-4',
    due_date: '2026-09-15',
    commission_amount: 45000.00,
    agent_name: 'Cole de Unson',
    role: 'Agent',
    project_name: 'Ayala Center Residences',
    developer_name: 'Ayala Land Premier',
    is_admin_approved: true,
    status: 'Claimed',
    payment_no: 1
  },
  {
    id: 'comm-5',
    due_date: '2026-10-20',
    commission_amount: 33750.00,
    agent_name: 'Cole de Unson',
    role: 'Agent',
    project_name: 'Seaside Towers Cebu',
    developer_name: 'SM Development Corporation',
    is_admin_approved: false,
    status: 'Locked',
    payment_no: 2
  }
]);

/**
 * Checks if the due date has been reached relative to the current date.
 * 
 * @param {string} dueDate - The target due date string (YYYY-MM-DD).
 * @returns {boolean} True if current date is equal or past due date.
 */
function isDueDateReached(dueDate: string): boolean {
  const current = new Date(current_date_string.value);
  const due = new Date(dueDate);
  return current >= due;
}

/**
 * Gets the active tab header label.
 */
const getActiveTabLabel = computed(() => {
  const found = filter_tabs.find(t => t.id === active_tab.value);
  return found ? found.label : 'Commissions';
});

/**
 * Counts commissions matching specific status filter category.
 * 
 * @param {string} tabId - The filter tab identifier.
 * @returns {number} Count of items.
 */
function countCommissionsByStatus(tabId: string): number {
  if (tabId === 'all') return commissions_list.value.length;
  if (tabId === 'ready') {
    return commissions_list.value.filter(c => c.status !== 'Claimed' && isDueDateReached(c.due_date) && c.is_admin_approved).length;
  }
  if (tabId === 'locked') {
    return commissions_list.value.filter(c => c.status !== 'Claimed' && (!isDueDateReached(c.due_date) || !c.is_admin_approved)).length;
  }
  if (tabId === 'claimed') {
    return commissions_list.value.filter(c => c.status === 'Claimed').length;
  }
  return 0;
}

// this filters the commission tabs
const filteredCommissions = computed(() => {
    // 1. Filter items by active tab
    const list = commissions_list.value.filter(comm => {
        if (active_tab.value === 'ready') {
        return comm.status !== 'Claimed' && comm.is_admin_approved && isDueDateReached(comm.due_date);
        }
        if (active_tab.value === 'locked') {
        return comm.status !== 'Claimed' && (!comm.is_admin_approved || !isDueDateReached(comm.due_date));
        }
        if (active_tab.value === 'claimed') {
        return comm.status === 'Claimed';
        }
        // Default for 'all' tab
        return true;
    });

    // 2. Multi-level sort: Unclaimed first -> Due Date -> Developer Name
    return list.sort((a, b) => {
        // 1st Priority: Unclaimed (0) before Claimed (1)
        const aClaimed = a.status === 'Claimed' ? 1 : 0;
        const bClaimed = b.status === 'Claimed' ? 1 : 0;
        if (aClaimed !== bClaimed) {
        return aClaimed - bClaimed;
        }

        // 2nd Priority: Due Date (Earliest first)
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        if (dateA !== dateB) {
        return dateA - dateB;
        }

        // 3rd Priority: Developer Name (Alphabetical A-Z)
        const devA = (a.developer_name || '').toLowerCase();
        const devB = (b.developer_name || '').toLowerCase();
        return devA.localeCompare(devB);
    });
});

/**
 * Generates appropriate tooltip text for the claim button.
 * 
 * @param {CommissionItem} comm - The commission item object.
 * @returns {string} Tooltip description.
 */
function getClaimButtonTooltip(comm: CommissionItem): string {
  const dateReached = isDueDateReached(comm.due_date);
  if (!dateReached && !comm.is_admin_approved) {
    return 'Locked: Due date not reached and pending admin approval.';
  }
  if (!dateReached) {
    return 'Locked: Due date has not been reached yet.';
  }
  if (!comm.is_admin_approved) {
    return 'Locked: Waiting for admin approval.';
  }
  return 'Ready to claim!';
}

/**
 * Toggles the admin approval status of a commission item (for testing sandbox).
 * 
 * @param {string} commId - The commission ID.
 */
function toggleAdminApproval(commId: string): void {
  const item = commissions_list.value.find(c => c.id === commId);
  if (item) {
    item.is_admin_approved = !item.is_admin_approved;
  }
}

/**
 * Handles the claiming action for an individual commission.
 * 
 * @param {string} commId - The commission ID.
 */
function handleClaimCommission(commId: string): void {
  const item = commissions_list.value.find(c => c.id === commId);
  if (item && isDueDateReached(item.due_date) && item.is_admin_approved) {
    item.status = 'Claimed';
    alert(`Success! Commission of ₱${item.commission_amount.toLocaleString()} for ${item.project_name} has been successfully claimed and queued for release.`);
  }
}
</script>