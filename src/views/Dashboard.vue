<template>
  <div class="flex min-h-screen bg-background-gray dark:bg-background-dark-gray w-full">
    <div class="flex-1 flex flex-col">
      
      <header class="flex flex-col py-5 px-10 pb-0 w-full bg-gradient-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black shadow-md sticky top-0 z-20">
        <div class="flex justify-between items-center w-full pb-5">
          <div class="font-['Poppins']">
            <h1 class="text-[30px] text-[var(--color-maurealty-blue,#0A3D62)] dark:text-white font-bold">Welcome back, {{ agentName }} </h1>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Dashboard > <span class="text-blue-600 dark:text-blue-300 font-medium">{{ agent.position_ID ? positionMap[agent.position_ID] : 'Wait'}}</span></p>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#0066ff] dark:bg-[#0052cc] text-white hover:bg-[#0052cc] dark:hover:bg-[#0066ff]" @click="addListing">+ Add Listing</button>
            <!-- Admins only: opens the same Add Agent modal as the Genealogy page (it also creates the login) -->
            <button v-if="isAdmin" class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#e6f4ea] dark:bg-[#1e2821] text-[#1e8e3e] dark:text-green-500 hover:bg-[#d4eeda] dark:hover:bg-[#385440]" @click="openAddAgent">+ Add Agent</button>
            <div class="w-px h-6 bg-[#e1e4e8] mx-1"></div>

            <!-- Admin: own numbers or the whole company's -->
            <div v-if="isAdmin" class="flex items-center rounded-md border border-[#dcdcdc] dark:border-[#2d2d2d] overflow-hidden">
              <button
                v-for="sc in scopes" :key="sc.id"
                @click="setScope(sc.id)"
                :class="['px-3 py-1.5 text-[0.85rem] font-medium cursor-pointer transition-colors',
                  scope === sc.id ? 'bg-[#0066ff] text-white' : 'bg-white dark:bg-background-dark-gray text-[#4a4a4a] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800']"
              >{{ sc.label }}</button>
            </div>
            
            <div class="flex items-center gap-1">
              <input 
                type="month" 
                v-model="selectedMonth" 
                @change="refresh"
                class="px-4 py-1.5 rounded-md font-medium text-[0.9rem] cursor-pointer border border-[#dcdcdc] dark:border-[#2d2d2d] bg-white dark:bg-background-dark-gray text-[#4a4a4a] dark:text-white outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all duration-200 ease-in-out"
                title="Filter by month"
              />
              <button 
                v-if="selectedMonth"
                @click="clearMonthFilter"
                class="px-2 py-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                title="Clear filter and view totals"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="p-8 md:px-10">
        <!-- Alerts: commission approvals, payment requests and proofs of payment -->
        <div v-if="alerts.length" class="flex flex-col gap-3 mb-6">
          <button
            v-for="(al, i) in alerts" :key="i" type="button"
            class="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border cursor-pointer transition hover:shadow-md"
            :class="al.tone === 'action'
              ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100'
              : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100'"
            @click="router.push(al.to)"
          >
            <span class="text-lg">{{ al.tone === 'action' ? '🔔' : 'ℹ️' }}</span>
            <span class="flex-1 text-sm font-medium">{{ al.text }}</span>
            <span class="text-sm font-semibold underline shrink-0">Open</span>
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            v-for="stat in metrics" 
            :key="stat.label" 
            :stat="stat" 
            @click="expandMetric(stat)" 
            class="cursor-pointer hover:shadow-md transition-shadow"
          />
        </div>
        <!-- Commissions (from the Commissions page) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            v-for="stat in commissionMetrics" 
            :key="stat.label" 
            :stat="stat" 
            @click="expandMetric(stat)" 
            class="cursor-pointer hover:shadow-md transition-shadow"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8"> 
          <div class="flex flex-col gap-8">
            <SalesPerformance
              :bars="performance.bars"
              :sold="performance.sold"
              :avg-deal="performance.avgDeal"
              @open-details="router.push('/sales')"
            />
            <CommissionHistory :history="history" />
            <!-- Recent Activity is hidden for now (not removed). To bring it back, uncomment this block and
                 the RecentActivity import in the script; `activities` is still built by dashboardService.
            <RecentActivity 
              :activities="activities" 
              @view-item="(item: any) => router.push(item.to || '/sales')"
              @view-all="router.push('/sales')"
            />
            -->
          </div>

          <div class="flex flex-col gap-8">
            <GenealogyCard :upline="upline" :downline="downline" @view-full="router.push('/genealogy')" />
            <Reminders :reminders="reminders" @open="openReminder" />
          </div>
        </div>
      </div>
    </div>

    <transition 
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- Card breakdown ("Analysis") popup: components/dashboard/MetricDetailsModal.vue -->
      <MetricDetailsModal v-if="selectedMetric" :metric="selectedMetric" @close="closeAll" />
    </transition>

    <!-- Add Agent (admins): the Genealogy page's modal, teleported to <body> with its own overlay -->
    <AddAgentModal v-if="showAddAgent" @close="showAddAgent = false" @saved="onAgentSaved" />

    <!-- From the red "initial password" reminder: the code always goes to the agent's own login email -->
    <ChangePasswordModal
      v-if="showChangePassword"
      :email="loginEmail"
      lock-email
      @close="showChangePassword = false"
      @changed="onPasswordChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { supabase } from '@/supabaseClient';
import { type AgentProfile, positionMap } from '@/assets/classes/agent';
import { useRouter } from 'vue-router'
import { genealogyService, type GenealogyAgent } from '@/services/genealogyService';
import {
  getDashboardData, buildDashboard,
  type Metric, type Activity, type Reminder, type Performance, type HistoryItem, type DashAlert
} from '@/services/dashboardService';

// Component Imports
import StatCard from '@/components/dashboard/DashboardStatCard.vue';
import SalesPerformance from '@/components/dashboard/SalesPerfromance.vue';
// import RecentActivity from '@/components/dashboard/RecentActivity.vue'; // hidden for now, see the template
import CommissionHistory from '@/components/dashboard/CommissionHistory.vue';
import { useLiveRefresh } from '@/utils/liveRefresh';
import GenealogyCard from '@/components/dashboard/GenealogyCard.vue';
import Reminders from '@/components/dashboard/Reminders.vue';
import MetricDetailsModal from '@/components/dashboard/MetricDetailsModal.vue';
import AddAgentModal from '@/components/genealogy/AddAgentModal.vue';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';
import { accountService } from '@/services/accountService';
import { getSessionUser } from '@/services/authService';

// The numbers on this page are built from the same tables the rest of the app writes to
// (sales, commissions, listings, genealogy) in dashboardService, so they always match the
// Sales Report, Commissions and Listings pages.

// State
const selectedMetric = ref<Metric | null>(null);
const showAddAgent = ref(false); // Add Agent modal (admins only)
const showChangePassword = ref(false); // opened from the "initial password" reminder
const loginEmail = ref(''); // the signed-in user's login email (where the password code is sent)
const agent = ref<Partial<AgentProfile & { admin_access: boolean }>>({});
const router = useRouter();

// Admins can look at their own numbers or the whole company's. Agents only see their own.
const isAdmin = computed(() => !!agent.value.admin_access);
const scope = ref<'mine' | 'all'>('mine');
const scopes = [
  { id: 'mine', label: 'My Stats' },
  { id: 'all', label: 'All Agents' }
] as const;

// Filter State
const selectedMonth = ref('');

// Data shown on the page
const loadingStat = (label: string): Metric => ({ label, value: 'Loading', trend: '...', sub: '', type: 'neutral', details: [], showAmount: false });
const metrics = ref<Metric[]>(['TOTAL SALES', 'TOTAL RECEIVED COMMISSION', 'LISTINGS'].map(loadingStat));
const history = ref<HistoryItem[]>([]);
const alerts = ref<DashAlert[]>([]);
const commissionMetrics = ref<Metric[]>(['RECEIVABLES', 'READY TO REQUEST', 'AWAITING APPROVAL'].map(loadingStat));
const performance = ref<Performance>({ bars: [], sold: 0, avgDeal: 0 });
const activities = ref<Activity[]>([]);
const reminders = ref<Reminder[]>([]);
const upline = ref<{ name: string; meta: string }[]>([]);      // direct upline first, then theirs, up to the top
const downline = ref<{ name: string; meta: string }[]>([]);    // everyone below, any depth

// Handlers
// A card with a link (Total Sales) opens that page; the others open their breakdown popup.
const expandMetric = (stat: Metric) => {
  if (stat.link) { router.push(stat.link); return; }
  selectedMetric.value = stat;
};
const closeAll = () => {
  selectedMetric.value = null;
};
const openAddAgent = () => {
  if (isAdmin.value) showAddAgent.value = true;
};
// A new agent changes the team card; the live refresh would catch it too, this is just sooner.
const onAgentSaved = () => {
  showAddAgent.value = false;
  loadTeam();
};
// Reminders go to their page, except the password one, which opens the change-password modal here.
const openReminder = (r: Reminder) => {
  if (r.action === 'change-password') showChangePassword.value = true;
  else router.push(r.to);
};
// Password changed: reload so the red reminder goes away.
const onPasswordChanged = () => {
  showChangePassword.value = false;
  refresh();
};
const clearMonthFilter = () => {
  selectedMonth.value = '';
  refresh();
};
const setScope = (s: 'mine' | 'all') => {
  scope.value = s;
  refresh();
};

// Scroll Lock
watch([selectedMetric, showAddAgent, showChangePassword], ([metric, modal, password]) => {
  document.body.style.overflow = (metric || modal || password) ? 'hidden' : '';
});

// Adds the first and last name of the agent
const agentName = computed(() => {
  if (agent.value.first_name && agent.value.last_name){
    return `${agent.value.first_name} ${agent.value.last_name}`;
  }
  return 'Guest';
});

const fullName = (a: GenealogyAgent) => `${a.first_name} ${a.last_name}`.trim();

// Sales, commissions and listings numbers (re-run when the month or scope changes).
const loadDashboardStats = async () => {
  if (!agent.value.agent_ID) return;

  try {
    const lookAtEveryone = isAdmin.value && scope.value === 'all';
    // The password check is personal (not affected by the scope or month) and never throws.
    const [data, needsPasswordChange] = await Promise.all([
      getDashboardData(lookAtEveryone ? undefined : agent.value.agent_ID),
      accountService.needsPasswordChange(),
    ]);
    const view = buildDashboard(data, {
      month: selectedMonth.value,
      agentId: agent.value.agent_ID,
      isAdmin: isAdmin.value,
      needsPasswordChange
    });

    metrics.value = view.metrics;
    commissionMetrics.value = view.commissionMetrics;
    history.value = view.history;
    alerts.value = view.alerts;
    performance.value = view.performance;
    activities.value = view.activities;
    reminders.value = view.reminders;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    metrics.value = metrics.value.map(m => ({ ...m, value: '0', trend: 'N/A', details: [] }));
    commissionMetrics.value = commissionMetrics.value.map(m => ({ ...m, value: '0', trend: 'N/A', details: [] }));
  }
};

// Upline and team come from the Genealogy page's data (two generations down).
const loadTeam = async () => {
  if (!agent.value.agent_ID) return;
  try {
    // Upline: the whole chain above (direct upline first). Downline: everyone below at any depth,
    // so a Supervisor or Investment Manager sees every Specialist under them.
    const [uplineChain, team] = await Promise.all([
      genealogyService.getUplineChain(agent.value.agent_ID, 20),
      genealogyService.getDownline(agent.value.agent_ID, 20)
    ]);
    const meta = (a: GenealogyAgent) => a.position || (a.position_ID ? positionMap[a.position_ID] ?? '' : '');
    upline.value = uplineChain.map(u => ({ name: fullName(u), meta: meta(u) }));
    downline.value = team.map(t => ({ name: fullName(t), meta: meta(t) }));
  } catch (error) {
    console.error("Error loading team for dashboard:", error);
  }
};

const refresh = () => loadDashboardStats();

// Every number here follows the database: sales, commissions, listings and genealogy changes
// (made on any page or by anyone) refresh the dashboard without a reload.
useLiveRefresh(async () => {
  await Promise.all([loadDashboardStats(), loadTeam()]);
  // keep an open analysis popup in step with the new numbers
  if (selectedMetric.value) {
    const fresh = [...metrics.value, ...commissionMetrics.value].find(m => m.label === selectedMetric.value?.label);
    const open = selectedMetric.value;
    if (fresh && (fresh.value !== open.value || fresh.details.length !== open.details.length)) selectedMetric.value = fresh;
  }
}, ['sales', 'commissions', 'main_listings', 'genealogy', 'agents']);

onMounted(async () => {
  try {
    // From the session the browser already holds (no auth-server round trip; see getSessionUser).
    const user = await getSessionUser();

    if (user) {
      loginEmail.value = user.email ?? '';
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('agent_ID, first_name, last_name, position_ID, admin_access')
        .eq('user_id', user.id) 
        .single();

      if (agentError) throw agentError;
      
      if (agentData) {
        agent.value = agentData;
        if (agentData.admin_access) scope.value = 'all'; // admins start on the company view

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        selectedMonth.value = `${currentYear}-${currentMonth}`;

        await Promise.all([loadDashboardStats(), loadTeam()]);
      }
    }
  } catch (error) {
    console.error("Error setting up dashboard:", error); 
  }
});

// edit: 0 = a new listing (Property Management also treats a missing edit flag as create mode)
const addListing = () => {
  router.push({ path: '/propertymanagement', query: { edit: 0 } });
}
</script>