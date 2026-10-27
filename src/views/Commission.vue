<template>
  <div class="min-h-screen bg-background-gray text-gray-800 flex flex-col md:flex-row font-sans">

    <!-- MAIN CONTENT CONTAINER -->
    <main class="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-2xl p-6 shadow-sm mb-6 border border-sidebar-hover/20">
        <div>
          <strong><h1 class="text-2xl md:text-3xl font-bold text-maurealty-blue">COMMISSIONS MANAGEMENT</h1></strong>
          <p class="text-sm text-gray-600 mt-1">Track your commissions: get approved, request payment, and confirm once you are paid.</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <span class="px-3 py-1 bg-maurealty-green/10 text-maurealty-green font-semibold text-xs rounded-full uppercase tracking-wider">
            Active Portal
          </span>
        </div>
      </div>

      <!-- ADMIN VIEW SWITCH: own commissions (claimable) vs everyone's (for approval) -->
      <div v-if="isAdmin" class="bg-white rounded-2xl p-3 shadow-sm mb-3 border border-sidebar-hover/20">
        <div class="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <button
            v-for="sc in scopes"
            :key="sc.id"
            @click="scope = sc.id"
            :class="[
              'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0',
              scope === sc.id
                ? 'bg-maurealty-green text-white shadow-md'
                : 'bg-background-gray text-sidebar-hover hover:bg-sidebar-hover/20'
            ]"
          >
            {{ sc.label }}
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 px-1">
          {{ scope === 'all'
            ? 'Every agent’s commissions. Approve them, then release payment once an agent requests it.'
            : 'Commissions you receive as the seller or as an upline (Upline 1, 2 or the broker).' }}
        </p>
      </div>

      <!-- RECEIVABLES: claimed vs total commission (everyone's in the admin "All Agents" view) -->
      <div class="bg-white rounded-2xl p-5 shadow-sm mb-3 border border-sidebar-hover/20">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span class="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
              {{ isAdmin && scope === 'all' ? 'Total Receivables (All Agents)' : 'My Receivables (received)' }}
            </span>
            <p class="text-2xl font-extrabold text-maurealty-green">
              {{ peso(receivables.claimedAmount) }}
              <span class="text-base font-semibold text-gray-500">received of {{ peso(receivables.totalAmount) }}</span>
            </p>
          </div>
          <div class="text-xs text-gray-600 sm:text-right">
            <p>{{ receivables.claimedCount }} of {{ receivables.totalCount }} payouts received</p>
            <p>Yet to collect: <span class="font-semibold text-amber-600">{{ peso(receivables.pendingAmount) }}</span></p>
          </div>
        </div>
        <div class="h-2 bg-background-gray rounded-full overflow-hidden mt-3">
          <div class="h-full bg-maurealty-green transition-all" :style="{ width: receivablesPercent + '%' }"></div>
        </div>

        <div v-if="isAdmin && scope === 'all' && perAgent.length" class="mt-4 border-t border-gray-100 pt-3">
          <span class="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Per agent (received / total)</span>
          <ul class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <li v-for="a in perAgent" :key="a.id" class="flex items-center justify-between gap-3">
              <span class="truncate text-gray-700" :title="a.name">{{ a.name }}</span>
              <span class="shrink-0 font-semibold text-gray-800">
                {{ peso(a.summary.claimedAmount) }} <span class="text-gray-400 font-normal">/ {{ peso(a.summary.totalAmount) }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- PER-SALE FILTER: what has been collected and what is still to collect for one sale -->
      <div class="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-sidebar-hover/20">
        <div class="flex flex-col md:flex-row md:items-center gap-3">
          <label class="text-sm font-semibold text-sidebar-hover shrink-0" for="sale-filter">Filter by sale</label>
          <select id="sale-filter" v-model="saleFilter"
                  class="flex-1 min-w-0 py-2 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-2 focus:outline-maurealty-blue">
            <option value="all">All sales</option>
            <option v-for="s in saleOptions" :key="s.id" :value="String(s.id)">
              Sale #{{ s.id }} · {{ s.project }} ({{ s.summary.claimedCount }}/{{ s.summary.totalCount }} received)
            </option>
          </select>
        </div>
        <div v-if="saleSummary" class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div class="rounded-lg bg-maurealty-green/10 p-3">
            <span class="text-[11px] uppercase tracking-wider text-gray-500 block">Collected</span>
            <span class="font-bold text-maurealty-green">{{ peso(saleSummary.claimedAmount) }}</span>
            <span class="text-xs text-gray-500 block">{{ saleSummary.claimedCount }} payout(s)</span>
          </div>
          <div class="rounded-lg bg-amber-100/60 p-3">
            <span class="text-[11px] uppercase tracking-wider text-gray-500 block">Yet to collect</span>
            <span class="font-bold text-amber-700">{{ peso(saleSummary.pendingAmount) }}</span>
            <span class="text-xs text-gray-500 block">{{ saleSummary.totalCount - saleSummary.claimedCount }} payout(s)</span>
          </div>
          <div class="rounded-lg bg-background-gray p-3">
            <span class="text-[11px] uppercase tracking-wider text-gray-500 block">Sale total</span>
            <span class="font-bold text-maurealty-blue">{{ peso(saleSummary.totalAmount) }}</span>
            <span class="text-xs text-gray-500 block">{{ saleSummary.totalCount }} payout(s)</span>
          </div>
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

        <div v-if="loading" class="py-16 text-center text-sm text-gray-500">Loading commissions…</div>

        <!-- LOAD ERROR: shown instead of an empty list so the cause is visible -->
        <div v-else-if="loadError" class="py-12 px-4 text-center">
          <p class="text-sm font-semibold text-red-600">Commissions could not be loaded.</p>
          <p class="text-xs text-gray-600 mt-1 break-words">{{ loadError }}</p>
          <p class="text-xs text-gray-500 mt-2">If it mentions a missing column, re-run the latest migration and then <code>notify pgrst, 'reload schema';</code>.</p>
        </div>

        <!-- EMPTY STATE -->
        <div v-else-if="filteredCommissions.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
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
            class="bg-background-gray/40 border border-sidebar-hover/20 rounded-xl p-5 hover:shadow-md transition-all grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[4.5rem_minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_11rem] gap-x-4 gap-y-3 items-center"
          >
            <!-- One grid for every card (columns line up whatever the status); `contents` lets the
                 cells below sit directly in it. On phones it becomes 2 columns, on tablets 3. -->
            <div class="contents">
              <!-- Payment index: 1/12, 2/12, ... -->
              <div class="col-span-2 sm:col-span-3 lg:col-span-1 flex lg:flex-col items-baseline lg:items-start gap-2 lg:gap-0">
                <span class="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Payment</span>
                <span class="text-xl font-extrabold text-maurealty-blue leading-tight">{{ comm.payment_no }}/{{ comm.payment_total }}</span>
              </div>

              <!-- Project Name & Developer -->
              <div class="col-span-2 sm:col-span-1">
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Project / Developer</span>
                <p class="text-sm font-bold text-maurealty-blue truncate" :title="comm.project_name">{{ comm.project_name }}</p>
                <p class="text-xs text-gray-600 truncate" :title="comm.developer_name">{{ comm.developer_name }}</p>
              </div>

              <!-- Agent (the person receiving this commission) -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Agent</span>
                <p class="text-sm font-semibold text-gray-800 truncate" :title="comm.agent_name">{{ comm.agent_name }}</p>
              </div>

              <!-- Role: Agent, Upline 1, Upline 2 or Upline 3 (broker), with the recipient's rank -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Role</span>
                <span class="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded bg-sidebar-hover/10 text-maurealty-blue uppercase">
                  {{ comm.role }}
                </span>
                <p v-if="comm.rank" class="text-[11px] text-gray-600 mt-0.5 truncate" :title="comm.rank">Rank: {{ comm.rank }}</p>
              </div>

              <!-- Commission Amount -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Commission</span>
                <p class="text-base font-extrabold text-maurealty-green">
                  ₱{{ comm.commission_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </p>
                <span v-if="comm.is_balance" class="text-[10px] text-gray-500">Remaining balance</span>
              </div>

              <!-- Due Date -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Due Date</span>
                <p class="text-sm font-medium text-gray-700">{{ comm.due_date }}</p>
                <span 
                  :class="[
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5',
                    isDue(comm) ? 'bg-maurealty-green/20 text-maurealty-green' : 'bg-amber-100 text-amber-700'
                  ]"
                >
                  {{ comm.sale_status === 'complete' && !isDateReached(comm.due_date) ? 'Sale Complete' : isDue(comm) ? 'Due Date Reached' : 'Pending Date' }}
                </span>
              </div>

              <!-- Commission status -->
              <div>
                <span class="text-[11px] uppercase tracking-wider text-gray-500 block font-medium">Status</span>
                <span :class="['inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1', statusClass(comm.status)]">
                  {{ STATUS_LABEL[comm.status] }}
                </span>
                <span v-if="comm.status === 'approved' && blockedBy(comm) !== null && !isAdmin" class="block text-[10px] text-amber-700 mt-0.5">Receive payment {{ blockedBy(comm) }} first</span>
                <span v-else-if="comm.status === 'approved' && !isDue(comm)" class="block text-[10px] text-gray-500 mt-0.5">Request opens on the due date</span>
              </div>
            </div>

            <!-- ACTIONS: approve (admin) -> request payment (recipient) -> release payment (admin) -> received (recipient) -->
            <div class="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col items-stretch lg:items-center justify-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
              <button v-if="isAdmin && comm.status === 'pending_approval'" class="action-btn border border-maurealty-blue text-maurealty-blue hover:bg-maurealty-blue hover:text-white" @click="handleApprove(comm.id)">
                Approve commission
              </button>

              <template v-if="comm.status === 'approved'">
                <button v-if="canAgentAct(comm)" :disabled="!canRequest(comm)"
                        :class="['action-btn', canRequest(comm) ? 'bg-maurealty-green text-white hover:bg-maurealty-green/90 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed']"
                        :title="requestTooltip(comm)"
                        @click="requesting = comm">
                  Request payment
                </button>
                <p v-else class="w-full text-center text-xs text-gray-500">Waiting for the agent to request payment</p>
              </template>

              <template v-if="comm.status === 'payment_requested'">
                <button v-if="isAdmin" class="action-btn bg-maurealty-blue text-white hover:opacity-90 shadow-md" @click="releasing = comm">
                  Release payment
                </button>
                <p v-else class="w-full text-center text-xs text-gray-500">Request sent. Waiting for the admin to release payment.</p>
              </template>

              <template v-if="comm.status === 'payment_released'">
                <button class="action-btn bg-maurealty-green text-white hover:bg-maurealty-green/90 shadow-md animate-pulse" @click="viewing = comm">
                  {{ canAgentAct(comm) ? 'View proof / Confirm' : 'View proof of payment' }}
                </button>
              </template>

              <template v-if="comm.status === 'received'">
                <p class="w-full text-center text-xs font-bold text-gray-500">✓ Received<template v-if="comm.claimed_at"><br /><span class="font-normal">{{ new Date(comm.claimed_at).toLocaleDateString('en-PH') }}</span></template></p>
                <button v-if="comm.proof_urls.length" class="text-xs text-maurealty-blue underline cursor-pointer" @click="viewing = comm">View proof</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- POPUPS -->
      <PaymentRequestModal v-if="requesting && me" :tab="requesting" :agent="me" @close="requesting = null" @submitted="afterChange(requesting!, 'Payment request sent to the admin.')" />
      <ReleasePaymentModal v-if="releasing" :tab="releasing" :admin-agent-id="currentAgentId" @close="releasing = null" @released="afterChange(releasing!, 'Proof of payment sent. The agent has been notified.')" />
      <ProofModal v-if="viewing" :tab="viewing" :can-confirm="canAgentAct(viewing) && viewing.status === 'payment_released'" @close="viewing = null" @received="afterChange(viewing!, 'Marked as received.')" />
    </main>
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, watch } from 'vue';
import { commissionService, summarizeTabs, STATUS_LABEL, type CommissionTab, type CommissionStatus } from '@/services/commissionService';
import PaymentRequestModal from '@/components/commissions/PaymentRequestModal.vue';
import ReleasePaymentModal from '@/components/commissions/ReleasePaymentModal.vue';
import ProofModal from '@/components/commissions/ProofModal.vue';
import { useLiveRefresh } from '@/utils/liveRefresh';
import { authService } from '@/services/authService';

// Tabs come from the `commissions` table, which is filled when a sale is approved
// (see salesService.generateCommissionTabs). Each has a status in the payment flow.
type CommissionItem = CommissionTab;

const commissions_list = ref<CommissionItem[]>([]);
const loading = ref(true);
const loadError = ref('');

// Who is looking. Admins can see and approve everything, but only claim their own tabs.
const isAdmin = ref(false);
const currentAgentId = ref<number | null>(null);
const me = ref<{ first_name: string; middle_name?: string | null; last_name: string } | null>(null);

// Popups
const requesting = ref<CommissionItem | null>(null);
const releasing = ref<CommissionItem | null>(null);
const viewing = ref<CommissionItem | null>(null);

let adminScopeSet = false;

// Admin view: "mine" = tabs I receive, "all" = everyone's tabs (for approval).
const scope = ref<'mine' | 'all'>('mine');
const scopes = [
  { id: 'mine', label: 'My Commissions' },
  { id: 'all', label: 'All Agents (Approval)' }
] as const;

// Active Filter Tab state
const active_tab = ref<string>('all');

// Filter tabs definition
const filter_tabs: { id: string; label: string }[] = [
  { id: 'all', label: 'All Commissions' },
  { id: 'pending_approval', label: 'Awaiting Approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'payment_requested', label: 'Payment Requested' },
  { id: 'payment_released', label: 'Payment Released' },
  { id: 'received', label: 'Received' }
];

const statusClass = (st: CommissionStatus) =>
  st === 'received' ? 'bg-gray-200 text-gray-700'
  : st === 'payment_released' ? 'bg-maurealty-green text-white'
  : st === 'payment_requested' ? 'bg-blue-100 text-blue-700'
  : st === 'approved' ? 'bg-maurealty-green/20 text-maurealty-green'
  : 'bg-amber-100 text-amber-700';

// Today's date (YYYY-MM-DD, local time) for display and comparison
function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const current_date_string = ref<string>(todayString());

// True when the calendar due date has arrived. YYYY-MM-DD strings compare correctly.
function isDateReached(dueDate: string): boolean {
  return current_date_string.value >= dueDate;
}

// A tab counts as due when its date has arrived, or when the sale is complete
// (every remaining tab becomes claimable once the sale is completed).
function isDue(tab: CommissionTab): boolean {
  return tab.sale_status === 'complete' || isDateReached(tab.due_date);
}

// Requesting and receiving payment is for the agent only: the recipient of the tab, never an admin.
// (Approving and releasing payment are the admin-only steps.)
function canAgentAct(tab: CommissionTab): boolean {
  return !isAdmin.value && isOwnTab(tab);
}

// Payments of a sale are received in order: a later payment can't be requested until the
// earlier ones (same sale, same person) are received. Returns the first earlier payment still
// open, or null when nothing blocks.
function blockedBy(tab: CommissionTab): number | null {
  const open = commissions_list.value
    .filter(t => t.sale_ID === tab.sale_ID && t.recipient_agent_ID === tab.recipient_agent_ID
      && t.payment_no < tab.payment_no && t.status !== 'received')
    .map(t => t.payment_no);
  return open.length ? Math.min(...open) : null;
}

const canRequest = (tab: CommissionTab) => isDue(tab) && blockedBy(tab) === null;

function requestTooltip(tab: CommissionTab): string {
  const b = blockedBy(tab);
  if (b !== null) return `Receive payment ${b} of this sale first.`;
  if (!isDue(tab)) return 'You can request payment once the due date is reached (or the sale is complete).';
  return 'Send your details to the admin';
}

// The tab belongs to the signed-in person.
function isOwnTab(tab: CommissionTab): boolean {
  return tab.recipient_agent_ID === currentAgentId.value;
}

// Admin loads everyone's tabs; an agent loads only the tabs they receive.
async function loadCommissions(silent = false) {
  if (!silent) loading.value = true;
  try {
    const agent = await authService.getCurrentAgent();
    isAdmin.value = !!agent?.admin_access;
    currentAgentId.value = agent?.agent_ID ?? null;
    me.value = agent ? { first_name: agent.first_name, middle_name: (agent as any).middle_name ?? null, last_name: agent.last_name } : null;
    // An admin has no payouts of their own to act on, so they start on everyone's commissions.
    if (isAdmin.value && !adminScopeSet) { scope.value = 'all'; adminScopeSet = true; }
    loadError.value = '';
    const tabs = await commissionService.getTabs(isAdmin.value ? undefined : agent?.agent_ID);
    commissions_list.value = tabs;
  } catch (e: any) {
    console.error('Failed to load commissions:', e);
    loadError.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadCommissions());

// Stay current without a reload (sales approved/completed, tabs approved or claimed elsewhere).
useLiveRefresh(() => loadCommissions(true), ['commissions', 'sales']);

// What this person is looking at: an admin in "mine" scope sees only their own tabs.
const scopedList = computed(() =>
  isAdmin.value && scope.value === 'mine'
    ? commissions_list.value.filter(c => isOwnTab(c))
    : commissions_list.value
);

// --- Receivables (claimed vs total) ---
const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const receivables = computed(() => summarizeTabs(scopedList.value));
const receivablesPercent = computed(() =>
  receivables.value.totalAmount > 0 ? Math.min(100, Math.round((receivables.value.claimedAmount / receivables.value.totalAmount) * 100)) : 0
);

// Admin "All Agents" view: claimed / total per recipient.
const perAgent = computed(() => {
  const groups = new Map<number, { id: number; name: string; tabs: CommissionTab[] }>();
  for (const t of scopedList.value) {
    const g = groups.get(t.recipient_agent_ID) ?? { id: t.recipient_agent_ID, name: t.agent_name, tabs: [] };
    g.tabs.push(t);
    groups.set(t.recipient_agent_ID, g);
  }
  return [...groups.values()]
    .map(g => ({ id: g.id, name: g.name, summary: summarizeTabs(g.tabs) }))
    .sort((a, b) => b.summary.totalAmount - a.summary.totalAmount);
});

// --- Per-sale filter ---
const saleFilter = ref<string>('all');
watch(scope, () => { saleFilter.value = 'all'; });
const saleOptions = computed(() => {
  const groups = new Map<number, { id: number; project: string; tabs: CommissionTab[] }>();
  for (const t of scopedList.value) {
    const g = groups.get(t.sale_ID) ?? { id: t.sale_ID, project: t.project_name, tabs: [] };
    g.tabs.push(t);
    groups.set(t.sale_ID, g);
  }
  return [...groups.values()]
    .map(g => ({ id: g.id, project: g.project, summary: summarizeTabs(g.tabs) }))
    .sort((a, b) => b.id - a.id);
});
const saleSummary = computed(() =>
  saleFilter.value === 'all' ? null : saleOptions.value.find(o => String(o.id) === saleFilter.value)?.summary ?? null
);

// What the list and the status counters show: the scope, narrowed to the chosen sale.
const visibleList = computed(() =>
  saleFilter.value === 'all' ? scopedList.value : scopedList.value.filter(c => String(c.sale_ID) === saleFilter.value)
);

/**
 * Gets the active tab header label.
 */
const getActiveTabLabel = computed(() => {
  const found = filter_tabs.find(t => t.id === active_tab.value);
  return found ? found.label : 'Commissions';
});

// Does a tab belong under a given filter tab?
function matchesFilter(c: CommissionItem, tabId: string): boolean {
  return tabId === 'all' || c.status === tabId;
}

/**
 * Counts commissions matching specific status filter category.
 * 
 * @param {string} tabId - The filter tab identifier.
 * @returns {number} Count of items.
 */
function countCommissionsByStatus(tabId: string): number {
  return visibleList.value.filter(c => matchesFilter(c, tabId)).length;
}

// this filters the commission tabs
const filteredCommissions = computed(() => {
    // 1. Filter items by active tab
    const list = visibleList.value.filter(comm => matchesFilter(comm, active_tab.value));

    // 2. Multi-level sort: Unclaimed first -> Due Date -> Developer Name
    return list.sort((a, b) => {
        // 1st Priority: Unclaimed (0) before Claimed (1)
        const aClaimed = a.status === 'received' ? 1 : 0;
        const bClaimed = b.status === 'received' ? 1 : 0;
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
 * Admin approves a commission so its recipient can claim it.
 * 
 * @param {number} commId - The commission ID.
 */
async function handleApprove(commId: number): Promise<void> {
  const item = commissions_list.value.find(c => c.id === commId);
  if (!item || !isAdmin.value) return;

  try {
    const ok = await commissionService.approveTab(commId);
    if (!ok) {
      alert('Approval failed — check permissions.');
      return;
    }
    item.is_admin_approved = true;
    item.status = 'approved';
  } catch (e) {
    console.error('Failed to approve commission:', e);
    alert('Something went wrong approving this commission.');
  }
}

// After a request / release / receipt: close the popup, show a note and reload.
async function afterChange(_tab: CommissionItem, message: string): Promise<void> {
  requesting.value = null;
  releasing.value = null;
  viewing.value = null;
  await loadCommissions(true);
  alert(message);
}
</script>

<style scoped>
.action-btn {
  width: 100%;
  max-width: 11rem;
  padding: 0.6rem 0;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.15s;
  cursor: pointer;
}
</style>
