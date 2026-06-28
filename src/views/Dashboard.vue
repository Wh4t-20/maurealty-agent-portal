<template>
  <div class="flex min-h-screen bg-[var(--color-background-gray,#f6f7fb)] w-full">
    <div class="flex-1 flex flex-col">
      
      <header class="flex flex-col py-5 px-10 pb-0 w-full bg-gradient-to-r from-[#A9D6FF70] to-[#FFFFFF] shadow-md sticky top-0 z-20">
        <div class="flex justify-between items-center w-full pb-5">
          <div class="font-['Poppins']">
            <h1 class="text-[30px] text-[var(--color-maurealty-blue,#0A3D62)] font-bold">Welcome back, {{ agentName }} </h1>
            <p class="text-gray-600 mt-1">Dashboard > <span class="text-blue-600 font-medium">{{ agent.position_ID ? positionMap[agent.position_ID] : 'Wait'}}</span></p>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#0066ff] text-white hover:bg-[#0052cc]" @click="addListing">+ Add Listing</button>
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer border border-transparent transition-all duration-200 ease-in-out flex items-center bg-[#e6f4ea] text-[#1e8e3e] hover:bg-[#d4eeda]" @click="activeModal = 'addAgent'">+ Add Agent</button>
            <div class="w-[1px] h-6 bg-[#e1e4e8] mx-1"></div>
            <button class="px-4 py-2 rounded-md font-medium text-[0.9rem] cursor-pointer transition-all duration-200 ease-in-out flex items-center bg-white border border-[#dcdcdc] text-[#4a4a4a] hover:bg-[#f8f9fa] hover:border-[#bbb]" @click="activeModal = 'calculator'">Calculator</button>
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
        
        <div v-if="activeModal" class="bg-white rounded-[24px] relative p-6 w-full max-w-lg shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-bold" @click="activeModal = null">✕</button>
          <AddListing v-if="activeModal === 'addListing'" />
          <AddAgent v-if="activeModal === 'addAgent'" />
          <Calculator v-if="activeModal === 'calculator'" />
        </div> 

        <div v-else-if="selectedMetric" class="bg-white rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
          <button class="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-bold" @click="selectedMetric = null">✕</button>
          <div class="border-b pb-4 mb-4">
            <h2 class="text-2xl font-bold text-gray-800">{{ selectedMetric.label }} Analysis</h2>
          </div>
          </div>

        <div v-else-if="selectedItem" class="bg-white rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl">
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
import { useRoute, useRouter } from 'vue-router'

// Component Imports
import StatCard from '@/components/dashboard/DashboardStatCard.vue';
import SalesPerformance from '@/components/dashboard/SalesPerfromance.vue';
import RecentActivity from '@/components/dashboard/RecentActivity.vue';
import GenealogyCard from '@/components/dashboard/GenealogyCard.vue';
import Reminders from '@/components/dashboard/Reminders.vue';
import AddListing from '@/components/dashboard/AddListing.vue';
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
  { label: 'TOTAL LISTINGS', value: '...', trend: '+12%', sub: 'vs last month', type: 'positive' },
  { label: 'COMMISSION (NET)', value: '$38,420', trend: '85%', sub: 'Target: $45k', type: 'positive' },
  { label: 'TEAM SALES', value: '$1.2M', trend: '+5.4%', sub: 'Downline contrib.', type: 'positive' },
  { label: 'ACTIVE DEALS', value: '8', trend: '3', sub: 'Pending approval', type: 'neutral' }
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

// Functionalities
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('agents')
        .select('agent_ID, first_name, last_name, position_ID')
        .eq('user_id', user.id) 
        .single();

      if (error) throw error;
      if (data) {
        agent.value = data;
      }
    }
  } catch (error) {
    console.error("Error fetching agent profile:", error);
  }
});

const agentName = computed(() => {
  if (agent.value.first_name && agent.value.last_name){
    return `${agent.value.first_name} ${agent.value.last_name}`;
  }
  return 'Guest';
});

const addListing = () => {
  router.push({ 
    path: '/propertymanagement',
    query:{
    } 
  })
}
</script>