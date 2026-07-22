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
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#e6f4ea] dark:bg-[#1e2821] text-[#1e8e3e] dark:text-green-500 hover:bg-[#d4eeda] dark:hover:bg-[#385440]" @click="activeModal = 'addAgent'">+ Add Agent</button>
            <div class="w-px h-6 bg-[#e1e4e8] mx-1"></div>
            
            <div class="flex items-center gap-1">
              <input 
                type="month" 
                v-model="selectedMonth" 
                @change="loadDashboardStats"
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            v-for="stat in metrics" 
            :key="stat.label" 
            :stat="stat" 
            @click="expandMetric(stat)" 
            class="cursor-pointer hover:shadow-md transition-shadow"
          />
        </div>
        <!-- Hid this kay samok pa tan awn -->
        <!-- <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8"> 
          <div class="flex flex-col gap-8">
            <SalesPerformance @open-details="openDetails(performanceData, 'performance')" />
            <RecentActivity 
              :activities="activities" 
              @view-item="(item) => openDetails(item, 'activity')"
              @view-all="openDetails(activities, 'activity_all')"
            />
          </div>

          <div class="flex flex-col gap-8">
            <GenealogyCard :downline="downline" @view-full="openDetails(null, 'genealogy_full')" />
            <Reminders :reminders="reminders" @view-all="openDetails(reminders, 'reminders_all')" />
          </div>
        </div> -->
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
      <div v-if="selectedItem || selectedMetric || activeModal" class="fixed inset-0 w-full h-full bg-[#0a3d62]/70 backdrop-blur-sm flex items-center justify-center z-[9999]" @click.self="closeAll">
        
        <div v-if="activeModal" class="bg-white dark:bg-black rounded-[24px] relative p-6 w-full max-w-lg shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 dark:text-gray-700 hover:text-gray-700 dark:hover:text-gray-400 text-xl font-bold" @click="activeModal = null">✕</button>
          <AddAgent v-if="activeModal === 'addAgent'" />
        </div> 

        <div v-else-if="selectedMetric" class="bg-white dark:bg-black rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 dark:text-gray-700 hover:text-gray-700 dark:hover:text-gray-400 text-xl font-bold" @click="selectedMetric = null">✕</button>
          <div class="border-b pb-4 mb-4">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">{{ selectedMetric.label }} Analysis</h2>
          </div>
        </div>

        <div v-else-if="selectedItem" class="bg-white dark:bg-black rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
           <button class="absolute top-4 right-5 text-gray-400 dark:text-gray-700 hover:text-gray-700 dark:hover:text-gray-400 text-xl font-bold" @click="closeAll">✕</button>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { supabase } from '@/supabaseClient';
import { type AgentProfile, positionMap } from '@/assets/classes/agent';
import { useRouter } from 'vue-router'

// Component Imports
import StatCard from '@/components/dashboard/DashboardStatCard.vue';
import SalesPerformance from '@/components/dashboard/SalesPerfromance.vue';
import RecentActivity from '@/components/dashboard/RecentActivity.vue';
import GenealogyCard from '@/components/dashboard/GenealogyCard.vue';
import Reminders from '@/components/dashboard/Reminders.vue';
import AddAgent from '@/components/dashboard/AddAgent.vue';

// State
const selectedItem = ref<any>(null);
const selectedMetric = ref<any>(null);
const activeModal = ref<string | null>(null);
const modalType = ref('');
const agent = ref<Partial<AgentProfile>>({});
const router = useRouter();

// Filter State
const selectedMonth = ref('');

// Data
const metrics = ref([
  { label: 'MONTHLY LISTINGS', value: 'Loading', trend: 'Loading', sub: 'vs previous month', type: '...' },
  { label: 'MONTHLY GROSS', value: 'Loading', trend: '...', sub: 'vs previous month', type: '...' },
  { label: 'PROPERTIES SOLD', value: 'Loading', trend: '...', sub: 'vs previous month', type: 'positive' },
  { label: 'RECEIVABLES', value: 'Loading', trend: '...', sub: 'Awaiting payment', type: 'neutral' }
]);

const performanceData = ref({ title: "Performance Data", id: "perf-1" });
const activities = ref([]);
const reminders = ref([]);
const downline = ref([]);

// Handlers
const expandMetric = (stat: any) => { selectedMetric.value = stat; };
const openDetails = (item: any, type: string) => {
  selectedItem.value = item || { id: 'temp' };
  modalType.value = type;
};
const closeAll = () => {
  selectedItem.value = null;
  selectedMetric.value = null;
  activeModal.value = null;
};
const clearMonthFilter = () => {
  selectedMonth.value = '';
  loadDashboardStats();
};

// Scroll Lock
watch([selectedItem, selectedMetric, activeModal], ([item, metric, modal]) => {
  document.body.style.overflow = (item || metric || modal) ? 'hidden' : '';
});

// Helper to format large numbers into clean currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value);
};

// Calculate Trends Helper
const calculateTrend = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const percent = ((curr - prev) / prev) * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
};

// Get Trend Type Helper
const getTrendType = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 'positive' : 'neutral';
  const percent = ((curr - prev) / prev) * 100;
  return percent > 0 ? 'positive' : (percent < 0 ? 'negative' : 'neutral');
};

const processSalesData = (data: any[]) => {
  let stats = { gross: 0, sold: 0, receivables: 0 };
  if (!data) return stats;

  data.forEach((item) => {
    const status = (item.status || '').toString().toLowerCase().trim();

    const netCommission = Number(item.net_commission) || 0;

    if (status === 'complete') {
      stats.gross += netCommission;
      stats.sold += 1;
    } 
    else if (status === 'awaiting payment') {
      stats.receivables += netCommission;
    }
  });

  return stats;
};

// Adds the first and last name of the agent
const agentName = computed(() => {
  if (agent.value.first_name && agent.value.last_name){
    return `${agent.value.first_name} ${agent.value.last_name}`;
  }
  return 'Guest';
});

const loadDashboardStats = async () => {
  if (!agent.value.agent_ID) return;

  metrics.value.forEach(m => { m.value = 'Loading'; m.trend = '...'; });

  try {
    if (selectedMonth.value) {
      const [yearStr, monthStr] = selectedMonth.value.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      const startOfSelected = new Date(year, month - 1, 1).toISOString();
      const endOfSelected = new Date(year, month, 1).toISOString();
      const startOfPrev = new Date(year, month - 2, 1).toISOString();
      const endOfPrev = new Date(year, month - 1, 1).toISOString();

      const [currListingsRes, prevListingsRes, currSalesRes, prevSalesRes] = await Promise.all([
        supabase.from('main_listings').select('*', { count: 'exact', head: true })
          .eq('agent_ID', agent.value.agent_ID).gte('created_at', startOfSelected).lt('created_at', endOfSelected),
        supabase.from('main_listings').select('*', { count: 'exact', head: true })
          .eq('agent_ID', agent.value.agent_ID).gte('created_at', startOfPrev).lt('created_at', endOfPrev),
        
        supabase.from('sales').select('status, net_commission, created_at')
          .eq('agent_ID', agent.value.agent_ID).gte('created_at', startOfSelected).lt('created_at', endOfSelected),
        supabase.from('sales').select('status, net_commission, created_at')
          .eq('agent_ID', agent.value.agent_ID).gte('created_at', startOfPrev).lt('created_at', endOfPrev)
      ]);

      const currListings = currListingsRes.count || 0;
      const prevListings = prevListingsRes.count || 0;

      const currSalesStats = processSalesData(currSalesRes.data || []);
      const prevSalesStats = processSalesData(prevSalesRes.data || []);

      // updates UI Cards for Monthly
      metrics.value[2] = { ...metrics.value[0], label: 'MONTHLY LISTINGS', sub: 'vs previous month', value: currListings.toString(), trend: calculateTrend(currListings, prevListings), type: getTrendType(currListings, prevListings) };
      metrics.value[0] = { ...metrics.value[1], label: 'MONTHLY GROSS', sub: 'vs previous month', value: formatCurrency(currSalesStats.gross), trend: calculateTrend(currSalesStats.gross, prevSalesStats.gross), type: getTrendType(currSalesStats.gross, prevSalesStats.gross) };
      metrics.value[3] = { ...metrics.value[2], label: 'PROPERTIES SOLD', sub: 'vs previous month', value: currSalesStats.sold.toString(), trend: calculateTrend(currSalesStats.sold, prevSalesStats.sold), type: getTrendType(currSalesStats.sold, prevSalesStats.sold) };
      metrics.value[1] = { ...metrics.value[3], label: 'RECEIVABLES', sub: 'Awaiting payment', value: formatCurrency(currSalesStats.receivables), trend: calculateTrend(currSalesStats.receivables, prevSalesStats.receivables), type: getTrendType(currSalesStats.receivables, prevSalesStats.receivables) };

    } else {
      const [listingsRes, salesRes] = await Promise.all([
        supabase.from('main_listings').select('*', { count: 'exact', head: true })
          .eq('agent_ID', agent.value.agent_ID),
        supabase.from('sales').select('status, net_commission, created_at')
          .eq('agent_ID', agent.value.agent_ID)
      ]);
      
      const totalListings = listingsRes.count || 0;
      const totalSalesStats = processSalesData(salesRes.data || []);

      metrics.value[2] = { ...metrics.value[2], label: 'TOTAL LISTINGS', sub: 'All Time', value: totalListings.toString(), trend: '-', type: 'neutral' };
      metrics.value[0] = { ...metrics.value[0], label: 'TOTAL GROSS', sub: 'All Time', value: formatCurrency(totalSalesStats.gross), trend: '-', type: 'neutral' };
      metrics.value[3] = { ...metrics.value[3], label: 'TOTAL PROPERTIES SOLD', sub: 'All Time', value: totalSalesStats.sold.toString(), trend: '-', type: 'neutral' };
      metrics.value[1] = { ...metrics.value[1], label: 'TOTAL RECEIVABLES', sub: 'Awaiting payment', value: formatCurrency(totalSalesStats.receivables), trend: '-', type: 'neutral' };
    }

  } catch (error) {
    console.error("SUPABASE ERROR fetching dashboard stats:", error);
    if (metrics.value[0]) { metrics.value[0].value = '0'; metrics.value[0].trend = 'N/A'; }
    if (metrics.value[1]) { metrics.value[1].value = '$0'; metrics.value[1].trend = 'N/A'; }
    if (metrics.value[2]) { metrics.value[2].value = '0'; metrics.value[2].trend = 'N/A'; }
    if (metrics.value[3]) { metrics.value[3].value = '$0'; metrics.value[3].trend = 'N/A'; }
  }
};

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('agent_ID, first_name, last_name, position_ID')
        .eq('user_id', user.id) 
        .single();

      if (agentError) throw agentError;
      
      if (agentData) {
        agent.value = agentData;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        selectedMonth.value = `${currentYear}-${currentMonth}`;

        await loadDashboardStats();
      }
    }
  } catch (error) {
    console.error("Error setting up dashboard:", error); 
  }
});

const addListing = () => {
  router.push({ path: '/propertymanagement' });
}
</script>