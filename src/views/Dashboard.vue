<template>
  <div class="flex min-h-screen bg-background-gray dark:bg-background-dark-gray w-full">
    <div class="flex-1 flex flex-col">
      
      <header class="flex flex-col py-5 px-10 pb-0 w-full bg-gradient-to-r from-[#A9D6FF70] dark:from-[#06294470] to-[#FFFFFF] dark:to-black shadow-md sticky top-0 z-20">
        <div class="flex justify-between items-center w-full pb-5">
          <div class="font-['Poppins']">
            <h1 class="text-[30px] text-[var(--color-maurealty-blue,#0A3D62)] dark:text-[#b3d7ff] font-bold">Welcome back, {{ agentName }} </h1>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Dashboard > <span class="text-blue-600 dark:text-blue-300 font-medium">{{ agent.position_ID ? positionMap[agent.position_ID] : 'Wait'}}</span></p>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#0066ff] dark:bg-[#0052cc] text-white hover:bg-[#0052cc] dark:hover:bg-[#0066ff]" @click="addListing">+ Add Listing</button>
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#e6f4ea] dark:bg-[#1e2821] text-[#1e8e3e] dark:text-green-500 hover:bg-[#d4eeda] dark:hover:bg-[#385440]" @click="activeModal = 'addAgent'">+ Add Agent</button>
            <div class="w-px h-6 bg-[#e1e4e8] mx-1"></div>
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer transition-all duration-200 ease-in-out flex items-center bg-white dark:bg-background-dark-gray border border-[#dcdcdc] dark:border-[#2d2d2d] text-[#4a4a4a] dark:text-white hover:bg-[#f8f9fa] dark:hover:bg-[#303030] hover:border-[#bbb] dark:hover:border-[#494949]" @click="activeModal = 'calculator'">Calculator</button>
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

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
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
      <div v-if="selectedItem || selectedMetric || activeModal" class="fixed inset-0 w-full h-full bg-[#0a3d62]/70 backdrop-blur-sm flex items-center justify-center z-[9999]" @click.self="closeAll">
        
        <div v-if="activeModal" class="bg-white dark:bg-black rounded-[24px] relative p-6 w-full max-w-lg shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-bold" @click="activeModal = null">✕</button>
          <AddAgent v-if="activeModal === 'addAgent'" />
          <Calculator v-if="activeModal === 'calculator'" />
        </div> 

        <div v-else-if="selectedMetric" class="bg-white dark:bg-black rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-bold" @click="selectedMetric = null">✕</button>
          <div class="border-b pb-4 mb-4">
            <h2 class="text-2xl font-bold text-gray-800">{{ selectedMetric.label }} Analysis</h2>
          </div>
          </div>

        <div v-else-if="selectedItem" class="bg-white dark:bg-black rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
           <button class="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-bold" @click="closeAll">✕</button>
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
import Calculator from '@/components/dashboard/Calculator.vue';

// State
const selectedItem = ref<any>(null);
const selectedMetric = ref<any>(null);
const activeModal = ref<string | null>(null);
const modalType = ref('');
const agent_ID = ref('');
const agent = ref<Partial<AgentProfile>>({});
const router = useRouter();

// Data
const metrics = ref([
  { label: 'TOTAL LISTINGS', value: 'Loading', trend: 'Loading', sub: 'vs last month', type: '...' },
  { label: 'TOTAL GROSS', value: 'Loading', trend: '...', sub: 'vs last month', type: '...' }, // Changed to Total Gross
  { label: 'TOTAL PROPERTIES SOLD', value: 'Loading', trend: '...', sub: 'vs last month', type: 'positive' },
  { label: 'ACTIVE DEALS', value: '...', trend: '...', sub: 'Pending approval', type: 'neutral' }
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

// Scroll Lock
watch([selectedItem, selectedMetric, activeModal], ([item, metric, modal]) => {
  document.body.style.overflow = (item || metric || modal) ? 'hidden' : '';
});

// Helper to format large numbers into clean currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP', // 
    maximumFractionDigits: 0
  }).format(value);
};
// adds the first and last name of the agent
const agentName = computed(() => {
  if (agent.value.first_name && agent.value.last_name){
    return `${agent.value.first_name} ${agent.value.last_name}`;
  }
  return 'Guest';
});

// Functionalities
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
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        
        //fetches all the coounts
        const responses = await Promise.all([
        //for the total listings
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID),
        // for this months listings
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID)
            .gte('created_at', startOfThisMonth),
          // for last months listing
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID)
            .gte('created_at', startOfLastMonth)
            .lt('created_at', startOfThisMonth),
          // for the sold
          supabase.from('main_listings')
          .select('price, created_at')
          .eq('agent_ID', agentData.agent_ID)
          .eq('status', 'sold'),
          // for the total sold
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID)
            .eq('status', 'sold'),
          // ffor this months sold listings
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID)
            .eq('status', 'sold')
            .gte('created_at', startOfThisMonth),
          // for last months listing
          supabase.from('main_listings').select('*', { count: 'exact', head: true })
            .eq('agent_ID', agentData.agent_ID)
            .eq('status', 'sold')
            .gte('created_at', startOfLastMonth)
            .lt('created_at', startOfThisMonth),
          
          
        ]);

        // note that metrics.value[0] is the total listings since it is the first metric card shown in the page
        if (metrics.value[0]) {
          const totalCount = responses[0].count || 0;
          const curr = responses[1].count || 0;
          const prev = responses[2].count || 0;
          
          metrics.value[0].value = totalCount.toString();
          if (prev === 0) {
            metrics.value[0].trend = curr > 0 ? '+100%' : '0%';
            metrics.value[0].type = curr > 0 ? 'positive' : 'neutral';
          } else {
            const percent = ((curr - prev) / prev) * 100;
            metrics.value[0].trend = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
            metrics.value[0].type = percent > 0 ? 'positive' : (percent < 0 ? 'negative' : 'neutral');
          }
        }
    
        const soldPricesData = responses[3].data || [];
          
        if (soldPricesData && metrics.value[1]) {
          let totalGross = 0;
          let thisMonthGross = 0;
          let lastMonthGross = 0;
          const startThisTime = new Date(startOfThisMonth).getTime();
          const startLastTime = new Date(startOfLastMonth).getTime();

          soldPricesData.forEach((item: any) => {
            const price = Number(item.price) || 0;
            const createdTime = new Date(item.created_at).getTime();
            totalGross += price;
            if (createdTime >= startThisTime) thisMonthGross += price;
            else if (createdTime >= startLastTime) lastMonthGross += price;
          });
          // note that metrics.value[1] is the total gross 
          metrics.value[1].value = formatCurrency(totalGross);
          const percent = lastMonthGross === 0 ? (thisMonthGross > 0 ? 100 : 0) : ((thisMonthGross - lastMonthGross) / lastMonthGross) * 100;
          metrics.value[1].trend = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
          metrics.value[1].type = percent > 0 ? 'positive' : (percent < 0 ? 'negative' : 'neutral');
        }
        // note that metrics.value[2] is the total sold listings since it is the third metric card shown in the page
        if (metrics.value[2]) {
          const totalSold = responses[4].count || 0;
          const currSold = responses[5].count || 0;
          const prevSold = responses[6].count || 0;
          
          metrics.value[2].value = totalSold.toString();
          if (prevSold === 0) {
            metrics.value[2].trend = currSold > 0 ? '+100%' : '0%';
            metrics.value[2].type = currSold > 0 ? 'positive' : 'neutral';
          } else {
            const percent = ((currSold - prevSold) / prevSold) * 100;
            metrics.value[2].trend = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
            metrics.value[2].type = percent > 0 ? 'positive' : (percent < 0 ? 'negative' : 'neutral');
          }
        }

        

        
      }
    }
  } catch (error) {
    console.error(" SUPABASE ERROR fetching dashboard data:", error); 
    // Fallbacks if data fails
    if (metrics.value[0]) { metrics.value[0].value = '0'; metrics.value[0].trend = 'N/A'; }
    if (metrics.value[1]) { metrics.value[1].value = '$0'; metrics.value[1].trend = 'N/A'; }
    if (metrics.value[2]) { metrics.value[2].value = '0'; metrics.value[2].trend = 'N/A'; }
  }
});

const addListing = () => {
  router.push({ 
    path: '/propertymanagement',
    query:{
    } 
  })
}
</script>